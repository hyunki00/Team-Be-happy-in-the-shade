# 담당: 조현기
# [11/24 조현기] 레시피 사진 썸네일(작은 사진) 한 번에 만들기 — 팀장이 한 번만 실행
#
# 왜: 레시피 사진 777장은 식약처 사이트의 원본(장당 수백 KB~수 MB)을 그대로 받아서 목록이 느렸음
#     목록 카드는 작게 보이니, 카드 크기(가로 480px) WebP로 줄인 사진을 우리 쪽에 두고 그걸 먼저 씀
#
# 하는 일
#   1. DB에서 사진이 있는 레시피의 (번호, 사진 주소)를 읽음  (.env의 DB 설정 그대로)
#   2. 식약처에서 사진을 내려받아 make_thumbnail(routers/image.py)로 줄임
#   3. frontend/public/thumbs/레시피번호.webp 로 저장  (예: thumbs/281.webp)
#      → 화면에서는 http://localhost:5173/thumbs/281.webp 로 열림 (api.js의 thumbUrl이 이 규칙을 씀)
#   - 이미 만든 파일은 건너뜀 → 중간에 끊겨도 다시 실행하면 남은 것만 이어서 만듦
#   - 8장씩 동시에 받음 (전체 약 2~5분, 인터넷 속도에 따라)
#   - 실패한 레시피 번호는 마지막에 보여 줌 (그 레시피는 화면에서 원본 사진을 그대로 씀)
#
# 실행 (backend 폴더에서, venv 켠 상태)
#   pip install -r requirements.txt     ← pillow가 새로 들어감 (처음 한 번)
#   python make_thumbnails.py
#
# 끝나면: frontend/public/thumbs 폴더를 커밋 · push → 팀원은 pull만 하면 같이 씀 (팀원은 실행할 필요 없음)
#   ※ 새로 등록하는 레시피 사진은 POST /images가 올릴 때 썸네일을 같이 만들어서 이 스크립트와 상관없음
import os
import urllib.request
from concurrent.futures import ThreadPoolExecutor

from sqlalchemy import create_engine, text

from app.core.settings import settings
from app.routers.image import make_thumbnail

# 저장할 곳: backend의 옆 폴더 frontend/public/thumbs
HERE = os.path.dirname(os.path.abspath(__file__))
THUMB_DIR = os.path.join(HERE, "..", "frontend", "public", "thumbs")
WORKERS = 8      # 동시에 받을 개수 (너무 크면 식약처 서버가 막을 수 있음)
TIMEOUT = 20     # 사진 한 장 기다리는 최대 시간(초)


def make_one(recipe_id: int, url: str) -> str:
    """사진 한 장: 'skip'(이미 있음) / 'ok'(만듦) / 'fail'(실패)"""
    path = os.path.join(THUMB_DIR, f"{recipe_id}.webp")
    if os.path.exists(path):
        return "skip"
    try:
        # User-Agent: 일부 서버는 브라우저가 아닌 요청을 막아서 브라우저처럼 보이게 함
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
            data = res.read()
        thumb = make_thumbnail(data)
        if thumb is None:
            return "fail"
        with open(path, "wb") as f:
            f.write(thumb)
        return "ok"
    except Exception:
        return "fail"


def main():
    os.makedirs(THUMB_DIR, exist_ok=True)

    # 1. 사진이 있는 레시피 목록 (우리 서버에 올린 사진(/uploads/)은 올릴 때 이미 썸네일이 생겨서 제외)
    engine = create_engine(settings.sync_db_url)
    with engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT recipe_id, image_url FROM recipes "
            "WHERE image_url IS NOT NULL AND image_url <> '' AND image_url NOT LIKE '%/uploads/%' "
            "ORDER BY recipe_id"
        )).all()
    print(f"사진이 있는 레시피 {len(rows)}개 → {os.path.abspath(THUMB_DIR)}")

    # 2~3. 8장씩 동시에 내려받아 줄이고 저장
    counts = {"ok": 0, "skip": 0, "fail": 0}
    failed = []
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        results = pool.map(lambda row: (row[0], make_one(row[0], row[1])), rows)
        for done, (recipe_id, result) in enumerate(results, start=1):
            counts[result] += 1
            if result == "fail":
                failed.append(recipe_id)
            if done % 50 == 0 or done == len(rows):
                print(f"  {done}/{len(rows)}  만듦 {counts['ok']} · 이미 있음 {counts['skip']} · 실패 {counts['fail']}")

    # 결과
    total_kb = sum(os.path.getsize(os.path.join(THUMB_DIR, f)) for f in os.listdir(THUMB_DIR)) // 1024
    print(f"끝! 썸네일 폴더 크기 약 {total_kb / 1024:.1f}MB")
    if failed:
        # 많으면 앞 30개만 (전부 실패면 인터넷 · 식약처 사이트 접속 문제일 가능성이 큼)
        shown = failed[:30]
        more = f" … 외 {len(failed) - 30}개" if len(failed) > 30 else ""
        print(f"실패한 레시피 {len(failed)}개 (다시 실행하면 이것만 다시 시도): {shown}{more}")
        if counts["ok"] == 0 and counts["skip"] == 0:
            print("※ 하나도 못 받았어요. 인터넷 연결과, 브라우저에서 식약처 사진 주소가 열리는지 확인해 주세요.")


if __name__ == "__main__":
    main()
