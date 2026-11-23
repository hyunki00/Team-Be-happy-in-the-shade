# 담당: 정호진 — DB 읽기 · 쓰기만 담당, commit은 서비스에서
from datetime import date
from sqlalchemy import select, delete
from app.db.models.fridges import UserIngredient, StandardTool, MyTool
from app.db.models.ingredients import Ingredient, IngredientCategory
from app.db.models.users import User


class FridgeCrud:
    @staticmethod
    async def user_exists(db, user_id):
        return await db.get(User, user_id) is not None

    @staticmethod
    async def lock_user(db, user_id):
        # 같은 사용자의 도구 추가 요청을 순서대로 처리해 중복 등록을 막습니다.
        return await db.scalar(select(User).where(User.user_id == user_id).with_for_update())

    @staticmethod
    def ingredient_query():
        return select(
            UserIngredient.user_ing_id, UserIngredient.ing_id,
            Ingredient.ing_name, Ingredient.ing_category_id,
            UserIngredient.amount, UserIngredient.unit, UserIngredient.expiration_date,
        ).join(Ingredient, Ingredient.ing_id == UserIngredient.ing_id)

    @staticmethod
    async def get_by_user(db, user_id):
        result = await db.execute(
            FridgeCrud.ingredient_query().where(UserIngredient.user_id == user_id)
            .order_by(UserIngredient.expiration_date.is_(None),
                      UserIngredient.expiration_date, UserIngredient.user_ing_id)
        )
        return result.mappings().all()

    @staticmethod
    async def get_by_id(db, user_ing_id):
        return await db.get(UserIngredient, user_ing_id)

    @staticmethod
    async def get_read(db, user_ing_id):
        result = await db.execute(FridgeCrud.ingredient_query().where(
            UserIngredient.user_ing_id == user_ing_id))
        return result.mappings().one()

    @staticmethod
    async def get_ingredient(db, ing_id):
        result = await db.execute(select(Ingredient, IngredientCategory.category_name)
            .join(IngredientCategory, IngredientCategory.ing_category_id == Ingredient.ing_category_id)
            .where(Ingredient.ing_id == ing_id))
        return result.first()

    @staticmethod
    async def create(db, user_id, data):
        item = UserIngredient(user_id=user_id, **data.model_dump())
        db.add(item)
        await db.flush()
        return item

    @staticmethod
    async def update_by_id(db, user_ing_id, data):
        item = await db.get(UserIngredient, user_ing_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(item, key, value)
        await db.flush()
        return item

    @staticmethod
    async def delete_by_id(db, user_ing_id):
        item = await db.get(UserIngredient, user_ing_id)
        await db.delete(item)
        await db.flush()

    @staticmethod
    async def delete_expired(db, user_id):
        # 조회 시 자동 실행하지 않습니다. 사용자가 삭제에 동의한 경우에만 호출합니다.
        result = await db.execute(delete(UserIngredient).where(
            UserIngredient.user_id == user_id, UserIngredient.expiration_date < date.today()))
        await db.flush()
        return result.rowcount

    @staticmethod
    async def get_tools(db):
        return (await db.scalars(select(StandardTool).order_by(StandardTool.tool_id))).all()

    @staticmethod
    async def get_tool(db, tool_id):
        return await db.get(StandardTool, tool_id)

    @staticmethod
    async def get_my_tools(db, user_id):
        result = await db.execute(select(MyTool.user_tool_id, MyTool.tool_id, StandardTool.tool_name)
            .join(StandardTool, StandardTool.tool_id == MyTool.tool_id)
            .where(MyTool.user_id == user_id).order_by(MyTool.tool_id))
        return result.mappings().all()

    @staticmethod
    async def get_my_tool(db, user_id, tool_id):
        return await db.scalar(select(MyTool).where(MyTool.user_id == user_id, MyTool.tool_id == tool_id))

    @staticmethod
    async def add_my_tool(db, user_id, tool_id):
        item = MyTool(user_id=user_id, tool_id=tool_id)
        db.add(item)
        await db.flush()
        return item

    @staticmethod
    async def delete_my_tool(db, user_id, tool_id):
        await db.execute(delete(MyTool).where(MyTool.user_id == user_id, MyTool.tool_id == tool_id))
        await db.flush()
