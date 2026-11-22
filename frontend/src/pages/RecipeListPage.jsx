// 담당: 권우정
// [디자인 11/22 조현기] 시안 F + 와이어프레임 p.15~17 레이아웃 적용 — 검색 · 필터 · 정렬 계산 로직은 그대로
//   1. 위: 검색창 / 아래: 왼쪽 필터(재료 · 요리 종류 · 난이도 · 조리 시간) + 오른쪽 결과
//      - 난이도 · 시간 · 요리 종류: select → 칩 버튼 (같은 값을 다시 누르면 '전체'), 값은 기존과 같음
//      - 재료: 고른 재료 칩(✕로 하나씩 빼기 handleIngredientRemove 추가) + '+ 식재료 선택' + '검색 재료 초기화'
//      - 필터 '초기화' = 기존 handleReset (검색 조건 초기화)
//   2. 오른쪽 맨 위: '모든 재료 일치' 버튼 → '내 냉장고 재료 우선' 스위치 (켜고 끄는 로직은 그대로)
//      - 켰을 때만 거르는 방식 안내, 껐을 때는 로그인 전에만 "로그인하면 켤 수 있어요"
//   3. 결과 개수 + 정렬(select)을 한 줄에, 카드는 한 줄에 최대 3개
//   4. 식재료 선택: 화면 위에 뜨는 창(모달)으로 (p.16), ✕ · Esc로 닫으면 선택 취소(기존 handleIngredientCancel)
//   5. 제목 '레시피 목록' → '레시피 검색' (메뉴 이름과 맞춤), '현재 검색어' 확인용 줄은 뺌
// [기준 변경 11/22 조현기] 일치율 기준 70% → 50% (백엔드 MATCH_RATE와 맞춤): 0.7 → 0.5 두 곳
import { mockRecipes, mockIngredients, mockIngredientCategories, mockFridge } from "../mockData";
import RecipeCard from "../components/RecipeCard";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext"

function RecipeListPage() {
  // 검색 및 필터 조건을 하나의 객체로 관리
  const [filters, setFilters] = useState({
    keyword: "", //검색어
    ingredients: [], //재료
    r_category_id: null, //요리 종류
    level: null, //요리 난이도
    cooking_time: null, //조리 시간
    sort: "name", //정렬
  });  

  // 사용자가 식재료 선택창에서 고르고 있는 재료 임시로 보관
  const [tempIngredients, setTempIngredients] = useState([]);

  // 식재료 선택 영역 열기/닫기
  const [isIngredientOpen, setIsIngredientOpen] = useState(false);

  // 식재료 검색창에 입력한 글자
  const [ingredientKeyword, setIngredientKeyword] = useState("");

  // 식재료 대분류 선택 상태
  const [ingredientCategory, setIngredientCategory] = useState(null);

  // ON/OFF 상태(false : 일반 레시피 검색, true : 내 냉장고 재료 우선 ON)
  const [isAllIngredientsOn, setIsAllIngredientsOn] = useState(false);

  // 로그인 상태 확인
  const { isAuthenticated } = useAuth();

  // 로그아웃하면 내 냉장고 재료 우선 OFF
  useEffect(() => {
    if (!isAuthenticated) {
      setIsAllIngredientsOn(false);
    }
  }, [isAuthenticated]);

  // 냉장고 재료 ID 목록 만들기
  const fridgeIngredientIds = mockFridge.map(
    (ingredient) => ingredient.ing_id
  );

  // 냉장고 재료 일치율 계산
  const calculateFridgeMatchRate = (recipe) => {
    const recipeIngredients = recipe.ingredient_ids ?? [];

    if (recipeIngredients.length === 0) {
      return 0;
    }

    const matchedCount = recipeIngredients.filter((ingId) =>
      fridgeIngredientIds.includes(ingId)
    ).length;

    return matchedCount / recipeIngredients.length;
  };

  // filter() : 배열에서 조건에 맞는 데이터만 골라서 새로운 배열을 만드는 함수
  const filteredRecipes = mockRecipes.filter((recipe) => {
    //레시피 제목에 검색어 포함 -> true
    //앞 뒤 공백 제거해서 검색, 영어 대소문자 구분 없이 검색 가능
    const matchKeyword = recipe.recipe_title.toLowerCase().includes(filters.keyword.trim().toLowerCase());
    //난이도를 선택하지 않았거나, 선택한 난이도와 레시피 난이도가 같으면 true
    const matchLevel = filters.level === null || recipe.level === filters.level;
    //조리 시간을 선택하지 않았으면 전체 허용
    //"초과" 선택 시 60분 초과, 그 외에는 선택한 시간 이하만 허용
    const matchTime =
    filters.cooking_time === null ||
    (filters.cooking_time === "초과"
      ? recipe.cooking_time > 60
      : recipe.cooking_time <= Number(filters.cooking_time));
    //요리 종류를 선택하지 않았거나, 선택한 카테고리 ID가 같으면 true
    const matchCategory =
      filters.r_category_id === null ||
      recipe.r_category_id === filters.r_category_id; 

    // 레시피에 필요한 전체 재료
    const recipeIngredients = recipe.ingredient_ids ?? [];

    // 선택한 재료 중 레시피에 포함된 재료 개수
    const matchedCount = recipeIngredients.filter((ingId) =>
      filters.ingredients.includes(ingId)
    ).length;

    // 재료 일치율 계산
    const matchRate =
      recipeIngredients.length > 0
        ? matchedCount / recipeIngredients.length
        : 0;

    // 재료를 선택하지 않았으면 전체 표시
    // 선택했다면 일치율 50% 이상만 표시
    const matchIngredients =
      filters.ingredients.length === 0 ||
      (recipeIngredients.length > 0 && matchRate >= 0.5);

    // 선택한 재료가 레시피에 모두 포함되어 있는지 확인
      const matchSelectedIngredients =
      filters.ingredients.every((ingId) =>
        recipeIngredients.includes(ingId)
    );

    // ON일 때 선택 재료 포함 여부와 냉장고 일치율 50% 이상 확인
    const matchFridge =
      !isAllIngredientsOn ||
      (
        matchSelectedIngredients &&
        calculateFridgeMatchRate(recipe) >= 0.5
      );

    //검색, 난이도, 조리시간, 요리 종류 선택 모두 만족해야 출력
    return (matchKeyword && matchLevel && matchTime && matchCategory && (isAllIngredientsOn ? matchFridge : matchIngredients));
  }); 

    const recipesWithMatch = filteredRecipes.map((recipe) => {
      // ON이면 냉장고 재료, OFF면 선택한 재료를 기준으로 계산
      const selectedIngredientIds = isAllIngredientsOn
        ? fridgeIngredientIds
        : filters.ingredients;

      // OFF 상태에서 선택한 재료가 없으면 기존 데이터 유지
      if (!isAllIngredientsOn && filters.ingredients.length === 0) {
        return recipe;
      }

    const recipeIngredients = recipe.ingredient_ids ?? [];

    const matchedCount = recipeIngredients.filter((ingId) =>
      selectedIngredientIds.includes(ingId)
    ).length;

    const matchRate =
      recipeIngredients.length > 0
        ? matchedCount / recipeIngredients.length
        : 0;

    // 선택하지 않은 재료 ID 찾기
    const missingIds = recipeIngredients.filter(
      (ingId) => !selectedIngredientIds.includes(ingId)
    );

    // ID를 재료 이름으로 변환
    const missingIngredients = mockIngredients.filter((ingredient) =>
      missingIds.includes(ingredient.ing_id)
    );

    return {
      ...recipe,
      match_rate: matchRate,
      missing_ingredients: missingIngredients,
    };
  });  

  // 재료가 하나 이상인지 확인하고, 재료가 선택되어있으면 정렬 기준을 일치율로 설정
  const currentSort =
  filters.ingredients.length > 0 ? "match_rate" : filters.sort;

  // 정렬 기준에 따라 가나다순 또는 일치율순 정렬
  const sortedRecipes = [...recipesWithMatch].sort((a, b) => {
    //일치율 높은 레시피부터 정렬(내림차순)
    if (filters.sort === "match_rate") {
      return b.match_rate - a.match_rate;
    }
    return a.recipe_title.localeCompare(b.recipe_title, "ko");
  });

  // 식재료 선택 및 선택 해제
  const handleIngredientToggle = (ingId) => {
    setTempIngredients((prev) =>
      prev.includes(ingId)
        ? prev.filter((id) => id !== ingId)
        : [...prev, ingId]
    );
  };

  // 선택한 재료를 실제 검색에 반영
  const handleIngredientConfirm = () => {
    setFilters((prev) => ({
      ...prev,
      ingredients: tempIngredients,
    }));

    setIsIngredientOpen(false);
  };

  // 재료 선택창 닫고 선택 취소
  const handleIngredientCancel = () => {
    setTempIngredients(filters.ingredients);
    setIsIngredientOpen(false);
  };

  // 임시 선택과 확정된 검색 재료를 모두 비우고 선택창을 닫음
  const handleIngredientClear = () => {
    setTempIngredients([]);
    setFilters((prev) => ({
      ...prev,
      ingredients: [],
    }));
    setIsIngredientOpen(false);
  };

  // 검색어, 필터, 정렬 기준 초기화
  const handleReset = () => {
    setFilters({
      keyword: "",
      ingredients: [],
      r_category_id: null,
      level: null,
      cooking_time: null,
      sort: "name",
    });
    setIngredientKeyword("");
    setIngredientCategory(null);    
  };

  // 재료 이름과 대분류 조건에 맞는 식재료 목록
  const filteredIngredients = mockIngredients.filter((ingredient) =>
    ingredient.ing_name.includes(ingredientKeyword.trim()) &&
    (ingredientCategory === null ||
      ingredient.ing_category_id === ingredientCategory)
  );

  // 고른 재료 하나만 검색에서 빼기 (왼쪽 필터의 재료 칩 ✕)
  const handleIngredientRemove = (ingId) => {
    setFilters((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((id) => id !== ingId),
    }));
  };

  // 식재료 선택 창은 Esc로도 닫힘 (와이어프레임 p.16)
  useEffect(() => {
    if (!isIngredientOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setTempIngredients(filters.ingredients);
        setIsIngredientOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isIngredientOpen, filters.ingredients]);

  // 왼쪽 필터 칩: 고른 값을 다시 누르면 '전체'로 돌아감
  const toggleFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: prev[key] === value ? null : value }));

  const chipClass = (isOn) =>
    `inline-flex items-center h-9 px-3.5 rounded-pill text-sm font-medium ${
      isOn ? "bg-ink text-white" : "bg-gray-100 text-ink hover:bg-gray-200"
    }`;

  // 왼쪽 필터에 보여 줄 값 (값은 기존 select와 같음)
  const CATEGORY_OPTIONS = [{ value: 1, label: "밥" }, { value: 4, label: "반찬" }];
  const LEVEL_OPTIONS = ["초급", "중급", "고급"];
  const TIME_OPTIONS = [
    { value: 15, label: "~15분" },
    { value: 30, label: "~30분" },
    { value: 60, label: "~60분" },
    { value: "초과", label: "60분 이상" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-black">레시피 검색</h1>

      {/* ① 검색창 (위 전체 폭) */}
      <input
        type="text"
        placeholder="레시피 제목 검색"
        aria-label="레시피 제목 검색"
        className="h-14 w-full rounded-pill border-0 px-6 text-base shadow-card"
        value={filters.keyword}
        onChange={(e) =>
          setFilters({
            ...filters,
            keyword: e.target.value,
          })
        }
      />

      {/* 아래: 왼쪽 필터(260px) + 오른쪽 결과 */}
      <div className="grid items-start gap-6 lg:grid-cols-[260px_1fr]">

        {/* ② 왼쪽 필터 */}
        <aside aria-label="필터" className="flex flex-col gap-6 rounded-card bg-surface p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">필터</h2>
            <button type="button" className="text-sm text-muted underline hover:text-accent" onClick={handleReset}>
              초기화
            </button>
          </div>

          {/* 재료: 고른 재료 칩 + 식재료 선택 */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-ink-soft">재료</h3>
            {filters.ingredients.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {mockIngredients
                  .filter((ingredient) => filters.ingredients.includes(ingredient.ing_id))
                  .map((ingredient) => (
                    <button
                      key={ingredient.ing_id}
                      type="button"
                      aria-label={`${ingredient.ing_name} 빼기`}
                      className="inline-flex items-center h-9 px-3.5 rounded-pill bg-ink text-sm font-bold text-white"
                      onClick={() => handleIngredientRemove(ingredient.ing_id)}
                    >
                      {ingredient.ing_name} ✕
                    </button>
                  ))}
              </div>
            )}
            <button
              type="button"
              className="inline-flex items-center justify-center h-10 rounded-pill border border-gray-300 text-sm font-medium hover:border-accent hover:text-accent"
              onClick={() => {
                setTempIngredients([...filters.ingredients]);
                setIsIngredientOpen(true);
              }}
            >
              + 식재료 선택
            </button>
            {/* 실제 검색에 적용된 재료까지 삭제 */}
            {filters.ingredients.length > 0 && (
              <button type="button" className="self-start text-xs text-muted underline hover:text-accent" onClick={handleIngredientClear}>
                검색 재료 초기화
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-ink-soft">요리 종류</h3>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_OPTIONS.map((option) => (
                <button key={option.value} type="button" aria-pressed={filters.r_category_id === option.value}
                  className={chipClass(filters.r_category_id === option.value)}
                  onClick={() => toggleFilter("r_category_id", option.value)}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-ink-soft">난이도</h3>
            <div className="flex flex-wrap gap-1.5">
              {LEVEL_OPTIONS.map((level) => (
                <button key={level} type="button" aria-pressed={filters.level === level}
                  className={chipClass(filters.level === level)}
                  onClick={() => toggleFilter("level", level)}>
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-ink-soft">조리 시간</h3>
            <div className="flex flex-wrap gap-1.5">
              {TIME_OPTIONS.map((option) => (
                <button key={option.value} type="button" aria-pressed={filters.cooking_time === option.value}
                  className={chipClass(filters.cooking_time === option.value)}
                  onClick={() => toggleFilter("cooking_time", option.value)}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* 오른쪽 결과 */}
        <section className="flex min-w-0 flex-col gap-5">

          {/* ③ 내 냉장고 재료 우선 스위치 (와이어프레임 p.15·17): 결과 맨 위 */}
          <div
            className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[20px] px-5 py-3 ${
              isAllIngredientsOn ? "bg-have-soft" : "bg-surface shadow-card"
            }`}
          >
            <button
              type="button"
              role="switch"
              aria-checked={isAllIngredientsOn}
              aria-label="내 냉장고 재료 우선"
              disabled={!isAuthenticated}
              onClick={() => setIsAllIngredientsOn((prev) => !prev)}
              className={`relative h-7 w-12 flex-none rounded-pill transition-colors disabled:opacity-40 ${
                isAllIngredientsOn ? "bg-have" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-surface transition-transform ${
                  isAllIngredientsOn ? "translate-x-5" : ""
                }`}
              />
            </button>
            <span className={`font-bold ${isAllIngredientsOn ? "text-have" : "text-ink"}`}>내 냉장고 재료 우선</span>
            {/* 켰을 때만 어떻게 거르는지 안내, 껐을 때는 로그인 전에만 안내 */}
            {isAllIngredientsOn ? (
              <div className="basis-full flex flex-col gap-0.5 pl-16 text-sm text-have">
                <p>
                  내 냉장고 재료(<strong>{fridgeIngredientIds.length}개</strong>)로 <strong>50% 이상</strong> 만들 수 있는 요리만 보여요.
                </p>
                <p>카드의 일치율 · 부족한 재료는 내 냉장고 기준이에요.</p>
                {/* 필터 재료가 있을 때만, 맨 아래에 배경색으로 강조 */}
                {filters.ingredients.length > 0 && (
                  <p className="mt-1 self-start rounded-[8px] bg-surface px-2.5 py-1">
                    필터에서 고른 재료 {filters.ingredients.length}개가 모두 들어간 요리 중에서 골랐어요.
                  </p>
                )}
              </div>
            ) : (
              !isAuthenticated && <span className="text-sm text-muted">로그인하면 켤 수 있어요</span>
            )}
          </div>

          {/* ④ 결과 개수 + 정렬 */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg font-black">
              검색 결과 <span className="text-accent">{filteredRecipes.length}개</span>
            </p>
            <select
              aria-label="정렬"
              className="h-10 rounded-pill pr-8 text-sm"
              value={filters.sort}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  sort: e.target.value,
                })
              }
            >
              <option value="name">가나다순</option>
              <option value="match_rate">일치율 높은 순</option>
            </select>
          </div>

          {filteredRecipes.length === 0 && (
            <p className="rounded-card bg-surface p-8 text-center text-muted shadow-card">검색 결과가 없습니다.</p>
          )}

          {/* ⑤ 결과 카드: 한 줄에 최대 3개 */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {sortedRecipes.map((recipe)=>(
              <RecipeCard
               key={recipe.recipe_id}
               recipe={recipe}
               showMatch={true}
              />
            ))}
          </div>
        </section>
      </div>

      {/* ⑥ 식재료 선택 창 (와이어프레임 p.16): 화면 위에 뜨는 창, ✕ · Esc로 닫으면 선택 취소 */}
      {isIngredientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="ingredient-dialog-title"
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-card bg-surface shadow-card">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 id="ingredient-dialog-title" className="text-xl font-black">식재료 선택</h2>
              <button type="button" aria-label="닫기" className="h-10 w-10 rounded-full text-xl hover:bg-gray-100" onClick={handleIngredientCancel}>
                ✕
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto md:grid-cols-[1fr_260px]">
              {/* 왼쪽: 찾기 · 분류 · 재료 칩 */}
              <div className="flex flex-col gap-4 p-6">
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    placeholder="식재료 이름 검색"
                    aria-label="식재료 이름 검색"
                    className="h-11 min-w-0 flex-1 rounded-pill px-5"
                    value={ingredientKeyword}
                    onChange={(e) => setIngredientKeyword(e.target.value)}
                  />
                  <select
                    aria-label="재료 대분류"
                    className="h-11 rounded-pill pr-8"
                    value={ingredientCategory ?? ""}
                    onChange={(e) =>
                      setIngredientCategory(
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                  >
                    <option value="">전체 재료</option>
                    {mockIngredientCategories.map((category) => (
                      <option
                        key={category.ing_category_id}
                        value={category.ing_category_id}
                      >
                        {category.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-2">
                  {filteredIngredients.map((ingredient) => (
                    <button
                      key={ingredient.ing_id}
                      type="button"
                      aria-pressed={tempIngredients.includes(ingredient.ing_id)}
                      className={chipClass(tempIngredients.includes(ingredient.ing_id))}
                      onClick={() => handleIngredientToggle(ingredient.ing_id)}
                    >
                      {tempIngredients.includes(ingredient.ing_id) ? "✓ " : ""}
                      {ingredient.ing_name}
                    </button>
                  ))}
                </div>
                {filteredIngredients.length === 0 && (
                  <p className="text-muted">검색 결과가 없습니다.</p>
                )}
                <p className="text-xs text-muted">누르면 선택, 다시 누르면 해제</p>
              </div>

              {/* 오른쪽: 선택한 재료 + 찾기 버튼 */}
              <div className="flex flex-col gap-3 bg-gray-50 p-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold">
                    선택한 재료 <span className="text-accent">{tempIngredients.length}</span>
                  </h4>
                  {/* 선택창 안에서 임시로 고른 재료만 삭제 */}
                  <button
                    type="button"
                    className="text-sm text-muted underline hover:text-accent disabled:opacity-40"
                    onClick={() => setTempIngredients([])}
                    disabled={tempIngredients.length === 0}
                  >
                    모두 지우기
                  </button>
                </div>
                {/* 선택한 재료 0개 -> 안내 문구 표시 / 1개 이상 -> 안내 문구 숨김, 선택한 재료 버튼 표시 */}
                {tempIngredients.length === 0 && (
                  <p className="text-sm text-muted">선택한 재료가 없습니다.</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {mockIngredients
                    .filter((ingredient) => tempIngredients.includes(ingredient.ing_id))
                    .map((ingredient) => (
                      <button
                        key={ingredient.ing_id}
                        type="button"
                        className="inline-flex items-center h-9 px-3.5 rounded-pill bg-ink text-sm font-bold text-white"
                        onClick={() => handleIngredientToggle(ingredient.ing_id)}
                      >
                        {ingredient.ing_name} ✕
                      </button>
                    ))}
                </div>
                <button
                  type="button"
                  className="mt-auto h-12 rounded-pill bg-accent font-bold text-white hover:bg-accent-dark disabled:opacity-40"
                  onClick={handleIngredientConfirm}
                  disabled={tempIngredients.length === 0}
                >
                  이 재료로 레시피 찾기 ({tempIngredients.length}) →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecipeListPage;
