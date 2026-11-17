// 담당: 권우정 
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

  return (
    <div>
      <h1>레시피 목록</h1>
      <input
        type="text"
        placeholder="레시피 제목 검색"
        value={filters.keyword}
        onChange={(e) =>
          setFilters({
            ...filters,
            keyword: e.target.value,
          })
        }
      /> 
      <p>현재 검색어 : {filters.keyword}</p> <br />

      <h3>식재료 선택</h3>

      <button
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
      </button> <br />

      <button
        disabled={!isAuthenticated}
        onClick={() => setIsAllIngredientsOn((prev) => !prev)}
      >
        모든 재료 일치: {isAllIngredientsOn ? "ON" : "OFF"}
      </button> <br />

      {/* 실제 검색에 적용된 재료까지 삭제 */}
      <button
        onClick={handleIngredientClear}
        disabled={filters.ingredients.length === 0}
      >
        검색 재료 초기화
      </button> <br />

      {isIngredientOpen && (
        <div>
          <input
            type="text"
            placeholder="식재료 이름 검색"
            value={ingredientKeyword}
            onChange={(e) => setIngredientKeyword(e.target.value)}
          /> <br />
          <select
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
          </select> <br />
          {filteredIngredients.map((ingredient) => (
            <span key={ingredient.ing_id}>
              <button onClick={() => handleIngredientToggle(ingredient.ing_id)}>
                {ingredient.ing_name}
                {tempIngredients.includes(ingredient.ing_id) ? "✓" : ""}
              </button>{" "}
            </span>
          ))}
          {filteredIngredients.length === 0 && (
            <p>검색 결과가 없습니다.</p>
          )}


          <p>선택한 재료 수 : {tempIngredients.length}개</p> <br />

          <h4>선택한 재료</h4>
          {/* 선택한 재료 0개 -> 안내 문구 표시 / 1개 이상 -> 안내 문구 숨김, 선택한 재료 버튼 표시 */}
          {tempIngredients.length === 0 && (
            <p>선택한 재료가 없습니다.</p>
          )}

          {mockIngredients
            .filter((ingredient) => tempIngredients.includes(ingredient.ing_id))
            .map((ingredient) => (
              <span key={ingredient.ing_id}>
                <button onClick={() => handleIngredientToggle(ingredient.ing_id)}>
                  {ingredient.ing_name} ✕
                </button>{" "}
              </span>
            ))} <br />

          {/* 선택창 안에서 임시로 고른 재료만 삭제 */}
          <button
            onClick={() => setTempIngredients([])}
            disabled={tempIngredients.length === 0}
          >
            모두 지우기
          </button> <br />

          <button
            onClick={handleIngredientConfirm}
            disabled={tempIngredients.length === 0}
          >
            이 재료로 레시피 찾기 ({tempIngredients.length})
          </button> <br />
        </div>
      )}

      {/* filters.level이 null 또는 undefined이면 빈 문자열 "" 사용 */}
      <select
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
      </select> <br />

      <select
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
      </select> <br />      

      <select
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
      </select> <br />

      <select
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
      </select> <br />      

      <button type="button" onClick={handleReset}>
        검색 조건 초기화
      </button> <br />     

      <p>검색 결과: {filteredRecipes.length}개</p>

      {filteredRecipes.length === 0 && (
        <p>검색 결과가 없습니다.</p>
      )}

      {sortedRecipes.map((recipe)=>(
        <RecipeCard
         key={recipe.recipe_id}
         recipe={recipe}
         showMatch={true}
        />
      ))}
    </div>
  );
}

export default RecipeListPage;
