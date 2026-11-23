# 담당: 권우정 (쓰기 API는 오효정이 추가)
# 할 일: prefix="/recipes"
#   GET /recipes, GET /recipes/{recipe_id}   get_optional (비로그인도 보임)
#   POST · DELETE /recipes/{recipe_id}/likes, POST · DELETE /recipes/{recipe_id}/bookmarks   로그인 필수
#   (오효정) POST /recipes, PATCH · DELETE /recipes/{recipe_id}   본인 레시피만
#   ※ 댓글 /recipes/{recipe_id}/comments는 recipe_comment.py(조현기)에 이미 있음
#
# - 파일 안에 router = APIRouter(prefix=..., tags=[...])를 만들면 main.py가 자동으로 등록함 (main.py는 안 고쳐도 됨)
# - 모양은 app/routers/ingredient.py · recipe_comment.py(조현기) 참고
# - 로그인 필수: user_id: int = Depends(get_user_id) / 로그인 선택: Depends(get_optional)  (app/core/auth.py)
# - DB 세션: db: AsyncSession = Depends(get_db)  (app/db/database.py)
# - 만든 뒤 http://localhost:8044/docs 에서 바로 눌러 보며 확인

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_user_id, get_optional
from app.db.database import get_db
from app.db.scheme.recipes import RecipeDetail, RecipeListItem, RecipeSearch
from app.services.recipe import RecipeService

# 레시피 관련 API의 공통 URL 경로와 Swagger 태그 설정
router = APIRouter(prefix="/recipes", tags=["recipes"])


# 로그인한 사용자의 냉장고 재료 기반 레시피 추천
@router.get("/recommendations", response_model=list[RecipeListItem])
async def get_recipe_recommendations(
    user_id: int = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
):
    return await RecipeService.recommend(db, user_id)

# 1. 레시피 목록 / 검색
@router.get("", response_model=list[RecipeListItem])
async def get_recipes(
    keyword: str | None = None,
    r_category_id: int | None = None,
    level: str | None = None,
    cooking_time: int | None = Query(default=None, ge=1),
    ingredient_ids: list[int] = Query(default=[]),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user_id: int | None = Depends(get_optional),
    db: AsyncSession = Depends(get_db),
    over_60: bool = False
):
    # URL로 전달받은 검색 조건을 RecipeSearch 객체로 묶기
    search = RecipeSearch(
        keyword=keyword,
        r_category_id=r_category_id,
        level=level,
        cooking_time=cooking_time,
        ingredient_ids=ingredient_ids,
        over_60=over_60
    )

    # 검색 조건에 맞는 레시피 목록을 서비스에서 조회
    return await RecipeService.search(
        db, search, user_id, limit, offset
    )


# 2. 레시피 상세
@router.get("/{recipe_id}", response_model=RecipeDetail)
async def get_recipe_detail(
    recipe_id: int,
    user_id: int | None = Depends(get_optional),
    db: AsyncSession = Depends(get_db)
):
    return await RecipeService.get_detail(
        db, recipe_id, user_id
    )


# 3. 좋아요 추가
@router.post("/{recipe_id}/likes")
async def add_recipe_like(
    recipe_id: int,
    user_id: int = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
):
    # 좋아요 추가를 요청하고 변경된 상태를 저장
    liked = await RecipeService.toggle_like(
        db, recipe_id, user_id, True
    )

    return {"is_liked": liked}


# 4. 좋아요 취소
@router.delete("/{recipe_id}/likes")
async def delete_recipe_like(
    recipe_id: int,
    user_id: int = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
):
    # 좋아요 취소를 요청하고 변경된 상태를 저장
    liked = await RecipeService.toggle_like(
        db, recipe_id, user_id, False
    )

    return {"is_liked": liked}


# 5. 북마크 추가
@router.post("/{recipe_id}/bookmarks")
async def add_recipe_bookmark(
    recipe_id: int,
    user_id: int = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
):
    # 북마크 추가를 요청하고 변경된 상태를 저장
    bookmarked = await RecipeService.toggle_bookmark(
        db, recipe_id, user_id, True
    )

    return {"is_bookmarked": bookmarked}


# 6. 북마크 취소
@router.delete("/{recipe_id}/bookmarks")
async def delete_recipe_bookmark(
    recipe_id: int,
    user_id: int = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)
):
    # 북마크 취소를 요청하고 변경된 상태를 저장
    bookmarked = await RecipeService.toggle_bookmark(
        db, recipe_id, user_id, False
    )

    return {"is_bookmarked": bookmarked}