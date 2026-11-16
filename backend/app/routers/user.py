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
