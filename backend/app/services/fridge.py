# 담당: 정호진 — 본인 재료 확인 · 수량/단위 검증 · 저장
from fastapi import HTTPException
from app.db.crud.fridge import FridgeCrud
from app.db.scheme.fridges import UserIngredientRead, MyToolRead


class FridgeService:
    @staticmethod
    async def get_my_fridge(db, user_id):
        return await FridgeCrud.get_by_user(db, user_id)

    @staticmethod
    async def get_owned(db, user_id, user_ing_id):
        item = await FridgeCrud.get_by_id(db, user_ing_id)
        if item is None:
            raise HTTPException(404, "재료를 찾을 수 없습니다.")
        if item.user_id != user_id:
            raise HTTPException(403, "본인 재료만 수정 · 삭제할 수 있습니다.")
        return item

    @staticmethod
    async def validate(db, ing_id, amount, unit):
        row = await FridgeCrud.get_ingredient(db, ing_id)
        if row is None:
            raise HTTPException(404, "식재료를 찾을 수 없습니다.")
        _, category_name = row
        if category_name == "육류" and unit != "g":
            raise HTTPException(400, "육류의 단위는 g입니다.")
        if category_name != "육류" and unit not in ("개", "L"):
            raise HTTPException(400, "육류 외 재료의 단위는 개 또는 L입니다.")
        # 확정 규칙: 육류는 g, 나머지 재료는 개 또는 L을 선택합니다.
        maximum = 999 if unit == "g" else 99
        if amount is None or not 1 <= amount <= maximum:
            raise HTTPException(400, f"수량은 1부터 {maximum}까지 입력해 주세요.")

    @staticmethod
    async def add(db, user_id, data):
        try:
            await FridgeService.validate(db, data.ing_id, data.amount, data.unit)
            item = await FridgeCrud.create(db, user_id, data)
            result = UserIngredientRead.model_validate(await FridgeCrud.get_read(db, item.user_ing_id))
            await db.commit()
            return result
        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def update(db, user_id, user_ing_id, data):
        try:
            item = await FridgeService.get_owned(db, user_id, user_ing_id)
            values = {name: getattr(item, name) for name in ("ing_id", "amount", "unit")}
            values.update(data.model_dump(exclude_unset=True))
            await FridgeService.validate(db, values["ing_id"], values["amount"], values["unit"])
            await FridgeCrud.update_by_id(db, user_ing_id, data)
            result = UserIngredientRead.model_validate(await FridgeCrud.get_read(db, user_ing_id))
            await db.commit()
            return result
        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def delete(db, user_id, user_ing_id):
        try:
            await FridgeService.get_owned(db, user_id, user_ing_id)
            await FridgeCrud.delete_by_id(db, user_ing_id)
            await db.commit()
        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def add_tool(db, user_id, tool_id):
        try:
            if await FridgeCrud.lock_user(db, user_id) is None:
                raise HTTPException(401, "다시 로그인해 주세요.")
            tool = await FridgeCrud.get_tool(db, tool_id)
            if tool is None:
                raise HTTPException(404, "조리도구를 찾을 수 없습니다.")
            if await FridgeCrud.get_my_tool(db, user_id, tool_id):
                raise HTTPException(409, "이미 등록한 조리도구입니다.")
            item = await FridgeCrud.add_my_tool(db, user_id, tool_id)
            result = MyToolRead(user_tool_id=item.user_tool_id, tool_id=tool_id, tool_name=tool.tool_name)
            await db.commit()
            return result
        except Exception:
            await db.rollback()
            raise

    @staticmethod
    async def delete_tool(db, user_id, tool_id):
        try:
            await FridgeCrud.lock_user(db, user_id)
            if not await FridgeCrud.get_my_tool(db, user_id, tool_id):
                raise HTTPException(404, "내 조리도구를 찾을 수 없습니다.")
            await FridgeCrud.delete_my_tool(db, user_id, tool_id)
            await db.commit()
        except Exception:
            await db.rollback()
            raise
