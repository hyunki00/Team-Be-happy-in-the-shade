# 담당: 오효정
# 할 일: prefix="/users"
#   PATCH /users/me
#   GET /users/me/recipes · /me/posts · /me/liked-recipes · /me/bookmarked-recipes · /me/liked-posts · /me/post-comments
#   GET /users/me/recipe-comments → RecipeCommentCrud.get_by_user(db, user_id)가 이미 있음 (조현기, 레시피 제목 포함)
#                                  돌려줄 모양은 MyRecipeCommentRead (app/db/scheme/recipe_comments.py)
#   ※ 나머지 목록도 각 담당자의 crud 함수를 가져다 씀. 필요한 함수는 담당자에게 요청
#
# - 파일 안에 router = APIRouter(prefix=..., tags=[...])를 만들면 main.py가 자동으로 등록함 (main.py는 안 고쳐도 됨)
# - 모양은 app/routers/ingredient.py · recipe_comment.py(조현기) 참고
# - 로그인 필수: user_id: int = Depends(get_user_id) / 로그인 선택: Depends(get_optional)  (app/core/auth.py)
# - DB 세션: db: AsyncSession = Depends(get_db)  (app/db/database.py)
# - 만든 뒤 http://localhost:8044/docs 에서 바로 눌러 보며 확인

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_user_id
from app.db.database import get_db
from app.db.scheme.users import UserRead, UserUpdate

from app.db.crud.recipe_comment import RecipeCommentCrud
from app.db.scheme.recipe_comments import MyRecipeCommentRead

from app.db.crud.recipe import RecipeCrud
from app.db.scheme.recipes import RecipeSearch, RecipeListItem

from app.db.crud.post import PostCrud
from app.db.scheme.posts import PostListItem, MyPostCommentRead

from app.services.recipe import RecipeService
from app.services.post import PostService
from app.services.user import UserService


router = APIRouter(prefix="/users", tags=["Users"])

# 내 프로필 조회
@router.get("/me", response_model=UserRead)
async def get_me(user_id: int = Depends(get_user_id), db: AsyncSession = Depends(get_db)):
    return await UserService.get_user(db, user_id)


# 내 프로필 수정
@router.patch("/me", response_model=UserRead)
async def update_me(data: UserUpdate, user_id: int = Depends(get_user_id), db: AsyncSession = Depends(get_db)):
    return await UserService.update_profile(db, user_id, data)

# 로그인한 사용자가 작성한 레시피 댓글 목록
@router.get("/me/recipe-comments", response_model=list[MyRecipeCommentRead])
async def get_my_recipe_comments(user_id: int = Depends(get_user_id), db: AsyncSession = Depends(get_db)):
    return [MyRecipeCommentRead(
        rc_id=c.rc_id, recipe_id=c.recipe_id, recipe_title=title, rc_content=c.rc_content, created_at=c.created_at) 
        for c, title in await RecipeCommentCrud.get_by_user(db, user_id)]

# 로그인 아이디 중복확인 
@router.get("/check-login-id")
async def check_login_id(login_id: str, db: AsyncSession = Depends(get_db)):
    available = await UserService.check_login_id(db, login_id)
    return {"available": available}

# 내 레시피 조회
@router.get("/me/recipes", response_model=list[RecipeListItem])
async def get_my_recipes(user_id: int = Depends(get_user_id), db: AsyncSession = Depends(get_db),):
    recipes = await RecipeCrud.get_by_user(db, user_id)
    recipe_ids = {recipe.recipe_id for recipe in recipes}
    if not recipe_ids:
        return []

    items = await RecipeService.search(db, RecipeSearch(), limit=1000)
    return [item for item in items if item.recipe_id in recipe_ids]

# 좋아요한 레시피 조회
@router.get("/me/liked-recipes", response_model=list[RecipeListItem])
async def get_my_liked_recipes(user_id: int = Depends(get_user_id), db: AsyncSession = Depends(get_db)):
    recipes = await RecipeCrud.get_liked_by_user(db, user_id)
    recipe_ids = {recipe.recipe_id for recipe in recipes}
    if not recipe_ids:
        return []

    items = await RecipeService.search(db, RecipeSearch(), limit=1000)
    return [item for item in items if item.recipe_id in recipe_ids]

# 북마크한 레시피 조회
@router.get("/me/bookmarked-recipes", response_model=list[RecipeListItem])
async def get_my_bookmarked_recipes(user_id: int = Depends(get_user_id), db: AsyncSession = Depends(get_db)):
    recipes = await RecipeCrud.get_bookmarked_by_user(db, user_id)
    recipe_ids = {recipe.recipe_id for recipe in recipes}
    if not recipe_ids:
        return []

    items = await RecipeService.search(db, RecipeSearch(), limit=1000)
    return [item for item in items if item.recipe_id in recipe_ids]

# 내 게시글 조회
@router.get("/me/posts", response_model=list[PostListItem])
async def get_my_posts(user_id: int = Depends(get_user_id), db: AsyncSession = Depends(get_db)):
    posts = await PostCrud.get_by_user(db, user_id)
    return await PostService.build_list_items(db, posts)

# 좋아요한 게시글 조회
@router.get("/me/liked-posts", response_model=list[PostListItem])
async def get_my_liked_posts(user_id: int = Depends(get_user_id), db: AsyncSession = Depends(get_db),):
    posts = await PostCrud.get_liked_by_user(db, user_id)
    return await PostService.build_list_items(db, posts)

# 내 게시글 댓글 조회
@router.get("/me/post-comments", response_model=list[MyPostCommentRead])
async def get_my_post_comments(user_id: int = Depends(get_user_id),
    db: AsyncSession = Depends(get_db)):
    rows = await PostCrud.get_comments_by_user(db, user_id)
    return [
        MyPostCommentRead(
            pc_id=comment.pc_id,
            post_id=comment.post_id,
            post_title=title,
            pc_content=comment.pc_content,
            pc_image_url=comment.pc_image_url,
            created_at=comment.created_at,
        )
        for comment, title in rows
    ]