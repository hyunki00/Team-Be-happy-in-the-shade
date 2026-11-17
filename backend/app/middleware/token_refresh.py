# 담당: 조현기 (공통) — mini를 바탕으로 두 가지를 바꿈
# 1. 토큰 재발급을 요청 처리 "전"에 한다.
#    mini처럼 처리 "후"에 하면, 액세스 토큰이 만료된 뒤 첫 요청은 401로 실패하고 두 번째부터 성공한다.
# 2. 리프레시 토큰을 DB(users.refresh_token)에 저장된 값과 비교한다.
#    로그아웃 때 DB 값을 지우면(NULL) 그 리프레시 토큰은 더 이상 쓸 수 없다.
#    → 오효정의 로그인은 DB에 리프레시 토큰을 저장하고, 로그아웃은 NULL로 지워야 한다.
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from jwt import ExpiredSignatureError, InvalidTokenError
from sqlalchemy import select, update, table, column
from app.db.database import AsyncSessionLocal
from app.core.jwt_handle import verify_token, create_access_token, create_refresh_token
from app.core.auth import set_auth_cookies

# 다른 사람 모델(User)을 기다리지 않도록 필요한 컬럼만 적은 가벼운 table()
users_t = table("users", column("user_id"), column("refresh_token"))


def is_valid_access(token: str | None) -> bool:
    if not token:
        return False
    try:
        verify_token(token)
        return True
    except (ExpiredSignatureError, InvalidTokenError):
        return False


# 리프레시 토큰이 DB 값과 같으면 새 토큰 두 개를 만들고 DB를 새 리프레시 토큰으로 바꾼다.
# 쓸 수 없는 토큰이면 None
async def reissue(refresh_token: str) -> tuple[str, str] | None:
    try:
        user_id = verify_token(refresh_token, token_type="refresh")
    except (ExpiredSignatureError, InvalidTokenError):
        return None

    async with AsyncSessionLocal() as db:
        saved = (await db.execute(
            select(users_t.c.refresh_token).where(users_t.c.user_id == user_id)
        )).scalar_one_or_none()
        if saved != refresh_token:  # 탈퇴 · 로그아웃 · 이미 바뀐 토큰
            return None

        new_access = create_access_token(user_id)
        new_refresh = create_refresh_token(user_id)
        await db.execute(
            update(users_t).where(users_t.c.user_id == user_id).values(refresh_token=new_refresh)
        )
        await db.commit()
    return new_access, new_refresh


# 요청 쿠키의 access_token을 새 값으로 바꿔서, 이번 요청도 새 토큰으로 처리되게 한다
def replace_access_cookie(request: Request, new_access: str) -> None:
    cookies = {k: v for k, v in request.cookies.items() if k != "access_token"}
    cookies["access_token"] = new_access
    cookie_header = "; ".join(f"{k}={v}" for k, v in cookies.items()).encode("latin-1")
    headers = [(k, v) for k, v in request.scope["headers"] if k != b"cookie"]
    headers.append((b"cookie", cookie_header))
    request.scope["headers"] = headers


class TokenRefreshMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        access_token = request.cookies.get("access_token")
        refresh_token = request.cookies.get("refresh_token")

        new_tokens = None
        if not is_valid_access(access_token) and refresh_token:
            new_tokens = await reissue(refresh_token)
            if new_tokens:
                replace_access_cookie(request, new_tokens[0])

        response = await call_next(request)

        if new_tokens:
            set_auth_cookies(response, new_tokens[0], new_tokens[1])
        return response
