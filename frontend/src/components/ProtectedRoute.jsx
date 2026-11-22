// 담당: 조현기 — 쿠키 로그인 확인 후 보호 페이지를 표시합니다.
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function ProtectedRoute({ children }) {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const location = useLocation();
  if (isAuthLoading) return <p className="p-6" role="status">로그인 확인 중...</p>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

export default ProtectedRoute;
