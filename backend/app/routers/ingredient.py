# 담당: 조현기
# 식재료 API: 재료 담기(정호진), 식재료 선택 모달(조현기)에서 씀. 로그인 없이도 볼 수 있음
# 계산할 게 없어서 서비스 파일 없이 IngredientCrud를 바로 부름
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db.crud.ingredient import IngredientCrud
from app.db.scheme.ingredients import IngredientRead, IngredientCategoryRead

router = APIRouter(prefix="/ingredients", tags=["Ingredient"])


# GET /ingredients                       → 전체
# GET /ingredients?category_id=3          → 대분류 3(육류)만
# GET /ingredients?keyword=계란            → 이름 · 별칭 검색 (달걀이 나옴)
# GET /ingredients?category_id=1&keyword=파 → 둘 다
@router.get("", response_model=list[IngredientRead])
async def get_ingredients(
    category_id: int | None = Query(None, description="대분류 번호 (ing_category_id)"),
    keyword: str | None = Query(None, max_length=50, description="검색어"),
    db: AsyncSession = Depends(get_db),
):
    keyword = (keyword or "").strip()
    if keyword:
        return await IngredientCrud.search_by_name(db, keyword, category_id)
    return await IngredientCrud.get_by_category(db, category_id)


# GET /ingredients/categories → 대분류 8개
@router.get("/categories", response_model=list[IngredientCategoryRead])
async def get_categories(db: AsyncSession = Depends(get_db)):
    return await IngredientCrud.get_categories(db)
