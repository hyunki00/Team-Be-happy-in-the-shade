# 담당: 권우정
# 할 일: class RecipeService
#   search / get_detail / toggle_like / toggle_bookmark   (비로그인이면 user_id가 None)
#   calc_match_rate(recipe_ing_ids, my_ing_ids)  내 냉장고에 있는 재료 수 ÷ 레시피 재료 수
#   recommend(db, user_id)  settings.match_rate(.env의 MATCH_RATE, 기본 0.5) 이상만
# [병합 11/23 조현기] 재료 검색 일치율 기준을 0.7 고정 → settings.match_rate(0.5)로 (추천 · 검색 기준을 하나로)
#   ※ recommend는 정호진의 /fridge/recommendations가 부름
#   ※ 재료를 고르면 일치율순, 안 고르면 가나다순
#     → [수정 11/24 조현기 2차] 지금은: 재료 필터 = '고른 재료가 모두 들어간 레시피'(최신순 · 인기순),
#       일치율순은 '내 냉장고 재료 우선'을 켰을 때만 (search_page 위 표 참고)
#
# - mini의 serivces/user.py 모양: crud를 부르고, 안 되는 경우는 HTTPException(status_code, detail)으로 막기
# - 404 없음 / 403 남의 것 / 400 잘못된 값 / 401 로그인 필요
# - commit은 여기서. 실패하면 rollback -261122 권우정 추가 : (현재 함수에 명시적인 rollback 처리는 없음)
# - 다 만들면 app/services/__init__.py에 import 한 줄 추가
# [수정 11/24 조현기] 이 파일에서 바뀐 곳 (자세한 설명은 각 함수 위 주석)
#   1. search_page 추가 : 검색 결과 + 전체 개수를 같이 돌려줌. 속도 개선(약 3초 → 0.1초),
#                          냉장고 우선 + 재료 필터를 같이 쓸 때 필터가 무시되던 문제 수정
#   2. search           : 이름 · 받는 값 · 돌려주는 값은 그대로, 안에서 search_page를 부름
#   3. build_list_items : 레시피 여러 개를 화면 카드로 한 번에 만드는 함수 (검색 · 추천 · 마이페이지가 같이 씀)
#   4. recommend        : search_page(냉장고 우선)로 계산 (결과 · 순서는 전과 같음)
#   5. create · edit    : 없는 재료 · 요리 종류 · 조리도구 번호를 보내면 500 대신 400
#   ※ 일치율 계산(calc_match_rate) · 50% 기준 · 정렬 규칙은 바꾸지 않음

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError   # [수정 11/24 조현기] DB 연결(외래 키) 오류. 없는 번호를 저장하려 할 때 남 → 400으로 바꿔 줌
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.crud.recipe import RecipeCrud
from app.db.scheme.recipes import RecipeDetail, RecipeListItem, RecipeSearch, RecipeCreate, RecipeUpdate
from app.core.settings import settings
# [수정 11/24 조현기] 메인화면용으로 만든 '여러 레시피를 한 번에 조회하는 함수'를 검색에서도 같이 씀
#   (get_cards · get_like_counts · get_comment_counts · get_ingredients · get_all_recipe_ing_pairs · get_my_ing_ids · get_my_tool_ids)
from app.db.crud.home import HomeCrud

# 레시피 검색, 상세 조회, 추천 및 좋아요/북마크 처리를 담당하는 서비스 클래스
class RecipeService:

    # 레시피 재료 중 사용자가 가진 재료의 비율을 계산하는 함수
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

    # ──────────────────────────────────────────────────────────────────────
    # [수정 11/24 조현기] 레시피 검색 (search_page) — 권우정 search를 다시 정리
    # ──────────────────────────────────────────────────────────────────────
    # 무엇이 바뀌었나
    #   - 규칙(일치율 계산 · 50% 기준 · 정렬 순서)은 원래 코드와 똑같다.
    #     예전 코드와 나란히 돌려서 검색 7가지 · 추천 5명의 결과 개수 · 순서 · 값이 모두 같은 것을 확인함.
    #   - 바뀐 것은 세 가지
    #       ① 속도   : 레시피마다 DB에 7번씩 묻던 것을 '표 단위로 한 번씩' 묻도록 (약 3초 → 0.1초 안팎)
    #       ② 총 개수: 목록과 함께 '전체 몇 개인지'도 돌려준다 (화면의 '검색 결과 N개')
    #       ③ 버그   : 냉장고 우선 + 재료 필터를 같이 쓰면 필터가 무시되던 문제
    #
    # 원래 코드가 느렸던 이유
    #   재료를 고르거나 냉장고 우선을 켜면 조건에 맞는 레시피를 전부(최대 778개) 가져온 뒤,
    #   한 개씩 돌면서 재료 · 닉네임 · 종류 · 도구 · 좋아요 수 · 댓글 수 · 부족한 재료를 따로 물었다.
    #   → 778개 × 7번 ≈ 5,400번 DB 왕복. 그런데 화면에 나가는 건 한 페이지(12개)뿐이고 나머지는 버려졌다.
    #
    # 지금 순서 (냉장고 우선일 때 — 일치율을 계산해야 하는 경우)
    #   1. 후보 레시피 목록을 가져온다 (검색어 · 종류 · 난이도 · 시간 조건만 적용)
    #   2. '레시피 ID - 재료 ID' 짝을 쿼리 한 번으로 전부 가져와서 일치율을 파이썬에서 계산
    #   3. 기준(50%) 이상만 남기고 정렬한 뒤, 이번 페이지(예: 12개)만 잘라낸다
    #   4. 잘라낸 12개에 대해서만 카드 정보(닉네임 · 좋아요 수 …)를 한 번에 가져온다 (build_list_items)
    #
    # 경우별 동작 ([수정 11/24 조현기 2차] '재료만 고름'을 '포함' 조건으로 바꿈)
    #   ┌──────────────────────────┬──────────────────┬──────────────────────────────┬────────────────┐
    #   │ 상황                     │ 일치율 계산 기준 │ 남기는 레시피                │ 정렬           │
    #   ├──────────────────────────┼──────────────────┼──────────────────────────────┼────────────────┤
    #   │ 재료 안 고름, 냉장고 OFF │ (계산 안 함)     │ 조건에 맞는 전부             │ 최신순 · 인기순 │
    #   │ 재료만 고름, 냉장고 OFF  │ (계산 안 함)     │ 고른 재료가 '모두' 들어간 것 │ 최신순 · 인기순 │
    #   │ 냉장고 우선 ON           │ 내 냉장고 재료   │ 일치율 50% 이상              │ 일치율 높은 순  │
    #   │ 냉장고 ON + 재료 고름    │ 내 냉장고 재료   │ 고른 재료가 '모두' 들어 있고 │ 일치율 높은 순  │
    #   │                          │                  │ 일치율 50% 이상              │                │
    #   └──────────────────────────┴──────────────────┴──────────────────────────────┴────────────────┘
    #   - 원래 코드는 마지막 경우에 고른 재료를 냉장고 재료로 덮어써서 필터가 사라졌음
    #   - [2차] 원래 '재료만 고름'은 "고른 재료가 레시피 재료의 50% 이상을 채우는 레시피"였음
    #     → 감자 하나만 고르면 감자가 재료의 절반 이상인 레시피가 거의 없어서 0개가 나왔음
    #     → 이제 "고른 재료가 들어간 레시피"를 최신순 · 인기순으로 (일치율은 냉장고 우선일 때만)
    #
    # 돌려주는 값: (이번 페이지 카드 목록, 전체 개수)
    #   - 라우터(routers/recipe.py)가 전체 개수를 응답 헤더 X-Total-Count에 담아 화면으로 보낸다
    #   - 목록만 필요하면 아래 search()를 쓰면 된다 (원래 이름 그대로 남겨 둠)
    @staticmethod
    async def search_page(
        db: AsyncSession,
        search: RecipeSearch,
        user_id: int | None = None,
        limit: int = 20,
        offset: int = 0,
        min_match_rate: float | None = None,
        sort: str = "latest"
    ) -> tuple[list[RecipeListItem], int]:

        # 기준을 따로 안 주면 .env의 MATCH_RATE(기본 0.5)를 씀
        if min_match_rate is None:
            min_match_rate = settings.match_rate

        # ── 0. 어떤 재료를 기준으로 계산할지 정하기 ─────────────────────────
        # base_ing_ids : 일치율을 계산할 기준 재료 (이 재료가 레시피 재료 중 몇 %를 채우나)
        #                냉장고 우선일 때만 내 냉장고 재료가 들어감. 아니면 비어 있음(일치율 계산 안 함)
        # must_ing_ids : 레시피에 '꼭 모두' 들어 있어야 하는 재료 = 화면 필터에서 고른 재료
        # set()은 '중복 없는 묶음'. 'A in 묶음', '묶음 <= 묶음(포함 관계)' 계산이 빠르다
        # [수정 11/24 조현기 2차] 원래는 고른 재료가 base(일치율 기준)였음 → 이제 must(포함 조건)
        base_ing_ids = set()                        # 기본은 일치율 계산 안 함
        must_ing_ids = set(search.ingredient_ids)   # 화면에서 고른 재료는 항상 '포함' 조건

        if search.fridge_first:
            # 로그인하지 않았거나 냉장고가 비어 있으면 결과 없음 (원래 코드와 같음)
            if user_id is None:
                return [], 0
            my_ing_ids = await HomeCrud.get_my_ing_ids(db, user_id)
            if not my_ing_ids:
                return [], 0
            # 냉장고 우선일 때만 일치율 계산 기준이 생김 (= 내 냉장고 재료)
            #   화면에서 고른 재료는 그대로 '꼭 포함' 조건
            base_ing_ids = my_ing_ids

        # 내 조리도구 ID (카드의 '내 도구로 가능' 표시 · 같은 일치율일 때 정렬에 씀). 로그인 안 했으면 빈 묶음
        my_tool_ids = await HomeCrud.get_my_tool_ids(db, user_id) if user_id is not None else set()

        # ── 1. 냉장고 우선이 꺼져 있을 때: 일반 목록 (재료를 골랐으면 '포함' 조건만 더함) ──
        # 최신순 · 인기순 정렬과 페이지 자르기(limit · offset)를 DB가 바로 해 준다
        # 전체 개수는 같은 조건으로 COUNT 쿼리를 한 번 더 해서 구한다
        # [수정 11/24 조현기 2차] must_ing_ids를 넘겨서 고른 재료가 모두 들어간 레시피만 (안 골랐으면 빈 묶음 → 조건 없음)
        if not base_ing_ids:
            total = await RecipeCrud.count_list(db, search, must_ing_ids)
            recipes = await RecipeCrud.get_list(db, search, limit=limit, offset=offset, sort=sort, must_ing_ids=must_ing_ids)
            items = await RecipeService.build_list_items(db, recipes, my_tool_ids)
            return items, total

        # ── 2. 냉장고 우선이 켜져 있을 때: 내 냉장고 기준 일치율 계산 ──────────
        # 2-1. 후보 레시피 전부 (검색어 · 종류 · 난이도 · 시간 조건 + 고른 재료 '모두 포함', 페이지 자르기 없음)
        #      sort를 넘기는 이유: 일치율이 같을 때 최신순/인기순 순서를 지키려고 (아래 2-4)
        #      [수정 11/24 조현기 2차] '고른 재료 모두 포함'은 DB에서 거름 (must_ing_ids, 1번과 같은 조건)
        candidates = await RecipeCrud.get_list(db, search, limit=None, sort=sort, must_ing_ids=must_ing_ids)
        if not candidates:
            return [], 0

        # 2-2. 모든 레시피의 재료를 쿼리 한 번으로 가져와서 { 레시피 ID: {재료 ID, …} } 모양으로 묶기
        #      예) {1: {2, 3, 61}, 2: {1, 54}, …}
        #      setdefault(키, 기본값): 키가 없으면 빈 set을 만들어 넣고, 있으면 있는 것을 돌려줌
        recipe_ings: dict[int, set[int]] = {}
        for recipe_id, ing_id in await HomeCrud.get_all_recipe_ing_pairs(db):
            recipe_ings.setdefault(recipe_id, set()).add(ing_id)

        # 2-3. 후보마다 일치율 계산 → 기준 이상만 passed에 담기
        rates = {}      # { 레시피 ID: 일치율 } — 아래 카드 만들 때 다시 계산하지 않으려고 저장
        passed = []     # 기준을 통과한 레시피 (Recipe 객체)
        for recipe in candidates:
            ings = recipe_ings.get(recipe.recipe_id, set())
            if not ings:                          # 재료가 하나도 없는 레시피는 계산할 수 없으니 제외
                continue
            # ('꼭 포함' 재료 확인은 위 2-1에서 DB가 이미 했음)
            # 일치율 = 레시피 재료 중 기준 재료에 있는 개수 ÷ 레시피 재료 수 (calc_match_rate는 원래 함수 그대로)
            rate = RecipeService.calc_match_rate(list(ings), list(base_ing_ids))
            if rate >= min_match_rate:
                rates[recipe.recipe_id] = rate
                passed.append(recipe)

        # 2-4. 정렬: 일치율 높은 순 → 같으면 '내 도구로 가능'한 레시피 먼저
        #   그래도 같으면 DB에서 가져온 순서(최신순 또는 인기순)를 그대로 유지
        #   (파이썬 sort는 키가 같으면 원래 순서를 지키는 '안정 정렬'이라 가능. 원래 코드와 같은 결과)
        #   key의 (값1, 값2)는 '값1로 먼저 비교하고, 같으면 값2로' 라는 뜻. reverse=True는 큰 것부터
        passed.sort(
            key=lambda recipe: (
                rates[recipe.recipe_id],
                recipe.tool_id is not None and recipe.tool_id in my_tool_ids,
            ),
            reverse=True
        )

        # 2-5. 이번 페이지만 잘라서 카드로 만들기 (예: offset 12, limit 12 → 13~24번째)
        #      전체 개수는 기준을 통과한 레시피 수
        page = passed[offset:offset + limit]
        items = await RecipeService.build_list_items(db, page, my_tool_ids, base_ing_ids, rates)
        return items, len(passed)

    # 원래 쓰던 이름 그대로 (목록만 필요할 때)
    # [수정 11/24 조현기] 안쪽은 search_page를 부르고 전체 개수만 버린다
    #   다른 파일에서 RecipeService.search(...)를 부르던 곳은 고칠 필요 없음
    @staticmethod
    async def search(
        db: AsyncSession,
        search: RecipeSearch,
        user_id: int | None = None,
        limit: int = 20,
        offset: int = 0,
        min_match_rate: float | None = None,
        sort: str = "latest"
    ) -> list[RecipeListItem]:
        items, _ = await RecipeService.search_page(        # _ : 받긴 하지만 안 쓰는 값(전체 개수)
            db, search, user_id, limit, offset, min_match_rate, sort
        )
        return items

    # ──────────────────────────────────────────────────────────────────────
    # [수정 11/24 조현기] 레시피 목록 → 화면 카드 데이터(RecipeListItem) 만들기
    # ──────────────────────────────────────────────────────────────────────
    # 원래 search 안의 '2. 각 레시피의 카드 데이터 만들기' 반복문이 하던 일을 따로 꺼낸 함수.
    #   원래: 레시피 1개마다 닉네임 · 종류 · 도구 · 좋아요 · 댓글 · 재료를 하나씩 물음 (12개면 84번)
    #   지금: 레시피 여러 개의 값을 'WHERE recipe_id IN (…)'으로 한꺼번에 물음 (몇 개든 4번)
    #   쓰는 곳: search_page(검색 · 추천), routers/user.py(마이페이지 내 레시피 · 좋아요 · 북마크)
    #
    # 받는 값
    #   recipes      : 카드로 만들 Recipe 객체 목록 (이 순서 그대로 카드가 나감)
    #   my_tool_ids  : 내 조리도구 ID 묶음 → can_cook_with_my_tools(내 도구로 가능) 계산
    #   base_ing_ids : 일치율 기준 재료. 주면 match_rate · missing_ingredients(부족한 재료)를 채우고,
    #                  안 주면(일반 목록 · 마이페이지) 둘 다 비워 둠 → 화면에 일치율 막대가 안 나옴
    #   rates        : search_page에서 이미 계산한 일치율 (있으면 다시 계산하지 않음)
    @staticmethod
    async def build_list_items(
        db: AsyncSession,
        recipes: list,
        my_tool_ids: set[int] | None = None,
        base_ing_ids: set[int] | None = None,
        rates: dict[int, float] | None = None
    ) -> list[RecipeListItem]:
        recipe_ids = [recipe.recipe_id for recipe in recipes]
        if not recipe_ids:
            return []
        my_tool_ids = my_tool_ids or set()

        # 1) 카드 기본 정보: 레시피 + 작성자 닉네임 + 요리 종류 이름 + 조리도구 이름 (JOIN으로 한 번에)
        #    { 레시피 ID: (Recipe, 닉네임, 종류 이름, 도구 이름) } 모양으로 바꿔 둠
        cards = {row[0].recipe_id: row for row in await HomeCrud.get_cards(db, recipe_ids)}
        # 2) 좋아요 수 · 댓글 수: { 레시피 ID: 개수 } (0개인 레시피는 없으니 아래에서 .get(rid, 0))
        likes = await HomeCrud.get_like_counts(db, recipe_ids)
        comments = await HomeCrud.get_comment_counts(db, recipe_ids)

        # 3) 레시피별 재료 → ingredient_ids(레시피 재료 ID 목록)와 missing(부족한 재료) 만들기
        #    부족한 재료 = 레시피 재료 중 기준 재료(base_ing_ids)에 없는 것
        ing_ids: dict[int, list[int]] = {rid: [] for rid in recipe_ids}
        missing: dict[int, list[dict]] = {rid: [] for rid in recipe_ids}
        for rid, ing_id, ing_name in await HomeCrud.get_ingredients(db, recipe_ids):
            ing_ids[rid].append(ing_id)
            if base_ing_ids and ing_id not in base_ing_ids:
                missing[rid].append({"ing_id": ing_id, "ing_name": ing_name})

        # 4) 받은 순서 그대로 카드(RecipeListItem) 만들기 — 필드는 원래 search가 만들던 것과 같음
        items = []
        for recipe in recipes:
            rid = recipe.recipe_id
            _, nickname, category_name, tool_name = cards[rid]     # 첫 값(Recipe)은 이미 recipe로 있으니 _
            match_rate = None                                      # 기준 재료가 없으면 일치율 없음(None)
            if base_ing_ids:
                # 미리 계산한 값이 있으면 그것을, 없으면 여기서 계산
                match_rate = rates[rid] if rates and rid in rates else RecipeService.calc_match_rate(ing_ids[rid], list(base_ing_ids))
            items.append(
                RecipeListItem(
                    recipe_id=rid,
                    recipe_title=recipe.recipe_title,
                    intro=recipe.intro,
                    image_url=recipe.image_url,
                    level=recipe.level,
                    cooking_time=recipe.cooking_time,
                    r_category_id=recipe.r_category_id,
                    category_name=category_name or "",
                    tool_id=recipe.tool_id,
                    tool_name=tool_name,
                    can_cook_with_my_tools=recipe.tool_id is not None and recipe.tool_id in my_tool_ids,
                    user_id=recipe.user_id,
                    nickname=nickname or "",
                    created_at=recipe.created_at,
                    like_count=likes.get(rid, 0),
                    comment_count=comments.get(rid, 0),
                    match_rate=match_rate,
                    missing_ingredients=missing[rid],
                    ingredient_ids=ing_ids[rid],
                )
            )
        return items

    # 냉장고 재료를 기준으로 레시피 추천
    # [수정 11/24 조현기] '냉장고 우선 검색'과 계산이 똑같아서 search_page를 그대로 씀 (약 3초 → 0.1초 안팎)
    #   - RecipeSearch(fridge_first=True): 다른 조건 없이 냉장고 우선만 켠 검색
    #   - limit=1000: 추천은 페이지 없이 전부 보여 주므로 넉넉하게 (레시피는 800개 미만)
    #   - 원래 코드도 search(limit=1000)를 부른 뒤 같은 기준 · 같은 순서로 정렬했으므로 결과 · 순서는 전과 같음
    #   ※ 정호진의 /fridge/recommendations와 추천 페이지(/recipes/recommendations)가 부름
    @staticmethod
    async def recommend(
        db: AsyncSession,
        user_id: int
    ) -> list[RecipeListItem]:
        items, _ = await RecipeService.search_page(
            db,
            RecipeSearch(fridge_first=True),
            user_id=user_id,
            limit=1000,
            offset=0,
            min_match_rate=settings.match_rate
        )
        return items

    # 레시피 좋아요 추가 / 취소
    @staticmethod
    async def toggle_like(
        db: AsyncSession,
        recipe_id: int,
        user_id: int,
        liked: bool
    ) -> bool:

        # 좋아요를 변경하기 전에 레시피 존재 여부 확인
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

        # 북마크를 변경하기 전에 레시피 존재 여부 확인
        recipe = await RecipeCrud.get_by_id(db, recipe_id)

        if recipe is None:
            raise HTTPException(
                status_code=404,
                detail="레시피를 찾을 수 없습니다."
            )

        # 사용자가 이미 북마크한 레시피인지 확인
        already_bookmarked = await RecipeCrud.has_bookmark(
            db, user_id, recipe_id
        )

        if bookmarked and not already_bookmarked:
            await RecipeCrud.add_bookmark(db, user_id, recipe_id)

        elif not bookmarked and already_bookmarked:
            await RecipeCrud.remove_bookmark(db, user_id, recipe_id)

        await db.commit()

        return bookmarked


    # 레시피 등록
    @staticmethod
    async def create(
        db: AsyncSession,
        user_id: int,
        data: RecipeCreate,
    ) -> RecipeDetail:
        if not user_id:
            raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

        try:
            recipe = await RecipeCrud.create(
                db=db,
                user_id=user_id,
                data=data,
            )
            recipe_id = recipe.recipe_id
            await db.commit()
        # [수정 11/24 조현기] 없는 재료 · 요리 종류 · 조리도구 번호를 보내면
        #   DB가 '연결된 표에 그런 번호가 없다'(외래 키 오류, IntegrityError)를 내면서 500 서버 오류가 났음
        #   → 이 오류만 잡아서 되돌리고(rollback) 400 + 안내 문장으로 돌려줌. 다른 오류는 아래에서 원래대로 처리
        except IntegrityError:
            await db.rollback()
            raise HTTPException(status_code=400, detail="없는 재료 · 요리 종류 · 조리도구가 들어 있어요.")
        except Exception:
            await db.rollback()
            raise

        return await RecipeService.get_detail(
            db=db,
            recipe_id=recipe_id,
            user_id=user_id,
        )

# -- (오효정) -- 
    # 본인 레시피 수정
    @staticmethod
    async def edit(
        db: AsyncSession,
        user_id: int,
        recipe_id: int,
        data: RecipeUpdate,
    ) -> RecipeDetail:
        if not user_id:
            raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

        recipe = await RecipeCrud.get_by_id(db, recipe_id)
        if recipe is None:
            raise HTTPException(status_code=404, detail="레시피를 찾을 수 없습니다.")

        if recipe.user_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="본인 레시피만 수정할 수 있습니다.",
            )

        try:
            await RecipeCrud.update_by_id(
                db=db,
                recipe_id=recipe_id,
                data=data,
            )
            await db.commit()
        # [수정 11/24 조현기] 수정할 때도 같은 처리 (없는 번호 → 500 대신 400, 위 create 주석 참고)
        except IntegrityError:
            await db.rollback()
            raise HTTPException(status_code=400, detail="없는 재료 · 요리 종류 · 조리도구가 들어 있어요.")
        except Exception:
            await db.rollback()
            raise

        return await RecipeService.get_detail(
            db=db,
            recipe_id=recipe_id,
            user_id=user_id,
        )

    # 본인 레시피 삭제
    @staticmethod
    async def remove(
        db: AsyncSession,
        user_id: int,
        recipe_id: int,
    ) -> None:
        if not user_id:
            raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

        recipe = await RecipeCrud.get_by_id(db, recipe_id)
        if recipe is None:
            raise HTTPException(status_code=404, detail="레시피를 찾을 수 없습니다.")

        if recipe.user_id != user_id:
            raise HTTPException(
                status_code=403,
                detail="본인 레시피만 삭제할 수 있습니다.",
            )

        try:
            await RecipeCrud.delete_by_id(db, recipe_id)
            await db.commit()
        except Exception:
            await db.rollback()
            raise