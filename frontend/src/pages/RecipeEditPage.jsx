// 담당: 오효정 (임시화면입니다~)
// [디자인 11/22 조현기] 시안 F 적용 — 모양만 바꿈, 작성자 확인 로직은 그대로
//   1. 로그인 · 없음 · 본인 아님 · 데이터 없음 안내 문구를 가운데 흰 카드로 (폼 모양은 RecipeForm에서)
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { mockRecipes, mockRecipeDetail } from '../mockData';
import RecipeForm from './RecipeForm';

function RecipeEditPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();

  // API 연결 시 해당 ID의 상세 조회 및 로딩·실패 처리 추가하기
  const recipes = mockRecipes;
  const recipeDetail = mockRecipeDetail;

  const recipe = recipes.find(
    (item) => Number(item.recipe_id) === Number(id)
  );

  // 목록 mock에는 재료·조리 단계가 없어, ID가 같은 상세 mock만 합친다
  const detail =
    Number(recipeDetail.recipe_id) === Number(recipe?.recipe_id)
      ? recipeDetail
      : null;

  // 상세 데이터가 있는 경우 상세 값을 우선 사용
  const recipeData = { ...recipe, ...detail };

  const initialData = {
    ...recipeData,
    main_image_url:
      recipeData.main_image_url ?? recipeData.image_url ?? '',
    tool_ids:
      recipeData.tool_ids ?? (recipeData.tool_id ? [recipeData.tool_id] : []),
  };

  // 수정·이미지 업로드 API는 DB 연결 후 구현
  // 현재 저장 시 RecipeForm에서 구현 예정 알림을 표시

  // 로그인·작성자 확인 및 화면 출력
  // API 연결 후 서버에서도 작성자 권한을 확인해야 함
  if (!isAuthenticated || !user) {
    return <p className="mx-auto mt-8 max-w-lg rounded-card bg-surface p-10 text-center text-muted shadow-card">로그인 후 레시피를 수정할 수 있습니다.</p>;
  }

  if (!recipe) {
    return <p className="mx-auto mt-8 max-w-lg rounded-card bg-surface p-10 text-center text-muted shadow-card">레시피를 찾을 수 없습니다.</p>;
  }

  if (Number(recipe.user_id) !== Number(user.user_id)) {
    return <p className="mx-auto mt-8 max-w-lg rounded-card bg-surface p-10 text-center text-muted shadow-card">본인이 작성한 레시피만 수정할 수 있습니다.</p>;
  }

  // 상세 정보 없이 빈 수정 폼이 열리지 않도록 안내
  if (!detail) {
    return <p className="mx-auto mt-8 max-w-lg rounded-card bg-surface p-10 text-center text-muted shadow-card">이 레시피의 상세 테스트 데이터가 없습니다. DB 연결 후 상세 정보를 불러올 예정입니다.</p>;
  }

  return (
    <RecipeForm key={recipe.recipe_id} initialData={initialData} />
  );
}

export default RecipeEditPage;
