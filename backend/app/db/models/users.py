# 담당: 오효정
# 할 일: User → 테이블 users
#   user_id, login_id(추가 요청분), email, password, nickname, profile_image, refresh_token, created_at
#   ※ 토큰 재발급(공통 미들웨어)이 refresh_token 컬럼을 씀
#
# - 모양은 app/db/models/ingredients.py · recipe_comments.py(조현기) 참고: class 이름(Base) + __tablename__ + mapped_column
# - 테이블 · 컬럼 이름과 타입은 테이블 생성 SQL(11/13)과 글자 하나까지 같게
# - ForeignKey는 DB에 이미 걸려 있으니 안 적어도 됨 (적으면 상대 모델이 없을 때 오류)
# - 다 만들면 app/db/models/__init__.py에 import 한 줄 추가
