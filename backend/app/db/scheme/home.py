# 담당: 조현기
# 메인화면 전용 응답 모양 (11/24)
from pydantic import BaseModel, Field

from app.db.scheme.recipes import RecipeListItem


# 메인 '내 냉장고 재료로 만들 수 있는 요리'
#   total   : 일치율 기준(MATCH_RATE, 50%) 이상인 레시피 전체 개수 → 배너의 'N가지'
#   recipes : 그중 위에서부터 몇 개만 (카드 모양은 레시피 목록과 같음: RecipeListItem)
class HomeRecommendRead(BaseModel):
    total: int = 0
    recipes: list[RecipeListItem] = Field(default_factory=list)
