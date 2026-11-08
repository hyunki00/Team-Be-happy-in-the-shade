// 담당: 조현기
// 모든 페이지 위에 보이는 메뉴 (스타일은 나중에 정함)
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function NavBar() {
  const { isAuthenticated, user, logout } = useAuth();

  const onLogoutClick = () => {
    logout();
  };

  return (
    <nav className="flex items-center gap-4 p-4 border-b">
      <Link to="/" className="font-bold">
        그늘에있으면기분이해피하조
      </Link>
      <Link to="/fridge">내 냉장고</Link>
      <Link to="/recipes">레시피 검색</Link>
      <Link to="/recipes/new">레시피 쓰기</Link>
      <Link to="/board">커뮤니티</Link>

      <div className="ml-auto flex gap-4">
        {isAuthenticated ? (
          <>
            <Link to="/mypage">{user?.nickname ?? "마이페이지"}</Link>
            <button onClick={onLogoutClick}>로그아웃</button>
          </>
        ) : (
          <>
            <Link to="/login">로그인</Link>
            <Link to="/signup">회원가입</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default NavBar;
