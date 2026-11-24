// 담당: 권우정
// [병합 11/23 조현기] woojung 브랜치(DB 연결 · 주석 정리) + main 디자인(11/22) 합침
//   - 검색 · 필터 · 페이지 · 정렬 로직은 woojung 브랜치 그대로 (mockData → 실제 DB)
//   - 화면 모양은 main 디자인 그대로 (왼쪽 필터 칩, 위쪽 스위치, 식재료 선택 모달), 아래 페이지 버튼만 새로 꾸밈
//   - 서버 요청을 직접 주소(127.0.0.1) 대신 api.js로: 프로젝트 규칙(요청은 api.js 하나로)
//     + 127.0.0.1로 보내면 localhost에서 받은 로그인 쿠키가 같이 안 가는 문제
//   - 일치율 막대는 재료를 골랐을 때만 표시 (안 고르면 서버가 일치율을 주지 않음)
//   - '내 냉장고 재료 우선' 스위치는 woojung 브랜치처럼 아직 검색 조건에 반영 안 됨 → 켜면 "준비 중" 안내
// [디자인 11/22 조현기] 시안 F + 와이어프레임 p.15~17 레이아웃 (왼쪽 필터 칩 · 위쪽 스위치 · 식재료 선택 모달 · 카드 한 줄 최대 3개)
import RecipeCard from "../components/RecipeCard";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext"
import { Link } from "react-router-dom";
import { RECIPE_CATEGORIES } from "../constants";
import api from "../api"; // [병합] 공통 api

function RecipeListPage() {
  // 검색 및 필터 조건을 하나의 객체로 관리
  const [filters, setFilters] = useState({
    keyword: "", //검색어
    ingredients: [], //재료
    r_category_id: null, //요리 종류
    level: null, //요리 난이도
    cooking_time: null, //조리 시간
    sort: "latest", //정렬 (기본값: 최신순)
  });  

  // 백엔드에서 조회한 현재 페이지의 레시피 목록
  const [recipes, setRecipes] = useState([]);

  // 레시피 조회 요청이 진행 중인지 표시
  const [loading, setLoading] = useState(true);

  // 레시피 조회 실패 시 표시할 오류 메시지
  const [error, setError] = useState("");

  // 실제 DB에서 가져온 식재료 목록
  const [ingredients, setIngredients] = useState([]);

  // 내 냉장고에 등록된 재료 개수
  // null은 아직 조회하지 않았다는 뜻
  const [fridgeIngredientCount, setFridgeIngredientCount] = useState(null);

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

        // 최신순 / 인기순 정렬은 백엔드에서 처리
        if (filters.sort === "latest" || filters.sort === "popular") {
          params.append("sort", filters.sort);
        }

        // 냉장고 우선 스위치가 켜져 있으면 서버에 전달
        if (isAllIngredientsOn) {
          params.append("fridge_first", "true");
        }

        // 화면에는 20개를 보여주지만 21개를 요청해 다음 페이지 존재 여부 확인
        params.append("limit", PAGE_SIZE + 1);
        params.append("offset", (page - 1) * PAGE_SIZE);

        // [병합] api.js로 요청 (실패하면 axios가 오류를 던짐)
        const { data } = await api.get(`/recipes?${params.toString()}`, {
          signal: controller.signal,
        });

        // 취소되지 않은 최신 요청의 결과만 반영
        if (!controller.signal.aborted) {
          // 21번째 레시피가 있으면 다음 페이지가 존재함
          setHasNextPage(data.length > PAGE_SIZE);

          // 실제 화면에는 20개만 표시
          setRecipes(data.slice(0, PAGE_SIZE));
        }

      } catch (err) {
        // [병합] axios는 요청 취소를 ERR_CANCELED로 알려 줌
        if (err.code !== "ERR_CANCELED") {
          setError("레시피를 불러오지 못했습니다.");
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
    filters.sort, // 정렬 방식이 변경되면 API 다시 호출
    isAllIngredientsOn,
    page
  ]);

  // 식재료 목록과 카테고리 가져오기
  useEffect(() => {
    // 식재료 목록과 식재료 카테고리를 함께 조회
    const fetchIngredients = async () => {
      try {
        // [병합] api.js로 요청
        const [{ data: ingredientData }, { data: categoryData }] = await Promise.all([
          api.get("/ingredients"),
          api.get("/ingredients/categories"),
        ]);

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

  // 냉장고 우선 검색을 켜면 내 냉장고 재료 개수 조회
  useEffect(() => {
    if (!isAuthenticated || !isAllIngredientsOn) {
      setFridgeIngredientCount(null);
      return;
    }

    const controller = new AbortController();

    const fetchFridgeIngredients = async () => {
      setFridgeIngredientCount(null);

      try {
        const { data } = await api.get("/fridge/ingredients", {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setFridgeIngredientCount(data.length);
        }
      } catch (err) {
        if (err.code !== "ERR_CANCELED") {
          console.error("냉장고 재료 조회 실패:", err);
        }
      }
    };

    fetchFridgeIngredients();

    return () => controller.abort();
  }, [isAuthenticated, isAllIngredientsOn]);

  // 검색 조건 변경 시 1페이지부터 다시 조회
  useEffect(() => {
    setPage(1);
  }, [
    filters.keyword,
    filters.r_category_id,
    filters.level,
    filters.cooking_time,
    filters.ingredients,
    filters.sort,       // 추가: 정렬 방식 변경
    isAllIngredientsOn  // 추가: 냉장고 우선 검색 ON/OFF
  ]);

  // 검색 조건은 백엔드에서 적용되므로 응답받은 목록을 그대로 사용
  const filteredRecipes = recipes;

  // 정렬에 사용할 레시피 목록
  const recipesWithMatch = filteredRecipes;

  // 정렬 기준에 따라 레시피 정렬
  const sortedRecipes = [...recipesWithMatch].sort((a, b) => {

    // 냉장고 우선 검색은 백엔드 정렬 순서를 유지
    if (isAllIngredientsOn) {
      return 0;
    }

    // 일치율 높은 순을 선택한 경우
    if (filters.sort === "match_rate") {
      return (b.match_rate ?? 0) - (a.match_rate ?? 0);
    }

    // 최신순 / 인기순은 백엔드 정렬 순서를 유지
    return 0;
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
  const CATEGORY_OPTIONS = RECIPE_CATEGORIES.map((category) => ({
    value: category.r_category_id,
    label: category.category_name,
  }));
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
                {ingredients
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
            {/* [병합] 켰을 때 안내. woojung 브랜치에서도 아직 검색 조건에 반영 전이라 '준비 중'으로 표시 */}
            {isAllIngredientsOn ? (
              <div className="basis-full flex flex-col gap-0.5 pl-16 text-sm text-have">
                <p>
                  내 냉장고 재료와 50% 이상 일치하는 레시피를
                  일치율 높은 순으로 보여드려요.
                </p>
                <p>
                  일치율이 같으면 내 조리도구로 만들 수 있는 요리를 먼저 보여드려요.
                </p>
              </div>
            ) : (
              !isAuthenticated && (
                <span className="text-sm text-muted">
                  로그인하면 켤 수 있어요
                </span>
              )
            )}
          </div>

          {/* ④ 결과 개수 + 정렬 */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg font-black">
              검색 결과 <span className="text-accent">{filteredRecipes.length}개</span>{(page > 1 || hasNextPage) && <span className="ml-2 text-sm font-medium text-muted">(이 페이지)</span>}
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
              <option value="latest">최신순</option>
              <option value="popular">인기순</option>
              <option value="match_rate">일치율 높은 순</option>
            </select>
          </div>

          {/* [병합] 불러오는 중 · 오류 (woojung 브랜치) */}
          {loading && <p role="status" className="text-muted">레시피를 불러오는 중...</p>}
          {error && <p role="alert" className="rounded-[16px] bg-miss-soft px-5 py-3 text-miss">{error}</p>}

          {!loading && !error && filteredRecipes.length === 0 && (
            <div className="rounded-card bg-surface p-8 text-center text-muted shadow-card">
              {isAllIngredientsOn && fridgeIngredientCount === 0 ? (
                <>
                  <p>냉장고에 등록된 재료가 없어요.</p>
                  <p className="mt-2">
                    재료를 등록하고 맞춤 레시피를 추천받아 보세요!
                  </p>
                  <Link
                    to="/fridge"
                    className="mt-4 inline-block rounded-pill bg-have px-5 py-2 font-bold text-white"
                  >
                    내 냉장고에 재료 등록하러 가기
                  </Link>
                </>
              ) : (
                <p>검색 결과가 없습니다.</p>
              )}
            </div>
          )}

          {/* ⑤ 결과 카드: 한 줄에 최대 3개 */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {/* [병합] 새 결과를 불러오는 동안에는 예전 카드를 숨김 */}
            {!loading && sortedRecipes.map((recipe)=>(
              <RecipeCard
               key={recipe.recipe_id}
               recipe={recipe}
               showMatch={filters.ingredients.length > 0 || isAllIngredientsOn}
              />
            ))}
          </div>

          {/* [병합] 페이지 이동 (woojung 브랜치, 한 페이지 20개) */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              className="h-10 rounded-pill bg-surface px-5 text-sm font-medium shadow-card hover:bg-gray-50 disabled:opacity-40"
              disabled={page === 1 || loading}
              onClick={() => setPage((prev) => prev - 1)}
            >
              ‹ 이전
            </button>
            <span className="text-sm font-bold">{page} 페이지</span>
            <button
              type="button"
              className="h-10 rounded-pill bg-surface px-5 text-sm font-medium shadow-card hover:bg-gray-50 disabled:opacity-40"
              disabled={loading || !hasNextPage}
              onClick={() => setPage((prev) => prev + 1)}
            >
              다음 ›
            </button>
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
                    {ingredientCategories.map((category) => (
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
                  {ingredients
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
