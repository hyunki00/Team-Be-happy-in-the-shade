// 담당: 오효정 (임시화면입니다~)
// [디자인 11/22 조현기] 시안 F 적용 — className(모양)만 바꿈, 인증 · 변경 로직은 그대로
//   1. 가운데 흰 카드(최대 440px), 입력칸 옆 버튼은 회색 알약, 변경 버튼은 포인트색
//   2. 오류: 인라인 style(color: red) → 연한 빨간 상자, 안내 문구는 흐린 글씨
//   3. 입력칸에 aria-label 추가 (라벨이 없어서 화면 읽기 프로그램이 이름을 몰랐음)

import { useState } from 'react';
import { Link } from 'react-router-dom';

import { mockUser } from '../mockData'; 
import { PASSWORD_MIN } from '../constants'; 

// 토큰, 비동기 요청


export default function ResetPasswordPage() {

  // 테스트용 데이터: DB 연결 후 가입 여부 확인·인증번호 검증은 API로 교체
  const user = mockUser;
  const verificationCode = '123456';

  // 현재 진행 단계
  const [step, setStep] = useState('verify');

  // 사용자 입력
  const [form, setForm] = useState({email: '', code: '', password: '', confirmPassword: ''});
 
  const [sentEmail, setSentEmail] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');


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
  const handleSendCode = () => {
    const email = form.email.trim();

    setError('');
    setMessage('');
    setSentEmail('');
    setVerifiedEmail('');

    // mock에 등록된 이메일인지 확인
    if (email !== user.email) {
      setError(`mock 등록된 이메일이 없습니다. 임시: ${user.email}`);
      return;
    }

    setSentEmail(email);
    setForm((prev) => ({ ...prev, code: '' }));
    setMessage(`테스트 인증번호는 ${verificationCode}입니다. 실제 메일은 발송되지 않습니다.`);

    // 백엔드 연결 시: 이메일 발송 API로 교체
  };

  // 인증번호 확인
  const handleVerifyCode = () => {
    setError('');
    setMessage('');

    if (!sentEmail || sentEmail !== form.email.trim()) {
      setError('인증번호를 먼저 요청해주세요.');
      return;
    }

    if (form.code.trim() !== verificationCode) {
      setError('인증번호가 일치하지 않습니다.');
      return;
    }

    setVerifiedEmail(sentEmail);
    setStep('reset');

    // 백엔드 연결 시: 인증번호 검증 API로 교체
  };

  // 비밀번호 변경
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!verifiedEmail || verifiedEmail !== form.email.trim()) {
      setError('이메일 인증이 필요합니다.');
      return;
    }

    if (form.password.length < PASSWORD_MIN) {
      setError(`비밀번호는 ${PASSWORD_MIN}자 이상 입력해주세요.`);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    //DB 연결 후 비밀번호 변경 API 요청 및 성공 처리
    window.alert('비밀번호 변경 기능은 DB 연결 후 제공될 예정입니다.');
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
