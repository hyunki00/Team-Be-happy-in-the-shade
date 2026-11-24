// 담당: 오효정 (임시화면입니다~)
// [디자인 11/22 조현기] 시안 F 적용 — className(모양)만 바꿈, 인증 · 변경 로직은 그대로
//   1. 가운데 흰 카드(최대 440px), 입력칸 옆 버튼은 회색 알약, 변경 버튼은 포인트색
//   2. 오류: 인라인 style(color: red) → 연한 빨간 상자, 안내 문구는 흐린 글씨
//   3. 입력칸에 aria-label 추가 (라벨이 없어서 화면 읽기 프로그램이 이름을 몰랐음)
// C:\Team-Be-happy-in-the-shade\frontend\src\pages\EmailAuthExample.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

import api from "../api";
import { PASSWORD_MIN } from '../constants'; 

// 토큰, 비동기 요청
// 이메일 인증, 비밀번호 착기 회면 쪽 가벼운

// API 추가
//	POST /auth/send-code 인증번호 받기
// POST /auth/verify-code 인증번호 확인
// POST /auth/reset-password 새 비밀번호 저장

export default function ResetPasswordPage() {


  // 현재 진행 단계
  const [step, setStep] = useState('verify');

  // 사용자 입력
  const [form, setForm] = useState({email: '', code: '', password: '', confirmPassword: ''});
 
  const [sentEmail, setSentEmail] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');


  const errorText = (err) => {
    const detail = err.response?.data?.detail;

    if (Array.isArray(detail)) {
      return detail.map((item) => item.msg).join(', ');
    }

    return detail ?? '요청에 실패했습니다. 다시 시도해 주세요.';
  };

  // 입력값 변경
  const update = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'email' ? { code: '' } : {}),
    }));

    setError('');
    setMessage('');

    if (field === 'email') {
      setSentEmail('');
      setVerifiedEmail('');
      setStep('verify');
    }
  };

  // 인증번호 발송
  const handleSendCode = async () => {
    const email = form.email.trim();

    setError('');
    setMessage('');
    setSentEmail('');
    setVerifiedEmail('');

    if (!email) {
      setError('이메일을 입력해 주세요.');
      return;
    }

    try {
      const { data } = await api.post('/auth/send-code', { email });

      setSentEmail(email);
      setForm((prev) => ({ ...prev, code: '' }));
      setMessage(data.message);
    } catch (err) {
      setError(errorText(err));
    }
  };

  // 인증번호 확인
  const handleVerifyCode = async () => {
    const email = form.email.trim();

    setError('');
    setMessage('');

    if (!sentEmail || sentEmail !== email) {
      setError('먼저 이 이메일로 인증번호를 받아 주세요.');
      return;
    }

    try {
      const { data } = await api.post('/auth/verify-code', {
        email,
        code: form.code.trim(),
      });

      setVerifiedEmail(email);
      setStep('reset');
      setMessage(data.message);
    } catch (err) {
      setError(errorText(err));
    }
  };


  // 새 비밀번호 저장
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setMessage('');

    const email = form.email.trim();

    if (!verifiedEmail || verifiedEmail !== email) {
      setError('이메일 인증을 먼저 완료해 주세요.');
      setStep('verify');
      return;
    }

    if (form.password.length < PASSWORD_MIN) {
      setError(`비밀번호를 ${PASSWORD_MIN}자 이상 입력해 주세요.`);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('비밀번호가 서로 일치하지 않습니다.');
      return;
    }

    try {
      const { data } = await api.post('/auth/reset-password', {
        email,
        new_password: form.password,
      });

      setMessage(data.message);
      setStep('verify');
      setSentEmail('');
      setVerifiedEmail('');
      setForm((prev) => ({
        ...prev,
        code: '',
        password: '',
        confirmPassword: '',
      }));
    } catch (err) {
      setError(errorText(err));
    }
  };

  const rowClass = "flex gap-2";
  const sideButton = "h-12 flex-none rounded-pill bg-gray-100 px-4 text-sm font-bold hover:bg-gray-200";

  return (
    <div className="mx-auto mt-4 flex max-w-[440px] flex-col gap-5 rounded-card bg-surface p-8 shadow-card md:p-10">
      <h2 className="text-3xl font-black">비밀번호 찾기</h2>

      {step === 'verify' ? (
        <div className="flex flex-col gap-3">
          <p className="text-muted">가입한 이메일을 인증해주세요.</p>

          <div className={rowClass}>
            <input type="email" placeholder="이메일" aria-label="이메일" className="h-12 min-w-0 flex-1" value={form.email} onChange={(e) => update('email', e.target.value)}/>

            <button type="button" onClick={handleSendCode} className={sideButton}>
              인증번호 받기
            </button>
          </div>

          <div className={rowClass}>
            <input placeholder="인증번호" aria-label="인증번호" className="h-12 min-w-0 flex-1" value={form.code} onChange={(e) => update('code', e.target.value)}/>

            <button type="button" onClick={handleVerifyCode} className={sideButton}>
              인증 확인
            </button>
          </div>
        </div>

      ) : (

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <p className="text-muted">새 비밀번호를 설정해주세요.</p>

          <input type="password" placeholder="새 비밀번호" aria-label="새 비밀번호" className="h-12" value={form.password} onChange={(e) => update('password', e.target.value)}/>

          <input type="password" placeholder="새 비밀번호 확인" aria-label="새 비밀번호 확인" className="h-12" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)}/>

          <button type="submit" className="mt-2 h-12 rounded-pill bg-accent font-bold text-white hover:bg-accent-dark">
            비밀번호 변경
          </button>
        </form>
      )}

      {error && <p role="alert" className="rounded-[16px] bg-miss-soft px-4 py-3 text-sm text-miss">{error}</p>}
      {message && <p role="status" className="text-sm text-have">{message}</p>}

      <Link to="/login" className="text-center text-sm text-muted hover:text-accent">로그인으로 돌아가기</Link>
    </div>
  );
}
