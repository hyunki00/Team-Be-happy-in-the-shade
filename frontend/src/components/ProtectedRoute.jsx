// 담당: 조현기 — 쿠키 로그인 확인 후 보호 페이지를 표시합니다.
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function ProtectedRoute({ children }) {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const location = useLocation();
  // 로그인 확인 중: 가운데 흰 카드 (시안 F)
  if (isAuthLoading) {
    return (
      <p role="status" className="mx-auto mt-8 max-w-sm rounded-card bg-surface p-8 text-center text-muted shadow-card">
        로그인 확인 중...
      </p>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

export default ProtectedRoute;
