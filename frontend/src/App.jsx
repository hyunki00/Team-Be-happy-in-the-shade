// 담당: 조현기
// 라우터 설정 + 모든 페이지에 공통으로 들어가는 레이아웃
import { createBrowserRouter, RouterProvider, Outlet, Link } from "react-router-dom";   // [11/24 조현기] Link: 하단 메뉴
import { AuthProvider } from "./contexts/AuthContext";
import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import MyPage from "./pages/MyPage";
import FridgePage from "./pages/FridgePage";
import RecipeListPage from "./pages/RecipeListPage";
import RecipeRecommendPage from "./pages/RecipeRecommendPage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import RecipeCreatePage from "./pages/RecipeCreatePage";
import RecipeEditPage from "./pages/RecipeEditPage";
import BoardListPage from "./pages/BoardListPage";
import BoardDetailPage from "./pages/BoardDetailPage";
import BoardFormPage from "./pages/BoardFormPage";
import NotFoundPage from "./pages/NotFoundPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";// 효정: resetpasswordpage추가

// [11/24 조현기] 모든 페이지 맨 아래 공통 하단(푸터)
//   쇼핑몰 하단처럼 '어떤 사이트인지 · 누가 만들었는지 · 데이터 출처 · 저작권'을 한곳에 모음
//   우리는 회사가 아니라 팀 프로젝트라서 사업자 번호 · 고객센터 같은 칸은 넣지 않음 (없는 정보를 지어내지 않기)
//   - 왼쪽 : 로고 · 한 줄 소개 · 프로젝트 기간
//   - 가운데: 바로가기 (위 메뉴와 같은 주소)
//   - 오른쪽: 만든 사람 (CLAUDE.md '파일 · 경로 · 담당' 기준 역할)
//   - 맨 아래 줄: 레시피 데이터 출처(식약처 조리식품 레시피 DB) · GitHub · 저작권
//   RootLayout에 한 번 넣었으니 각 페이지는 고칠 것 없음
const FOOTER_LINKS = [
  { to: "/fridge", label: "내 냉장고" },
  { to: "/recipes", label: "레시피 검색" },
  { to: "/recipes/new", label: "레시피 쓰기" },
  { to: "/board", label: "커뮤니티" },
];
const TEAM = [
  { name: "조현기", role: "팀장 · 메인 · 공통 화면 · 레시피 댓글" },
  { name: "권우정", role: "레시피 검색 · 추천 · 상세" },
  { name: "정호진", role: "내 냉장고 · 조리도구" },
  { name: "오효정", role: "회원 · 마이페이지 · 레시피 쓰기" },
  { name: "임유빈", role: "커뮤니티 · DB" },
];

function Footer() {
  return (
    // mt-auto: 내용이 짧은 페이지에서도 하단이 화면 맨 아래에 붙게 (바깥 div가 flex flex-col)
    <footer className="mt-auto border-t border-line bg-surface text-sm text-muted">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.3fr_0.7fr_1.2fr] md:px-6">
        {/* 왼쪽: 로고 · 소개 · 기간 */}
        <div className="flex flex-col gap-3">
          <img src="/logo.png" alt="뭐먹" className="h-12 w-auto self-start" />
          <p className="leading-relaxed text-ink-soft">
            냉장고 속 재료로 오늘 뭐 해 먹을지 찾아 주는<br />
            자취생 · 1인 가구를 위한 레시피 추천 커뮤니티
          </p>
          <p>팀 프로젝트 · 2026.11.03 – 11.27</p>
        </div>

        {/* 가운데: 바로가기 */}
        <nav aria-label="하단 바로가기" className="flex flex-col gap-2">
          <h2 className="mb-1 text-base font-bold text-ink">바로가기</h2>
          {FOOTER_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="w-fit hover:text-accent">{link.label}</Link>
          ))}
        </nav>

        {/* 오른쪽: 만든 사람 */}
        <div className="flex flex-col gap-2">
          <h2 className="mb-1 text-base font-bold text-ink">만든 사람 · 그늘에있으면기분이해피하조</h2>
          <ul className="flex flex-col gap-1">
            {TEAM.map((member) => (
              <li key={member.name}>
                <span className="font-bold text-ink-soft">{member.name}</span>
                <span className="ml-2">{member.role}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 맨 아래 줄: 데이터 출처 · GitHub · 저작권 (회색 띠) */}
      <div className="bg-page">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 text-xs md:px-6">
          <p>레시피 데이터: 식품의약품안전처 조리식품 레시피 DB</p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {/* target="_blank": 새 탭으로 열기 · rel="noreferrer": 새 탭이 이 화면을 건드리지 못하게 (보안) */}
            <a href="https://github.com/hyunki00/Team-Be-happy-in-the-shade" target="_blank" rel="noreferrer" className="underline hover:text-accent">GitHub</a>
            <span>© 2026 뭐먹 · 그늘에있으면기분이해피하조</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

// 1. 공통 레이아웃
// AuthProvider 안에서 useNavigate를 쓰기 때문에 라우터 안쪽(여기)에서 감싼다. (mini와 같음)
// 바탕색 · 글꼴은 index.css, 여기서는 전체 폭(최대 1152px)과 좌우 여백만 정한다
const RootLayout = () => {
  return (
    <AuthProvider>
      {/* [11/24 조현기] flex flex-col: 메뉴 · 내용 · 하단을 위에서 아래로 쌓음 (하단이 화면 맨 아래에 붙게) */}
      <div className="flex min-h-screen flex-col bg-page text-ink">
        <NavBar />
        {/* [11/24 조현기] w-full: flex 안에서도 원래처럼 가로로 꽉 차게 (최대 1152px는 그대로) */}
        <main className="mx-auto w-full max-w-6xl px-4 pb-16 md:px-6">
          <Outlet /> {/* 페이지 내용이 바뀔 자리 */}
        </main>
        <Footer />   {/* [11/24 조현기] 모든 페이지 공통 하단 */}
      </div>
    </AuthProvider>
  );
};

// 2. 라우터 설정 (경로는 컴포넌트 정리 문서 기준)
// /recipes/recommend, /recipes/new 는 /recipes/:id 보다 위에 둔다.
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignUpPage /> },
      { path: "password-reset", element: <ResetPasswordPage /> }, // 효정: resetpasswordpage추가
      { path: "mypage", element: <ProtectedRoute><MyPage /></ProtectedRoute> },
      { path: "fridge", element: <ProtectedRoute><FridgePage /></ProtectedRoute> },

      { path: "recipes", element: <RecipeListPage /> },
      { path: "recipes/recommend", element: <RecipeRecommendPage /> },
      { path: "recipes/new", element: <ProtectedRoute><RecipeCreatePage /></ProtectedRoute> },
      { path: "recipes/:id", element: <RecipeDetailPage /> },
      { path: "recipes/:id/edit", element: <ProtectedRoute><RecipeEditPage /></ProtectedRoute> },

      { path: "board", element: <BoardListPage /> },
      { path: "board/new", element: <ProtectedRoute><BoardFormPage /></ProtectedRoute> },
      { path: "board/:id", element: <BoardDetailPage /> },
      { path: "board/:id/edit", element: <ProtectedRoute><BoardFormPage /></ProtectedRoute> },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

// 3. App에서는 RouterProvider만 리턴
const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
