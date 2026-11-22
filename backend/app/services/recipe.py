# 담당: 권우정
# 할 일: class RecipeService
#   search / get_detail / toggle_like / toggle_bookmark   (비로그인이면 user_id가 None)
#   calc_match_rate(recipe_ing_ids, my_ing_ids)  내 냉장고에 있는 재료 수 ÷ 레시피 재료 수
#   recommend(db, user_id)  settings.match_rate(.env의 MATCH_RATE, 기본 0.7) 이상만
#   ※ recommend는 정호진의 /fridge/recommendations가 부름
#   ※ 재료를 고르면 일치율순, 안 고르면 가나다순
#
# - mini의 serivces/user.py 모양: crud를 부르고, 안 되는 경우는 HTTPException(status_code, detail)으로 막기
# - 404 없음 / 403 남의 것 / 400 잘못된 값 / 401 로그인 필요
# - commit은 여기서. 실패하면 rollback
# - 다 만들면 app/services/__init__.py에 import 한 줄 추가

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.crud.recipe import RecipeCrud
from app.db.scheme.recipes import RecipeDetail, RecipeListItem, RecipeSearch
from app.core.settings import settings

class RecipeService:

    @staticmethod
    def calc_match_rate(
        recipe_ing_ids: list[int],
        my_ing_ids: list[int]
    ) -> float:

        # 레시피에 필요한 재료가 없으면 0
        if not recipe_ing_ids:
            return 0.0

        # 중복 재료 ID 제거
        recipe_set = set(recipe_ing_ids)
        my_set = set(my_ing_ids)

        # 내 냉장고에 있는 재료 개수
        matched = len(recipe_set & my_set)

        # 일치율 계산
        return matched / len(recipe_set)

    # 레시피 상세 정보 조회
    @staticmethod
    async def get_detail(
        db: AsyncSession,
        recipe_id: int,
        user_id: int | None = None
    ) -> RecipeDetail:

        # 1. 레시피 기본 정보 조회
        recipe = await RecipeCrud.get_by_id(db, recipe_id)

        if recipe is None:
            raise HTTPException(
                status_code=404,
                detail="레시피를 찾을 수 없습니다."
            )

        # 2-1. 작성자 닉네임
        nickname = await RecipeCrud.get_nickname(
            db, recipe.user_id
        )

        # 2-2. 카테고리 명
        category_name = await RecipeCrud.get_category_name(
            db, recipe.r_category_id
        )

        # 2-3. 도구 명
        tool_name = await RecipeCrud.get_tool_name(
            db, recipe.tool_id
        )

        # 3. 재료와 조리 순서
        ingredients = await RecipeCrud.get_ingredients(db, recipe_id)
        steps = await RecipeCrud.get_steps(db, recipe_id)

        # 4. 좋아요 수와 댓글 수
        like_count = await RecipeCrud.get_like_count(db, recipe_id)
        comment_count = await RecipeCrud.get_comment_count(db, recipe_id)

        # 5. 로그인 여부에 따른 사용자 상태
        is_liked = False
        is_bookmarked = False
        is_mine = False

        if user_id is not None:
            is_liked = await RecipeCrud.has_like(db, user_id, recipe_id)
            is_bookmarked = await RecipeCrud.has_bookmark(db, user_id, recipe_id)
            is_mine = recipe.user_id == user_id

        # 6. 프론트엔드에 전달할 데이터 구성
        return RecipeDetail(
            recipe_id=recipe.recipe_id,
            recipe_title=recipe.recipe_title,
            intro=recipe.intro,
            image_url=recipe.image_url,
            level=recipe.level,
            cooking_time=recipe.cooking_time,
            r_category_id=recipe.r_category_id,
            category_name=category_name or "",
            tool_id=recipe.tool_id,
            tool_name=tool_name,
            user_id=recipe.user_id,
            nickname=nickname or "",
            created_at=recipe.created_at,
            like_count=like_count,
            comment_count=comment_count,
            ingredient_ids=[ing.ing_id for ing in ingredients],
            servings=recipe.servings,
            is_liked=is_liked,
            is_bookmarked=is_bookmarked,
            is_mine=is_mine,
            ingredients=ingredients,
            steps=steps
        )

    #레시피 목록 검색
    @staticmethod
    async def search(
        db: AsyncSession,
        search: RecipeSearch,
        user_id: int | None = None,
        limit: int = 20,
        offset: int = 0
    ) -> list[RecipeListItem]:

        # 1. 검색 조건에 맞는 레시피 조회
        # 1-1. 재료 일치율 정렬이 필요하면 전체 후보를 조회
        if search.ingredient_ids:
            recipes = await RecipeCrud.get_list(
                db, search, limit=None
            )

        # 1-2. 일반 목록 검색은 필요한 페이지만 조회
        else:
            recipes = await RecipeCrud.get_list(
                db, search, limit=limit, offset=offset
            )

        results = []

        # 2. 각 레시피의 카드 데이터 만들기
        for recipe in recipes:
            ingredient_ids = await RecipeCrud.get_ingredient_ids(
                db, recipe.recipe_id
            )

            nickname = await RecipeCrud.get_nickname(
                db, recipe.user_id
            )

            category_name = await RecipeCrud.get_category_name(
                db, recipe.r_category_id
            )

            tool_name = await RecipeCrud.get_tool_name(
                db, recipe.tool_id
            )

            like_count = await RecipeCrud.get_like_count(
                db, recipe.recipe_id
            )

            comment_count = await RecipeCrud.get_comment_count(
                db, recipe.recipe_id
            )

            match_rate = None
            missing_ingredients = []

            # 3. 선택한 재료가 있다면 일치율 계산
            if search.ingredient_ids:
                match_rate = RecipeService.calc_match_rate(
                    ingredient_ids,
                    search.ingredient_ids
                )

                ingredients = await RecipeCrud.get_ingredients(
                    db, recipe.recipe_id
                )

                missing_ingredients = [
                    {
                        "ing_id": ing.ing_id,
                        "ing_name": ing.ing_name
                    }
                    for ing in ingredients
                    if ing.ing_id not in search.ingredient_ids
                ]

            results.append(
                RecipeListItem(
                    recipe_id=recipe.recipe_id,
                    recipe_title=recipe.recipe_title,
                    intro=recipe.intro,
                    image_url=recipe.image_url,
                    level=recipe.level,
                    cooking_time=recipe.cooking_time,
                    r_category_id=recipe.r_category_id,
                    category_name=category_name or "",
                    tool_id=recipe.tool_id,
                    tool_name=tool_name,
                    user_id=recipe.user_id,
                    nickname=nickname or "",
                    created_at=recipe.created_at,
                    like_count=like_count,
                    comment_count=comment_count,
                    match_rate=match_rate,
                    missing_ingredients=missing_ingredients,
                    ingredient_ids=ingredient_ids
                )
            )

        # 4. 재료 검색은 일치율 순으로 정렬 후 페이지 나누기
        if search.ingredient_ids:
            results.sort(
                key=lambda recipe: recipe.match_rate or 0,
                reverse=True
            )
            return results[offset:offset + limit]

        # 5. 일반 검색은 이미 DB에서 정렬·페이지 처리를 완료함
        return results

    # 냉장고 재료를 기준으로 레시피 추천
    @staticmethod
    async def recommend(
        db: AsyncSession,
        user_id: int
    ) -> list[RecipeListItem]:

        # 1. 내 냉장고 재료 조회
        my_ing_ids = await RecipeCrud.get_user_ingredient_ids(
            db, user_id
        )

        # 냉장고가 비어 있으면 추천할 레시피 없음
        if not my_ing_ids:
            return []

        # 2. 냉장고 재료를 검색 조건으로 사용
        search = RecipeSearch(
            ingredient_ids=my_ing_ids
        )

        # 3. 재료 일치율을 계산한 레시피 목록
        recipes = await RecipeService.search(
            db,
            search,
            user_id=user_id,
            limit=1000,
            offset=0
        )

        # 4. 추천 기준 이상의 레시피만 선택
        recommended = [
            recipe
            for recipe in recipes
            if recipe.match_rate is not None
            and recipe.match_rate >= settings.match_rate
        ]

        # 5. 일치율 높은 순 정렬
        recommended.sort(
            key=lambda recipe: recipe.match_rate,
            reverse=True
        )

        return recommended

    # 레시피 좋아요 추가 / 취소
    @staticmethod
    async def toggle_like(
        db: AsyncSession,
        recipe_id: int,
        user_id: int,
        liked: bool
    ) -> bool:

        recipe = await RecipeCrud.get_by_id(db, recipe_id)

        if recipe is None:
            raise HTTPException(
                status_code=404,
                detail="레시피를 찾을 수 없습니다."
            )

        #이미 좋아요 눌렀는지 확인
        already_liked = await RecipeCrud.has_like(
            db, user_id, recipe_id
        )

        if liked and not already_liked:
            await RecipeCrud.add_like(db, user_id, recipe_id)

        elif not liked and already_liked:
            await RecipeCrud.remove_like(db, user_id, recipe_id)

        await db.commit() #변경 내용을 DB에 최종 저장

        return liked

    # 레시피 북마크 추가 / 취소
    @staticmethod
    async def toggle_bookmark(
        db: AsyncSession,
        recipe_id: int,
        user_id: int,
        bookmarked: bool
    ) -> bool:

        recipe = await RecipeCrud.get_by_id(db, recipe_id)

        if recipe is None:
            raise HTTPException(
                status_code=404,
                detail="레시피를 찾을 수 없습니다."
            )

        already_bookmarked = await RecipeCrud.has_bookmark(
            db, user_id, recipe_id
        )

        if bookmarked and not already_bookmarked:
            await RecipeCrud.add_bookmark(db, user_id, recipe_id)

        elif not bookmarked and already_bookmarked:
            await RecipeCrud.remove_bookmark(db, user_id, recipe_id)

        await db.commit()

        return bookmarked