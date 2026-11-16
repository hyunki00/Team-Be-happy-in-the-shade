# 담당: 정호진
# 할 일: class FridgeCrud
#   get_by_user(db, user_id)  소비기한 순, 재료 이름은 ingredients와 join
#   create / update_by_id / delete_by_id / delete_expired(db, user_id)
#   get_tools(db) / get_my_tools(db, user_id) / add_my_tool / delete_my_tool
#   ※ 재료 이름 · 대분류는 app/db/models/ingredients.py의 Ingredient(조현기)를 import해서 join
#
# - crud는 DB 읽기 · 쓰기만. 권한 확인 · 계산 같은 규칙은 services에
# - 모양은 app/db/crud/recipe_comment.py(조현기) 참고: @staticmethod + async def + await db.execute(select(...))
# - 쓰기 함수는 flush까지만, commit은 서비스(또는 라우터)에서 한 번에
# - 다 만들면 app/db/crud/__init__.py에 import 한 줄 추가
