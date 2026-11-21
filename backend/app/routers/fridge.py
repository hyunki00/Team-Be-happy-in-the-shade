# 담당: 정호진 — 모든 냉장고 API는 로그인 필수
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.auth import get_user_id
from app.db.database import get_db
from app.db.crud.fridge import FridgeCrud
from app.db.scheme.fridges import (
    UserIngredientCreate, UserIngredientUpdate, UserIngredientRead,
    ToolRead, MyToolCreate, MyToolRead,
)
from app.services.fridge import FridgeService
from app.services import recipe as recipe_service


async def get_fridge_user(
    user_id: int = Depends(get_user_id), db: AsyncSession = Depends(get_db),
):
    # DB 초기화 · 탈퇴 후 남은 쿠키도 거절합니다.
    if not await FridgeCrud.user_exists(db, user_id):
        raise HTTPException(401, "다시 로그인해 주세요.")
    return user_id


router = APIRouter(prefix="/fridge", tags=["Fridge"])


@router.get("/ingredients", response_model=list[UserIngredientRead])
async def get_ingredients(user_id: int = Depends(get_fridge_user), db: AsyncSession = Depends(get_db)):
    return await FridgeService.get_my_fridge(db, user_id)


@router.post("/ingredients", response_model=UserIngredientRead, status_code=status.HTTP_201_CREATED)
async def create_ingredient(data: UserIngredientCreate, user_id: int = Depends(get_fridge_user), db: AsyncSession = Depends(get_db)):
    return await FridgeService.add(db, user_id, data)


@router.patch("/ingredients/{user_ing_id}", response_model=UserIngredientRead)
async def update_ingredient(user_ing_id: int, data: UserIngredientUpdate, user_id: int = Depends(get_fridge_user), db: AsyncSession = Depends(get_db)):
    return await FridgeService.update(db, user_id, user_ing_id, data)


@router.delete("/ingredients/{user_ing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ingredient(user_ing_id: int, user_id: int = Depends(get_fridge_user), db: AsyncSession = Depends(get_db)):
    await FridgeService.delete(db, user_id, user_ing_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/tools/standard", response_model=list[ToolRead])
async def get_standard_tools(user_id: int = Depends(get_fridge_user), db: AsyncSession = Depends(get_db)):
    return await FridgeCrud.get_tools(db)


@router.get("/tools", response_model=list[MyToolRead])
async def get_tools(user_id: int = Depends(get_fridge_user), db: AsyncSession = Depends(get_db)):
    return await FridgeCrud.get_my_tools(db, user_id)


@router.post("/tools", response_model=MyToolRead, status_code=status.HTTP_201_CREATED)
async def create_tool(data: MyToolCreate, user_id: int = Depends(get_fridge_user), db: AsyncSession = Depends(get_db)):
    return await FridgeService.add_tool(db, user_id, data.tool_id)


@router.delete("/tools/{tool_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tool(tool_id: int, user_id: int = Depends(get_fridge_user), db: AsyncSession = Depends(get_db)):
    await FridgeService.delete_tool(db, user_id, tool_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/recommendations", responses={503: {"description": "추천 서비스 준비 중"}})
async def get_recommendations(user_id: int = Depends(get_fridge_user), db: AsyncSession = Depends(get_db)):
    service = getattr(recipe_service, "RecipeService", None)
    if service is None or not callable(getattr(service, "recommend", None)):
        raise HTTPException(503, "레시피 추천 서비스가 아직 준비되지 않았습니다.")
    return await service.recommend(db, user_id)
