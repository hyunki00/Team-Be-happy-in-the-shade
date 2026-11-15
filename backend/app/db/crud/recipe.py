# 담당: 권우정 (create · update_by_id · delete_by_id는 오효정이 추가)
# 할 일: class RecipeCrud
#   get_list(db, search) / get_by_id(db, recipe_id) / get_ingredient_ids(db, recipe_id)
#   add_like / remove_like / add_bookmark / remove_bookmark   (db, user_id, recipe_id)
#   (오효정) create / update_by_id / delete_by_id
#   ※ 레시피 778개라 목록은 페이지 나누기(limit · offset)를 고려
#   ※ 오효정이 같은 파일에 함수를 추가하니, 먼저 만들어서 올린 뒤 알려 주기
#
# - crud는 DB 읽기 · 쓰기만. 권한 확인 · 계산 같은 규칙은 services에
# - 모양은 app/db/crud/recipe_comment.py(조현기) 참고: @staticmethod + async def + await db.execute(select(...))
# - 쓰기 함수는 flush까지만, commit은 서비스(또는 라우터)에서 한 번에
# - 다 만들면 app/db/crud/__init__.py에 import 한 줄 추가
