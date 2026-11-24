// 담당: 오효정 (임시화면입니다~)
// [디자인 11/22 조현기] 시안 F 적용 — className(모양)만 바꿈, 입력 · 검사 · 사진 · 단계 이동 로직은 그대로
//   1. recipe-form__* 클래스는 정의된 CSS가 없어서 적용이 안 되고 있었음 → Tailwind 클래스로 바꿈 (is-active 포함)
//   2. 구역(사진·제목 / 시간·인분·난이도 / 종류 / 재료 / 도구 / 만드는 법 / 하단 버튼)마다 흰 둥근 카드, 폭 최대 880px
//   3. 대표 사진 · 단계 사진: 점선 상자를 누르면 파일 선택 (파일 입력칸은 화면에서 숨기고 키보드로는 그대로 선택 가능)
//   4. 난이도 · 종류 · 도구는 알약 버튼(고르면 검정), 추가한 재료는 초록 칩, 재료 검색 결과는 입력칸 아래 떠 있는 목록
//   5. 단계 번호는 포인트색 동그라미, ↑ ↓ × 는 작은 동그라미 버튼 / 오류는 연한 빨간 상자
// [수정 11/24 조현기] 가짜 데이터(mockData) → 실제 API 연결 (원래는 등록을 누르면 'DB 연결 후 제공 예정' 알림만 떴음)
//   1) 재료 검색: mockIngredients(몇 개뿐) → GET /ingredients?keyword= (식재료 1,039개 + 별칭)
//      → '계란'을 쳐도 '달걀'이 나옴 (내 냉장고 재료 추가와 같은 API). 입력하면 아래에 목록이 뜨는 모양은 그대로
//   2) 조리도구: mockStandardTools → GET /fridge/tools/standard (DB의 조리도구 12개)
//      DB(recipes.tool_id)에는 레시피당 도구가 하나만 저장돼서, 고르는 것도 하나만 (다시 누르면 해제)
//   3) 사진: FileReader로 만든 긴 글자(data:…)는 DB 칸(500자)에 안 들어감
//      → 고르는 즉시 서버에 올리고(api.js uploadImage → POST /images) 돌려받은 진짜 주소를 씀
//   4) 등록 · 수정: POST /recipes (새 레시피) · PATCH /recipes/{id} (수정) → 성공하면 그 레시피 상세 화면으로
//   입력칸 모양 · 검사 규칙 · 단계 이동은 원래 그대로

import { useState, useEffect } from 'react';   // [수정 11/24 조현기] useEffect: 재료 검색 · 도구 목록 받기
import { useNavigate } from 'react-router-dom';   // [수정 11/24 조현기] 저장 후 레시피 상세로 이동
import Swal from 'sweetalert2';                    // [수정 11/24 조현기] 저장 완료 알림
import api, { uploadImage } from '../api';         // [수정 11/24 조현기] 서버 요청 · 사진 올리기
import {
  RECIPE_CATEGORIES,
  RECIPE_LEVELS,
  RECIPE_TITLE_MAX,
  RECIPE_INTRO_MAX,
  COOKING_TIME_DEFAULT,
  IMAGE_TYPES,
  IMAGE_MAX_MB,
} from '../constants';

// [수정 11/24 조현기] mockIngredients · mockStandardTools import 삭제 (아래에서 API로 받음)

// [수정 11/24 조현기] 재료 검색: 입력을 멈추고 이 시간(ms)이 지나면 서버에 물어봄
//   글자 하나 칠 때마다 요청하지 않으려고 (내 냉장고 재료 검색과 같은 0.25초)
const SEARCH_DELAY_MS = 250;

function RecipeForm({ initialData = null }) {

  // 수정할 레시피는 부모 페이지(RecipeEditPage)에서 서버로 조회하여 initialData로 전달
  // [수정 11/24 조현기] initialData가 있으면 '수정', 없으면 '새 레시피'
  const navigate = useNavigate();

  // [수정 11/24 조현기] 조리도구 목록: 원래 mockStandardTools → 서버에서 받음 (처음 한 번)
  const [standardTools, setStandardTools] = useState([]);
  useEffect(() => {
    const controller = new AbortController();
    api.get('/fridge/tools/standard', { signal: controller.signal })
      .then(({ data }) => setStandardTools(data))
      .catch(() => {});   // 실패하면 도구 칸이 비어 보임 (저장할 때 '도구를 골라 주세요' 안내가 뜸)
    return () => controller.abort();
  }, []);

  // [수정 11/24 조현기] 사진 올리는 중이면 true → 그동안 등록 버튼 잠금 · '사진 올리는 중' 표시
  const [isUploading, setIsUploading] = useState(false);
  // [수정 11/24 조현기] 저장(등록 · 수정) 요청 중이면 true → 두 번 눌러 두 번 저장되는 것 막기
  const [isSaving, setIsSaving] = useState(false);

  // 입력 상태·검증·미리보기는 DB와 관계없이 사용
  const [form, setForm] = useState(() => ({
    recipe_title: initialData?.recipe_title ?? '',
    intro: initialData?.intro ?? '',
    r_category_id: initialData?.r_category_id ?? '',
    level: initialData?.level ?? RECIPE_LEVELS[0],
    cooking_time:
      initialData?.cooking_time ?? COOKING_TIME_DEFAULT,

    servings: initialData?.servings ?? 1,
    main_image_url: initialData?.main_image_url ?? '',
    main_image_file: null,

    tool_ids: initialData?.tool_ids?.map(Number) ?? [],

    ingredients: initialData?.ingredients?.length
      ? initialData.ingredients.map((item) => ({ ...item }))
      : [],

    steps: initialData?.steps?.length
      ? initialData.steps.map((step) => ({ ...step }))
      : [{ step_content: '' }],
  }));

  const [error, setError] = useState('');

  // 재료 검색 관련 상태
  const [ingredientKeyword, setIngredientKeyword] = useState('');
  const [ingredientAmount, setIngredientAmount] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  // 도구 더보기
  const [showAllTools, setShowAllTools] = useState(false);

  const keyword = ingredientKeyword.trim();

  // 검색어에 맞는 재료 목록
  // [수정 11/24 조현기] 원래: mockIngredients에서 이름에 검색어가 들어간 것만 (별칭 검색 없음 → '계란'은 0개)
  //   지금: GET /ingredients?keyword=검색어 (이름 + 별칭, 정확히 같은 이름이 맨 위)
  //   - 입력을 멈추고 0.25초 뒤에 요청 (setTimeout), 그 전에 또 입력하면 이전 요청은 취소
  //   - 재료를 이미 골랐으면(selectedIngredient) 검색하지 않음 (입력칸에 고른 이름이 채워져 있어서)
  //   - 검색어가 비면 요청하지 않고, 아래 화면도 목록을 그리지 않음
  const [ingredientResults, setIngredientResults] = useState([]);
  const [isSearchingIngredient, setIsSearchingIngredient] = useState(false);
  useEffect(() => {
    if (!keyword || selectedIngredient) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setIsSearchingIngredient(true);
      api.get('/ingredients', { params: { keyword }, signal: controller.signal })
        .then(({ data }) => setIngredientResults(data))
        .catch((err) => { if (err.code !== 'ERR_CANCELED') setIngredientResults([]); })
        .finally(() => { if (!controller.signal.aborted) setIsSearchingIngredient(false); });
    }, SEARCH_DELAY_MS);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [keyword, selectedIngredient]);

  // 일반 필드 변경
  const update = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setError('');
  };

  // 재료 추가
  const addIngredient = (ingredient, amount = ingredientAmount) => {
    if (!ingredient) return;

    if (!amount.trim()) {
      setError('재료의 분량을 입력해 주세요.');
      return;
    }

    setForm((prev) => {
      const exists = prev.ingredients.some(
        (item) =>
          Number(item.ing_id) === Number(ingredient.ing_id)
      );

      if (exists) return prev;

      return {
        ...prev,
        ingredients: [
          ...prev.ingredients,
          {
            ing_id: ingredient.ing_id,
            ing_name: ingredient.ing_name,
            amount_text: amount.trim(),
          },
        ],
      };
    });

    setIngredientKeyword('');
    setIngredientAmount('');
    setSelectedIngredient(null);
    setError('');
  };

  // 선택한 재료의 분량 수정
  const updateIngredient = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((item, i) =>
        i === index
          ? { ...item, [field]: value }
          : item
      ),
    }));

    setError('');
  };

  // 조리 단계 내용 수정
  const updateStep = (index, value) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.map((step, i) =>
        i === index
          ? { ...step, step_content: value }
          : step
      ),
    }));

    setError('');
  };

  // 조리 단계 순서 변경
  const moveStep = (index, direction) => {
    setForm((prev) => {
      const nextIndex = index + direction;

      if (
        nextIndex < 0 ||
        nextIndex >= prev.steps.length
      ) {
        return prev;
      }

      const steps = [...prev.steps];

      [steps[index], steps[nextIndex]] = [
        steps[nextIndex],
        steps[index],
      ];

      return {
        ...prev,
        steps,
      };
    });
  };

  // 이미지 검증 및 미리보기
  // [수정 11/24 조현기] 검사는 그대로, 그다음이 바뀜
  //   원래: FileReader로 사진을 긴 글자(data:image/jpeg;base64,…)로 바꿔서 미리보기 → 이 글자를 DB에 저장할 수 없었음
  //   지금: 서버에 올리고(uploadImage) 돌려받은 진짜 주소로 미리보기 · 저장 (callback(주소, 파일))
  //   async: 올리는 동안 기다려야 해서. 올리는 중에는 isUploading = true
  const readImage = async (file, callback) => {
    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      setError('JPG, PNG, WEBP 사진만 선택할 수 있습니다.');
      return;
    }

    if (file.size > IMAGE_MAX_MB * 1024 * 1024) {
      setError(`사진은 ${IMAGE_MAX_MB}MB 이하로 선택하세요.`);
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      callback(url, file);
      setError('');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : '사진을 올리지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsUploading(false);
    }
  };

  // 단계별 이미지 변경
  const updateStepImage = (index, file) => {
    readImage(file, (url, imageFile) => {
      setForm((prev) => ({
        ...prev,
        steps: prev.steps.map((step, i) =>
          i === index
            ? {
                ...step,
                step_image_file: imageFile,
                step_image_url: url,
              }
            : step
        ),
      }));
    });
  };

  // 대표 사진 변경
  const updateMainImage = (file) => {
    readImage(file, (url, imageFile) => {
      setForm((prev) => ({
        ...prev,
        main_image_file: imageFile,
        main_image_url: url,
      }));
    });
  };

  // 입력 검증 후 등록 · 수정
  // [수정 11/24 조현기] 원래: 검사만 하고 'DB 연결 후 제공될 예정입니다' 알림 → 지금: 실제로 서버에 저장
  const submit = async (event) => {
    event.preventDefault();
    if (isSaving || isUploading) return;   // [수정 11/24 조현기] 저장 중 · 사진 올리는 중에는 무시

    const invalid =
      !form.recipe_title.trim() ||
      !form.r_category_id ||
      !form.main_image_url ||
      form.tool_ids.length === 0 ||
      form.ingredients.length === 0 ||
      !Number.isInteger(Number(form.cooking_time)) ||
      Number(form.cooking_time) < 1 ||
      !Number.isInteger(Number(form.servings)) ||
      Number(form.servings) < 1 ||
      form.ingredients.some(
        (item) =>
          !item.ing_id ||
          !item.amount_text.trim()
      ) ||
      form.steps.some(
        (step) => !step.step_content.trim()
      );

    if (invalid) {
      setError(
        '대표 사진·제목·종류·재료(분량)·도구·만드는 법 등 필수 항목을 확인해 주세요.'
      );
      return;
    }

    setError('');

    // [수정 11/24 조현기] 서버(RecipeCreate · RecipeUpdate)가 받는 모양으로 정리
    //   - 이름은 DB 컬럼 그대로 (recipe_title, intro, image_url, servings, tool_id, level, cooking_time, r_category_id)
    //   - 숫자 칸은 Number(): 입력칸 값은 글자("15")라서 숫자(15)로
    //   - intro가 비었으면 null (빈 글자는 저장하지 않음 — 와이어프레임 '빈 글자(null) 저장 안 함')
    //   - tool_id: 고른 도구 하나 (DB에 하나만 저장)
    //   - steps: 화면 순서대로 step_no 1, 2, 3 … 을 새로 매김 (↑ ↓로 순서를 바꿨어도 맞게)
    const payload = {
      recipe_title: form.recipe_title.trim(),
      intro: form.intro.trim() || null,
      image_url: form.main_image_url,
      servings: Number(form.servings),
      tool_id: form.tool_ids.length ? Number(form.tool_ids[0]) : null,
      level: form.level,
      cooking_time: Number(form.cooking_time),
      r_category_id: Number(form.r_category_id),
      ingredients: form.ingredients.map((item) => ({
        ing_id: Number(item.ing_id),
        amount_text: item.amount_text.trim(),
      })),
      steps: form.steps.map((step, index) => ({
        step_no: index + 1,
        step_content: step.step_content.trim(),
        step_image_url: step.step_image_url || null,
      })),
    };

    // [수정 11/24 조현기] 수정이면 PATCH /recipes/{id}, 새 레시피면 POST /recipes
    //   성공하면 서버가 저장된 레시피 상세(RecipeDetail)를 돌려줌 → 알림 후 그 레시피 상세 화면으로
    //   실패하면 서버가 준 문장(예: '본인 레시피만 수정할 수 있습니다.')을 빨간 상자에
    setIsSaving(true);
    try {
      const { data } = initialData
        ? await api.patch(`/recipes/${initialData.recipe_id}`, payload)
        : await api.post('/recipes', payload);
      await Swal.fire(initialData ? '레시피를 수정했어요' : '레시피를 등록했어요', '', 'success');
      navigate(`/recipes/${data.recipe_id}`);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : `레시피 ${initialData ? '수정' : '등록'}에 실패했습니다. 입력한 값을 다시 확인해 주세요.`);
    } finally {
      setIsSaving(false);
    }
  };

  // 표시할 도구 목록
  const visibleTools = showAllTools
    ? standardTools
    : standardTools.slice(0, 5); //도구 목록을 처음에는 5개만 보여줌

  return (
    <form className="mx-auto flex max-w-[880px] flex-col gap-6" onSubmit={submit}>

      {/* ===== 제목 ===== */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-3xl font-black">{initialData ? '레시피 수정' : '레시피 쓰기'}</h2>
        <span className="text-sm text-muted">* 필수, 빈 칸으로 저장 불가</span>
      </div>

      {/* ===== 1. 대표 사진 / 제목 / 소개 ===== */}
      <div className="rounded-card bg-surface p-6 shadow-card md:p-8 grid gap-6 md:grid-cols-[240px_1fr]">
        <label className="relative flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-[20px] border-2 border-dashed border-gray-300 bg-gray-50 text-muted hover:border-accent focus-within:ring-2 focus-within:ring-accent">
          {form.main_image_url ? (
            <img src={form.main_image_url} alt="대표 사진 미리보기" className="h-full w-full object-cover" />
          ) : (
            <span className="font-bold">+ 대표 사진 *</span>
          )}
          <input type="file" accept={IMAGE_TYPES.join(',')} className="sr-only"
            onChange={(e) => {
              updateMainImage(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>
        <div className="flex flex-col gap-2">
          <label htmlFor="recipe-title" className="text-sm font-bold">제목 *</label>
          <input id="recipe-title" placeholder="요리 이름 입력" value={form.recipe_title}
            maxLength={RECIPE_TITLE_MAX} className="h-12 text-lg"
            onChange={(e) => update('recipe_title', e.target.value)}
            required
          />
          <label htmlFor="recipe-intro" className="mt-3 text-sm text-muted">
            + 한 줄 소개 (선택)
          </label>
          <input id="recipe-intro" placeholder="이 요리를 소개해 주세요" value={form.intro} maxLength={RECIPE_INTRO_MAX} className="h-12"
            onChange={(e) => update('intro', e.target.value)}
          />
        </div>
      </div>

      {/* ===== 2. 조리 시간 / 인분 / 난이도 ===== */}
      <div className="rounded-card bg-surface p-6 shadow-card md:p-8 grid gap-6 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="recipe-time" className="text-sm font-bold">조리 시간 *</label>
          <div className="flex items-center gap-2">
            <input id="recipe-time" type="number" min="1" step="1" value={form.cooking_time} className="h-11 w-24"
              onChange={(e) => update('cooking_time', e.target.value)}
              required
            />
            <span className="text-muted">분</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="recipe-servings" className="text-sm font-bold">인분</label>
          <div className="flex items-center gap-2">
            <button type="button" className="h-11 w-11 rounded-full bg-gray-100 text-lg font-bold hover:bg-gray-200" onClick={() => update('servings', Math.max(1, Number(form.servings) - 1))}>
              −
            </button>
            <input id="recipe-servings" type="number" min="1" step="1" value={form.servings} className="h-11 w-16 text-center"
              onChange={(e) => update('servings', e.target.value)}
            />
            <button type="button" className="h-11 w-11 rounded-full bg-gray-100 text-lg font-bold hover:bg-gray-200" onClick={() => update('servings', Number(form.servings || 0) + 1)}>
              +
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold">난이도</span>
          <div className="flex flex-wrap gap-2">
            {RECIPE_LEVELS.map((level) => (
              <button key={level} type="button"
                className={`inline-flex items-center h-10 px-4 rounded-pill text-sm font-medium ${
                  form.level === level ? 'bg-ink text-white font-bold' : 'bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => update('level', level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== 3. 요리 종류 ===== */}
      <div className="rounded-card bg-surface p-6 shadow-card md:p-8 flex flex-col gap-3">
        <span className="text-sm font-bold"> 요리 종류 *</span>
        <div className="flex flex-wrap gap-2">

          {RECIPE_CATEGORIES.map((category) => (
            <button key={category.r_category_id} type="button"
              className={`inline-flex items-center h-10 px-4 rounded-pill text-sm font-medium ${
                String(form.r_category_id) ===
                String(category.r_category_id)
                  ? 'bg-ink text-white font-bold'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              onClick={() => update('r_category_id', category.r_category_id)}
            >
              {category.category_name}
            </button>
          ))}
        </div>
      </div>

      {/* ===== 4. 재료 ===== */}
      <section className="rounded-card bg-surface p-6 shadow-card md:p-8 flex flex-col gap-4">
        <h3 className="text-xl font-black">재료 *</h3>
        <div className="flex flex-wrap items-start gap-2">
          <div className="relative min-w-[200px] flex-1">
            <input id="ingredient-search" type="search" placeholder="재료 검색" aria-label="재료 검색" className="h-11 w-full" value={ingredientKeyword}
              onChange={(e) => {
                setIngredientKeyword(e.target.value);
                setSelectedIngredient(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
            />

            {/* 검색 결과 */}
            {/* [수정 11/24 조현기] 재료를 고른 뒤에는 목록을 닫음 (!selectedIngredient). 받는 중이면 '검색 중...' */}
            {keyword && !selectedIngredient && (
              <div className="absolute inset-x-0 top-full z-10 mt-1 flex max-h-64 flex-col overflow-y-auto rounded-[16px] bg-surface py-2 shadow-card ring-1 ring-line">

                {isSearchingIngredient && ingredientResults.length === 0 ? (
                  <p className="px-4 py-2 text-sm text-muted">검색 중...</p>
                ) : ingredientResults.length ? (
                  ingredientResults.map((ingredient) => {

                    const selected = form.ingredients.some(
                      (item) =>
                        Number(item.ing_id) ===
                        Number(ingredient.ing_id)
                    );

                    return (
                      <button key={ingredient.ing_id} type="button" disabled={selected} className="px-4 py-2 text-left hover:bg-gray-50 disabled:text-muted"
                        onClick={() => {
                          setSelectedIngredient(ingredient);
                          setIngredientKeyword(ingredient.ing_name);
                        }}
                      >
                        {ingredient.ing_name}
                        {selected ? ' (추가됨)' : ''}
                      </button>
                    );
                  })
                ) : (
                  <p className="px-4 py-2 text-sm text-muted">검색된 재료가 없습니다.</p>
                )}
              </div>
            )}
          </div>
          <input aria-label="재료 분량" placeholder="분량 (예: 1모, 약간)" className="h-11 w-44" value={ingredientAmount}
            onChange={(e) => setIngredientAmount(e.target.value)}
          />
          <button type="button" className="h-11 rounded-pill bg-ink px-5 text-sm font-bold text-white hover:bg-gray-800" onClick={() => addIngredient(selectedIngredient)}
          >
            추가
          </button>
        </div>

        {/* 추가된 재료 태그 */}
        <div className="flex flex-wrap gap-2">

          {form.ingredients.map((item, index) => (
            <div className="inline-flex items-center gap-2 rounded-pill bg-have-soft py-1 pl-4 pr-1" key={item.ing_id}>
              <span className="font-bold text-have">
                {/* [수정 11/24 조현기] mock 목록에서 이름을 찾던 부분 삭제: 추가할 때 · 수정 화면에서 받을 때 이름이 같이 들어 있음 */}
                {item.ing_name ?? '재료'}
              </span>
              <input aria-label="선택한 재료 분량 수정" className="h-8 w-24 rounded-pill border-0 px-3 text-sm" value={item.amount_text}
                onChange={(e) => updateIngredient(index, 'amount_text', e.target.value)}
              />
              <button type="button" aria-label="재료 삭제" className="h-8 w-8 rounded-full text-have hover:bg-surface"
                onClick={() => update('ingredients', form.ingredients.filter((_, i) => i !== index))}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 5. 조리 도구 ===== */}
      <section className="rounded-card bg-surface p-6 shadow-card md:p-8 flex flex-col gap-4">
        {/* [수정 11/24 조현기] DB에 레시피당 도구 하나만 저장돼서 하나만 고르게 (여러 개를 골라도 첫 번째만 저장됐음) */}
        <h3 className="text-xl font-black">필요한 도구 * <span className="text-sm font-normal text-muted">(하나 선택)</span></h3>
        <div className="flex flex-wrap gap-2">

          {visibleTools.map((tool) => (
            <button key={tool.tool_id} type="button" className={`inline-flex items-center h-10 px-4 rounded-pill text-sm font-medium ${
              form.tool_ids.map(Number).includes(Number(tool.tool_id)) ? 'bg-ink text-white font-bold' : 'bg-gray-100 hover:bg-gray-200'}`}
              onClick={() => {
                const selected = form.tool_ids.map(Number).includes(Number(tool.tool_id));

                // [수정 11/24 조현기] 하나만: 고른 도구를 다시 누르면 해제([]), 다른 도구를 누르면 그것만([id])
                //   (원래는 여러 개를 쌓았음. tool_ids를 배열로 둔 건 다른 코드를 덜 바꾸려고 그대로)
                const updated = selected ? [] : [Number(tool.tool_id)];

                update('tool_ids', updated);
              }}
            >
              {tool.tool_name}
            </button>
          ))}

          {standardTools.length > 5 && (
            <button type="button" className="inline-flex items-center h-10 px-4 rounded-pill text-sm font-medium border border-dashed border-gray-300 text-muted hover:text-accent"
              onClick={() => setShowAllTools((prev) => !prev)}
            >
              {showAllTools ? '접기' : '+ 더보기'}
            </button>
          )}
        </div>
      </section>

      {/* ===== 6. 만드는 법 ===== */}
      <section className="rounded-card bg-surface p-6 shadow-card md:p-8 flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-black">만드는 법 *</h3>
          <button type="button" className="h-10 rounded-pill bg-gray-100 px-4 text-sm font-bold hover:bg-gray-200"
            onClick={() => update('steps', [...form.steps, { step_content: '' },])}>
            + 단계 추가
          </button>
        </div>

        {form.steps.map((step, index) => (
          <div className="flex flex-wrap items-start gap-3 sm:flex-nowrap" key={index}>
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-accent font-bold text-white">{index + 1}</span>

            <textarea
              aria-label={`${index + 1}단계 조리 설명`} placeholder="조리 과정을 입력해 주세요" className="min-h-24 min-w-0 flex-1 basis-60" value={step.step_content}
              onChange={(e) => updateStep(index, e.target.value)} required />

            {/* 단계별 사진 */}
            <label className="relative flex h-24 w-28 flex-none cursor-pointer items-center justify-center overflow-hidden rounded-[16px] border-2 border-dashed border-gray-300 bg-gray-50 text-sm text-muted hover:border-accent focus-within:ring-2 focus-within:ring-accent">

              {step.step_image_url ? (
                <img src={step.step_image_url} alt={`${index + 1}단계 사진`} className="h-full w-full object-cover"/>
              ) : (
                <span>+ 사진</span>
              )}
              <input type="file" accept={IMAGE_TYPES.join(',')} className="sr-only"
                onChange={(e) => {
                  updateStepImage(index, e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>

            {/* 순서 변경 및 삭제 */}
            <div className="flex flex-none gap-1 sm:flex-col">
              <button type="button" aria-label="위로 이동" className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30" disabled={index === 0}
                onClick={() => moveStep(index, -1)}>
                ↑
              </button>
              <button type="button" aria-label="아래로 이동" className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30" disabled={index === form.steps.length - 1}
                onClick={() => moveStep(index, 1)}>
                ↓
              </button>
              <button type="button" aria-label="단계 삭제" className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30" disabled={form.steps.length === 1}
                onClick={() => update('steps', form.steps.filter((_, i) => i !== index))}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* ===== 오류 메시지 ===== */}
      {error && (
        <p className="rounded-[16px] bg-miss-soft px-5 py-3 text-miss" role="alert">
          {error}
        </p>
      )}

      {/* ===== 하단 버튼 ===== */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-surface px-6 py-4 shadow-card">
        <span className="text-sm text-muted">필수: 사진 · 제목 · 종류 · 재료(분량) · 도구 · 만드는 법</span>
        <div className="flex gap-2">
          <button type="button" className="h-12 rounded-pill bg-gray-100 px-6 font-medium hover:bg-gray-200" onClick={() => window.history.back()}>
            취소
          </button>
          {/* [수정 11/24 조현기] 사진 올리는 중 · 저장 중에는 잠그고 글자도 바꿈 */}
          <button type="submit" disabled={isUploading || isSaving} className="h-12 rounded-pill bg-accent px-6 font-bold text-white hover:bg-accent-dark disabled:opacity-40">
            {isUploading ? '사진 올리는 중...' : isSaving ? '저장 중...' : initialData ? '레시피 수정' : '레시피 등록'}
          </button>
        </div>
      </div>
    </form>
  );
}

export default RecipeForm;
