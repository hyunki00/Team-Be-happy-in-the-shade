# 담당: 권우정 (RecipeCreate · RecipeUpdate는 오효정이 추가)
# 할 일: BaseModel 클래스
#   RecipeListItem   카드 하나, mockRecipes 모양 (nickname, like_count, comment_count, match_rate, missing_ingredients …)
#   RecipeDetail     상세, mockRecipeDetail 모양 (ingredients, steps, is_liked, is_bookmarked, is_mine …)
#   RecipeSearch     검색 조건 (검색어 · 요리 종류 · 난이도 · 조리시간 · 고른 재료)
#   (오효정) RecipeCreate / RecipeUpdate   기본 정보 + ingredients[ing_id, amount_text] + steps[step_no, step_content, step_image_url]
#   ※ comment_count는 recipe_comments를 세면 됨 (조현기 모델 RecipeComment 사용 가능)
#
# - 모양은 app/db/scheme/ingredients.py · recipe_comments.py(조현기) 참고
# - 필드 이름은 프론트 mockData.js와 같게 (화면이 그대로 받을 수 있게)
# - DB 모델 객체를 그대로 돌려줄 클래스에는 model_config = ConfigDict(from_attributes=True)
# - 글자 수 제한은 Field(max_length=…)로, 숫자는 프론트 constants.js와 맞추기
