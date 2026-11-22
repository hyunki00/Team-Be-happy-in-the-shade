// 담당: 정호진 — 실제 로그인 사용자의 냉장고 API 연결
// [디자인 11/22 조현기] 시안 F 적용 — className(모양)만 바꿈, API · 상태 로직은 그대로
//   1. 맨 바깥 <main> → <div>: App.jsx 공통 레이아웃에 이미 <main>이 있어서 (한 화면에 main은 하나)
//   2. 식재료 · 조리도구 탭: 알약 버튼, 고른 탭은 검정
//   3. 재료 추가 · 추천 · 조리도구: 흰 둥근 카드, 버튼은 둥근 모양 (주요 버튼은 포인트색)
//   4. 오류 문구: 연한 빨간 상자
import { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import api from "../api";
import IngredientCard from "../components/IngredientCard";
import IngredientForm from "../components/IngredientForm";
import RecipeCard from "../components/RecipeCard";

function errorMessage(err) {
  const detail = err.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return "입력한 수량·단위·날짜를 확인해 주세요.";
  return "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.";
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
      if (!data.length) setRecommendMessage("현재 재료로 추천할 요리가 없습니다.");
    } catch (err) { setRecipes([]); setRecommendMessage(errorMessage(err)); }
    finally { setIsRecommending(false); }
  }

  const filtered = ingredients.filter((item) => item.ing_name.includes(keyword.trim())).sort((a, b) =>
    (a.expiration_date || "9999-12-31").localeCompare(b.expiration_date || "9999-12-31") || a.user_ing_id - b.user_ing_id);
  const availableTools = standardTools.filter((tool) => !tools.some((mine) => mine.tool_id === tool.tool_id));

  const tabClass = (isOn) =>
    `inline-flex items-center h-11 px-5 rounded-pill text-[15px] font-bold ${
      isOn ? "bg-ink text-white" : "bg-surface text-ink shadow-card hover:bg-gray-50"
    }`;
  const mainButton = "inline-flex items-center justify-center h-11 px-5 rounded-pill bg-accent text-white text-[15px] font-bold hover:bg-accent-dark disabled:opacity-40";
  const subButton = "inline-flex items-center justify-center h-11 px-5 rounded-pill bg-gray-100 text-ink text-[15px] font-medium hover:bg-gray-200 disabled:opacity-40";
  const cardClass = "rounded-card bg-surface p-6 shadow-card";

  return (
    <div className="flex flex-col">
      <h1 className="text-3xl font-black">내 냉장고</h1>
      <p className="mt-2 text-muted">내 재료와 조리도구를 관리하세요.</p>
      {isLoading ? <p role="status" className={`${cardClass} mt-6 text-muted`}>냉장고 불러오는 중...</p> : loadError ? (
        <div role="alert" className="mt-6 rounded-card bg-miss-soft p-6 text-miss"><p>{loadError}</p><button className={`${subButton} mt-3 bg-surface`} onClick={() => { setIsLoading(true); setReload((n) => n + 1); }}>다시 불러오기</button></div>
      ) : <>
        <div className="flex gap-2 my-6" role="group" aria-label="냉장고 메뉴">
          <button aria-pressed={tab === "ingredients"} onClick={() => { setTab("ingredients"); setError(""); }} className={tabClass(tab === "ingredients")}>식재료 {ingredients.length}</button>
          <button aria-pressed={tab === "tools"} onClick={() => { setTab("tools"); setError(""); }} className={tabClass(tab === "tools")}>조리도구 {tools.length}</button>
        </div>
        {error && <p role="alert" className="mb-4 rounded-[20px] bg-miss-soft px-5 py-3 text-miss">{error}</p>}
        {tab === "ingredients" ? <>
          <div className="flex gap-2 flex-wrap">
            <input aria-label="내 재료 찾기" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="내 재료 찾기" className="h-11 min-w-0 flex-1 sm:flex-none sm:w-72 rounded-pill px-5" />
            <button disabled={isSaving} onClick={() => { setIsAdding(true); setSelected(null); setSearch(""); setError(""); }} className={mainButton}>재료 추가</button>
          </div>
          {isAdding && <section className={`${cardClass} mt-4`}>
            <h2 className="text-lg font-bold">추가할 식재료 선택</h2>
            <input aria-label="식재료 이름 검색" value={search} onChange={(e) => { setSearch(e.target.value); setSelected(null); }} placeholder="이름 또는 별칭 검색 (예: 계란)" className="h-11 rounded-pill px-5 mt-3 w-full" disabled={isSaving} />
            {isSearching && <p role="status" className="mt-2 text-sm text-muted">식재료 검색 중...</p>}
            {catalogError && <p role="alert" className="mt-2 text-sm text-miss">{catalogError}</p>}
            <select aria-label="추가할 식재료" value={selected?.ing_id || ""} disabled={isSaving || isSearching} onChange={(e) => setSelected(catalog.find((item) => item.ing_id === Number(e.target.value)) || null)} className="h-11 rounded-pill px-5 mt-2 w-full">
              <option value="">식재료를 선택하세요 ({catalog.length}개)</option>
              {catalog.map((item) => <option key={item.ing_id} value={item.ing_id}>{item.ing_name}</option>)}
            </select>
            <button disabled={isSaving} onClick={() => { setIsAdding(false); setSelected(null); }} className="mt-3 text-sm text-muted underline hover:text-accent">추가 닫기</button>
          </section>}
          {selected && <section className="my-4">
            <IngredientForm key={`${isAdding}-${selected.user_ing_id || selected.ing_id}`} mode={isAdding ? "create" : "edit"} initialValue={selected} isMeat={selected.ing_category_id === meatCategory} isSaving={isSaving} onSubmit={saveIngredient} onClose={() => { setSelected(null); setIsAdding(false); }} />
            {!isAdding && <button disabled={isSaving} onClick={() => deleteIngredient(selected)} className="mt-3 inline-flex items-center h-11 px-5 rounded-pill bg-miss-soft text-miss text-[15px] font-bold disabled:opacity-40">재료 삭제</button>}
          </section>}
          <p className="mt-6 text-sm text-muted">소비기한 임박순 · 기한이 지난 재료는 확인 후 삭제할 수 있습니다.</p>
          <fieldset disabled={isSaving} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
            {filtered.map((item) => <IngredientCard key={item.user_ing_id} item={item} onClick={() => { setSelected(item); setIsAdding(false); setError(""); }} onDeleteClick={() => deleteIngredient(item)} />)}
          </fieldset>
          {filtered.length === 0 && <p className={`${cardClass} mt-4 text-muted`}>{keyword ? "검색한 재료가 없습니다." : "아직 등록한 재료가 없습니다. 재료를 추가해 주세요."}</p>}
          <section className={`${cardClass} mt-10`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black">내 재료로 요리 추천</h2>
              <button disabled={isRecommending || isSaving} onClick={getRecommendations} className={mainButton}>{isRecommending ? "추천 확인 중..." : "추천 확인"}</button>
            </div>
            {recommendMessage && <p role="status" className="mt-3 text-muted">{recommendMessage}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">{recipes.map((recipe) => <RecipeCard key={recipe.recipe_id} recipe={recipe} showMatch />)}</div>
          </section>
        </> : <section className={cardClass}>
          <h2 className="text-xl font-black">내 조리도구</h2>
          <form onSubmit={addTool} className="flex flex-wrap gap-2 my-4">
            <select aria-label="추가할 조리도구" value={selectedTool} onChange={(e) => setSelectedTool(e.target.value)} disabled={isSaving} className="h-11 rounded-pill px-5">
              <option value="">{availableTools.length ? "조리도구 선택" : "모든 조리도구를 등록했습니다."}</option>
              {availableTools.map((tool) => <option key={tool.tool_id} value={tool.tool_id}>{tool.tool_name}</option>)}
            </select>
            <button disabled={!selectedTool || isSaving} className={mainButton}>도구 추가</button>
          </form>
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">{tools.map((tool) => <li key={tool.user_tool_id} className="rounded-[20px] bg-gray-50 px-5 py-4 flex items-center justify-between gap-3"><span className="font-bold">{tool.tool_name}</span><button aria-label={`${tool.tool_name} 삭제`} disabled={isSaving} onClick={() => deleteTool(tool)} className="text-sm text-muted underline hover:text-miss">삭제</button></li>)}</ul>
          {!tools.length && <p className="text-muted">등록한 조리도구가 없습니다.</p>}
        </section>}
      </>}
    </div>
  );
}
export default FridgePage;
