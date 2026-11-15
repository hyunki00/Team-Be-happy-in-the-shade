# 담당: 임유빈
# 할 일: class PostCrud
#   get_list(db, sort, search_type, keyword)  최신순 · 인기순 / 제목 · 제목+내용 · 작성자 검색
#   get_by_id / create / update_by_id / delete_by_id
#   add_like / remove_like / get_comments / create_comment / update_comment / delete_comment
#   ※ 댓글 부분은 app/db/crud/recipe_comment.py(조현기)와 거의 같은 모양
#
# - crud는 DB 읽기 · 쓰기만. 권한 확인 · 계산 같은 규칙은 services에
# - 모양은 app/db/crud/recipe_comment.py(조현기) 참고: @staticmethod + async def + await db.execute(select(...))
# - 쓰기 함수는 flush까지만, commit은 서비스(또는 라우터)에서 한 번에
# - 다 만들면 app/db/crud/__init__.py에 import 한 줄 추가
