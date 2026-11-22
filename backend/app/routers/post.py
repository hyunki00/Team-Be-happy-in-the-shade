# 담당: 임유빈
# 할 일: 주소가 /posts와 /post-comments 두 갈래라 prefix 없이 전체 주소를 적기 (recipe_comment.py 참고)
#   GET · POST /posts, GET · PATCH · DELETE /posts/{post_id}
#   GET · POST /posts/{post_id}/comments, PATCH · DELETE /post-comments/{pc_id}
#   POST · DELETE /posts/{post_id}/likes
#
# - 파일 안에 router = APIRouter(prefix=..., tags=[...])를 만들면 main.py가 자동으로 등록함 (main.py는 안 고쳐도 됨)
# - 모양은 app/routers/ingredient.py · recipe_comment.py(조현기) 참고
# - 로그인 필수: user_id: int = Depends(get_user_id) / 로그인 선택: Depends(get_optional)  (app/core/auth.py)
# - DB 세션: db: AsyncSession = Depends(get_db)  (app/db/database.py)
# - 만든 뒤 http://localhost:8044/docs 에서 바로 눌러 보며 확인

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_optional, get_user_id  
from app.db.database import get_db  
from app.db.scheme.posts import (
    PostCommentCreate,
    PostCommentRead,
    PostCommentUpdate,
    PostCreate,
    PostDetail,
    PostListItem,
    PostUpdate,
)
from app.services.post import PostService  


router = APIRouter(tags=["posts"])


# --- 게시글 ---

# 게시글 목록 조회
@router.get("/posts", response_model=list[PostListItem])
async def get_posts(
    sort: str = Query(default="latest"),  
    search_type: Optional[str] = Query(default=None),  
    keyword: Optional[str] = Query(default=None), 
    skip: int = Query(default=0, ge=0),  
    limit: int = Query(default=20, ge=1, le=100),  
    db: AsyncSession = Depends(get_db),
):
    return await PostService.get_list(
        db=db,
        sort=sort,
        search_type=search_type,
        keyword=keyword,
        skip=skip,
        limit=limit,
    )


# 게시글 상세 조회
@router.get("/posts/{post_id}", response_model=PostDetail)
async def get_post_detail(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: Optional[int] = Depends(get_optional),  
):
    return await PostService.get_detail(db=db, post_id=post_id, user_id=current_user_id)


# 게시글 작성
@router.post("/posts", response_model=PostDetail, status_code=status.HTTP_201_CREATED)
async def create_post(
    data: PostCreate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_user_id), 
):
    return await PostService.write(db=db, user_id=user_id, data=data)


# 게시글 수정
@router.patch("/posts/{post_id}", response_model=PostDetail)
async def update_post(
    post_id: int,
    data: PostUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_user_id), 
):
    return await PostService.edit(db=db, user_id=user_id, post_id=post_id, data=data)


# 게시글 삭제
@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_user_id), 
):
    await PostService.remove(db=db, user_id=user_id, post_id=post_id)



# --- 좋아요 ---

# 좋아요 추가/토글
@router.post("/posts/{post_id}/likes")
async def add_post_like(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_user_id),  
):
    return await PostService.toggle_like(db=db, user_id=user_id, post_id=post_id)


# 좋아요 취소/토글
@router.delete("/posts/{post_id}/likes")
async def remove_post_like(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_user_id),  
):
    return await PostService.toggle_like(db=db, user_id=user_id, post_id=post_id)



# --- 댓글 ---

# 댓글 목록 조회 
@router.get("/posts/{post_id}/comments", response_model=list[PostCommentRead])
async def get_post_comments(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    current_user_id: Optional[int] = Depends(get_optional),  
):
    return await PostService.get_comments(db=db, post_id=post_id, user_id=current_user_id)


# 댓글 작성
@router.post("/posts/{post_id}/comments", response_model=PostCommentRead, status_code=status.HTTP_201_CREATED)
async def create_post_comment(
    post_id: int,
    data: PostCommentCreate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_user_id),  
):
    return await PostService.create_comment(db=db, user_id=user_id, post_id=post_id, data=data)


# 댓글 수정
@router.patch("/post-comments/{pc_id}", response_model=PostCommentRead)
async def update_post_comment(
    pc_id: int,
    data: PostCommentUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_user_id),  
):
    return await PostService.edit_comment(db=db, user_id=user_id, pc_id=pc_id, data=data)


# 댓글 삭제
@router.delete("/post-comments/{pc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post_comment(
    pc_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_user_id),  
):
    await PostService.remove_comment(db=db, user_id=user_id, pc_id=pc_id)