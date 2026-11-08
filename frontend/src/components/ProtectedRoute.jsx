// 담당: 조현기
// 로그인이 필요한 페이지를 감싸는 컴포넌트
// 백엔드 로그인이 붙기 전까지는 각자 화면을 볼 수 있게 그냥 통과시킨다.
// import { Navigate } from "react-router-dom";
// import { useAuth } from "../contexts/AuthContext";

function ProtectedRoute({ children }) {
  // TODO 백엔드 로그인 연결 후 아래 주석을 풀기
  // const { isAuthenticated } = useAuth();
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />;
  // }
  return children;
}

export default ProtectedRoute;
