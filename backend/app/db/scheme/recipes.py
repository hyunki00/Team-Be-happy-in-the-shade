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

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


# 레시피에 부족한 식재료
class MissingIngredient(BaseModel):
    ing_id: int
    ing_name: str


# 레시피 목록의 카드 하나
class RecipeListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    recipe_id: int
    recipe_title: str
    intro: str | None = None
    image_url: str | None = None

    level: str
    cooking_time: int

    r_category_id: int
    category_name: str

    tool_id: int | None = None
    tool_name: str | None = None

    user_id: int
    nickname: str
    created_at: datetime

    like_count: int = 0
    comment_count: int = 0

    match_rate: float | None = None
    missing_ingredients: list[MissingIngredient] = Field(default_factory=list)
    ingredient_ids: list[int] = Field(default_factory=list)


# 레시피 상세의 식재료 하나
class RecipeIngredientItem(BaseModel):
    ing_id: int
    ing_name: str
    amount_text: str | None = None


# 레시피 상세의 조리 순서 하나
class RecipeStepItem(BaseModel):
    step_id: int
    step_no: int
    step_content: str
    step_image_url: str | None = None


# 레시피 상세 응답
class RecipeDetail(RecipeListItem):
    servings: int

    is_liked: bool = False
    is_bookmarked: bool = False
    is_mine: bool = False

    ingredients: list[RecipeIngredientItem] = Field(default_factory=list)
    steps: list[RecipeStepItem] = Field(default_factory=list)

# 레시피 검색 조건
class RecipeSearch(BaseModel):
    keyword: str | None = None
    r_category_id: int | None = None
    level: str | None = None
    cooking_time: int | None = Field(default=None, ge=1) #ge=1 : 1 이상

    ingredient_ids: list[int] = Field(default_factory=list)