// 담당: 권우정 
import RecipeCard from "../components/RecipeCard";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext"

// 레시피와 식재료 데이터를 요청할 백엔드 서버 주소
const API_URL = "http://127.0.0.1:8044";

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

  // 백엔드에서 조회한 현재 페이지의 레시피 목록
  const [recipes, setRecipes] = useState([]);

  // 레시피 조회 요청이 진행 중인지 표시
  const [loading, setLoading] = useState(true);

  // 레시피 조회 실패 시 표시할 오류 메시지
  const [error, setError] = useState("");

  // 실제 DB에서 가져온 식재료 목록
  const [ingredients, setIngredients] = useState([]);

  // 실제 DB에서 가져온 식재료 카테고리
  const [ingredientCategories, setIngredientCategories] = useState([]);

  // 사용자가 식재료 선택창에서 고르고 있는 재료 임시로 보관
  const [tempIngredients, setTempIngredients] = useState([]);

  // 식재료 선택 영역 열기/닫기
  const [isIngredientOpen, setIsIngredientOpen] = useState(false);

  // 식재료 검색창에 입력한 글자
  const [ingredientKeyword, setIngredientKeyword] = useState("");

  // 식재료 대분류 선택 상태
  const [ingredientCategory, setIngredientCategory] = useState(null);

  // 모든 재료 일치 버튼의 ON/OFF 상태 (현재는 화면 상태만 변경하며 검색 조건에는 반영되지 않음)
  const [isAllIngredientsOn, setIsAllIngredientsOn] = useState(false);

  // 현재 페이지 번호
  const [page, setPage] = useState(1);

  // 다음 페이지가 존재하는지
  const [hasNextPage, setHasNextPage] = useState(false);

  // 한 페이지에 표시할 레시피 수
  const PAGE_SIZE = 20;

  // 로그인 상태 확인
  const { isAuthenticated } = useAuth();

  // 검색 조건이나 페이지가 바뀔 때 백엔드에서 레시피를 다시 조회
  useEffect(() => {
    // 이전 요청을 취소해 오래된 검색 결과가 화면에 표시되지 않도록 관리
    const controller = new AbortController();

    // 선택한 검색 조건을 URL 파라미터로 만들어 레시피 목록 요청
    const fetchRecipes = async () => {
      setLoading(true);
      setError("");

      try {
        // 검색어, 필터, 페이지 번호를 서버에 전달할 쿼리 파라미터
        const params = new URLSearchParams();

        if (filters.keyword.trim()) {
          params.append("keyword", filters.keyword.trim());
        }

        if (filters.r_category_id !== null) {
          params.append("r_category_id", filters.r_category_id);
        }

        if (filters.level !== null) {
          params.append("level", filters.level);
        }

        if (
          filters.cooking_time !== null &&
          filters.cooking_time !== "초과"
        ) {
          params.append("cooking_time", filters.cooking_time);
        }

        if (filters.cooking_time === "초과") {
          params.append("over_60", "true");
        }

        filters.ingredients.forEach((ingId) => {
          params.append("ingredient_ids", ingId);
        });

        // 화면에는 20개를 보여주지만 21개를 요청해 다음 페이지 존재 여부 확인
        params.append("limit", PAGE_SIZE + 1);
        params.append("offset", (page - 1) * PAGE_SIZE);

        const response = await fetch(
          `${API_URL}/recipes?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("레시피 조회 실패");
        }

        const data = await response.json();

        // 취소되지 않은 최신 요청의 결과만 반영
        if (!controller.signal.aborted) {
          // 21번째 레시피가 있으면 다음 페이지가 존재함
          setHasNextPage(data.length > PAGE_SIZE);

          // 실제 화면에는 20개만 표시
          setRecipes(data.slice(0, PAGE_SIZE));
        }

      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchRecipes();

    // 검색 조건이 변경되면 이전 요청 취소
    return () => controller.abort();

  }, [
    filters.keyword,
    filters.r_category_id,
    filters.level,
    filters.cooking_time,
    filters.ingredients,
    page
  ]);

  // 식재료 목록과 카테고리 가져오기
  useEffect(() => {
    // 식재료 목록과 식재료 카테고리를 함께 조회
    const fetchIngredients = async () => {
      try {
        const [ingredientResponse, categoryResponse] = await Promise.all([
          fetch(`${API_URL}/ingredients`),
          fetch(`${API_URL}/ingredients/categories`)
        ]);

        if (!ingredientResponse.ok || !categoryResponse.ok) {
          throw new Error("식재료 조회 실패");
        }

        const ingredientData = await ingredientResponse.json();
        const categoryData = await categoryResponse.json();

        setIngredients(ingredientData);
        setIngredientCategories(categoryData);

      } catch (err) {
        console.error("식재료 조회 오류:", err);
      }
    };

    fetchIngredients();
  }, []);

  // 로그아웃하면 모든 재료 일치 기능 OFF
  useEffect(() => {
    if (!isAuthenticated) {
      setIsAllIngredientsOn(false);
    }
  }, [isAuthenticated]);

  // 검색 조건 변경 시 1페이지부터 다시 조회
  useEffect(() => {
    setPage(1);
  }, [
    filters.keyword,
    filters.r_category_id,
    filters.level,
    filters.cooking_time,
    filters.ingredients
  ]);

  // 검색 조건은 백엔드에서 적용되므로 응답받은 목록을 그대로 사용
  const filteredRecipes = recipes;

  // 정렬에 사용할 레시피 목록
  const recipesWithMatch = filteredRecipes;

  // 정렬 기준에 따라 가나다순 또는 일치율순 정렬
  const sortedRecipes = [...recipesWithMatch].sort((a, b) => {
    // 재료를 선택했거나 일치율순을 선택했다면
    if (filters.ingredients.length > 0 || filters.sort === "match_rate") {
      return (b.match_rate ?? 0) - (a.match_rate ?? 0);
    }

    // 그 외에는 가나다순
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
  const filteredIngredients = ingredients.filter((ingredient) =>
    ingredient.ing_name.includes(ingredientKeyword.trim()) &&
    (ingredientCategory === null ||
      ingredient.ing_category_id === ingredientCategory)
  );

  return (
    <div>
      <h1>레시피 목록</h1>
      {loading && <p>레시피를 불러오는 중...</p>}
      {error && <p>오류: {error}</p>}
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
            {ingredientCategories.map((category) => (
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

          {ingredients
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

      {/* 페이지 이동 */}
      <div>
        <button
          type="button"
          disabled={page === 1 || loading}
          onClick={() => setPage((prev) => prev - 1)}
        >
          이전
        </button>

        <span> {page} 페이지 </span>

        <button
          type="button"
          disabled={loading || !hasNextPage}
          onClick={() => setPage((prev) => prev + 1)}
        >
          다음
        </button>
      </div>
    </div>
  );
}

export default RecipeListPage;
