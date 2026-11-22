// 담당: 조현기
// 로그인 정보를 모든 페이지에서 같이 쓰기 위한 파일 
// 로그인 · 로그인 유지 · 로그아웃은 공통 api 인스턴스로 요청합니다.
// (아래 eslint 주석: 이 파일은 AuthProvider와 useAuth를 같이 내보내서 생기는 경고를 끈다. 실행에는 문제 없음)
/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { LOGIN_ID_MIN, LOGIN_ID_MAX, NICKNAME_MIN, PASSWORD_MIN } from "../constants";
import api from "../api";
import Swal from "sweetalert2";

// Context를 먼저 정의
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [error, setError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState(null);
  const isAuthenticated = user !== null;
  const navigate = useNavigate();

  // 로그인: 아이디 + 비밀번호, 성공하면 true (이메일은 회원가입 인증 · 비밀번호 찾기에만 씀)
  const login = async (login_id, password) => {
    setError("");
    if (!login_id.trim() || !password) {
      setError("아이디와 비밀번호를 입력하세요.");
      return false;
    }
    try {
      const { data } = await api.post("/auth/login", { login_id: login_id.trim(), password });
      setUser(data);
      return true;
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "로그인 서버에 연결할 수 없습니다. 다시 시도해 주세요.");
      return false;
    }
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
    // DB 연결 전 입력 검사 통과 시 화면 이동만 허용. 실제 가입은 되지 않음
    return true;
  };

  // 쿠키는 서버가 삭제합니다. 실패한 경우 로그인 상태를 유지합니다.
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      if (err.response?.status !== 401) {
        await Swal.fire("로그아웃 실패", "서버 연결을 확인하고 다시 시도해 주세요.", "error");
        return;
      }
    }
    setUser(null);
    setError("");
    navigate("/");
  };

  useEffect(() => {
    const controller = new AbortController();
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (err) => {
        if (err.response?.status === 401) setUser(null);
        return Promise.reject(err);
      },
    );
    api.get("/users/me", { signal: controller.signal })
      .then(({ data }) => setUser(data))
      .catch((err) => {
        if (err.code !== "ERR_CANCELED" && err.response?.status !== 401) {
          setError("로그인 상태를 확인하지 못했습니다. 서버 연결을 확인해 주세요.");
        }
      })
      .finally(() => { if (!controller.signal.aborted) setIsAuthLoading(false); });
    return () => {
      controller.abort();
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isAuthLoading, error, setError, login, signup, logout }}
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
