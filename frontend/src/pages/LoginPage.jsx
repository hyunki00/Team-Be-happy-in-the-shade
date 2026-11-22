// 담당: 오효정 (임시화면입니다~)
// [디자인 11/22 조현기] 시안 F 적용 — className(모양)만 바꿈, 로그인 로직은 그대로
//   1. auth-card · panel · form-field 클래스는 정의된 CSS가 없어서 적용이 안 되고 있었음 → Tailwind 클래스로 바꿈
//   2. 가운데 흰 카드(최대 440px), 라벨 위 · 입력칸 아래, 로그인 버튼은 포인트색 알약
//   3. 회원가입 · 비밀번호 찾기 링크를 아래 한 줄로

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
    <div className="mx-auto mt-4 max-w-[440px] rounded-card bg-surface p-8 shadow-card md:p-10">
      <h1 className="text-3xl font-black">로그인</h1>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="login-id" className="text-sm font-bold">아이디</label>
          <input id="login-id" type="text" autoComplete="username" className="h-12"
            value={loginId} onChange={(e) => setLoginId(e.target.value)} required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="login-password" className="text-sm font-bold">비밀번호</label>
          <input id="login-password" type="password" autoComplete="current-password" className="h-12"
            value={password} onChange={(e) => setPassword(e.target.value)} required
          />
        </div>

        {error && <p role="alert" className="rounded-[16px] bg-miss-soft px-4 py-3 text-sm text-miss">{error}</p>}

        <button type="submit" disabled={submitting} className="mt-2 h-12 rounded-pill bg-accent font-bold text-white hover:bg-accent-dark disabled:opacity-40">{submitting ? "로그인 중..." : "로그인"}</button>
      </form>

      <div className="mt-6 flex justify-center gap-4 text-sm text-muted">
        <Link to="/signup" className="hover:text-accent">회원가입</Link>
        <span aria-hidden="true">·</span>
        <Link to="/password-reset" className="hover:text-accent">비밀번호 찾기</Link>
      </div>
    </div>
  );
}
