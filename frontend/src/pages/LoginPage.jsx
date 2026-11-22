// 담당: 오효정 (임시화면입니다~)

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const { login, error } = useAuth();

  // 이 페이지에서 직접 조회하는 mock 데이터는 없음. 로그인 정보는 AuthContext에서 관리
  // 아이디·비밀번호 입력 상태는 DB 연결 후에도 사용
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');

  // 로그인 요청은 AuthContext.login()에 위임
  const submit = async (event) => {
    event.preventDefault();

    if (submitting) return;
    setSubmitting(true);
    const success = await login(loginId, password);
    setSubmitting(false);

    if (success) {
      navigate(location.state?.from || '/fridge', { replace: true });
    }
  };

  //  화면 출력·오류 표시·페이지 이동 링크는 DB 연결 후에도 사용
  return (
    <div className="auth-card panel">
      <h1>로그인</h1>

      <form onSubmit={submit}>
        <div className="form-field">
          <label htmlFor="login-id">아이디</label>
          <input id="login-id" type="text" autoComplete="username"
            value={loginId} onChange={(e) => setLoginId(e.target.value)} required
          />
        </div>

        <div className="form-field">
          <label htmlFor="login-password">비밀번호</label>
          <input id="login-password" type="password" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} required
          />
        </div>

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={submitting}>{submitting ? "로그인 중..." : "로그인"}</button>
      </form>

      <Link to="/signup">회원가입</Link>
      <Link to="/password-reset">비밀번호 찾기</Link>
    </div>
  );
}
