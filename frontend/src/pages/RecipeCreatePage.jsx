// 담당: 오효정 (임시화면입니다~)
// [디자인 11/22 조현기] 시안 F 적용 — 모양만 바꿈, 로그인 확인 로직은 그대로
//   1. 로그인 안내 문구를 가운데 흰 카드로 (폼 모양은 RecipeForm에서)

import { useAuth } from '../contexts/AuthContext';
import RecipeForm from './RecipeForm';

function RecipeCreatePage() {
  const { user, isAuthenticated } = useAuth();

  // ① 이 페이지에서 직접 조회할 데이터는 없음
  // 재료·도구 목록은 RecipeForm에서 관리

  // ② 레시피 등록·이미지 업로드
  // [수정 11/24 조현기] 이제 RecipeForm이 실제로 저장함 (사진은 POST /images, 레시피는 POST /recipes)
  //   원래는 여기 적힌 대로 '구현 예정' 알림만 떴음. 이 파일은 바뀐 것 없음 (주석만)

  // ③ 로그인 확인 및 화면 출력

  if (!isAuthenticated || !user) {
    return <p className="mx-auto mt-8 max-w-lg rounded-card bg-surface p-10 text-center text-muted shadow-card">로그인 후 레시피를 작성할 수 있습니다.</p>;
  }

  return (
    <section>
      <RecipeForm />
    </section>
  );
}

export default RecipeCreatePage;
