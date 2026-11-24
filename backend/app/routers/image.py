# 담당: 조현기 (공통)
# [11/24 조현기] 사진 올리기 API — 게시글 사진 · 레시피 대표/단계 사진이 같이 씀
#
# 왜 필요한가
#   원래는 사진을 고르면 브라우저가 만든 임시 주소(blob:…)나 긴 글자(data:…)를 그대로 DB에 넣으려 했음
#   → blob: 주소는 그 창을 닫으면 깨지고, data: 글자는 너무 길어서 DB 칸(최대 500자)에 안 들어감
#   그래서 '사진 파일은 서버 폴더에, DB에는 짧은 주소만' 저장하는 방식으로 정함 (11/24 팀장 결정)
#
# 흐름
#   1. 화면이 사진 파일을 POST /images 로 보냄 (api.js의 uploadImage 함수)
#   2. 서버가 종류(JPG · PNG · WEBP) · 크기(10MB 이하)를 확인하고 backend/uploads 폴더에 저장
#      파일 이름은 겹치지 않게 무작위로 새로 지음 (예: 3f2a9c…e1.jpg) — 사용자가 올린 이름은 쓰지 않음
#   3. { "url": "http://localhost:8044/uploads/3f2a9c…e1.jpg" } 를 돌려줌
#   4. 화면은 이 주소를 게시글 images · 레시피 image_url · step_image_url 에 넣어서 저장
#   5. 사진을 볼 때는 main.py가 열어 둔 /uploads 주소로 바로 열림
#
# 알아 둘 것
#   - 로그인한 사람만 올릴 수 있음 (아무나 서버에 파일을 채우지 못하게)
#   - PC마다 DB가 따로인 것처럼 uploads 폴더도 PC마다 따로 (다른 사람 PC에서 올린 사진은 내 PC에 없음)
#   - uploads 폴더는 .gitignore에 넣어서 GitHub에 올라가지 않음
#
# [11/24 조현기] 썸네일(작은 사진)도 같이 만듦 — 목록 카드가 큰 원본 대신 작은 사진을 받게 (로딩 속도)
#   - 원본: 3f2a…e1.jpg  →  썸네일: 3f2a…e1_thumb.webp (같은 폴더, 이름 뒤에 _thumb)
#   - 크기: 가로 480px (카드는 화면에서 360px 안팎. 선명한 화면(2배)도 어느 정도 버티게 조금 크게)
#   - 형식: WebP 품질 72 → 같은 화질에 JPG보다 가벼움. 보통 장당 20~40KB (원본은 수백 KB~수 MB)
#   - 화면은 썸네일 주소를 규칙으로 만들어 씀 (api.js의 thumbUrl). 썸네일이 없으면 원본으로 자동으로 넘어감
#   - 식약처 레시피 사진 777장의 썸네일은 backend/make_thumbnails.py로 한 번에 만듦 (같은 make_thumbnail 함수 사용)
#   - Pillow(사진 라이브러리)가 아직 설치 안 된 PC에서는 썸네일만 건너뜀 (서버는 그대로 켜짐)
#     설치: backend 폴더에서 pip install -r requirements.txt  (또는 pip install pillow)
import io
import os
import uuid

try:
    from PIL import Image   # 사진 줄이기 (Pillow)
except ImportError:        # 설치 안 된 PC: 썸네일 없이 원본만
    Image = None

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile

from app.core.auth import get_user_id

router = APIRouter(prefix="/images", tags=["Images"])

# 사진을 저장할 폴더: backend/uploads (이 파일 위치에서 세 단계 위가 backend)
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")

# 받는 사진 종류 → 저장할 확장자 (프론트 constants.js의 IMAGE_TYPES와 같게)
ALLOWED_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
MAX_MB = 10  # 프론트 constants.js의 IMAGE_MAX_MB와 같게

THUMB_WIDTH = 480    # 썸네일 가로 크기(px). 세로는 원래 비율대로
THUMB_QUALITY = 72   # WebP 품질 (0~100). 낮을수록 가볍고 흐려짐


# [11/24 조현기] 사진 데이터(바이트) → 썸네일 WebP 데이터(바이트)
#   Pillow가 없거나 사진을 읽지 못하면 None (그러면 썸네일 없이 원본만 씀)
#   make_thumbnails.py(식약처 사진 777장 한 번에 만들기)도 이 함수를 같이 씀
def make_thumbnail(data: bytes) -> bytes | None:
    if Image is None:
        return None
    try:
        with Image.open(io.BytesIO(data)) as im:
            im = im.convert("RGB")                    # PNG 투명 배경 · 흑백 등을 일반 색으로 (WebP 저장용)
            if im.width > THUMB_WIDTH:                # 이미 작으면 그대로 (키우지 않음)
                height = round(im.height * THUMB_WIDTH / im.width)
                im = im.resize((THUMB_WIDTH, height), Image.LANCZOS)   # LANCZOS: 줄일 때 가장 선명한 방법
            out = io.BytesIO()
            im.save(out, "WEBP", quality=THUMB_QUALITY, method=6)    # method=6: 시간이 조금 더 걸려도 더 작게
            return out.getvalue()
    except Exception:
        return None


@router.post("")
async def upload_image(
    request: Request,
    file: UploadFile = File(...),             # 화면이 FormData에 "file"이라는 이름으로 담아 보낸 사진
    user_id: int = Depends(get_user_id),      # 로그인 확인 (안 했으면 401)
):
    # 1. 종류 확인
    ext = ALLOWED_TYPES.get(file.content_type)
    if ext is None:
        raise HTTPException(status_code=400, detail="JPG, PNG, WEBP 사진만 올릴 수 있습니다.")

    # 2. 크기 확인 (파일 내용을 읽어서 바이트 수로)
    data = await file.read()
    if len(data) > MAX_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"사진은 {MAX_MB}MB 이하로 올려 주세요.")

    # 3. 겹치지 않는 새 이름으로 저장 (uuid4().hex: 무작위 32글자)
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    name = uuid.uuid4().hex
    filename = f"{name}.{ext}"
    with open(os.path.join(UPLOAD_DIR, filename), "wb") as f:
        f.write(data)

    # [11/24 조현기] 썸네일도 같이 저장 (이름_thumb.webp). 못 만들면 건너뜀 → 화면은 원본으로 보여 줌
    thumb = make_thumbnail(data)
    if thumb is not None:
        with open(os.path.join(UPLOAD_DIR, f"{name}_thumb.webp"), "wb") as f:
            f.write(thumb)

    # 4. 사진 주소 돌려주기
    #   request.base_url: 이 서버 주소 (예: http://localhost:8044/) → 뒤에 uploads/파일이름
    return {"url": f"{request.base_url}uploads/{filename}"}
