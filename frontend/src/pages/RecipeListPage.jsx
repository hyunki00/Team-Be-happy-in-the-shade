// 담당: 권우정
// [병합 11/23 조현기] woojung 브랜치(DB 연결 · 주석 정리) + main 디자인(11/22) 합침
//   - 검색 · 필터 · 페이지 · 정렬 로직은 woojung 브랜치 그대로 (mockData → 실제 DB)
//   - 화면 모양은 main 디자인 그대로 (왼쪽 필터 칩, 위쪽 스위치, 식재료 선택 모달), 아래 페이지 버튼만 새로 꾸밈
//   - 서버 요청을 직접 주소(127.0.0.1) 대신 api.js로: 프로젝트 규칙(요청은 api.js 하나로)
//     + 127.0.0.1로 보내면 localhost에서 받은 로그인 쿠키가 같이 안 가는 문제
//   - 일치율 막대는 재료를 골랐을 때만 표시 (안 고르면 서버가 일치율을 주지 않음)
//   - '내 냉장고 재료 우선' 스위치는 woojung 브랜치처럼 아직 검색 조건에 반영 안 됨 → 켜면 "준비 중" 안내
//     (→ 이후 권우정이 fridge_first로 반영함. 지금은 정상 동작)
//
// [수정 11/24 조현기] 발견된 문제 수정 — 코드 안 [수정 11/24] 주석이 있는 곳
//   1) 검색 결과 개수: '이 페이지 개수' → '전체 개수'
//        서버가 레시피 목록과 함께 전체 개수를 응답 헤더 X-Total-Count로 보내 줌 (본문은 그대로 목록)
//   2) 한 페이지 20개 → 12개 (한 줄 3개 × 4줄이 딱 맞음), 페이지 표시 '1 / 65 페이지'
//        예전에는 21개를 받아서 '다음 페이지가 있나'만 알았는데, 이제 전체 개수로 계산
//   3) 왼쪽 필터 카드가 스크롤을 내려도 화면을 따라옴 (CSS sticky)
//   4) 냉장고 우선 ON이면 정렬은 '일치율 높은 순'으로 고정 (드롭다운 잠금)
//        이때 서버는 항상 일치율 순으로 보내는데, 드롭다운은 '최신순'으로 보여서 헷갈렸음
//        냉장고 우선 OFF면 일치율이 없으니 '일치율 높은 순'은 목록에서 뺌 (골라도 아무 일이 없었음)
//   4-1) [2차] 재료 필터 = '고른 재료가 모두 들어간 레시피' (냉장고 우선 OFF면 최신순 · 인기순 그대로)
//        원래는 "고른 재료가 레시피 재료의 50% 이상"이라 감자 하나만 고르면 0개가 나왔음 (백엔드에서 수정)
//        일치율 막대도 냉장고 우선 ON일 때만 보임 (재료 필터만으로는 일치율을 계산하지 않음)
//   5) 냉장고 우선 + 재료 필터를 같이 쓰면 필터가 무시되던 문제 → 백엔드(services/recipe.py)에서 수정
//        고른 재료가 '모두' 들어간 레시피만 남기고, 일치율은 내 냉장고 기준. 화면에는 안내 한 줄 추가
//   6) 초기화 버튼이 없는 정렬값("name")을 넣던 것 → "latest"
//   7) 린트 오류 3개 (react-hooks/set-state-in-effect: 이펙트 안에서 바로 setState 하면 화면을 두 번 그림)
//        - '로그아웃하면 스위치 끄기' 이펙트   → isFridgeOn(로그인 && 스위치)으로 계산해서 씀
//        - '조건이 바뀌면 1페이지로' 이펙트   → changeFilters가 조건을 바꿀 때 같이 1페이지로
//        - '스위치 끄면 냉장고 재료 수 비우기' → 꺼져 있으면 그 값을 안 쓰니 비울 필요 없음
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

  // 내 냉장고 재료 우선 스위치 ON/OFF
  const [isAllIngredientsOn, setIsAllIngredientsOn] = useState(false);

  // 현재 페이지 번호
  const [page, setPage] = useState(1);

  // [수정 11/24 조현기] 검색 결과 전체 개수 (서버 응답 헤더 X-Total-Count에서 받음)
  //   '검색 결과 N개' 표시, 전체 페이지 수 · 다음 페이지가 있는지 계산에 씀
  //   (원래 있던 hasNextPage 상태는 이 값으로 계산하는 변수로 바뀜, 아래 참고)
  const [total, setTotal] = useState(0);

  // 한 페이지에 표시할 레시피 수
  // [수정 11/24 조현기] 20 → 12 (카드가 한 줄에 3개라 12개면 4줄이 꽉 참. 20개면 마지막 줄이 2개만 남았음)
  const PAGE_SIZE = 12;

  // 로그인 상태 확인
  const { isAuthenticated } = useAuth();

  // [수정 11/24 조현기] '냉장고 우선이 실제로 켜져 있는지'
  //   원래는 로그아웃하면 이펙트에서 setIsAllIngredientsOn(false)로 껐음 (린트 오류)
  //   지금은 스위치 값은 그대로 두고 '로그인했고 && 스위치가 켜짐'일 때만 켜진 것으로 계산
  //   → 아래 코드에서는 isAllIngredientsOn 대신 이 isFridgeOn을 씀
  const isFridgeOn = isAuthenticated && isAllIngredientsOn;

  // [수정 11/24 조현기] 서버가 '일치율 높은 순'으로 정렬해서 보내는 경우인지
  //   냉장고 우선 ON이면 true → 정렬 드롭다운을 '일치율 높은 순'으로 잠금
  //   [2차] 원래는 재료를 골라도 true였음 → 이제 재료만 고르면 최신순 · 인기순을 그대로 고를 수 있음
  const isMatchSort = isFridgeOn;

  // [수정 11/24 조현기] 전체 페이지 수 · 다음 페이지가 있는지 (상태가 아니라 total로 매번 계산)
  //   예) total 778, PAGE_SIZE 12 → Math.ceil(778 / 12) = 65 페이지
  //   결과가 0개여도 '1 / 1 페이지'로 보이게 Math.max(1, …)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasNextPage = page < totalPages;

  // [수정 11/24 조현기] 검색 조건을 바꾸는 함수 — 조건을 바꾸면서 1페이지로 돌아감
  //   원래는 '조건이 바뀌면 setPage(1)' 이펙트가 따로 있었음 (린트 오류 + 3페이지에서 조건을 바꾸면
  //   3페이지로 한 번 요청한 뒤 1페이지로 또 요청하는 낭비). 이제 한 번에 처리
  //   쓰는 법: setFilters 대신 changeFilters({...}) 또는 changeFilters((prev) => ({...prev, …}))
  //   (정렬 · 검색어 · 재료 · 칩 · 초기화가 모두 이걸 씀)
  const changeFilters = (updater) => {
    setFilters(updater);
    setPage(1);
  };

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
        if (isFridgeOn) {
          params.append("fridge_first", "true");
        }

        // [수정 11/24 조현기] 원래: 21개(PAGE_SIZE + 1)를 받아서 '21번째가 있으면 다음 페이지 있음'으로 판단
        //   지금: 딱 한 페이지(12개)만 받고, 전체 개수는 응답 헤더로 받음
        //   offset = 건너뛸 개수 (2페이지면 12개 건너뛰고 13번째부터)
        params.append("limit", PAGE_SIZE);
        params.append("offset", (page - 1) * PAGE_SIZE);

        // [병합] api.js로 요청 (실패하면 axios가 오류를 던짐)
        // [수정 11/24 조현기] { data } 대신 response 전체를 받음 → 본문(response.data)과 헤더(response.headers)를 둘 다 씀
        const response = await api.get(`/recipes?${params.toString()}`, {
          signal: controller.signal,
        });

        // 취소되지 않은 최신 요청의 결과만 반영
        if (!controller.signal.aborted) {
          setRecipes(response.data);
          // [수정 11/24 조현기] 전체 개수 = 응답 헤더 X-Total-Count (axios는 헤더 이름을 소문자로 줌, 값은 글자라 Number로)
          //   ?? : 왼쪽 값이 없으면(undefined) 오른쪽 값 → 헤더가 없는 옛 서버면 받은 개수로 대신함
          setTotal(Number(response.headers["x-total-count"] ?? response.data.length));
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
    isFridgeOn,   // [수정 11/24 조현기] isAllIngredientsOn → isFridgeOn (로그아웃하면 자동으로 꺼진 것으로 다시 조회)
    page,
    PAGE_SIZE     // [수정 11/24 조현기] 함수 안에서 쓰는 값이라 목록에 같이 적음 (값은 바뀌지 않음)
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

  // [수정 11/24 조현기] 원래 여기 있던 '로그아웃하면 스위치 OFF' 이펙트는 삭제
  //   위의 isFridgeOn(로그인 && 스위치)이 같은 일을 함 — 로그아웃하면 isFridgeOn이 자동으로 false

  // 냉장고 우선 검색을 켜면 내 냉장고 재료 개수 조회
  useEffect(() => {
    // [수정 11/24 조현기] 꺼져 있을 때 setFridgeIngredientCount(null) 하던 줄 삭제 (린트 오류)
    //   이 값은 '스위치가 켜져 있을 때' 빈 냉장고 안내에만 쓰므로, 꺼져 있으면 비울 필요가 없음
    //   다시 켜면 아래 fetch 함수가 처음에 null로 비우고 새로 받아 옴
    if (!isFridgeOn) {
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
  }, [isFridgeOn]);

  // [수정 11/24 조현기] 원래 여기 있던 '조건이 바뀌면 setPage(1)' 이펙트는 삭제
  //   검색 조건은 changeFilters(위)가, 냉장고 우선 스위치는 스위치 버튼(아래)이 바꿀 때 바로 1페이지로 돌림

  // 검색 조건 · 정렬은 모두 백엔드에서 적용되므로 응답받은 목록을 그대로 사용
  // [수정 11/24 조현기] 화면에서 다시 정렬하던 코드 삭제
  //   예전에는 '일치율 높은 순'을 고르면 화면에서 다시 정렬했는데, 받은 12개 안에서만 섞여서 페이지마다 순서가 어긋났음
  //   이제 일치율 순서는 서버가 전체를 기준으로 정해서 보내므로 받은 순서 그대로 보여 줌
  //   (sortedRecipes라는 이름은 아래 화면 코드가 쓰고 있어서 그대로 둠)
  const sortedRecipes = recipes;

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
    changeFilters((prev) => ({
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
    changeFilters((prev) => ({
      ...prev,
      ingredients: [],
    }));
    setIsIngredientOpen(false);
  };

  // 검색어, 필터, 정렬 기준 초기화
  const handleReset = () => {
    // [수정 11/24 조현기] 두 가지
    //   - sort: "name" → "latest" : "name"은 정렬 목록에 없는 값이라, 초기화하면 드롭다운이 빈칸처럼 보였음
    //   - setFilters → changeFilters : 초기화할 때도 1페이지로
    changeFilters({
      keyword: "",
      ingredients: [],
      r_category_id: null,
      level: null,
      cooking_time: null,
      sort: "latest",
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
    changeFilters((prev) => ({
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
    changeFilters((prev) => ({ ...prev, [key]: prev[key] === value ? null : value }));

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
          changeFilters({
            ...filters,
            keyword: e.target.value,
          })
        }
      />

      {/* 아래: 왼쪽 필터(260px) + 오른쪽 결과 */}
      <div className="grid items-start gap-6 lg:grid-cols-[260px_1fr]">

        {/* ② 왼쪽 필터 */}
        {/* [수정 11/24 조현기] 스크롤을 내려도 필터 카드가 화면 위쪽에 붙어서 따라옴
            - lg:sticky lg:top-6 : 넓은 화면(1024px 이상)에서만, 화면 위에서 24px 지점에 붙음
                                   (좁은 화면은 필터가 결과 위에 쌓이는 한 줄 배치라 따라올 필요 없음)
            - lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto : 필터가 화면보다 길면 카드 안에서만 따로 스크롤
            - sticky는 부모 grid의 items-start(위쪽 정렬)가 있어야 동작함 (이미 있음) */}
        <aside aria-label="필터" className="flex flex-col gap-6 rounded-card bg-surface p-6 shadow-card lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
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
            {/* [수정 11/24 조현기 2차] 재료 필터가 어떻게 걸리는지 안내 (여러 개면 모두 들어간 레시피만) */}
            {filters.ingredients.length > 0 && (
              <p className="text-xs text-muted">고른 재료가 모두 들어간 레시피만 보여요.</p>
            )}
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
              isFridgeOn ? "bg-have-soft" : "bg-surface shadow-card"
            }`}
          >
            <button
              type="button"
              role="switch"
              aria-checked={isFridgeOn}
              aria-label="내 냉장고 재료 우선"
              disabled={!isAuthenticated}
              onClick={() => {
                // [수정 11/24 조현기] 켜고 끌 때도 1페이지로 (원래 이펙트가 하던 일)
                //   !isFridgeOn: 지금 '실제로 켜진 상태'의 반대로 바꿈
                setIsAllIngredientsOn(!isFridgeOn);
                setPage(1);
              }}
              className={`relative h-7 w-12 flex-none rounded-pill transition-colors disabled:opacity-40 ${
                isFridgeOn ? "bg-have" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-surface transition-transform ${
                  isFridgeOn ? "translate-x-5" : ""
                }`}
              />
            </button>
            <span className={`font-bold ${isFridgeOn ? "text-have" : "text-ink"}`}>내 냉장고 재료 우선</span>
            {/* [병합] 켰을 때 안내. woojung 브랜치에서도 아직 검색 조건에 반영 전이라 '준비 중'으로 표시 */}
            {isFridgeOn ? (
              <div className="basis-full flex flex-col gap-0.5 pl-16 text-sm text-have">
                <p>
                  내 냉장고 재료와 50% 이상 일치하는 레시피를
                  일치율 높은 순으로 보여드려요.
                </p>
                <p>
                  일치율이 같으면 내 조리도구로 만들 수 있는 요리를 먼저 보여드려요.
                </p>
                {/* [수정 11/24 조현기] 냉장고 우선 + 재료 필터를 같이 쓸 때 안내 한 줄
                    (이때 서버는 고른 재료가 '모두' 들어간 레시피만, 일치율은 내 냉장고 기준으로 보냄) */}
                {filters.ingredients.length > 0 && (
                  <p>왼쪽에서 고른 재료가 모두 들어간 레시피만 보여드려요.</p>
                )}
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
            {/* [수정 11/24 조현기] '이 페이지 개수' → '전체 개수' (total)
                toLocaleString(): 1000 → "1,000"처럼 쉼표. 원래 붙던 '(이 페이지)' 글자는 뺌 */}
            <p className="text-lg font-black">
              검색 결과 <span className="text-accent">{total.toLocaleString()}개</span>
            </p>
            {/* [수정 11/24 조현기] 정렬 드롭다운
                - isMatchSort(냉장고 우선 ON)면: '일치율 높은 순' 하나만 보이고 잠김(disabled)
                    서버가 이때는 항상 일치율 순으로 보내기 때문 (예전엔 '최신순'으로 보여서 헷갈렸음)
                    filters.sort 값은 그대로 두므로, 스위치를 끄면 원래 고르던 최신순/인기순으로 돌아감
                - 그 밖에는(재료만 골랐을 때 포함): 최신순 · 인기순만 (일치율이 없어서 '일치율 높은 순'은 뺌) */}
            <select
              aria-label="정렬"
              className="h-10 rounded-pill pr-8 text-sm disabled:opacity-60"
              value={isMatchSort ? "match_rate" : filters.sort}
              disabled={isMatchSort}
              onChange={(e) =>
                changeFilters({
                  ...filters,
                  sort: e.target.value,
                })
              }
            >
              {isMatchSort ? (
                <option value="match_rate">일치율 높은 순</option>
              ) : (
                <>
                  <option value="latest">최신순</option>
                  <option value="popular">인기순</option>
                </>
              )}
            </select>
          </div>

          {/* [병합] 불러오는 중 · 오류 (woojung 브랜치) */}
          {loading && <p role="status" className="text-muted">레시피를 불러오는 중...</p>}
          {error && <p role="alert" className="rounded-[16px] bg-miss-soft px-5 py-3 text-miss">{error}</p>}

          {!loading && !error && sortedRecipes.length === 0 && (
            <div className="rounded-card bg-surface p-8 text-center text-muted shadow-card">
              {isFridgeOn && fridgeIngredientCount === 0 ? (
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
            {/* [11/24 조현기] 연출: 카드가 왼쪽부터 차례로 떠오르며 나타남 (메인과 같은 animate-card-in, 정의는 index.css)
                i번째 카드는 i × 50ms 늦게 시작 (12장이면 마지막 카드 0.55초). 페이지를 넘길 때마다 새로 나타남 */}
            {!loading && sortedRecipes.map((recipe, i)=>(
              <div key={recipe.recipe_id} className="animate-card-in" style={{ animationDelay: `${i * 50}ms` }}>
              <RecipeCard
               recipe={recipe}
               showMatch={isFridgeOn} // [수정 11/24 조현기 2차] 일치율 막대는 냉장고 우선일 때만 (재료 필터만으로는 일치율 없음)
              />
              </div>
            ))}
          </div>

          {/* [병합] 페이지 이동 (woojung 브랜치) */}
          {/* [수정 11/24 조현기] 페이지 이동
              - 가운데 '현재 / 전체 페이지' (예: 1 / 65 페이지)
              - '다음'은 마지막 페이지에서 잠김 (hasNextPage = page < totalPages)
              - 넘기면 window.scrollTo({ top: 0 })로 화면 맨 위로 (아래에서 누르면 새 목록 첫 줄이 안 보였음) */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              className="h-10 rounded-pill bg-surface px-5 text-sm font-medium shadow-card hover:bg-gray-50 disabled:opacity-40"
              disabled={page === 1 || loading}
              onClick={() => {
                setPage((prev) => prev - 1);
                window.scrollTo({ top: 0 });
              }}
            >
              ‹ 이전
            </button>
            <span className="text-sm font-bold">{page} / {totalPages} 페이지</span>
            <button
              type="button"
              className="h-10 rounded-pill bg-surface px-5 text-sm font-medium shadow-card hover:bg-gray-50 disabled:opacity-40"
              disabled={loading || !hasNextPage}
              onClick={() => {
                setPage((prev) => prev + 1);
                window.scrollTo({ top: 0 });
              }}
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

            {/* [수정 11/24 조현기] 창 배치를 바꿈 (A안)
                원래: 왼쪽 재료 목록 + 오른쪽 '선택한 재료' 칸이 한 덩어리로 같이 스크롤
                      → 오른쪽 칸이 목록(1,039개) 길이만큼 늘어나서 '찾기' 버튼이 목록 끝까지 밀려 내려갔음
                지금: ① 검색 · 대분류 줄(고정) → ② 재료 칩 목록(여기만 스크롤) → ③ 아래 고정 줄(선택한 재료 + 버튼)
                      → 목록을 아무리 내려도 선택한 재료와 버튼은 창 맨 아래에 늘 보임 (휴대폰 · 넓은 화면 같음)
                검색 · 대분류 · 고르기 · 지우기 · 찾기 동작(함수)은 그대로 */}

            {/* ① 검색 · 대분류 (스크롤해도 위에 고정) */}
            <div className="flex flex-wrap gap-2 px-6 pt-5 pb-3">
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

            {/* ② 재료 칩 목록: 여기만 스크롤 (min-h-0 flex-1: 남는 높이를 다 쓰고, 넘치면 이 안에서만 스크롤) */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
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
              <p className="mt-3 text-xs text-muted">누르면 선택, 다시 누르면 해제</p>
            </div>

            {/* ③ 아래 고정 줄: 선택한 재료 + 버튼 (border-t: 목록과 구분선, bg-gray-50: 연한 바탕) */}
            <div className="flex flex-col gap-3 border-t border-line bg-gray-50 px-6 py-4">
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
              {/* [수정 11/24 조현기] 고른 재료가 많아져도 이 줄이 창을 다 차지하지 않게 최대 높이(max-h-24 = 96px, 약 두 줄),
                  넘치면 이 안에서만 스크롤 → 아래 버튼은 늘 보임 */}
              {tempIngredients.length > 0 && (
                <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto">
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
              )}
              {/* [수정 11/24 조현기] 화살표(→) 삭제, whitespace-nowrap: 숫자가 세 자리가 돼도 버튼 글자가 줄바꿈 · 넘침 없이 한 줄
                  w-full sm:w-auto sm:self-end: 휴대폰은 꽉 찬 버튼, 넓은 화면은 오른쪽에 글자 길이만큼 */}
              <button
                type="button"
                className="h-12 w-full whitespace-nowrap rounded-pill bg-accent px-6 font-bold text-white hover:bg-accent-dark disabled:opacity-40 sm:w-auto sm:self-end"
                onClick={handleIngredientConfirm}
                disabled={tempIngredients.length === 0}
              >
                이 재료로 레시피 찾기 ({tempIngredients.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecipeListPage;
