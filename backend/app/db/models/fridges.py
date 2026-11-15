# 담당: 정호진
# 할 일:
#   UserIngredient → user_ingredients   user_ing_id, user_id, ing_id, expiration_date, amount(INT), unit(추가 요청분)
#   StandardTool   → standard_tools     tool_id, tool_name
#   MyTool         → my_tools           user_tool_id, user_id, tool_id
#
# - 모양은 app/db/models/ingredients.py · recipe_comments.py(조현기) 참고: class 이름(Base) + __tablename__ + mapped_column
# - 테이블 · 컬럼 이름과 타입은 테이블 생성 SQL(11/13)과 글자 하나까지 같게
# - ForeignKey는 DB에 이미 걸려 있으니 안 적어도 됨 (적으면 상대 모델이 없을 때 오류)
# - 다 만들면 app/db/models/__init__.py에 import 한 줄 추가
