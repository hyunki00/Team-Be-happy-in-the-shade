# 담당: 조현기
# DB 읽기 (식재료는 표준 목록이라 읽기만 함)
from sqlalchemy import select, or_, case, func
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

    # 이름 검색
    # - 검색어가 대분류 이름 · 대분류 별칭과 똑같으면 그 대분류 전체 (가나다순)   예: "야채" → 채소 전부
    # - 아니면 식재료 이름 또는 식재료 별칭에 검색어가 들어간 것      예: "버섯" → 표고버섯 …, "계란" → 달걀
    #   순서: 이름(별칭)이 검색어와 똑같은 것 → 검색어로 시작하는 것 → 나머지, 같은 단계면 짧은 이름 · 가나다순
    #   예: "양파" → 양파, 양파가루 … 고기삶는재료양파 (첫 번째가 찾던 재료가 되게)
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
            exact_synonym_ids = select(IngredientSynonym.ing_id).where(IngredientSynonym.ing_sy_name == keyword)
            stmt = select(Ingredient).where(
                or_(
                    Ingredient.ing_name.contains(keyword, autoescape=True),
                    Ingredient.ing_id.in_(synonym_ids),
                )
            )
            # 정확히 같은 이름 0 → 검색어로 시작 1 → 나머지 2
            match_order = case(
                (or_(Ingredient.ing_name == keyword, Ingredient.ing_id.in_(exact_synonym_ids)), 0),
                (Ingredient.ing_name.startswith(keyword, autoescape=True), 1),
                else_=2,
            )
            stmt = stmt.order_by(match_order, func.char_length(Ingredient.ing_name))
        if ing_category_id is not None:
            stmt = stmt.where(Ingredient.ing_category_id == ing_category_id)
        result = await db.execute(stmt.order_by(Ingredient.ing_name))
        return list(result.scalars().all())
