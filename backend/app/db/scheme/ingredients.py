# 담당: 조현기
# 화면과 주고받는 식재료 데이터 모양 (프론트 mockData.js의 mockIngredients · mockIngredientCategories와 같은 이름)
from pydantic import BaseModel, ConfigDict


class IngredientCategoryRead(BaseModel):
    # from_attributes: DB 모델 객체를 그대로 넣어도 이 모양으로 바꿔 줌
    model_config = ConfigDict(from_attributes=True)

    ing_category_id: int
    category_name: str


class IngredientRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ing_id: int
    ing_name: str
    ing_category_id: int
