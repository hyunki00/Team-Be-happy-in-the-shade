# 담당: 정호진
# 할 일: class FridgeService
#   get_my_fridge / add / update / delete
#   ※ 단위 규칙(육류 g · 음료 L · 나머지 개), 수량 범위(1~99, g은 1~999)는 프론트 constants.js와 같게
#   ※ 수정 · 삭제 전에 본인 재료인지 확인 (아니면 403)
#   ※ 조리도구는 계산이 없어 라우터에서 crud를 바로 불러도 됨
#
# - mini의 serivces/user.py 모양: crud를 부르고, 안 되는 경우는 HTTPException(status_code, detail)으로 막기
# - 404 없음 / 403 남의 것 / 400 잘못된 값 / 401 로그인 필요
# - commit은 여기서. 실패하면 rollback
# - 다 만들면 app/services/__init__.py에 import 한 줄 추가
