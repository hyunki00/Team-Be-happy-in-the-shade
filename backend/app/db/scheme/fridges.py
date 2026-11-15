# 담당: 정호진
# 할 일: BaseModel 클래스
#   UserIngredientCreate / UserIngredientUpdate   ing_id, amount, unit, expiration_date
#   UserIngredientRead   mockFridge 모양 (재료 이름 ing_name · 대분류 ing_category_id를 붙여서)
#   ToolRead / MyToolRead   mockStandardTools · mockMyTools 모양
#
# - 모양은 app/db/scheme/ingredients.py · recipe_comments.py(조현기) 참고
# - 필드 이름은 프론트 mockData.js와 같게 (화면이 그대로 받을 수 있게)
# - DB 모델 객체를 그대로 돌려줄 클래스에는 model_config = ConfigDict(from_attributes=True)
# - 글자 수 제한은 Field(max_length=…)로, 숫자는 프론트 constants.js와 맞추기
