# 담당: 오효정
# 할 일: class UserCrud
#   get_by_id(db, user_id) / get_by_login_id(db, login_id) / get_by_email(db, email) / get_by_nickname(db, nickname)
#   create(db, data) / update_by_id(db, user_id, data)
#   update_refresh_token_by_id(db, user_id, refresh_token)
#   ※ 마지막 함수는 토큰 재발급(공통 미들웨어)이 이 이름 그대로 부름. 없으면 DB 저장만 건너뜀
#   ※ mini crud/user.py를 거의 그대로 쓰고 username → login_id로 바꾸면 됨
#
# - crud는 DB 읽기 · 쓰기만. 권한 확인 · 계산 같은 규칙은 services에
# - 모양은 app/db/crud/recipe_comment.py(조현기) 참고: @staticmethod + async def + await db.execute(select(...))
# - 쓰기 함수는 flush까지만, commit은 서비스(또는 라우터)에서 한 번에
# - 다 만들면 app/db/crud/__init__.py에 import 한 줄 추가
