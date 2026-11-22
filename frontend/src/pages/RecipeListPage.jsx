// 담당: 권우정
// [디자인 11/22 조현기] 시안 F 적용 — 모양만 바꿈, 검색 · 필터 · 정렬 로직은 그대로
//   1. 검색창: 큰 알약 모양. '현재 검색어 : ...' 확인용 줄은 뺌 (검색창에 글자가 그대로 보여서)
//   2. 식재료 선택: 흰 카드 안에 버튼 · 칩으로 정리, <br /> 줄바꿈 대신 칸 나눔
//   3. 난이도 · 시간 · 요리 종류 · 정렬: 한 줄에 둥근 고르기 칸 (aria-label 추가)
//   4. 결과: 레시피 카드를 한 줄에 최대 4개씩
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

  // ON/OFF 상태(false : 일반 레시피 검색, true : 모든 재료 일치 기능 ON)
  const [isAllIngredientsOn, setIsAllIngredientsOn] = useState(false);

  // 로그인 상태 확인
  const { isAuthenticated } = useAuth();

  // 로그아웃하면 모든 재료 일치 기능 OFF
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
    // 선택했다면 일치율 70% 이상만 표시
    const matchIngredients =
      filters.ingredients.length === 0 ||
      (recipeIngredients.length > 0 && matchRate >= 0.7);

    // 선택한 재료가 레시피에 모두 포함되어 있는지 확인
      const matchSelectedIngredients =
      filters.ingredients.every((ingId) =>
        recipeIngredients.includes(ingId)
    );

    // ON일 때 선택 재료 포함 여부와 냉장고 일치율 70% 이상 확인
    const matchFridge =
      !isAllIngredientsOn ||
      (
        matchSelectedIngredients &&
        calculateFridgeMatchRate(recipe) >= 0.7
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

  const chipClass = (isOn) =>
    `inline-flex items-center h-10 px-4 rounded-pill text-sm font-medium ${
      isOn ? "bg-ink text-white" : "bg-gray-100 text-ink hover:bg-gray-200"
    }`;
  const subButtonClass =
    "inline-flex items-center h-11 px-5 rounded-pill bg-gray-100 text-sm font-medium hover:bg-gray-200 disabled:opacity-40";
  const selectClass = "h-11 rounded-pill pr-8";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-black">레시피 목록</h1>

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

      <section className="flex flex-col gap-4 rounded-card bg-surface p-6 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-2 text-lg font-bold">식재료 선택</h2>

          <button
            className="inline-flex items-center h-11 px-5 rounded-pill bg-accent text-white text-sm font-bold hover:bg-accent-dark"
            onClick={() => {
              if (isIngredientOpen) {
                handleIngredientCancel();
              } else {
                setTempIngredients([...filters.ingredients]);
                setIsIngredientOpen(true);
              }
            }}
          >
            {isIngredientOpen ? "닫기" : "+ 식재료 선택"}
          </button>

          <button
            aria-pressed={isAllIngredientsOn}
            className={`inline-flex items-center h-11 px-5 rounded-pill text-sm font-bold disabled:opacity-40 ${
              isAllIngredientsOn ? "bg-have text-white" : "bg-gray-100 text-ink hover:bg-gray-200"
            }`}
            disabled={!isAuthenticated}
            onClick={() => setIsAllIngredientsOn((prev) => !prev)}
          >
            모든 재료 일치: {isAllIngredientsOn ? "ON" : "OFF"}
          </button>

          {/* 실제 검색에 적용된 재료까지 삭제 */}
          <button
            className={subButtonClass}
            onClick={handleIngredientClear}
            disabled={filters.ingredients.length === 0}
          >
            검색 재료 초기화
          </button>
        </div>

        {isIngredientOpen && (
          <div className="flex flex-col gap-4 rounded-[20px] bg-gray-50 p-5">
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
                className={selectClass}
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
                  aria-pressed={tempIngredients.includes(ingredient.ing_id)}
                  className={chipClass(tempIngredients.includes(ingredient.ing_id))}
                  onClick={() => handleIngredientToggle(ingredient.ing_id)}
                >
                  {ingredient.ing_name}
                  {tempIngredients.includes(ingredient.ing_id) ? " ✓" : ""}
                </button>
              ))}
            </div>
            {filteredIngredients.length === 0 && (
              <p className="text-muted">검색 결과가 없습니다.</p>
            )}

            <div className="flex flex-col gap-2 border-t border-line pt-4">
              <h4 className="font-bold">
                선택한 재료 <span className="text-accent">{tempIngredients.length}개</span>
              </h4>
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
                      className="inline-flex items-center h-9 px-4 rounded-pill bg-have-soft text-have text-sm font-bold"
                      onClick={() => handleIngredientToggle(ingredient.ing_id)}
                    >
                      {ingredient.ing_name} ✕
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* 선택창 안에서 임시로 고른 재료만 삭제 */}
              <button
                className={subButtonClass}
                onClick={() => setTempIngredients([])}
                disabled={tempIngredients.length === 0}
              >
                모두 지우기
              </button>

              <button
                className="inline-flex items-center h-11 px-5 rounded-pill bg-ink text-white text-sm font-bold hover:bg-gray-800 disabled:opacity-40"
                onClick={handleIngredientConfirm}
                disabled={tempIngredients.length === 0}
              >
                이 재료로 레시피 찾기 ({tempIngredients.length})
              </button>
            </div>
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {/* filters.level이 null 또는 undefined이면 빈 문자열 "" 사용 */}
        <select
          aria-label="난이도"
          className={selectClass}
          value={filters.level ?? ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              level: e.target.value === "" ? null : e.target.value,
            })
          }
        >
          <option value="">전체 난이도</option>
          <option value="초급">초급</option>
          <option value="중급">중급</option>
          <option value="고급">고급</option>
        </select>

        <select
          aria-label="조리 시간"
          className={selectClass}
          value={filters.cooking_time ?? ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              cooking_time:
                e.target.value === ""
                  ? null
                  : e.target.value === "초과"
                  ? "초과"
                  : Number(e.target.value),
            })
          }
        >
          <option value="">전체 시간</option>
          <option value="15">15분 이하</option>
          <option value="30">30분 이하</option>
          <option value="60">60분 이하</option>
          <option value="초과">60분 초과</option>
        </select>

        <select
          aria-label="요리 종류"
          className={selectClass}
          value={filters.r_category_id ?? ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              r_category_id:
                e.target.value === "" ? null : Number(e.target.value),
            })
          }
        >
          <option value="">전체 요리</option>
          <option value="1">밥</option>
          <option value="4">반찬</option>
        </select>

        <select
          aria-label="정렬"
          className={selectClass}
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

        <button type="button" className="h-11 px-3 text-sm text-muted underline hover:text-accent" onClick={handleReset}>
          검색 조건 초기화
        </button>
      </div>

      <p className="font-bold">
        검색 결과 <span className="text-accent">{filteredRecipes.length}개</span>
      </p>

      {filteredRecipes.length === 0 && (
        <p className="rounded-card bg-surface p-8 text-center text-muted shadow-card">검색 결과가 없습니다.</p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {sortedRecipes.map((recipe)=>(
          <RecipeCard
           key={recipe.recipe_id}
           recipe={recipe}
           showMatch={true}
          />
        ))}
      </div>
    </div>
  );
}

export default RecipeListPage;
