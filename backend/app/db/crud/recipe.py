# [병합 수정 11/24 조현기] 오효정 PR(#4) 충돌 정리 중 깨진 곳 복구 (효정씨 동의)
#   - get_tool_name 들여쓰기 복구 (틀어져서 모든 레시피 조회가 500 오류)
#   - get_user_tool_ids 복구 (권우정: '내 도구로 가능' 계산에 씀, 충돌 때 지워짐)
#   - 마이페이지용 get_by_user · get_liked_by_user · get_bookmarked_by_user 추가 (routers/user.py가 부름)
#   - update_by_id: 단계에 step_image_url을 안 보내면 500 나던 것 → .get()으로
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
from app.db.scheme.recipes import RecipeIngredientItem, RecipeStepItem, RecipeCreate, RecipeUpdate
from app.db.models.recipe_comments import RecipeComment

# users 테이블에서 작성자 ID와 닉네임을 조회하기 위한 테이블 정의
users_t = table(
    "users",
    column("user_id"),
    column("nickname")
)

# 사용자의 냉장고 재료 ID를 조회하기 위한 테이블 정의
user_ingredients_t = table(
    "user_ingredients",
    column("user_id"),
    column("ing_id")
)

# 레시피 관련 DB 조회 및 추가·삭제를 담당하는 클래스
class RecipeCrud:

    # 레시피 목록 조회
    @staticmethod
    async def get_list(
        db: AsyncSession,
        search=None,
        limit: int | None = 20,
        offset: int = 0,
        sort: str = "latest"
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

            # 60분 초과 레시피 검색
            if search.over_60:
                stmt = stmt.where(
                    Recipe.cooking_time > 60
                )

        # 정렬
        if sort == "popular":
            # 레시피별 좋아요 개수를 계산하는 서브쿼리
            like_counts = (
                select(
                    RecipeLike.recipe_id,
                    func.count().label("like_count")
                )
                .group_by(RecipeLike.recipe_id)
                .subquery()
            )

            # 좋아요가 없는 레시피도 포함
            stmt = stmt.outerjoin(
                like_counts,
                Recipe.recipe_id == like_counts.c.recipe_id
            )

            # 좋아요 많은 순 → 작성일 최신순
            stmt = stmt.order_by(
                func.coalesce(like_counts.c.like_count, 0).desc(),
                Recipe.created_at.desc(),
                Recipe.recipe_id.desc()
            )

        else:
            # 기본 정렬: 최신순
            stmt = stmt.order_by(
                Recipe.created_at.desc(),
                Recipe.recipe_id.desc()
            )

        # 필요한 경우에만 페이지 나누기
        if limit is not None:
            stmt = stmt.limit(limit).offset(offset)

        # SQL 실행 후 조회한 Recipe 객체들을 리스트로 반환
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
        # 사용자의 좋아요 기록 생성
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
        # 사용자의 북마크 기록 생성
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
        # 사용자가 저장한 북마크 기록 조회
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

        # 레시피 재료 테이블과 식재료 테이블을 JOIN하여 조회
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

        # 조회한 재료 정보를 Pydantic 스키마 형태로 변환
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

        # 조회한 조리 단계를 Pydantic 스키마 형태로 변환
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
        #func.count() : 해당 recipe_id의 좋아요 기록 개수를 COUNT(*)로 조회
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

        # 레시피 카테고리 이름을 조회하기 위한 테이블 정의
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

        # 조리 도구 이름을 조회하기 위한 테이블 정의
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


    # 사용자가 보유한 조리도구 ID 목록 조회  (권우정, [병합 수정 11/24] 복구)
    @staticmethod
    async def get_user_tool_ids(
        db: AsyncSession,
        user_id: int
    ) -> list[int]:

        # 사용자 조리도구 테이블
        my_tools_t = table(
            "my_tools",
            column("user_id"),
            column("tool_id")
        )

        # 해당 사용자가 보유한 도구 ID 조회
        stmt = select(my_tools_t.c.tool_id).where(
            my_tools_t.c.user_id == user_id
        )

        result = await db.execute(stmt)

        # 조회한 도구 ID들을 리스트로 반환
        return list(result.scalars().all())

    # ── 마이페이지 ([병합 수정 11/24] routers/user.py에서 부르는데 없어서 추가) ──
    # 내가 쓴 레시피 (최신순)
    @staticmethod
    async def get_by_user(db: AsyncSession, user_id: int) -> list[Recipe]:
        result = await db.execute(
            select(Recipe).where(Recipe.user_id == user_id)
            .order_by(Recipe.created_at.desc(), Recipe.recipe_id.desc())
        )
        return list(result.scalars().all())

    # 내가 좋아요한 레시피 (최근에 누른 순)
    @staticmethod
    async def get_liked_by_user(db: AsyncSession, user_id: int) -> list[Recipe]:
        result = await db.execute(
            select(Recipe).join(RecipeLike, RecipeLike.recipe_id == Recipe.recipe_id)
            .where(RecipeLike.user_id == user_id)
            .order_by(RecipeLike.created_at.desc())
        )
        return list(result.scalars().all())

    # 내가 북마크한 레시피 (최근에 누른 순)
    @staticmethod
    async def get_bookmarked_by_user(db: AsyncSession, user_id: int) -> list[Recipe]:
        result = await db.execute(
            select(Recipe).join(Bookmark, Bookmark.recipe_id == Recipe.recipe_id)
            .where(Bookmark.user_id == user_id)
            .order_by(Bookmark.created_at.desc())
        )
        return list(result.scalars().all())

# -- (오효정) --
# 레시피와 재료·조리 단계를 생성
    @staticmethod
    async def create(
        db: AsyncSession,
        user_id: int,
        data: RecipeCreate,
    ) -> Recipe:
        recipe_data = data.model_dump(exclude={"ingredients", "steps"})

        recipe = Recipe(user_id=user_id, **recipe_data)
        db.add(recipe)
        await db.flush()  # 생성된 recipe_id 사용

        db.add_all([
            RecipeIngredient(
                recipe_id=recipe.recipe_id,
                ing_id=item.ing_id,
                amount_text=item.amount_text,
            )
            for item in data.ingredients
        ])

        db.add_all([
            RecipeStep(
                recipe_id=recipe.recipe_id,
                step_no=item.step_no,
                step_content=item.step_content,
                step_image_url=item.step_image_url,
            )
            for item in data.steps
        ])

        await db.flush()
        return recipe

    # 요청에 포함된 기본 정보만 수정하고, 보낸 재료·단계 목록은 교체
    @staticmethod
    async def update_by_id(
        db: AsyncSession,
        recipe_id: int,
        data: RecipeUpdate,
    ) -> Recipe | None:
        recipe = await db.get(Recipe, recipe_id)
        if recipe is None:
            return None

        changes = data.model_dump(exclude_unset=True)
        ingredients = changes.pop("ingredients", None)
        steps = changes.pop("steps", None)

        for key, value in changes.items():
            setattr(recipe, key, value)

        if ingredients is not None:
            result = await db.execute(
                select(RecipeIngredient).where(
                    RecipeIngredient.recipe_id == recipe_id
                )
            )
            for item in result.scalars().all():
                await db.delete(item)

            db.add_all([
                RecipeIngredient(
                    recipe_id=recipe_id,
                    ing_id=item["ing_id"],
                    amount_text=item["amount_text"],
                )
                for item in ingredients
            ])

        if steps is not None:
            result = await db.execute(
                select(RecipeStep).where(
                    RecipeStep.recipe_id == recipe_id
                )
            )
            for step in result.scalars().all():
                await db.delete(step)

            db.add_all([
                RecipeStep(
                    recipe_id=recipe_id,
                    step_no=step["step_no"],
                    step_content=step["step_content"],
                    step_image_url=step.get("step_image_url"),
                )
                for step in steps
            ])

        await db.flush()
        return recipe

    # 레시피와 연결된 재료·단계·좋아요·북마크·댓글도 삭제
    @staticmethod
    async def delete_by_id(
        db: AsyncSession,
        recipe_id: int,
    ) -> bool:
        recipe = await db.get(Recipe, recipe_id)
        if recipe is None:
            return False

        related_models = (
            RecipeIngredient,
            RecipeStep,
            RecipeLike,
            Bookmark,
            RecipeComment,
        )

        for model in related_models:
            result = await db.execute(
                select(model).where(model.recipe_id == recipe_id)
            )
            for item in result.scalars().all():
                await db.delete(item)

        await db.delete(recipe)
        await db.flush()
        return True