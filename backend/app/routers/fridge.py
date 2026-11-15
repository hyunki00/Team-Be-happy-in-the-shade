# 담당: 정호진
# 할 일: prefix="/fridge", 전부 로그인 필수
#   GET · POST /fridge/ingredients, PATCH · DELETE /fridge/ingredients/{user_ing_id}
#   GET /fridge/tools/standard, GET · POST /fridge/tools, DELETE /fridge/tools/{tool_id}
#   GET /fridge/recommendations → 권우정의 RecipeService.recommend(db, user_id)를 불러서 돌려줌
#   ※ 식재료 목록은 /ingredients(조현기)가 이미 있음
#
# - 파일 안에 router = APIRouter(prefix=..., tags=[...])를 만들면 main.py가 자동으로 등록함 (main.py는 안 고쳐도 됨)
# - 모양은 app/routers/ingredient.py · recipe_comment.py(조현기) 참고
# - 로그인 필수: user_id: int = Depends(get_user_id) / 로그인 선택: Depends(get_optional)  (app/core/auth.py)
# - DB 세션: db: AsyncSession = Depends(get_db)  (app/db/database.py)
# - 만든 뒤 http://localhost:8044/docs 에서 바로 눌러 보며 확인
