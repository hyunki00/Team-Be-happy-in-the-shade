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
