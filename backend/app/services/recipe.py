# 담당: 권우정
# 할 일: class RecipeService
#   search / get_detail / toggle_like / toggle_bookmark   (비로그인이면 user_id가 None)
#   calc_match_rate(recipe_ing_ids, my_ing_ids)  내 냉장고에 있는 재료 수 ÷ 레시피 재료 수
#   recommend(db, user_id)  settings.match_rate(.env의 MATCH_RATE, 기본 0.7) 이상만
#   ※ recommend는 정호진의 /fridge/recommendations가 부름
#   ※ 재료를 고르면 일치율순, 안 고르면 가나다순
#
# - mini의 serivces/user.py 모양: crud를 부르고, 안 되는 경우는 HTTPException(status_code, detail)으로 막기
# - 404 없음 / 403 남의 것 / 400 잘못된 값 / 401 로그인 필요
# - commit은 여기서. 실패하면 rollback
# - 다 만들면 app/services/__init__.py에 import 한 줄 추가
