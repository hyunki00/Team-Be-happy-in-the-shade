# 담당: 조현기
# DB 읽기 (식재료는 표준 목록이라 읽기만 함)
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.ingredients import IngredientCategory, IngCateSynonym, Ingredient, IngredientSynonym


class IngredientCrud:
    # 대분류 8개, 번호 순
    @staticmethod
    async def get_categories(db: AsyncSession) -> list[IngredientCategory]:
        result = await db.execute(select(IngredientCategory).order_by(IngredientCategory.ing_category_id))
        return list(result.scalars().all())

    # 대분류별 식재료, 가나다순. ing_category_id가 None이면 전체
    @staticmethod
    async def get_by_category(db: AsyncSession, ing_category_id: int | None = None) -> list[Ingredient]:
        stmt = select(Ingredient)
        if ing_category_id is not None:
            stmt = stmt.where(Ingredient.ing_category_id == ing_category_id)
        result = await db.execute(stmt.order_by(Ingredient.ing_name))
        return list(result.scalars().all())

    # 이름 검색, 가나다순
    # - 검색어가 대분류 이름 · 대분류 별칭과 똑같으면 그 대분류 전체   예: "야채" → 채소 전부
    # - 아니면 식재료 이름 또는 식재료 별칭에 검색어가 들어간 것      예: "버섯" → 표고버섯 …, "계란" → 달걀
    @staticmethod
    async def search_by_name(db: AsyncSession, keyword: str, ing_category_id: int | None = None) -> list[Ingredient]:
        category_ids = (await db.execute(
            select(IngredientCategory.ing_category_id).where(IngredientCategory.category_name == keyword)
            .union(select(IngCateSynonym.ing_category_id).where(IngCateSynonym.ing_cate_sy_name == keyword))
        )).scalars().all()

        if category_ids:
            stmt = select(Ingredient).where(Ingredient.ing_category_id.in_(category_ids))
        else:
            synonym_ids = select(IngredientSynonym.ing_id).where(
                IngredientSynonym.ing_sy_name.contains(keyword, autoescape=True)
            )
            stmt = select(Ingredient).where(
                or_(
                    Ingredient.ing_name.contains(keyword, autoescape=True),
                    Ingredient.ing_id.in_(synonym_ids),
                )
            )
        if ing_category_id is not None:
            stmt = stmt.where(Ingredient.ing_category_id == ing_category_id)
        result = await db.execute(stmt.order_by(Ingredient.ing_name))
        return list(result.scalars().all())
