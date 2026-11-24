# 이메일 인증 · 비밀번호 찾기 — 가벼운 예시 (이 파일 하나로 끝)
#
# 넣는 법
#   1. 이 파일을 backend/app/routers/email_auth.py 로 복사
#   2. backend/main.py 의 ROUTERS 목록에 "email_auth" 추가
#   3. (선택) backend/.env 에 아래 두 줄. 안 적으면 메일 대신 백엔드 터미널에 인증번호가 찍힘
#        MAIL_USERNAME=보내는주소@gmail.com
#        MAIL_PASSWORD=Gmail앱비밀번호16자리   (구글 계정 → 보안 → 2단계 인증 → 앱 비밀번호)
#
# API (http://localhost:8044/docs 에서 바로 눌러 보기)
#   POST /auth/send-code      {"email": "..."}                          → 6자리 번호를 메일로 보냄 (5분 유효)
#   POST /auth/verify-code    {"email": "...", "code": "123456"}        → 맞으면 '인증 완료'
#   POST /auth/reset-password {"email": "...", "new_password": "..."}   → 인증 완료된 이메일만 비밀번호 변경
#
# 회원가입에 쓰려면: UserService.signup 맨 앞에 아래 두 줄
#   from app.routers.email_auth import verified_emails
#   if data.email not in verified_emails: raise HTTPException(400, "이메일 인증을 완료해 주세요.")
import os
import random
import smtplib
import time
from email.message import EmailMessage

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.core.jwt_handle import get_password_hash
from app.db.crud.user import UserCrud
from app.db.database import get_db

router = APIRouter(prefix="/auth", tags=["Email"])

# 인증번호는 서버 메모리에 잠깐 보관 (서버를 다시 켜면 사라짐 → 다시 받으면 됨)
codes = {}               # 이메일 → (번호, 만료 시각)
verified_emails = set()  # 인증 끝난 이메일


class EmailIn(BaseModel):
    email: EmailStr

class CodeIn(BaseModel):
    email: EmailStr
    code: str

class ResetIn(BaseModel):
    email: EmailStr
    new_password: str = Field(min_length=8)


def send_mail(to: str, code: str) -> None:
    user, password = os.getenv("MAIL_USERNAME"), os.getenv("MAIL_PASSWORD")
    if not user or not password:  # 메일 계정이 없으면 테스트 모드
        print(f"[메일 테스트 모드] {to} 인증번호: {code}")
        return
    msg = EmailMessage()
    msg["Subject"] = "[뭐먹] 인증번호"  # [수정 11/24 조현기] 메일 제목: 팀 이름 → 사이트 이름 '뭐먹' (받는 사람이 알아보게)
    msg["From"] = user
    msg["To"] = to
    msg.set_content(f"인증번호: {code}\n5분 안에 입력해 주세요.")
    with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as smtp:
        smtp.starttls()
        smtp.login(user, password)
        smtp.send_message(msg)


@router.post("/send-code")
async def send_code(data: EmailIn):
    code = f"{random.randint(0, 999999):06d}"
    codes[data.email] = (code, time.time() + 300)  # 5분
    verified_emails.discard(data.email)
    await run_in_threadpool(send_mail, data.email, code)  # 메일 보내는 동안 서버가 안 멈추게
    return {"message": "인증번호를 보냈습니다."}


@router.post("/verify-code")
async def verify_code(data: CodeIn):
    saved = codes.get(data.email)
    if not saved or time.time() > saved[1]:
        raise HTTPException(400, "인증번호를 다시 받아 주세요.")
    if data.code != saved[0]:
        raise HTTPException(400, "인증번호가 일치하지 않습니다.")
    codes.pop(data.email)
    verified_emails.add(data.email)
    return {"message": "인증되었습니다."}


@router.post("/reset-password")
async def reset_password(data: ResetIn, db: AsyncSession = Depends(get_db)):
    if data.email not in verified_emails:
        raise HTTPException(400 , "이메일 인증을 먼저 해 주세요.")
    user = await UserCrud.get_by_email(db, data.email)
    if user is None:
        raise HTTPException(404, "가입되지 않은 이메일입니다.")
    user.password = get_password_hash(data.new_password)
    user.refresh_token = None  # 다른 곳 로그인도 풀리게
    await db.commit()
    verified_emails.discard(data.email)
    return {"message": "비밀번호를 바꿨습니다. 다시 로그인해 주세요."}
