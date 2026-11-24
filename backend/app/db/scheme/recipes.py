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
    # SQLAlchemy 모델 객체의 속성값을 이용해 Pydantic 모델로 변환 가능
    model_config = ConfigDict(from_attributes=True)

    # 레시피 기본 정보
    recipe_id: int
    recipe_title: str
    intro: str | None = None
    image_url: str | None = None

    # 난이도와 조리 시간
    level: str
    cooking_time: int

    # 요리 카테고리 정보
    r_category_id: int
    category_name: str

    # 필요한 조리 도구 정보
    tool_id: int | None = None
    tool_name: str | None = None

    # 레시피 작성자와 작성일
    user_id: int
    nickname: str
    created_at: datetime

    # 레시피의 좋아요 수와 댓글 수
    like_count: int = 0
    comment_count: int = 0

    # 선택한 재료와 레시피 재료의 일치율 (0.0 ~ 1.0)
    match_rate: float | None = None

    # 부족한 재료 목록과 레시피에 필요한 재료 ID 목록
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
# RecipeListItem의 필드를 상속받고 상세 페이지에 필요한 정보를 추가
class RecipeDetail(RecipeListItem):
    servings: int

    # 현재 로그인한 사용자의 좋아요·북마크·작성자 여부
    is_liked: bool = False
    is_bookmarked: bool = False
    is_mine: bool = False

    # 레시피에 필요한 재료 목록과 조리 단계 목록
    ingredients: list[RecipeIngredientItem] = Field(default_factory=list)
    steps: list[RecipeStepItem] = Field(default_factory=list)

# 레시피 검색 조건
class RecipeSearch(BaseModel):
    keyword: str | None = None
    r_category_id: int | None = None
    level: str | None = None
    cooking_time: int | None = Field(default=None, ge=1) #ge=1 : 1 이상

    # 사용자가 검색할 때 선택한 식재료 ID 목록
    ingredient_ids: list[int] = Field(default_factory=list)

    # 조리 시간이 60분을 초과하는 레시피만 검색할지 여부
    over_60: bool = False


# -- 오효정 추가 -- RecipeCreate / RecipeUpdate 


# 레시피 등록·수정 요청에 사용하는 하위 항목(추가- 아래 RecipeUpdate에서 참고)
class RecipeIngredientInput(BaseModel):
    ing_id: int = Field(gt=0)
    amount_text: str = Field(min_length=1, max_length=50)

# 레시피 스텝 입력 (추가- 아래 RecipeUpdate에서 참고)
class RecipeStepInput(BaseModel):
    step_no: int = Field(ge=1)
    step_content: str = Field(min_length=1)
    step_image_url: str | None = Field(default=None, max_length=500)

# 레시피 등록 요청
class RecipeCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    recipe_title: str = Field(min_length=1, max_length=50)
    intro: str | None = Field(default=None, max_length=200)
    image_url: str | None = Field(default=None, max_length=500)
    servings: int = Field(default=1, ge=1, le=99)
    tool_id: int | None = Field(default=None, gt=0)
    level: str = Field(min_length=1, max_length=20)
    cooking_time: int = Field(ge=1)
    r_category_id: int = Field(gt=0)

    ingredients: list[RecipeIngredientInput] = Field(min_length=1)
    steps: list[RecipeStepInput] = Field(min_length=1)


# 레시피 수정 요청: 보낸 필드만 수정할 수 있도록 전부 선택값으로 둠
class RecipeUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    recipe_title: str | None = Field(default=None, min_length=1, max_length=50)
    intro: str | None = Field(default=None, max_length=200)
    image_url: str | None = Field(default=None, max_length=500)
    servings: int | None = Field(default=None, ge=1, le=99)
    tool_id: int | None = Field(default=None, gt=0)
    level: str | None = Field(default=None, min_length=1, max_length=20)
    cooking_time: int | None = Field(default=None, ge=1)
    r_category_id: int | None = Field(default=None, gt=0)

    ingredients: list[RecipeIngredientInput] | None = Field(default=None, min_length=1)
    steps: list[RecipeStepInput] | None = Field(default=None, min_length=1)

    