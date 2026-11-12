// 담당: 오효정 (임시화면입니다~)

import { useAuth } from '../contexts/AuthContext';
import RecipeForm from './RecipeForm';

function RecipeCreatePage() {
  const { user, isAuthenticated } = useAuth();

  // ① 이 페이지에서 직접 조회할 데이터는 없음
  // 재료·도구 목록은 RecipeForm에서 관리

  // ② 레시피 등록·이미지 업로드 API는 DB 연결 후 구현
  // 현재 저장 시 RecipeForm에서 구현 예정 알림을 표시

  // ③ 로그인 확인 및 화면 출력

  if (!isAuthenticated || !user) {
    return <p>로그인 후 레시피를 작성할 수 있습니다.</p>;
  }

  return (
    <section>
      <RecipeForm />
    </section>
  );
}

export default RecipeCreatePage;
