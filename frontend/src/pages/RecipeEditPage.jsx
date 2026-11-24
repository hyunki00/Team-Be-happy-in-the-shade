// 담당: 오효정 (임시화면입니다~)
// [디자인 11/22 조현기] 시안 F 적용 — 모양만 바꿈, 작성자 확인 로직은 그대로
//   1. 로그인 · 없음 · 본인 아님 · 데이터 없음 안내 문구를 가운데 흰 카드로 (폼 모양은 RecipeForm에서)
// [수정 11/24 조현기] 가짜 데이터(mockRecipes · mockRecipeDetail) → 실제 레시피 상세 API로
//   원래는 mock에 있는 레시피 하나만 열렸고, 나머지는 '상세 테스트 데이터가 없습니다'가 떴음
//   흐름
//     1. 주소의 id로 GET /recipes/{id} (레시피 상세: 재료 · 조리 단계 · is_mine 포함)
//     2. 받는 동안 '불러오는 중', 없으면(404) '레시피를 찾을 수 없습니다', 그 밖의 실패는 안내
//     3. 내 레시피가 아니면(is_mine false) '본인이 작성한 레시피만 수정할 수 있습니다'
//        (서버도 PATCH할 때 다시 확인해서 남의 레시피면 403)
//     4. 받은 값을 RecipeForm이 쓰는 모양(initialData)으로 바꿔서 넘김 → 저장은 RecipeForm이 PATCH /recipes/{id}
//   안내 문구 · 모양은 원래 그대로
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';   // [수정 11/24 조현기] mockData 대신 공통 api
import RecipeForm from './RecipeForm';

const boxClass = "mx-auto mt-8 max-w-lg rounded-card bg-surface p-10 text-center text-muted shadow-card";

function RecipeEditPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();

  // [수정 11/24 조현기] 서버에서 받은 레시피 상세와 불러오기 상태
  //   loaded = { id, recipe, error } : 어느 레시피 번호를 받아 왔는지 같이 기억
  //   지금 주소의 id와 다르면 '아직 불러오는 중' (이펙트에서 setLoading(true)를 하지 않으려고 — 린트 규칙)
  //   error: '' = 성공, 'notfound' = 404, 'failed' = 그 밖의 실패
  const [loaded, setLoaded] = useState({ id: null, recipe: null, error: '' });
  const isLoading = loaded.id !== id;

  useEffect(() => {
    if (!isAuthenticated) return;   // 로그인 안 했으면 아래에서 로그인 안내만 (요청 안 함)
    const controller = new AbortController();
    api.get(`/recipes/${id}`, { signal: controller.signal })
      .then(({ data }) => setLoaded({ id, recipe: data, error: '' }))
      .catch((err) => {
        if (err.code === 'ERR_CANCELED') return;
        setLoaded({ id, recipe: null, error: err.response?.status === 404 ? 'notfound' : 'failed' });
      });
    return () => controller.abort();
  }, [id, isAuthenticated]);

  // 로그인·작성자 확인 및 화면 출력
  if (!isAuthenticated || !user) {
    return <p className={boxClass}>로그인 후 레시피를 수정할 수 있습니다.</p>;
  }

  if (isLoading) {
    return <p role="status" className={boxClass}>레시피를 불러오는 중...</p>;
  }

  if (loaded.error === 'notfound') {
    return <p className={boxClass}>레시피를 찾을 수 없습니다.</p>;
  }

  if (loaded.error) {
    return <p role="alert" className={boxClass}>레시피를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>;
  }

  const recipe = loaded.recipe;

  // is_mine: 서버가 '로그인한 사람이 쓴 레시피인지' 계산해서 줌
  if (!recipe.is_mine) {
    return <p className={boxClass}>본인이 작성한 레시피만 수정할 수 있습니다.</p>;
  }

  // [수정 11/24 조현기] 서버 상세 → RecipeForm이 쓰는 이름으로
  //   - main_image_url: 폼은 대표 사진을 main_image_url로 씀 (서버 이름은 image_url)
  //   - tool_ids: 폼은 도구를 배열로 씀 (서버는 tool_id 하나, 없으면 빈 배열)
  //   - ingredients: [{ ing_id, ing_name, amount_text }] 그대로 (재료 칩에 이름이 보임)
  //   - steps: 내용 · 사진만 (step_no는 저장할 때 화면 순서대로 새로 매김)
  const initialData = {
    ...recipe,
    main_image_url: recipe.image_url ?? '',
    tool_ids: recipe.tool_id ? [recipe.tool_id] : [],
    ingredients: recipe.ingredients.map((item) => ({
      ing_id: item.ing_id,
      ing_name: item.ing_name,
      amount_text: item.amount_text ?? '',
    })),
    steps: recipe.steps.map((step) => ({
      step_content: step.step_content,
      step_image_url: step.step_image_url,
    })),
  };

  return (
    <RecipeForm key={recipe.recipe_id} initialData={initialData} />
  );
}

export default RecipeEditPage;
