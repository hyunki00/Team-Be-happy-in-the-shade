// 담당: 조현기
// 로그인 정보를 모든 페이지에서 같이 쓰기 위한 파일 
// 로그인 · 로그인 유지 · 로그아웃은 공통 api 인스턴스로 요청합니다.
// (아래 eslint 주석: 이 파일은 AuthProvider와 useAuth를 같이 내보내서 생기는 경고를 끈다. 실행에는 문제 없음)
/* eslint-disable react-refresh/only-export-components */
// [수정 11/24 조현기] 이 파일에서 바뀐 곳 두 가지
//   1) 오류 문구가 다른 화면까지 따라가던 문제 (+ 2차: 같은 화면에 새로 들어와도 예전 문구가 남던 문제)
//      예) 회원가입에서 '이미 사용 중인 이메일입니다.'가 뜬 뒤 [로그인] 링크로 가면 로그인 화면에도 같은 문구가 보임
//      원인: error는 이 파일 하나에만 있고 로그인 · 회원가입 화면이 같이 씀. 화면을 옮겨도 아무도 안 지웠음
//      해결: 오류 문구를 '어느 화면 방문에서 생겼는지(location.key)'와 같이 저장하고, 같은 방문일 때만 보여 줌
//            → /signup에서 생긴 문구는 /login에서는 안 보임. 화면 쪽(LoginPage · SignUpPage)은 고칠 것 없음
//      [2차] 처음엔 주소(pathname)로 비교했더니, 로그인 실패 → 다른 화면 → 다시 로그인 화면으로 오면
//            주소가 같아서 '아이디 또는 비밀번호가 올바르지 않습니다.'가 그대로 남아 있었음
//            → location.key로 비교: 화면에 '새로 들어올 때마다' 새 값이 생김 (같은 주소여도 다른 방문이면 다름)
//      (화면이 바뀔 때 setError("")로 지우는 useEffect를 쓰면 린트 오류(set-state-in-effect)가 나서 이 방식으로)
//   2) setUser를 밖으로 내보냄: 마이페이지에서 닉네임을 바꾸면 메뉴 · 댓글 칸 등 화면 전체에 바로 반영
import { useState, useEffect, createContext, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LOGIN_ID_MIN, LOGIN_ID_MAX, NICKNAME_MIN, PASSWORD_MIN } from "../constants";
import api from "../api";
import Swal from "sweetalert2";

// Context를 먼저 정의
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // [수정 11/24 조현기] 원래: const [error, setError] = useState("");
  //   지금: 문구(message)와 생긴 화면 방문 번호(key)를 같이 저장
  //   - error    : 다른 파일이 쓰던 이름 그대로. 지금 방문과 문구가 생긴 방문이 같을 때만 문구, 아니면 ""
  //   - setError : 다른 파일이 쓰던 이름 · 쓰는 법 그대로 (setError("문구"), setError(""))
  //                부를 때의 방문 번호(location.key)를 같이 기억함
  //   useLocation().key: 화면에 들어올 때마다 새로 생기는 번호 (react-router가 만들어 줌)
  //     예) /login 방문(key a1) → 로그인 실패 문구 저장(a1) → 마이페이지 → 다시 /login(key b7) → a1 ≠ b7 이라 안 보임
  //   [2차] path(주소)로 비교하던 것을 key로 바꿈 (위 맨 위 주석 1) 참고)
  const [errorInfo, setErrorInfo] = useState({ message: "", key: "" });
  const location = useLocation();
  const error = errorInfo.key === location.key ? errorInfo.message : "";  // 같은 방문이면 문구, 아니면 ""
  const setError = (message) => setErrorInfo({ message, key: location.key });
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
    try {
      // 회원가입만 하고 로그인은 하지 않는다 (가입 후 로그인 화면으로 이동)
      await api.post("/auth/signup", { login_id, email, nickname, password });
      return true;
    } catch (err) {
      const detail = err.response?.data?.detail;
      // 400: "이미 사용 중인 아이디입니다." 같은 글자 / 422: 입력 형식 오류(목록)
      if (typeof detail === "string") setError(detail);
      else if (Array.isArray(detail)) setError("입력한 값을 다시 확인해 주세요.");
      else setError("회원가입 서버에 연결할 수 없습니다. 다시 시도해 주세요.");
      return false;
    }
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
          // [수정 11/24 조현기 2차] setError 대신 setErrorInfo를 직접 부름 (린트 경고: 이펙트 안에서 바뀌는 함수를 쓰면 안 됨)
          //   이 문구는 '처음 연 화면'에 보여야 하므로 그 화면의 방문 번호를 같이 저장
          //   window.history.state?.key: 지금 화면의 방문 번호 (react-router가 브라우저 기록에 넣어 둠, 처음 화면은 "default")
          setErrorInfo({
            message: "로그인 상태를 확인하지 못했습니다. 서버 연결을 확인해 주세요.",
            key: window.history.state?.key ?? "default",
          });
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
      // [수정 11/24 조현기] setUser를 내보냄
      //   마이페이지 ProfileEditor가 닉네임을 저장한 뒤 setUser(서버가 돌려준 내 정보)를 부르면
      //   user를 쓰는 모든 화면(위 메뉴, 마이페이지 왼쪽 프로필 등)이 새 닉네임으로 다시 그려짐
      value={{ user, setUser, isAuthenticated, isAuthLoading, error, setError, login, signup, logout }}
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
