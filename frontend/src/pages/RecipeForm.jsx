// 담당: 오효정 (임시화면입니다~)
// [디자인 11/22 조현기] 시안 F 적용 — className(모양)만 바꿈, 입력 · 검사 · 사진 · 단계 이동 로직은 그대로
//   1. recipe-form__* 클래스는 정의된 CSS가 없어서 적용이 안 되고 있었음 → Tailwind 클래스로 바꿈 (is-active 포함)
//   2. 구역(사진·제목 / 시간·인분·난이도 / 종류 / 재료 / 도구 / 만드는 법 / 하단 버튼)마다 흰 둥근 카드, 폭 최대 880px
//   3. 대표 사진 · 단계 사진: 점선 상자를 누르면 파일 선택 (파일 입력칸은 화면에서 숨기고 키보드로는 그대로 선택 가능)
//   4. 난이도 · 종류 · 도구는 알약 버튼(고르면 검정), 추가한 재료는 초록 칩, 재료 검색 결과는 입력칸 아래 떠 있는 목록
//   5. 단계 번호는 포인트색 동그라미, ↑ ↓ × 는 작은 동그라미 버튼 / 오류는 연한 빨간 상자

import { useState } from 'react';
import {
  RECIPE_CATEGORIES,
  RECIPE_LEVELS,
  RECIPE_TITLE_MAX,
  RECIPE_INTRO_MAX,
  COOKING_TIME_DEFAULT,
  IMAGE_TYPES,
  IMAGE_MAX_MB,
} from '../constants';

import {
  mockIngredients,
  mockStandardTools,
} from '../mockData';




function RecipeForm({ initialData = null }) {

  // 데이터: API 연결 시 재료·도구 목록으로 교체
  // 수정할 레시피는 부모 페이지에서 조회하여 initialData로 전달
  const ingredients = mockIngredients;
  const standardTools = mockStandardTools;

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

  const keyword = ingredientKeyword.trim().toLowerCase();

  // 검색어에 맞는 재료 목록
  const ingredientResults = keyword
    ? ingredients.filter((ingredient) =>
        ingredient.ing_name.toLowerCase().includes(keyword)
      ) : [];

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
  const readImage = (file, callback) => {
    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      setError('JPG, PNG, WEBP 사진만 선택할 수 있습니다.');
      return;
    }

    if (file.size > IMAGE_MAX_MB * 1024 * 1024) {
      setError(`사진은 ${IMAGE_MAX_MB}MB 이하로 선택하세요.`);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      callback(reader.result, file);
      setError('');
    };

    reader.onerror = () => {
      setError('사진을 읽지 못했습니다.');
    };

    reader.readAsDataURL(file);
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

  // DB연결 후: 입력 검증 후 실제 등록·수정은 API 연결 시 구현
  const submit = (event) => {
    event.preventDefault();

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
    // DB연결 후 이미지 업로드, 전송 데이터 정리, 등록·수정 API 요청 및 성공·실패 처리
    window.alert(`레시피 ${initialData ? '수정' : '등록'} 기능은 DB 연결 후 제공될 예정입니다.`);
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
            {keyword && (
              <div className="absolute inset-x-0 top-full z-10 mt-1 flex max-h-64 flex-col overflow-y-auto rounded-[16px] bg-surface py-2 shadow-card ring-1 ring-line">

                {ingredientResults.length ? (
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
                {item.ing_name ??
                  ingredients.find(
                    (ingredient) =>
                      Number(ingredient.ing_id) ===
                      Number(item.ing_id)
                  )?.ing_name ??
                  '재료'}
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
        <h3 className="text-xl font-black">필요한 도구 *</h3>
        <div className="flex flex-wrap gap-2">

          {visibleTools.map((tool) => (
            <button key={tool.tool_id} type="button" className={`inline-flex items-center h-10 px-4 rounded-pill text-sm font-medium ${
              form.tool_ids.map(Number).includes(Number(tool.tool_id)) ? 'bg-ink text-white font-bold' : 'bg-gray-100 hover:bg-gray-200'}`}
              onClick={() => {
                const selected = form.tool_ids.map(Number).includes(Number(tool.tool_id));

                const updated = selected
                  ? form.tool_ids.filter(
                      (id) =>
                        Number(id) !== Number(tool.tool_id)
                    )
                  : [...form.tool_ids, Number(tool.tool_id),];

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
          <button type="submit" className="h-12 rounded-pill bg-accent px-6 font-bold text-white hover:bg-accent-dark">
            {initialData ? '레시피 수정' : '레시피 등록'}
          </button>
        </div>
      </div>
    </form>
  );
}

export default RecipeForm;
