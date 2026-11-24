# 담당: 조현기
# 메인화면 전용 규칙 (11/24)
#
# recommendations: '내 냉장고 재료로 만들 수 있는 요리' 상위 몇 개 + 전체 개수
#   - 계산 방법은 레시피 추천(RecipeService.recommend, 권우정)과 같게 맞춤
#       일치율 = 레시피 재료(중복 제외) 중 내 냉장고에 있는 개수 ÷ 레시피 재료 수
#       기준   = .env MATCH_RATE (기본 0.5) 이상만
#       순서   = 일치율 높은 순 → 같으면 내 조리도구로 가능한 것 먼저 → 최신 레시피 먼저
#   - 다른 점은 속도: 레시피마다 DB에 묻지 않고 표 단위로 한 번씩만 가져와서 계산 (3.4초 → 0.1초 안팎)
#   - 카드 정보(작성자 · 좋아요 수 · 부족한 재료 …)는 화면에 보여 줄 몇 개만 가져온다
#
# hero_images: 첫 배너 오른쪽에 깔 음식 사진 무작위 몇 장 (11/24, 맨 아래)
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.settings import settings
from app.db.crud.home import HomeCrud
from app.db.scheme.home import HeroImageRead, HomeRecommendRead
from app.db.scheme.recipes import RecipeListItem


class HomeService:
    @staticmethod
    async def recommendations(db: AsyncSession, user_id: int, limit: int = 4) -> HomeRecommendRead:
        my_ing_ids = await HomeCrud.get_my_ing_ids(db, user_id)
        if not my_ing_ids:
            return HomeRecommendRead()   # 냉장고가 비었으면 추천 없음

        # 1. 모든 레시피의 일치율을 한 번에 계산
        recipe_ings: dict[int, set[int]] = {}
        for recipe_id, ing_id in await HomeCrud.get_all_recipe_ing_pairs(db):
            recipe_ings.setdefault(recipe_id, set()).add(ing_id)

        rates = {
            recipe_id: len(ings & my_ing_ids) / len(ings)
            for recipe_id, ings in recipe_ings.items()
            if ings
        }
        passed = [recipe_id for recipe_id, rate in rates.items() if rate >= settings.match_rate]
        if not passed:
            return HomeRecommendRead()

        # 2. 순서 정하기: 일치율 → 내 도구로 가능 → 최신
        my_tool_ids = await HomeCrud.get_my_tool_ids(db, user_id)
        sort_info = await HomeCrud.get_sort_info(db, passed)
        can_cook = {rid: tool_id is not None and tool_id in my_tool_ids for rid, tool_id, _ in sort_info}
        sort_info.sort(key=lambda row: (rates[row[0]], can_cook[row[0]], row[2], row[0]), reverse=True)
        top_ids = [row[0] for row in sort_info[:limit]]

        # 3. 보여 줄 몇 개만 카드 정보 채우기
        cards = {row[0].recipe_id: row for row in await HomeCrud.get_cards(db, top_ids)}
        likes = await HomeCrud.get_like_counts(db, top_ids)
        comments = await HomeCrud.get_comment_counts(db, top_ids)
        missing: dict[int, list[dict]] = {rid: [] for rid in top_ids}
        for rid, ing_id, ing_name in await HomeCrud.get_ingredients(db, top_ids):
            if ing_id not in my_ing_ids:
                missing[rid].append({"ing_id": ing_id, "ing_name": ing_name})

        items = []
        for rid in top_ids:
            recipe, nickname, category_name, tool_name = cards[rid]
            items.append(
                RecipeListItem(
                    recipe_id=recipe.recipe_id,
                    recipe_title=recipe.recipe_title,
                    intro=recipe.intro,
                    image_url=recipe.image_url,
                    level=recipe.level,
                    cooking_time=recipe.cooking_time,
                    r_category_id=recipe.r_category_id,
                    category_name=category_name or "",
                    tool_id=recipe.tool_id,
                    tool_name=tool_name,
                    can_cook_with_my_tools=can_cook[rid],
                    user_id=recipe.user_id,
                    nickname=nickname or "",
                    created_at=recipe.created_at,
                    like_count=likes.get(rid, 0),
                    comment_count=comments.get(rid, 0),
                    match_rate=rates[rid],
                    missing_ingredients=missing[rid],
                    ingredient_ids=sorted(recipe_ings[rid]),
                )
            )

        return HomeRecommendRead(total=len(passed), recipes=items)

    # [11/24 조현기] 첫 배너 음식 사진: 사진이 있는 레시피를 무작위로 count장
    #   로그인과 상관없이 같은 동작 (누구에게나 보이는 장식)
    @staticmethod
    async def hero_images(db: AsyncSession, count: int = 10) -> list[HeroImageRead]:
        rows = await HomeCrud.get_random_images(db, count)
        return [HeroImageRead(recipe_id=recipe_id, image_url=image_url) for recipe_id, image_url in rows]
