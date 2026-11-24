// 담당: 정호진 — 실제 로그인 사용자의 냉장고 API 연결
// [디자인 11/22 조현기] 시안 F 적용 — className(모양)만 바꿈, API · 상태 로직은 그대로
//   1. 맨 바깥 <main> → <div>: App.jsx 공통 레이아웃에 이미 <main>이 있어서 (한 화면에 main은 하나)
//   2. 식재료 · 조리도구 탭: 알약 버튼, 고른 탭은 검정
//   3. 재료 추가 · 추천 · 조리도구: 흰 둥근 카드, 버튼은 둥근 모양 (주요 버튼은 포인트색)
//   4. 오류 문구: 연한 빨간 상자
// [레이아웃 11/22 조현기] 스크롤이 길어서 와이어프레임 p.10처럼 정리 — API · 상태 로직은 그대로
//   1. 제목 줄 오른쪽에 '+ 재료 추가', 탭 · 내 재료 찾기 · '소비기한 임박순'을 한 줄로
//   2. 식재료 탭: 왼쪽 재료 카드(작게, 한 줄 5개, 한 페이지 최대 15개) + 오른쪽 '지금 만들 수 있는 요리' 칸(340px, 스크롤해도 따라옴)
//      - 추천은 RecipeCard 대신 작은 줄 목록(사진 · 이름 · 일치율 · 부족 재료), 누르면 레시피 상세 → RecipeCard import 대신 Link
//      - 추천 확인 버튼 동작은 그대로 (getRecommendations)
//   3. 재료 수정 · 등록 칸은 재료 목록 위에 표시
//   4. 오른쪽 칸 안 스크롤에서 글자와 상자가 어긋나 보이는 문제 → 칸 안 스크롤 · 따라오기(sticky) 없앰
//      추천 요리는 페이지당 최대 5개씩 표시
// [수정 11/24 조현기] 재료 추가: 검색어를 입력하면 입력칸 바로 아래에 결과 목록이 자동으로 펼쳐짐
//   원래는 검색 후 따로 있는 '식재료를 선택하세요' 드롭다운(<select>)을 한 번 더 눌러 열어야 했음
//   목록 모양은 레시피 쓰기(RecipeForm)의 재료 검색 목록과 같게 (흰 바탕 · 둥근 모서리 · 그림자 · 위아래 스크롤)
//   검색 API(/ingredients?keyword=)와 고른 뒤 등록 칸(IngredientForm)이 뜨는 흐름은 그대로
// [11/24 조현기] 오른쪽 '지금 만들 수 있는 요리' 작은 사진도 썸네일로 (원본 대신, 없으면 원본으로)
import { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import api, { thumbUrl, fallbackToOriginal } from "../api";   // [11/24 조현기] thumbUrl · fallbackToOriginal: 추천 목록 작은 사진도 썸네일로
import IngredientCard from "../components/IngredientCard";
import IngredientForm from "../components/IngredientForm";
import { Link } from "react-router-dom";

function errorMessage(err) {
  const detail = err.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return "입력한 수량·단위·날짜를 확인해 주세요.";
  return "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.";
}

const INGREDIENT_PAGE_SIZE = 15;
const RECIPE_PAGE_SIZE = 5;

function Pagination({ label, page, totalPages, onChange, disabled = false }) {
  return (
    <nav aria-label={label} className="flex items-center justify-center gap-3">
      <button type="button" disabled={disabled || page === 1} onClick={() => onChange(page - 1)} className="h-10 rounded-pill bg-surface px-4 text-sm font-bold shadow-card disabled:opacity-40">이전</button>
      <span role="status" className="text-sm font-bold">{page} / {totalPages} 페이지</span>
      <button type="button" disabled={disabled || page === totalPages} onClick={() => onChange(page + 1)} className="h-10 rounded-pill bg-surface px-4 text-sm font-bold shadow-card disabled:opacity-40">다음</button>
    </nav>
  );
}

function FridgePage() {
  const [ingredients, setIngredients] = useState([]);
  const [tools, setTools] = useState([]);
  const [standardTools, setStandardTools] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [tab, setTab] = useState("ingredients");
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [catalog, setCatalog] = useState([]);
  const [catalogError, setCatalogError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);
  const [selectedTool, setSelectedTool] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [recommendMessage, setRecommendMessage] = useState("");
  const [isRecommending, setIsRecommending] = useState(false);
  const [ingredientPage, setIngredientPage] = useState(1);
  const [recipePage, setRecipePage] = useState(1);
  const meatCategory = categories.find((item) => item.category_name === "육류")?.ing_category_id;

  useEffect(() => {
    const controller = new AbortController();
    const config = { signal: controller.signal };
    Promise.all([
      api.get("/fridge/ingredients", config), api.get("/fridge/tools", config),
      api.get("/fridge/tools/standard", config), api.get("/ingredients/categories", config),
    ]).then(([fridge, mine, standard, groups]) => {
      setIngredients(fridge.data); setTools(mine.data);
      setStandardTools(standard.data); setCategories(groups.data);
      setLoadError("");
    }).catch((err) => {
      if (err.code !== "ERR_CANCELED") setLoadError(errorMessage(err));
    }).finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [reload]);

  useEffect(() => {
    if (!isAdding) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setIsSearching(true);
      api.get("/ingredients", { params: { keyword: search.trim() }, signal: controller.signal })
        .then(({ data }) => { setCatalog(data); setCatalogError(""); })
        .catch((err) => { if (err.code !== "ERR_CANCELED") setCatalogError(errorMessage(err)); })
        .finally(() => { if (!controller.signal.aborted) setIsSearching(false); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [isAdding, search]);

  async function mutate(action) {
    if (saving.current) return;
    saving.current = true; setIsSaving(true); setError("");
    try { await action(); }
    catch (err) { setError(errorMessage(err)); }
    finally { saving.current = false; setIsSaving(false); }
  }

  async function saveIngredient(data) {
    await mutate(async () => {
      if (isAdding) {
        const response = await api.post("/fridge/ingredients", { ...data, ing_id: selected.ing_id });
        setIngredients((items) => [...items, response.data]);
      } else {
        const response = await api.patch(`/fridge/ingredients/${selected.user_ing_id}`, data);
        setIngredients((items) => items.map((item) => item.user_ing_id === selected.user_ing_id ? response.data : item));
      }
      setSelected(null); setIsAdding(false); setRecipes([]); setRecommendMessage("");
    });
  }

  async function deleteIngredient(item) {
    const result = await Swal.fire({ title: `${item.ing_name}을(를) 삭제할까요?`, icon: "question", showCancelButton: true, confirmButtonText: "삭제", cancelButtonText: "취소" });
    if (!result.isConfirmed) return;
    await mutate(async () => {
      await api.delete(`/fridge/ingredients/${item.user_ing_id}`);
      setIngredients((items) => items.filter((value) => value.user_ing_id !== item.user_ing_id));
      if (selected?.user_ing_id === item.user_ing_id) setSelected(null);
      setRecipes([]); setRecommendMessage("");
    });
  }

  async function addTool(e) {
    e.preventDefault();
    if (!selectedTool) return;
    await mutate(async () => {
      const { data } = await api.post("/fridge/tools", { tool_id: Number(selectedTool) });
      setTools((items) => [...items, data]); setSelectedTool("");
    });
  }

  async function deleteTool(tool) {
    const result = await Swal.fire({ title: `${tool.tool_name}을(를) 삭제할까요?`, icon: "question", showCancelButton: true, confirmButtonText: "삭제", cancelButtonText: "취소" });
    if (!result.isConfirmed) return;
    await mutate(async () => {
      await api.delete(`/fridge/tools/${tool.tool_id}`);
      setTools((items) => items.filter((value) => value.tool_id !== tool.tool_id));
    });
  }

  async function getRecommendations() {
    setIsRecommending(true); setRecommendMessage("");
    try {
      const { data } = await api.get("/fridge/recommendations");
      setRecipes(data);
      setRecipePage(1);
      if (!data.length) setRecommendMessage("현재 재료로 추천할 요리가 없습니다.");
    } catch (err) { setRecipes([]); setRecommendMessage(errorMessage(err)); }
    finally { setIsRecommending(false); }
  }

  const filtered = ingredients.filter((item) => item.ing_name.includes(keyword.trim())).sort((a, b) =>
    (a.expiration_date || "9999-12-31").localeCompare(b.expiration_date || "9999-12-31") || a.user_ing_id - b.user_ing_id);
  const ingredientPages = Math.max(1, Math.ceil(filtered.length / INGREDIENT_PAGE_SIZE));
  const currentIngredientPage = Math.min(ingredientPage, ingredientPages);
  const visibleIngredients = filtered.slice((currentIngredientPage - 1) * INGREDIENT_PAGE_SIZE, currentIngredientPage * INGREDIENT_PAGE_SIZE);
  const recipePages = Math.max(1, Math.ceil(recipes.length / RECIPE_PAGE_SIZE));
  const currentRecipePage = Math.min(recipePage, recipePages);
  const visibleRecipes = recipes.slice((currentRecipePage - 1) * RECIPE_PAGE_SIZE, currentRecipePage * RECIPE_PAGE_SIZE);
  const availableTools = standardTools.filter((tool) => !tools.some((mine) => mine.tool_id === tool.tool_id));

  const tabClass = (isOn) =>
    `inline-flex items-center h-11 px-5 rounded-pill text-[15px] font-bold ${
      isOn ? "bg-ink text-white" : "bg-surface text-ink shadow-card hover:bg-gray-50"
    }`;
  const mainButton = "inline-flex items-center justify-center h-11 px-5 rounded-pill bg-accent text-white text-[15px] font-bold hover:bg-accent-dark disabled:opacity-40";
  const subButton = "inline-flex items-center justify-center h-11 px-5 rounded-pill bg-gray-100 text-ink text-[15px] font-medium hover:bg-gray-200 disabled:opacity-40";
  const cardClass = "rounded-card bg-surface p-6 shadow-card";

  return (
    <div className="flex flex-col gap-5">
      {/* 제목 줄: 왼쪽 제목 · 오른쪽 재료 담기 */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">내 냉장고</h1>
          <p className="mt-1 text-muted">내 재료와 조리도구를 관리하세요.</p>
        </div>
        {!isLoading && !loadError && tab === "ingredients" && (
          <button disabled={isSaving} onClick={() => { setIsAdding(true); setSelected(null); setSearch(""); setError(""); }} className={mainButton}>+ 재료 추가</button>
        )}
      </div>
      {isLoading ? <p role="status" className={`${cardClass} text-muted`}>냉장고 불러오는 중...</p> : loadError ? (
        <div role="alert" className="rounded-card bg-miss-soft p-6 text-miss"><p>{loadError}</p><button className={`${subButton} mt-3 bg-surface`} onClick={() => { setIsLoading(true); setReload((n) => n + 1); }}>다시 불러오기</button></div>
      ) : <>
        {/* 탭 + 내 재료 찾기 + 정렬 안내를 한 줄로 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-2" role="group" aria-label="냉장고 메뉴">
            <button aria-pressed={tab === "ingredients"} onClick={() => { setTab("ingredients"); setError(""); }} className={tabClass(tab === "ingredients")}>식재료 {ingredients.length}</button>
            <button aria-pressed={tab === "tools"} onClick={() => { setTab("tools"); setError(""); }} className={tabClass(tab === "tools")}>조리도구 {tools.length}</button>
          </div>
          {tab === "ingredients" && <>
            <input aria-label="내 재료 찾기" value={keyword} onChange={(e) => { setKeyword(e.target.value); setIngredientPage(1); }} placeholder="내 재료 찾기" className="h-11 min-w-0 flex-1 sm:ml-2 sm:flex-none sm:w-60 rounded-pill px-5" />
            <span className="ml-auto text-sm text-muted">소비기한 임박순</span>
          </>}
        </div>
        {error && <p role="alert" className="rounded-[20px] bg-miss-soft px-5 py-3 text-miss">{error}</p>}
        {tab === "ingredients" ? (
          // 왼쪽: 재료 (넓게) / 오른쪽: 지금 만들 수 있는 요리 (와이어프레임 p.10)
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
            <div className="flex min-w-0 flex-col gap-4">
              {isAdding && <section className={cardClass}>
                <h2 className="text-lg font-bold">추가할 식재료 선택</h2>
                {/* [수정 11/24 조현기] relative: 아래 결과 목록(absolute)을 이 입력칸 바로 밑에 붙이려고 */}
                <div className="relative mt-3">
                  <input aria-label="식재료 이름 검색" value={search} onChange={(e) => { setSearch(e.target.value); setSelected(null); }} placeholder="이름 또는 별칭 검색 (예: 계란)" className="h-11 rounded-pill px-5 w-full" disabled={isSaving} />
                  {/* [수정 11/24 조현기] 검색 결과 목록 (원래 <select> 대신)
                      - 검색어가 있고, 아직 재료를 고르지 않았을 때만 자동으로 펼쳐짐
                      - 하나를 누르면: 그 재료를 고르고(setSelected) 입력칸에 이름을 채움 → 목록은 닫히고 아래에 등록 칸이 뜸
                      - 입력칸 글자를 다시 바꾸면 고른 것이 풀리고(setSelected(null)) 목록이 다시 펼쳐짐
                      - absolute top-full: 입력칸 바로 아래에 겹쳐 뜸 (아래 내용을 밀지 않음), z-10: 다른 것보다 위
                      - max-h-64 overflow-y-auto: 결과가 많으면 목록 안에서 스크롤 */}
                  {search.trim() && !selected && (
                    <div role="listbox" aria-label="검색한 식재료" className="absolute inset-x-0 top-full z-10 mt-1 flex max-h-64 flex-col overflow-y-auto rounded-[16px] bg-surface py-2 shadow-card ring-1 ring-line">
                      {isSearching && catalog.length === 0 ? (
                        <p role="status" className="px-4 py-2 text-sm text-muted">식재료 검색 중...</p>
                      ) : catalog.length ? (
                        catalog.map((item) => (
                          <button key={item.ing_id} type="button" role="option" aria-selected="false" className="px-4 py-2 text-left hover:bg-gray-50"
                            onClick={() => { setSelected(item); setSearch(item.ing_name); }}>
                            {item.ing_name}
                          </button>
                        ))
                      ) : (
                        <p className="px-4 py-2 text-sm text-muted">검색된 식재료가 없습니다.</p>
                      )}
                    </div>
                  )}
                </div>
                {/* [수정 11/24 조현기] 검색어가 비어 있을 때 안내 (원래는 빈 드롭다운이 있었음) */}
                {!search.trim() && <p className="mt-2 text-sm text-muted">재료 이름이나 별칭을 입력하면 아래에 목록이 떠요.</p>}
                {catalogError && <p role="alert" className="mt-2 text-sm text-miss">{catalogError}</p>}
                <button disabled={isSaving} onClick={() => { setIsAdding(false); setSelected(null); }} className="mt-3 text-sm text-muted underline hover:text-accent">추가 닫기</button>
              </section>}
              {/* 수정 · 등록 칸: 재료 목록 위에서 바로 확인 */}
              {selected && <section>
                <IngredientForm key={`${isAdding}-${selected.user_ing_id || selected.ing_id}`} mode={isAdding ? "create" : "edit"} initialValue={selected} isMeat={selected.ing_category_id === meatCategory} isSaving={isSaving} onSubmit={saveIngredient} onClose={() => { setSelected(null); setIsAdding(false); }} />
                {!isAdding && <button disabled={isSaving} onClick={() => deleteIngredient(selected)} className="mt-3 inline-flex items-center h-11 px-5 rounded-pill bg-miss-soft text-miss text-[15px] font-bold disabled:opacity-40">재료 삭제</button>}
              </section>}
              <div className="overflow-x-auto pb-1">
                <fieldset aria-label="보유 중인 재료" disabled={isSaving} className="grid min-w-[540px] grid-cols-5 gap-3">
                  {visibleIngredients.map((item) => <IngredientCard key={item.user_ing_id} item={item} onClick={() => { setSelected(item); setIsAdding(false); setError(""); }} onDeleteClick={() => deleteIngredient(item)} />)}
                </fieldset>
              </div>
              {filtered.length > 0 && <Pagination label="보유 재료 페이지" page={currentIngredientPage} totalPages={ingredientPages} onChange={setIngredientPage} disabled={isSaving} />}
              {filtered.length === 0 && <p className={`${cardClass} text-muted`}>{keyword ? "검색한 재료가 없습니다." : "아직 등록한 재료가 없습니다. 재료를 추가해 주세요."}</p>}
              <p className="text-sm text-muted">기한이 지난 재료는 확인 후 삭제할 수 있습니다. 카드를 누르면 위에서 수정해요.</p>
            </div>

            {/* 오른쪽 칸: 추천 요리를 5개씩 페이지로 표시 */}
            <aside aria-labelledby="fridge-recommend-title" className="flex flex-col gap-3 rounded-card bg-have-soft p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 id="fridge-recommend-title" className="text-lg font-black text-have">
                  지금 만들 수 있는 요리{recipes.length > 0 && ` ${recipes.length}`}
                </h2>
                {/* [수정 11/24 조현기] 글자 넘침: 아주 좁은 화면(320px)에서 '추천 확인'이 두 줄로 쪼개지던 것 → whitespace-nowrap flex-none */}
                <button disabled={isRecommending || isSaving} onClick={getRecommendations} className="h-9 flex-none whitespace-nowrap rounded-pill bg-have px-4 text-sm font-bold text-white disabled:opacity-40">{isRecommending ? "확인 중..." : recipes.length ? "다시 확인" : "추천 확인"}</button>
              </div>
              <p className="text-xs text-have">내 냉장고 재료 50% 이상 일치</p>
              {recommendMessage && <p role="status" className="text-sm text-ink-soft">{recommendMessage}</p>}
              {recipes.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {visibleRecipes.map((recipe) => (
                    <li key={recipe.recipe_id}>
                      <Link to={`/recipes/${recipe.recipe_id}`} className="flex items-center gap-3 rounded-[18px] bg-surface p-2.5 hover:ring-2 hover:ring-have">
                        {recipe.image_url
                          ? <img src={thumbUrl(recipe.recipe_id, recipe.image_url)} onError={(e) => fallbackToOriginal(e, recipe.image_url)} loading="lazy" alt="" className="h-14 w-14 flex-none rounded-[12px] object-cover bg-photo" />
                          : <div className="h-14 w-14 flex-none rounded-[12px] bg-photo" aria-hidden="true" />}
                        <div className="min-w-0">
                          <p className="truncate font-bold">{recipe.recipe_title}</p>
                          <p className={`truncate text-xs font-bold ${recipe.missing_ingredients.length ? "text-miss" : "text-have"}`}>
                            일치율 {Math.round(recipe.match_rate * 100)}% · {recipe.missing_ingredients.length
                              ? `부족: ${recipe.missing_ingredients.map((ingredient) => ingredient.ing_name).join(", ")}`
                              : "다 있어요"}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {recipes.length > 0 && <Pagination label="추천 요리 페이지" page={currentRecipePage} totalPages={recipePages} onChange={setRecipePage} disabled={isRecommending} />}
              {!recipes.length && !recommendMessage && <p className="text-sm text-ink-soft">‘추천 확인’을 누르면 지금 재료로 만들 수 있는 요리를 보여 드려요.</p>}
            </aside>
          </div>
        ) : <section className={cardClass}>
          <h2 className="text-xl font-black">내 조리도구</h2>
          <form onSubmit={addTool} className="flex flex-wrap gap-2 my-4">
            <select aria-label="추가할 조리도구" value={selectedTool} onChange={(e) => setSelectedTool(e.target.value)} disabled={isSaving} className="h-11 rounded-pill px-5">
              <option value="">{availableTools.length ? "조리도구 선택" : "모든 조리도구를 등록했습니다."}</option>
              {availableTools.map((tool) => <option key={tool.tool_id} value={tool.tool_id}>{tool.tool_name}</option>)}
            </select>
            <button disabled={!selectedTool || isSaving} className={mainButton}>도구 추가</button>
          </form>
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">{tools.map((tool) => <li key={tool.user_tool_id} className="rounded-[20px] bg-gray-50 px-5 py-4 flex items-center justify-between gap-3">{/* [수정 11/24 조현기] 글자 넘침: 도구 이름이 길면 '삭제'가 '삭/제'로 쪼개지던 것 → 이름은 min-w-0 truncate(넘치면 …), '삭제'는 whitespace-nowrap flex-none */}<span className="min-w-0 truncate font-bold">{tool.tool_name}</span><button aria-label={`${tool.tool_name} 삭제`} disabled={isSaving} onClick={() => deleteTool(tool)} className="flex-none whitespace-nowrap text-sm text-muted underline hover:text-miss">삭제</button></li>)}</ul>
          {!tools.length && <p className="text-muted">등록한 조리도구가 없습니다.</p>}
        </section>}
      </>}
    </div>
  );
}
export default FridgePage;
