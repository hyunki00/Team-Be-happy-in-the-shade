# 담당: 조현기
# DB 읽기 · 쓰기 (recipe_comments)
# 작성자 닉네임 · 레시피 제목은 다른 사람 모델(User, Recipe)을 기다리지 않도록
# 필요한 컬럼만 적은 가벼운 table()로 읽는다. (users · recipes 테이블을 읽기만 함)
from sqlalchemy import select, table, column
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.recipe_comments import RecipeComment
from app.db.scheme.recipe_comments import RecipeCommentCreate

users_t = table("users", column("user_id"), column("nickname"))
recipes_t = table("recipes", column("recipe_id"), column("recipe_title"))


class RecipeCommentCrud:
    @staticmethod
    async def user_exists(db: AsyncSession, user_id: int) -> bool:
        result = await db.execute(select(users_t.c.user_id).where(users_t.c.user_id == user_id))
        return result.first() is not None

    @staticmethod
    async def recipe_exists(db: AsyncSession, recipe_id: int) -> bool:
        result = await db.execute(select(recipes_t.c.recipe_id).where(recipes_t.c.recipe_id == recipe_id))
        return result.first() is not None

    # 레시피 하나의 댓글 + 작성자 닉네임, 최신순 → [(댓글, 닉네임), …]
    @staticmethod
    async def get_by_recipe(db: AsyncSession, recipe_id: int) -> list[tuple[RecipeComment, str]]:
        result = await db.execute(
            select(RecipeComment, users_t.c.nickname)
            .join(users_t, users_t.c.user_id == RecipeComment.user_id)
            .where(RecipeComment.recipe_id == recipe_id)
            .order_by(RecipeComment.created_at.desc(), RecipeComment.rc_id.desc())
        )
        return [(row[0], row[1]) for row in result.all()]

    @staticmethod
    async def get_by_id(db: AsyncSession, rc_id: int) -> RecipeComment | None:
        return await db.get(RecipeComment, rc_id)

    # 댓글 하나 + 작성자 닉네임 → (댓글, 닉네임) 또는 None
    @staticmethod
    async def get_with_nickname(db: AsyncSession, rc_id: int) -> tuple[RecipeComment, str] | None:
        result = await db.execute(
            select(RecipeComment, users_t.c.nickname)
            .join(users_t, users_t.c.user_id == RecipeComment.user_id)
            .where(RecipeComment.rc_id == rc_id)
        )
        row = result.first()
        return (row[0], row[1]) if row else None

    # 마이페이지용: 내가 쓴 레시피 댓글 + 레시피 제목, 최신순 → [(댓글, 레시피 제목), …]
    @staticmethod
    async def get_by_user(db: AsyncSession, user_id: int) -> list[tuple[RecipeComment, str]]:
        result = await db.execute(
            select(RecipeComment, recipes_t.c.recipe_title)
            .join(recipes_t, recipes_t.c.recipe_id == RecipeComment.recipe_id)
            .where(RecipeComment.user_id == user_id)
            .order_by(RecipeComment.created_at.desc(), RecipeComment.rc_id.desc())
        )
        return [(row[0], row[1]) for row in result.all()]

    # 아래 쓰기 함수는 flush까지만 한다. commit은 부르는 쪽(라우터)에서
    @staticmethod
    async def create(db: AsyncSession, user_id: int, recipe_id: int, data: RecipeCommentCreate) -> RecipeComment:
        comment = RecipeComment(user_id=user_id, recipe_id=recipe_id, **data.model_dump())
        db.add(comment)
        await db.flush()
        return comment

    # 보낸 값만 바꾼다 (exclude_unset). 사진을 안 보내면 원래 사진이 그대로 남는다.
    # 사진을 지우려면 rc_image_url: null 을 직접 보낸다.
    @staticmethod
    async def update_by_id(db: AsyncSession, rc_id: int, data: RecipeCommentCreate) -> RecipeComment | None:
        comment = await db.get(RecipeComment, rc_id)
        if comment:
            for key, value in data.model_dump(exclude_unset=True).items():
                setattr(comment, key, value)
            await db.flush()
        return comment

    @staticmethod
    async def delete_by_id(db: AsyncSession, rc_id: int) -> bool:
        comment = await db.get(RecipeComment, rc_id)
        if not comment:
            return False
        await db.delete(comment)
        await db.flush()
        return True
