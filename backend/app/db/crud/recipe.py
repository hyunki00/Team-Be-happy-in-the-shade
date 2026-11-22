# 담당: 권우정 (create · update_by_id · delete_by_id는 오효정이 추가)
# 할 일: class RecipeCrud
#   get_list(db, search) / get_by_id(db, recipe_id) / get_ingredient_ids(db, recipe_id)
#   add_like / remove_like / add_bookmark / remove_bookmark   (db, user_id, recipe_id)
#   (오효정) create / update_by_id / delete_by_id
#   ※ 레시피 778개라 목록은 페이지 나누기(limit · offset)를 고려
#   ※ 오효정이 같은 파일에 함수를 추가하니, 먼저 만들어서 올린 뒤 알려 주기
#
# - crud는 DB 읽기 · 쓰기만. 권한 확인 · 계산 같은 규칙은 services에
# - 모양은 app/db/crud/recipe_comment.py(조현기) 참고: @staticmethod + async def + await db.execute(select(...))
# - 쓰기 함수는 flush까지만, commit은 서비스(또는 라우터)에서 한 번에
# - 다 만들면 app/db/crud/__init__.py에 import 한 줄 추가

from sqlalchemy import select, func, table, column
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.recipes import ( Recipe, RecipeIngredient, RecipeStep, RecipeLike, Bookmark )
from app.db.models.ingredients import Ingredient
from app.db.scheme.recipes import RecipeIngredientItem, RecipeStepItem
from app.db.models.recipe_comments import RecipeComment


users_t = table(
    "users",
    column("user_id"),
    column("nickname")
)

user_ingredients_t = table(
    "user_ingredients",
    column("user_id"),
    column("ing_id")
)

class RecipeCrud:

    # 레시피 목록 조회
    @staticmethod
    async def get_list(
        db: AsyncSession,
        search=None,
        limit: int | None = 20,
        offset: int = 0
    ) -> list[Recipe]:

        #select(Recipe) : SELECT * FROM recipes;
        stmt = select(Recipe)

        # 검색 조건
        if search:
            if search.keyword:
                stmt = stmt.where(
                    Recipe.recipe_title.contains(search.keyword)
                )

            if search.r_category_id is not None:
                stmt = stmt.where(
                    Recipe.r_category_id == search.r_category_id
                )

            if search.level:
                stmt = stmt.where(
                    Recipe.level == search.level
                )

            if search.cooking_time is not None:
                stmt = stmt.where(
                    Recipe.cooking_time <= search.cooking_time
                )

        # 정렬
        stmt = stmt.order_by(
            Recipe.recipe_title.asc(),
            Recipe.recipe_id.asc()
        )

        # 필요한 경우에만 페이지 나누기
        if limit is not None:
            stmt = stmt.limit(limit).offset(offset)

        result = await db.execute(stmt)
        return list(result.scalars().all()) #db.execute()로 조회한 결과에서 Recipe 객체들만 꺼내 리스트 만듦

    # 레시피 ID로 상세 조회
    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        recipe_id: int
    ) -> Recipe | None:

        return await db.get(Recipe, recipe_id)

    # 레시피에 필요한 식재료 ID 목록
    @staticmethod
    async def get_ingredient_ids(
        db: AsyncSession,
        recipe_id: int
    ) -> list[int]:
        stmt = select(RecipeIngredient.ing_id).where(
            RecipeIngredient.recipe_id == recipe_id
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    # 좋아요 추가
    @staticmethod
    async def add_like(
        db: AsyncSession,
        user_id: int,
        recipe_id: int
    ) -> None:
        like = RecipeLike(user_id=user_id, recipe_id=recipe_id)
        db.add(like)
        await db.flush()

    # 좋아요 취소
    @staticmethod
    async def remove_like(
        db: AsyncSession,
        user_id: int,
        recipe_id: int
    ) -> bool:
        like = await db.get(RecipeLike, (user_id, recipe_id)) #특정 사용자가 특정 레시피에 누른 좋아요 찾기

        if like is None:
            return False

        await db.delete(like)
        await db.flush() #지금까지의 변경 내용을 DB에 SQL로 반영하지만, 아직 최종 확정하지 않음
        return True

    # 북마크 추가
    @staticmethod
    async def add_bookmark(
        db: AsyncSession,
        user_id: int,
        recipe_id: int
    ) -> None:
        bookmark = Bookmark(user_id=user_id, recipe_id=recipe_id)
        db.add(bookmark)
        await db.flush()

    # 북마크 취소
    @staticmethod
    async def remove_bookmark(
        db: AsyncSession,
        user_id: int,
        recipe_id: int
    ) -> bool:
        bookmark = await db.get(Bookmark, (user_id, recipe_id))

        if bookmark is None:
            return False

        await db.delete(bookmark)
        await db.flush()
        return True

    # 레시피에 들어가는 재료 이름과 수량 조회
    @staticmethod
    async def get_ingredients(
        db: AsyncSession,
        recipe_id: int
    ) -> list[RecipeIngredientItem]:

        stmt = (
            select(
                RecipeIngredient.ing_id,
                Ingredient.ing_name,
                RecipeIngredient.amount_text
            )
            .join(
                Ingredient,
                RecipeIngredient.ing_id == Ingredient.ing_id
            )
            .where(RecipeIngredient.recipe_id == recipe_id)
            .order_by(RecipeIngredient.recipe_ing_id)
        )

        result = await db.execute(stmt)

        return [
            RecipeIngredientItem(
                ing_id=row.ing_id,
                ing_name=row.ing_name,
                amount_text=row.amount_text
            )
            for row in result.all()
        ]

    # 레시피 조리 순서 조회
    @staticmethod
    async def get_steps(
        db: AsyncSession,
        recipe_id: int
    ) -> list[RecipeStepItem]:

        stmt = (
            select(RecipeStep)
            .where(RecipeStep.recipe_id == recipe_id)
            .order_by(RecipeStep.step_no) #조리 순서를 1번 → 2번 → 3번 순서로 정렬
        )

        result = await db.execute(stmt)

        return [
            RecipeStepItem.model_validate(step, from_attributes=True)
            for step in result.scalars().all()
        ]

    # 레시피 좋아요 수
    @staticmethod
    async def get_like_count(
        db: AsyncSession,
        recipe_id: int
    ) -> int:
        #func.count() : SELECT COUNT(*) FROM recipe_likes WHERE recipe_id = 778;
        stmt = select(func.count()).select_from(RecipeLike).where(
            RecipeLike.recipe_id == recipe_id
        )

        result = await db.execute(stmt)
        return result.scalar_one()

    # 레시피 댓글 수
    @staticmethod
    async def get_comment_count(
        db: AsyncSession,
        recipe_id: int
    ) -> int:
        stmt = select(func.count()).select_from(RecipeComment).where(
            RecipeComment.recipe_id == recipe_id
        )

        result = await db.execute(stmt)
        return result.scalar_one()

    # 레시피 작성자 닉네임 조회
    @staticmethod
    async def get_nickname(
        db: AsyncSession,
        user_id: int
    ) -> str | None:

        stmt = select(users_t.c.nickname).where(
            users_t.c.user_id == user_id
        )

        result = await db.execute(stmt)
        return result.scalar_one_or_none() #조회 결과가 하나면 그 값을 반환, 없으면 None을 반환

    # 사용자가 이 레시피에 좋아요를 눌렀는지 확인
    @staticmethod
    async def has_like(
        db: AsyncSession,
        user_id: int,
        recipe_id: int
    ) -> bool:

        like = await db.get(RecipeLike, (user_id, recipe_id))
        return like is not None #좋아요 기록 존재->True, 기록 없음->False

    # 사용자가 이 레시피를 북마크했는지 확인
    @staticmethod
    async def has_bookmark(
        db: AsyncSession,
        user_id: int,
        recipe_id: int
    ) -> bool:

        bookmark = await db.get(Bookmark, (user_id, recipe_id))
        return bookmark is not None #북마크 기록 존재->True, 기록 없음->False

    # 사용자의 냉장고에 있는 식재료 ID 목록
    @staticmethod
    async def get_user_ingredient_ids(
        db: AsyncSession,
        user_id: int
    ) -> list[int]:

        stmt = select(user_ingredients_t.c.ing_id).where(
            user_ingredients_t.c.user_id == user_id
        )

        result = await db.execute(stmt)
        return list(result.scalars().all())

        # 레시피 카테고리 이름 조회
    @staticmethod
    async def get_category_name(
        db: AsyncSession,
        r_category_id: int
    ) -> str | None:

        categories_t = table(
            "recipe_categories",
            column("r_category_id"),
            column("category_name")
        )

        stmt = select(categories_t.c.category_name).where(
            categories_t.c.r_category_id == r_category_id
        )

        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    # 조리 도구 이름 조회
    @staticmethod
    async def get_tool_name(
        db: AsyncSession,
        tool_id: int | None
    ) -> str | None:

        if tool_id is None:
            return None

        tools_t = table(
            "standard_tools",
            column("tool_id"),
            column("tool_name")
        )

        stmt = select(tools_t.c.tool_name).where(
            tools_t.c.tool_id == tool_id
        )

        result = await db.execute(stmt)
        return result.scalar_one_or_none()