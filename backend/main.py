# 담당: 조현기 (공통)
# 앱 시작 파일: CORS · 미들웨어 · 라우터 등록
# 실행: backend 폴더에서  uvicorn main:app --port=8044 --reload
import importlib
import os   # [11/24 조현기] 사진 폴더 만들기
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles   # [11/24 조현기] 올린 사진 파일을 주소로 열어 주는 기능
from fastapi.concurrency import asynccontextmanager
from dotenv import load_dotenv
from app.db.database import async_engine
from app.middleware.token_refresh import TokenRefreshMiddleware

load_dotenv(dotenv_path=".env")


# mini는 여기서 Base.metadata.create_all로 테이블을 자동으로 만들지만,
# 우리는 테이블 생성 SQL(11/13) + seed.sql로 DB를 만들기 때문에 자동 생성은 하지 않는다.
# (모델 클래스가 SQL과 조금만 달라도 엉뚱한 테이블이 생기는 것을 막기 위해)
@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await async_engine.dispose()


app = FastAPI(lifespan=lifespan)

app.add_middleware(TokenRefreshMiddleware)

app.add_middleware(
    CORSMiddleware,
    # Vite 개발 서버 (mini는 3000). Vite를 두 개 띄우면 5174로 열려서 같이 허용
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # [수정 11/24 조현기] 레시피 검색 '총 개수' 헤더(X-Total-Count)를 화면이 읽을 수 있게 열어 줌
    #   브라우저는 주소가 다른 서버(5173 → 8044)의 응답 헤더를 기본적으로 숨김. 여기 적은 헤더만 JS에서 보임
    #   (routers/recipe.py의 레시피 목록 API가 이 헤더를 보냄)
    expose_headers=["X-Total-Count"],
)

# 라우터 등록: app/routers/파일이름.py 안에 router = APIRouter(...)가 있으면 자동으로 등록된다.
# 그래서 각자 라우터를 만들 때 이 파일(main.py)은 고치지 않아도 된다. (같은 파일 동시 수정 → 충돌 방지)
ROUTERS = ["auth", "user", "ingredient", "fridge", "recipe", "recipe_comment", "post", "email_auth", "home", "image"]  # [11/24 조현기] home: 메인화면 전용 빠른 추천 · image: 사진 올리기
for name in ROUTERS:
    module = importlib.import_module(f"app.routers.{name}")
    if hasattr(module, "router"):
        app.include_router(module.router)

# [11/24 조현기] 올린 사진 열기: http://localhost:8044/uploads/파일이름 → backend/uploads/파일이름
#   사진 올리기 API는 app/routers/image.py (POST /images). 폴더가 없으면 여기서 만들어 둠
#   app.mount: 이 주소 아래로 오는 요청은 라우터 대신 폴더의 파일을 그대로 돌려줌
from app.routers.image import UPLOAD_DIR
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8044, reload=True)
