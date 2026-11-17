# 담당: 오효정
# 할 일: prefix="/auth"
#   POST /auth/signup, POST /auth/login, GET /auth/me, POST /auth/logout, POST /auth/refresh
#   아이디 · 닉네임 중복 확인, 이메일 인증번호, 비밀번호 재설정
#   ※ 로그인 성공 시 set_auth_cookies(response, access_token, refresh_token)  (app/core/auth.py)
#   ※ 로그아웃은 response.delete_cookie로 두 쿠키 지우기 (mini routers/user.py 참고)
#   ※ 로그인 때 리프레시 토큰을 users.refresh_token에 저장, 로그아웃 때 NULL로 지우기
#     (토큰 재발급 미들웨어가 DB 값과 같을 때만 재발급함. 저장 안 하면 15분 뒤 로그인이 풀림)
#   ※ POST /auth/refresh는 미들웨어가 자동으로 재발급하므로 따로 안 만들어도 됨
#
# - 파일 안에 router = APIRouter(prefix=..., tags=[...])를 만들면 main.py가 자동으로 등록함 (main.py는 안 고쳐도 됨)
# - 모양은 app/routers/ingredient.py · recipe_comment.py(조현기) 참고
# - 로그인 필수: user_id: int = Depends(get_user_id) / 로그인 선택: Depends(get_optional)  (app/core/auth.py)
# - DB 세션: db: AsyncSession = Depends(get_db)  (app/db/database.py)
# - 만든 뒤 http://localhost:8044/docs 에서 바로 눌러 보며 확인
