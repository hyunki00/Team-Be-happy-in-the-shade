# 담당: 조현기
# 메인화면 전용 API (11/24)
#   GET /home/recommendations?limit=4
#     - 로그인 필요 (내 냉장고 기준이라서)
#     - { total: 기준 이상 전체 개수, recipes: 위에서부터 limit개 (레시피 카드 모양) }
#     - 계산은 레시피 추천과 같고 속도만 빠름 (설명은 services/home.py)
#   GET /home/hero-images?count=10   [11/24 조현기]
#     - 로그인 필요 없음 (첫 배너 장식이라 누구에게나 보임)
#     - [ { recipe_id, image_url }, … ] 사진이 있는 레시피를 무작위로 count장 (새로고침마다 다름)
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_user_id
from app.db.database import get_db
from app.db.scheme.home import HeroImageRead, HomeRecommendRead
from app.services.home import HomeService

router = APIRouter(prefix="/home", tags=["Home"])


@router.get("/recommendations", response_model=HomeRecommendRead)
async def get_home_recommendations(
    limit: int = Query(default=4, ge=1, le=20),
    user_id: int = Depends(get_user_id),
    db: AsyncSession = Depends(get_db),
):
    return await HomeService.recommendations(db, user_id, limit)


# [11/24 조현기] 첫 배너 오른쪽 음식 사진 (장식용, 로그인 필요 없음)
#   count: 몇 장 받을지 (기본 10장, 1~30). 화면은 3초마다 한 장씩 넘기므로 10장이면 30초에 한 바퀴
@router.get("/hero-images", response_model=list[HeroImageRead])
async def get_hero_images(
    count: int = Query(default=10, ge=1, le=30),
    db: AsyncSession = Depends(get_db),
):
    return await HomeService.hero_images(db, count)
