# 담당: 임유빈
# 할 일: class PostService
#   get_list / get_detail / write / edit / remove / toggle_like
#   ※ 본인 글 · 댓글만 수정 · 삭제 (아니면 403), 사진 최대 5장
#
# - mini의 serivces/user.py 모양: crud를 부르고, 안 되는 경우는 HTTPException(status_code, detail)으로 막기
# - 404 없음 / 403 남의 것 / 400 잘못된 값 / 401 로그인 필요
# - commit은 여기서. 실패하면 rollback
# - 다 만들면 app/services/__init__.py에 import 한 줄 추가
