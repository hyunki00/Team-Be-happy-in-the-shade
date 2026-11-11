// 담당: 조현기
// 로그인 정보를 모든 페이지에서 같이 쓰기 위한 파일 
// 서버 요청(api)과 알림창은 백엔드를 시작할 때 TODO 자리에 추가한다.
// (아래 eslint 주석: 이 파일은 AuthProvider와 useAuth를 같이 내보내서 생기는 경고를 끈다. 실행에는 문제 없음)
/* eslint-disable react-refresh/only-export-components */
import { useState, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { LOGIN_ID_MIN, LOGIN_ID_MAX, NICKNAME_MIN, PASSWORD_MIN } from "../constants";
import { mockUser } from "../mockData";

// 개발용 가짜 로그인: true로 바꾸면 로그인한 상태(mockUser)로 시작한다.
// 마이페이지 · 내 글 수정처럼 로그인 화면을 만들 때만 켜고, 커밋할 때는 false로 둔다.
const DEV_LOGIN = false;

// Context를 먼저 정의
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(DEV_LOGIN);
  const [user, setUser] = useState(DEV_LOGIN ? mockUser : null); // { user_id, login_id, email, nickname }
  const navigate = useNavigate();

  // 로그인: 아이디 + 비밀번호, 성공하면 true (이메일은 회원가입 인증 · 비밀번호 찾기에만 씀)
  const login = async (login_id, password) => {
    setError("");
    // TODO 백엔드 시작 시 추가
    // const response = await api.post("/auth/login", { login_id, password });
    // 성공하면 setUser(response.data), setIsAuthenticated(true), verifyJWT()
    console.log("login", login_id, password);
    return false;
  };

  // 회원가입: 입력값을 먼저 확인하고, 성공하면 true
  const signup = async ({ login_id, email, nickname, password, confirmPassword }) => {
    const idPattern = new RegExp(`^[A-Za-z0-9]{${LOGIN_ID_MIN},${LOGIN_ID_MAX}}$`);
    if (!idPattern.test(login_id)) {
      setError(`아이디는 영문 · 숫자 ${LOGIN_ID_MIN}~${LOGIN_ID_MAX}자로 입력하세요.`);
      return false;
    }
    if (!email.includes("@")) {
      setError("유효한 이메일을 입력하세요.");
      return false;
    }
    if (nickname.length < NICKNAME_MIN) {
      setError(`닉네임은 최소 ${NICKNAME_MIN}글자 이상이어야 합니다.`);
      return false;
    }
    if (password.length < PASSWORD_MIN) {
      setError(`비밀번호는 최소 ${PASSWORD_MIN}자리 이상이어야 합니다.`);
      return false;
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return false;
    }
    setError("");
    // TODO 백엔드 시작 시 추가
    // const response = await api.post("/auth/signup", { login_id, email, nickname, password });
    return false;
  };

  // 로그아웃: 로그인 정보를 지우고 홈으로
  const logout = async () => {
    // TODO 백엔드 시작 시 추가
    // await api.post("/auth/logout");
    setIsAuthenticated(false);
    setUser(null);
    navigate("/");
  };

  // TODO 백엔드 시작 시 추가
  // verifyJWT: api.get("/auth/me")로 로그인 상태 확인
  // useEffect(() => { verifyJWT(); }, []);  → 새로고침해도 로그인 유지

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, error, setError, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Context를 안전하게 가져오기 위한 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth는 반드시 <AuthProvider> 안에서 사용.");
  }
  return context;
};
