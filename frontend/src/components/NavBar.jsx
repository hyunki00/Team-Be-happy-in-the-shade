// 담당: 조현기
// 모든 페이지 위에 보이는 메뉴 (시안 F: 화면 위에 떠 있는 둥근 흰 메뉴바)
// [11/24 조현기] 왼쪽 로고: 팀 이름 → 사이트 이름 '뭐먹' 로고 그림 (frontend/public/logo.png)
//   숟가락 · 포크 · 베이지 배경까지 넣은 그림, 양 끝은 메뉴바 흰 바탕으로 흐려지게 만듦 (높이 폰 48px · PC 56px)
import { Link, NavLink } from "react-router-dom";
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
const menuClass = ({ isActive }) =>
  `inline-flex items-center justify-center h-11 px-2 sm:px-4 rounded-pill text-sm sm:text-[15px] whitespace-nowrap ${
    isActive ? "bg-accent-soft text-accent font-bold" : "font-medium hover:text-accent"
  }`;

function NavBar() {
  const { isAuthenticated, user, logout } = useAuth();

  const onLogoutClick = () => {
    logout();
  };

  return (
    <header className="px-4 pt-4 pb-6 md:px-6 md:pt-6 md:pb-8">
      <div className="mx-auto max-w-6xl flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[32px] bg-surface py-2 pl-5 pr-2 md:pl-6 shadow-float">
        <Link to="/" className="flex-none" aria-label="뭐먹 홈으로">
          <img src="/logo.png" alt="뭐먹" className="h-12 w-auto md:h-14" />
        </Link>

        {/* 좁은 화면에서는 메뉴가 다음 줄로 내려가고 4칸으로 나눠 한 줄에 보인다 */}
        <nav aria-label="주 메뉴" className="order-last w-full grid grid-cols-4 md:order-none md:w-auto md:flex-1 md:flex md:justify-center gap-1">
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
              <Link
                to="/mypage"
                aria-label={`마이페이지 · ${user?.nickname ?? ""}`}
                title={user?.nickname ?? "마이페이지"}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-200 text-ink-soft font-bold"
              >
                {user?.nickname?.slice(0, 1) ?? "나"}
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="inline-flex items-center h-11 px-3 text-[15px] font-medium hover:text-accent">
                로그인
              </Link>
              <Link
                to="/signup"
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
