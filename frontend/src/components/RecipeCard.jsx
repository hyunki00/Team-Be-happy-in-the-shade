// 담당: 권우정
// [디자인 11/22 조현기] 시안 F 적용 — 모양만 바꿈, 받는 값(recipe · showMatch)과 보여 주는 내용은 그대로
//   1. 인라인 style(폭 220px) → 흰 둥근 카드. 폭은 카드를 놓는 쪽(목록 · 메인 · 냉장고)의 칸에 맞춤
//   2. 사진을 카드 위에 꽉 차게 (4:3), 사진 주소가 없으면 빈 자리 색을 보여 줌
//   3. 조리 시간 · 난이도 · 작성자를 한 줄로, 일치율은 막대 + 숫자, 부족한 재료는 연한 빨간 칩으로
//   4. 마우스를 올렸을 때 움직임은 위치(transform)만 바뀌게 (빠른 스크롤 때 글자가 카드 밖으로 튀어 보이는 문제 줄임)
// [11/24 조현기] 사진 로딩 속도: 큰 원본 대신 썸네일(가로 480px WebP, 장당 수십 KB)을 먼저 받음
//   - thumbUrl: 썸네일 주소 규칙 (api.js). 썸네일 파일이 없으면 onError에서 원본으로 자동 교체(fallbackToOriginal)
//   - loading="lazy": 화면에 보이기 직전에 받음 (아래쪽 카드는 스크롤할 때) · decoding="async": 그리는 동안 화면이 멈추지 않게
//   받는 값 · 보여 주는 내용 · 모양은 그대로
// [11/24 조현기] 연출: 일치율 막대가 0%에서 실제 값까지 차오름 (animate-bar-fill, 정의는 index.css)
import { Link } from "react-router-dom";
import { thumbUrl, fallbackToOriginal } from "../api";

//recipe : 부모 컴포넌트(RecipeListPage.jsx)가 전달하는 레시피 한 개
//showMatch=false : 일치율 표시 여부의 기본값
function RecipeCard({recipe, showMatch=false}) {

  return (
    <Link
      to={`/recipes/${recipe.recipe_id}`}
      className="group block h-full overflow-hidden rounded-card bg-surface shadow-card transition-transform duration-150 hover:-translate-y-0.5"
    >
      {recipe.image_url ? (
        <img
          src={thumbUrl(recipe.recipe_id, recipe.image_url)}
          onError={(e) => fallbackToOriginal(e, recipe.image_url)}
          loading="lazy"
          decoding="async"
          alt={recipe.recipe_title}
          className="aspect-[4/3] w-full object-cover bg-photo"
        />
      ) : (
        <div className="aspect-[4/3] w-full bg-photo" aria-hidden="true" />
      )}

      <div className="flex flex-col gap-2 p-5">
        <h3 className="text-lg font-bold leading-snug group-hover:text-accent">{recipe.recipe_title}</h3>
        <p className="text-sm text-muted">
          조리 시간 {recipe.cooking_time}분 · 난이도 {recipe.level} · {recipe.nickname}
        </p>
        {/* 내 조리도구로 만들 수 있는 레시피 표시 */}
        {recipe.can_cook_with_my_tools === true && (
          <span className="self-start rounded-pill bg-have-soft px-3 py-1 text-xs font-bold text-have">
            ✓ 내 도구로 가능
          </span>
        )}
        {showMatch && (
          <div className="mt-1 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-pill bg-gray-100">
              {/* [11/24 조현기] animate-bar-fill: 0.9초 동안 차오름 · origin-left: 왼쪽 끝을 기준으로 늘어나게 */}
              <div
                className="h-full origin-left rounded-pill bg-have animate-bar-fill"
                style={{ width: `${Math.round(recipe.match_rate * 100)}%` }}
              />
            </div>
            <span className="text-sm font-bold text-have">
              재료 일치율 {Math.round(recipe.match_rate * 100)}%
            </span>
          </div>
        )}
        {showMatch && (
          <p
            className={`self-start rounded-pill px-3 py-1 text-xs font-bold ${
              recipe.missing_ingredients.length === 0 ? "bg-have-soft text-have" : "bg-miss-soft text-miss"
            }`}
          >
            {recipe.missing_ingredients.length === 0
              ? "부족한 재료 없음"
              : `부족한 재료 : ${recipe.missing_ingredients
                .map((ingredient) => ingredient.ing_name)
                .join(", ")}`
              }
          </p>
        )}
      </div>
    </Link>
  );
}

export default RecipeCard;
