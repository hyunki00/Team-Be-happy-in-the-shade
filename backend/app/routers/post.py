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
