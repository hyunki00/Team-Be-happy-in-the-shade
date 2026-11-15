# 담당: 임유빈
# 할 일:
#   Post        → posts          post_id, user_id, title, content, created_at
#   PostImage   → post_images    p_image_id, post_id, p_image_url, p_image_order
#   PostLike    → posts_likes    user_id + post_id 복합 기본키 (둘 다 primary_key=True), created_at
#   PostComment → post_comments  pc_id, user_id, post_id, pc_content, pc_image_url, created_at
#
# - 모양은 app/db/models/ingredients.py · recipe_comments.py(조현기) 참고: class 이름(Base) + __tablename__ + mapped_column
# - 테이블 · 컬럼 이름과 타입은 테이블 생성 SQL(11/13)과 글자 하나까지 같게
# - ForeignKey는 DB에 이미 걸려 있으니 안 적어도 됨 (적으면 상대 모델이 없을 때 오류)
# - 다 만들면 app/db/models/__init__.py에 import 한 줄 추가
