# 담당: 권우정
# 할 일:
#   RecipeCategory   → recipe_categories    r_category_id, category_name
#   CategorySynonym  → category_synonyms    r_cate_sy_id, r_category_id, r_cate_sy_name
#   Recipe           → recipes              recipe_id, user_id, recipe_title, intro, image_url, servings,
#                                           tool_id(NULL 가능), level, cooking_time, created_at, r_category_id
#   RecipeIngredient → recipe_ingredients   recipe_ing_id, recipe_id, ing_id, amount_text
#   RecipeStep       → recipe_steps         step_id, recipe_id, step_no, step_content, step_image_url
#   RecipeLike       → recipe_likes         user_id + recipe_id 복합 기본키 (둘 다 primary_key=True), created_at
#   Bookmark         → bookmarks            user_id + recipe_id 복합 기본키, created_at
#
# - 모양은 app/db/models/ingredients.py · recipe_comments.py(조현기) 참고: class 이름(Base) + __tablename__ + mapped_column
# - 테이블 · 컬럼 이름과 타입은 테이블 생성 SQL(11/13)과 글자 하나까지 같게
# - ForeignKey는 DB에 이미 걸려 있으니 안 적어도 됨 (적으면 상대 모델이 없을 때 오류)
# - 다 만들면 app/db/models/__init__.py에 import 한 줄 추가

from datetime import datetime

from sqlalchemy import String, Text,func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base


# 레시피 카테고리
class RecipeCategory(Base):
    __tablename__ = "recipe_categories" #테이블명

    r_category_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    category_name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False) #중복값 x, NULL 허용 x

# 레시피 카테고리 별칭
class CategorySynonym(Base):
    __tablename__ = "category_synonyms" #테이블명

    r_cate_sy_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    r_category_id: Mapped[int] = mapped_column(nullable=False)
    r_cate_sy_name: Mapped[str] = mapped_column(String(50), nullable=False)

# 레시피
class Recipe(Base):
    __tablename__ = "recipes" #테이블명

    recipe_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(nullable=False)

    recipe_title: Mapped[str] = mapped_column(String(100), nullable=False)
    intro: Mapped[str | None] = mapped_column(String(200), nullable=True) #intro는 생략 가능
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True) #이미지 생략 가능

    #레시피 인분수 입력하지 않으면 기본값 1
    servings: Mapped[int] = mapped_column(nullable=False, server_default="1")
    tool_id: Mapped[int | None] = mapped_column(nullable=True) #도구 생략 가능

    level: Mapped[str] = mapped_column(String(20), nullable=False)
    cooking_time: Mapped[int] = mapped_column(nullable=False)

    ##레시피 등록 시, 생성시간을 현재 시각으로 기록
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())
    r_category_id: Mapped[int] = mapped_column(nullable=False)

# 레시피 필요 식재료
class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients" #테이블명

    recipe_ing_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    recipe_id: Mapped[int] = mapped_column(nullable=False)
    ing_id: Mapped[int] = mapped_column(nullable=False)
    amount_text: Mapped[str | None] = mapped_column(String(50), nullable=True) #식재료 필요 분량 생략 가능

# 레시피 조리 순서
class RecipeStep(Base):
    __tablename__ = "recipe_steps" #테이블명

    step_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    recipe_id: Mapped[int] = mapped_column(nullable=False)
    step_no: Mapped[int] = mapped_column(nullable=False)
    step_content: Mapped[str] = mapped_column(Text, nullable=False)
    step_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True) #단계별 이미지 생략 가능

# 레시피 좋아요
class RecipeLike(Base):
    __tablename__ = "recipe_likes" #테이블명

    user_id: Mapped[int] = mapped_column(primary_key=True)
    recipe_id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())

# 레시피 북마크
class Bookmark(Base):
    __tablename__ = "bookmarks"

    user_id: Mapped[int] = mapped_column(primary_key=True)
    recipe_id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False, server_default=func.now())