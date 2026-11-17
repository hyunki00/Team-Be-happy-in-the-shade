# 담당: 조현기
# 레시피 댓글 API (레시피 상세 화면의 CommentSection에서 씀)
# 주소가 /recipes/…/comments 와 /recipe-comments/… 두 갈래라 prefix 없이 전체 주소를 적음
# 규칙이 단순해서 서비스 파일 없이 라우터에서 확인 → crud → commit
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.core.auth import get_user_id, get_optional
from app.db.crud.recipe_comment import RecipeCommentCrud
from app.db.models.recipe_comments import RecipeComment
from app.db.scheme.recipe_comments import RecipeCommentCreate, RecipeCommentRead

router = APIRouter(tags=["RecipeComment"])


def to_read(comment: RecipeComment, nickname: str, login_user_id: int | None) -> RecipeCommentRead:
    return RecipeCommentRead(
        rc_id=comment.rc_id,
        recipe_id=comment.recipe_id,
        user_id=comment.user_id,
        nickname=nickname,
        rc_content=comment.rc_content,
        rc_image_url=comment.rc_image_url,
        created_at=comment.created_at,
        is_mine=(login_user_id is not None and comment.user_id == login_user_id),
    )


async def get_my_comment(db: AsyncSession, rc_id: int, user_id: int) -> RecipeComment:
    # 댓글이 없으면 404, 내 댓글이 아니면 403
    comment = await RecipeCommentCrud.get_by_id(db, rc_id)
    if not comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    if comment.user_id != user_id:
        raise HTTPException(status_code=403, detail="본인 댓글만 수정 · 삭제할 수 있습니다.")
    return comment


async def commit(db: AsyncSession):
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=500, detail="저장 중 오류가 발생했습니다.")


# 댓글 목록 (최신순). 로그인 안 해도 보이고, 로그인하면 is_mine이 채워짐
@router.get("/recipes/{recipe_id}/comments", response_model=list[RecipeCommentRead])
async def get_comments(
    recipe_id: int,
    user_id: int | None = Depends(get_optional),
    db: AsyncSession = Depends(get_db),
):
    if not await RecipeCommentCrud.recipe_exists(db, recipe_id):
        raise HTTPException(status_code=404, detail="레시피를 찾을 수 없습니다.")
    rows = await RecipeCommentCrud.get_by_recipe(db, recipe_id)
    return [to_read(c, nickname, user_id) for c, nickname in rows]


# 댓글 쓰기 (로그인 필요)
@router.post("/recipes/{recipe_id}/comments", response_model=RecipeCommentRead, status_code=status.HTTP_201_CREATED)
async def create_comment(
    recipe_id: int,
    data: RecipeCommentCreate,
    user_id: int = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    # 토큰은 맞는데 사용자가 없으면 (탈퇴 · DB를 새로 만든 뒤 남은 쿠키) 다시 로그인하게 401
    if not await RecipeCommentCrud.user_exists(db, user_id):
        raise HTTPException(status_code=401, detail="다시 로그인해 주세요.")
    if not await RecipeCommentCrud.recipe_exists(db, recipe_id):
        raise HTTPException(status_code=404, detail="레시피를 찾을 수 없습니다.")
    comment = await RecipeCommentCrud.create(db, user_id, recipe_id, data)
    rc_id = comment.rc_id
    await commit(db)
    comment, nickname = await RecipeCommentCrud.get_with_nickname(db, rc_id)
    return to_read(comment, nickname, user_id)


# 댓글 수정 (본인만)
@router.patch("/recipe-comments/{rc_id}", response_model=RecipeCommentRead)
async def update_comment(
    rc_id: int,
    data: RecipeCommentCreate,
    user_id: int = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    await get_my_comment(db, rc_id, user_id)
    await RecipeCommentCrud.update_by_id(db, rc_id, data)
    await commit(db)
    comment, nickname = await RecipeCommentCrud.get_with_nickname(db, rc_id)
    return to_read(comment, nickname, user_id)


# 댓글 삭제 (본인만). 성공하면 내용 없이 204
@router.delete("/recipe-comments/{rc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    rc_id: int,
    user_id: int = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    await get_my_comment(db, rc_id, user_id)
    await RecipeCommentCrud.delete_by_id(db, rc_id)
    await commit(db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
