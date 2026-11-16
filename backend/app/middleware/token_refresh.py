# 담당: 조현기 (공통) — mini와 같음
# 다른 점 하나: UserCrud를 파일 맨 위가 아니라 쓸 때 불러온다.
# 오효정의 crud/user.py에 update_refresh_token_by_id가 생기기 전에도 서버가 켜지게 하려고.
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from jwt import ExpiredSignatureError, InvalidTokenError
from app.db.database import get_db
from app.core.jwt_handle import verify_token, create_access_token, create_refresh_token
from app.core.auth import set_auth_cookies
from fastapi.responses import JSONResponse

class TokenRefreshMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        access_token = request.cookies.get("access_token")
        refresh_token = request.cookies.get("refresh_token")

        try:
            if access_token:
                verify_token(access_token)
                return response
        except (ExpiredSignatureError, InvalidTokenError):
            pass 


        if refresh_token:
            try:
                user_id = verify_token(refresh_token)
            except (ExpiredSignatureError, InvalidTokenError):
                return response
            except (ExpiredSignatureError):
                return JSONResponse(
                    status_code=401,
                    content={"detail" : "refresh_token_expired"}
                )

            new_access_token = create_access_token(user_id)
            new_refresh_token = create_refresh_token(user_id)

            # 새 리프레시 토큰을 DB(users.refresh_token)에 저장
            # UserCrud.update_refresh_token_by_id(오효정)가 아직 없으면 저장만 건너뛴다
            from app.db.crud import user as user_crud
            UserCrud = getattr(user_crud, "UserCrud", None)
            if UserCrud is not None and hasattr(UserCrud, "update_refresh_token_by_id"):
                db = await anext(get_db())
                try:
                    await UserCrud.update_refresh_token_by_id(db, user_id, new_refresh_token)
                    await db.commit()
                except Exception:
                    await db.rollback()
                    raise
                finally:
                    await db.close()

            set_auth_cookies(response, new_access_token, new_refresh_token)

        return response
