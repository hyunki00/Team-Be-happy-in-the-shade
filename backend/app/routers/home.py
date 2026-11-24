# 담당: 조현기
# 메인화면 전용 API (11/24)
#   GET /home/recommendations?limit=4
#     - 로그인 필요 (내 냉장고 기준이라서)
#     - { total: 기준 이상 전체 개수, recipes: 위에서부터 limit개 (레시피 카드 모양) }
#     - 계산은 레시피 추천과 같고 속도만 빠름 (설명은 services/home.py)
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_user_id
from app.db.database import get_db
from app.db.scheme.home import HomeRecommendRead
from app.services.home import HomeService

router = APIRouter(prefix="/home", tags=["Home"])


@router.get("/recommendations", response_model=HomeRecommendRead)
async def get_home_recommendations(
    limit: int = Query(default=4, ge=1, le=20),
    user_id: int = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    return await HomeService.recommendations(db, user_id, limit)
