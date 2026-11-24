// 담당: 조현기
// 모든 페이지 위에 보이는 메뉴 (시안 F: 화면 위에 떠 있는 둥근 흰 메뉴바)
// [11/24 조현기] 왼쪽 로고: 팀 이름 → 사이트 이름 '뭐먹' 로고 그림 (frontend/public/logo.png)
//   숟가락 · 포크 · 베이지 배경까지 넣은 그림, 양 끝은 메뉴바 흰 바탕으로 흐려지게 만듦 (높이 폰 48px · PC 56px)
import { Link, NavLink, useLocation } from "react-router-dom";   // [수정 11/24 조현기] useLocation: 로그인 뒤 돌아갈 주소
import { useAuth } from "../contexts/AuthContext";

// 메뉴 목록 (end: 그 주소일 때만 선택 표시. /recipes/new에서 '레시피 검색'이 같이 켜지지 않게)
const MENUS = [
  { to: "/fridge", label: "내 냉장고" },
  { to: "/recipes", label: "레시피 검색", end: true },
  { to: "/recipes/new", label: "레시피 쓰기" },
  { to: "/board", label: "커뮤니티" },
];

// 선택된 메뉴는 연한 포인트 바탕 + 포인트 글자
// 폰에서는 메뉴 4개가 한 줄에 다 들어가게 글자 · 여백을 줄임
// [수정 11/24 조현기] 글자 넘침: 아주 좁은 휴대폰(320px)에서 4칸 메뉴 한 칸이 약 62px라 '레시피 검색'(약 70px)이 칸을 넘어
//   옆 메뉴와 글자가 붙었음 → 휴대폰 폭(sm 미만)에서만 글자 13px, 좌우 여백은 폭에 따라
//   (360px 미만 2px · 360px 이상 8px · 640px 이상 16px). 넓은 화면은 그대로(15px · 16px)
//   min-[360px]: '화면 폭 360px 이상일 때만' (Tailwind v4에서 숫자로 바로 쓰는 기준)
const menuClass = ({ isActive }) =>
  `inline-flex items-center justify-center h-11 px-0.5 min-[360px]:px-2 sm:px-4 rounded-pill text-[13px] sm:text-[15px] whitespace-nowrap ${
    isActive ? "bg-accent-soft text-accent font-bold" : "font-medium hover:text-accent"
  }`;

function NavBar() {
  const { isAuthenticated, user, logout } = useAuth();

  // [수정 11/24 조현기] 위 메뉴 [로그인] · [회원가입]을 누르면 지금 보던 화면으로 돌아오게 (state.from)
  //   지금 로그인 · 회원가입 · 비밀번호 찾기 화면이면 그 화면이 아니라, 이미 들고 있던 돌아갈 주소를 그대로 넘김
  const location = useLocation();
  const isAuthPage = ["/login", "/signup", "/password-reset"].includes(location.pathname);
  const loginFrom = isAuthPage ? location.state?.from : location.pathname + location.search;

  const onLogoutClick = () => {
    logout();
  };

  return (
    <header className="px-4 pt-4 pb-6 md:px-6 md:pt-6 md:pb-8">
      {/* [수정 11/24 조현기] 아주 좁은 폭(360px 미만)에서는 왼쪽 여백 20px → 12px (메뉴 4개가 한 줄에 들어가게) */}
      <div className="mx-auto max-w-6xl flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[32px] bg-surface py-2 pl-3 pr-2 min-[360px]:pl-5 md:pl-6 shadow-float">
        <Link to="/" className="flex-none" aria-label="뭐먹 홈으로">
          {/* [11/24 조현기] 연출: 처음 열 때 한 번 + 마우스를 올릴 때마다 요리사 모자처럼 살랑 (정의는 index.css)
              origin-bottom: 아래쪽 가운데를 기준으로 흔들려서 모자가 접시 위에서 살랑이는 느낌
              (로고가 그림 한 장이라 그림 전체가 흔들림) */}
          <img src="/logo.png" alt="뭐먹" className="h-12 w-auto origin-bottom animate-hat-wiggle hover:animate-hat-hover md:h-14" />
        </Link>

        {/* 좁은 화면에서는 메뉴가 다음 줄로 내려가고 4칸으로 나눠 한 줄에 보인다 */}
        {/* [수정 11/24 조현기] 똑같이 4등분(grid-cols-4) → 글자 길이만큼 차지하고 사이를 고르게 벌림(flex justify-between)
            '레시피 검색'처럼 긴 메뉴가 짧은 메뉴의 남는 자리를 쓸 수 있어서 좁은 폭에서도 칸을 넘지 않음 */}
        <nav aria-label="주 메뉴" className="order-last w-full flex justify-between md:order-none md:w-auto md:flex-1 md:justify-center gap-1">
          {MENUS.map((menu) => (
            <NavLink key={menu.to} to={menu.to} end={menu.end} className={menuClass}>
              {menu.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto md:ml-0 flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <button onClick={onLogoutClick} className="h-11 px-3 text-sm text-muted hover:text-accent">
                로그아웃
              </button>
              {/* 닉네임 첫 글자 동그라미 → 마이페이지 */}
              {/* [수정 11/24 조현기] 프로필 사진이 있으면 동그라미 안에 사진 (overflow-hidden: 사진을 동그라미 모양으로 자름) */}
              <Link
                to="/mypage"
                aria-label={`마이페이지 · ${user?.nickname ?? ""}`}
                title={user?.nickname ?? "마이페이지"}
                className="w-11 h-11 flex items-center justify-center overflow-hidden rounded-full bg-gray-200 text-ink-soft font-bold"
              >
                {user?.profile_image ? (
                  <img src={user.profile_image} alt="" className="h-full w-full object-cover" />
                ) : (
                  user?.nickname?.slice(0, 1) ?? "나"
                )}
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" state={{ from: loginFrom }} className="inline-flex items-center h-11 px-3 text-[15px] font-medium hover:text-accent">
                로그인
              </Link>
              <Link
                to="/signup"
                state={{ from: loginFrom }}
                className="inline-flex items-center h-11 px-5 rounded-pill bg-accent text-white text-[15px] font-bold hover:bg-accent-dark"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default NavBar;
