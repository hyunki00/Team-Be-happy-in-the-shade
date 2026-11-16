# 담당: 조현기
# 테이블: ingredients_categories, ing_cate_synonyms, ingredients, ingredient_synonyms
# 테이블 · 컬럼 이름과 타입은 테이블 생성 SQL(11/13)과 똑같이 맞춤
# 외래키(ForeignKey)는 DB에 이미 걸려 있어서 모델에는 적지 않는다.
# (다른 사람 모델이 아직 없어도 오류가 나지 않게. 테이블을 합칠 때는 join 조건을 직접 쓴다)
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base


# 식재료 대분류 8개 (채소, 버섯, 육류 …)
class IngredientCategory(Base):
    __tablename__ = "ingredients_categories"

    ing_category_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    category_name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)


# 대분류 별칭 (야채 → 채소, 고기 → 육류)
class IngCateSynonym(Base):
    __tablename__ = "ing_cate_synonyms"

    ing_cate_sy_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ing_category_id: Mapped[int] = mapped_column(nullable=False)
    ing_cate_sy_name: Mapped[str] = mapped_column(String(50), nullable=False)


# 표준 식재료
class Ingredient(Base):
    __tablename__ = "ingredients"

    ing_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ing_name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    ing_category_id: Mapped[int] = mapped_column(nullable=False)


# 식재료 별칭 (계란 → 달걀)
class IngredientSynonym(Base):
    __tablename__ = "ingredient_synonyms"

    ing_sy_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    ing_id: Mapped[int] = mapped_column(nullable=False)
    ing_sy_name: Mapped[str] = mapped_column(String(50), nullable=False)
