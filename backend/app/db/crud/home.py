# 담당: 조현기
# 메인화면 전용 DB 조회 (11/24)
# - 메인의 '내 냉장고 재료로 만들 수 있는 요리'를 빠르게 만들기 위한 조회만 모아 둠
# - 레시피마다 따로 DB에 묻지 않고, 필요한 값을 표 단위로 한 번씩만 가져온다 (쿼리 7번 안팎)
#   (기존 /fridge/recommendations는 레시피 778개 × 여러 번 조회라 3초 넘게 걸림)
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.fridges import UserIngredient, MyTool, StandardTool
from app.db.models.ingredients import Ingredient
from app.db.models.recipes import Recipe, RecipeCategory, RecipeIngredient, RecipeLike
from app.db.models.recipe_comments import RecipeComment
from app.db.models.users import User


class HomeCrud:
    # 내 냉장고 재료 ID (중복 없이)
    @staticmethod
    async def get_my_ing_ids(db: AsyncSession, user_id: int) -> set[int]:
        result = await db.execute(select(UserIngredient.ing_id).where(UserIngredient.user_id == user_id))
        return set(result.scalars().all())

    # 내 조리도구 ID
    @staticmethod
    async def get_my_tool_ids(db: AsyncSession, user_id: int) -> set[int]:
        result = await db.execute(select(MyTool.tool_id).where(MyTool.user_id == user_id))
        return set(result.scalars().all())

    # 모든 레시피의 (레시피 ID, 재료 ID) 짝 — 일치율 계산용, 한 번에
    @staticmethod
    async def get_all_recipe_ing_pairs(db: AsyncSession) -> list[tuple[int, int]]:
        result = await db.execute(select(RecipeIngredient.recipe_id, RecipeIngredient.ing_id).distinct())
        return list(result.all())

    # 후보 레시피의 정렬용 값 (도구 · 작성일)
    @staticmethod
    async def get_sort_info(db: AsyncSession, recipe_ids: list[int]) -> list[tuple[int, int | None, object]]:
        if not recipe_ids:
            return []
        result = await db.execute(
            select(Recipe.recipe_id, Recipe.tool_id, Recipe.created_at).where(Recipe.recipe_id.in_(recipe_ids))
        )
        return list(result.all())

    # 카드에 보여 줄 레시피 정보 (작성자 · 종류 · 도구 이름까지 JOIN 한 번)
    @staticmethod
    async def get_cards(db: AsyncSession, recipe_ids: list[int]):
        if not recipe_ids:
            return []
        stmt = (
            select(Recipe, User.nickname, RecipeCategory.category_name, StandardTool.tool_name)
            .join(User, User.user_id == Recipe.user_id, isouter=True)
            .join(RecipeCategory, RecipeCategory.r_category_id == Recipe.r_category_id, isouter=True)
            .join(StandardTool, StandardTool.tool_id == Recipe.tool_id, isouter=True)
            .where(Recipe.recipe_id.in_(recipe_ids))
        )
        result = await db.execute(stmt)
        return list(result.all())

    # 레시피별 좋아요 수
    @staticmethod
    async def get_like_counts(db: AsyncSession, recipe_ids: list[int]) -> dict[int, int]:
        if not recipe_ids:
            return {}
        result = await db.execute(
            select(RecipeLike.recipe_id, func.count())
            .where(RecipeLike.recipe_id.in_(recipe_ids))
            .group_by(RecipeLike.recipe_id)
        )
        return dict(result.all())

    # 레시피별 댓글 수
    @staticmethod
    async def get_comment_counts(db: AsyncSession, recipe_ids: list[int]) -> dict[int, int]:
        if not recipe_ids:
            return {}
        result = await db.execute(
            select(RecipeComment.recipe_id, func.count())
            .where(RecipeComment.recipe_id.in_(recipe_ids))
            .group_by(RecipeComment.recipe_id)
        )
        return dict(result.all())

    # 레시피별 재료 (이름까지, 레시피에 적힌 순서대로) — 부족한 재료를 고르는 데 씀
    @staticmethod
    async def get_ingredients(db: AsyncSession, recipe_ids: list[int]) -> list[tuple[int, int, str]]:
        if not recipe_ids:
            return []
        result = await db.execute(
            select(RecipeIngredient.recipe_id, RecipeIngredient.ing_id, Ingredient.ing_name)
            .join(Ingredient, Ingredient.ing_id == RecipeIngredient.ing_id)
            .where(RecipeIngredient.recipe_id.in_(recipe_ids))
            .order_by(RecipeIngredient.recipe_ing_id)
        )
        return list(result.all())
