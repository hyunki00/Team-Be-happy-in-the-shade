# 담당: 오효정
# 할 일: class UserService
#   signup(db, data)    아이디 · 닉네임 중복 확인, 비밀번호 암호화(get_password_hash)
#   login(db, data)     login_id로 찾고 verify_password, 토큰 두 개 발급, refresh_token 저장
#   get_user / check_login_id / check_nickname / update_profile
#   ※ mini serivces/user.py에서 email 로그인 → login_id 로그인으로 바꾸면 거의 그대로
#
# - mini의 serivces/user.py 모양: crud를 부르고, 안 되는 경우는 HTTPException(status_code, detail)으로 막기
# - 404 없음 / 403 남의 것 / 400 잘못된 값 / 401 로그인 필요
# - commit은 여기서. 실패하면 rollback
# - 다 만들면 app/services/__init__.py에 import 한 줄 추가
