// 담당: 조현기 (공통)
// 백엔드에 요청을 보낼 때 모두 이 api를 쓴다. (axios를 각자 따로 만들지 않기)
// 쓰는 법: import api from "../api";
//          const res = await api.get("/ingredients", { params: { keyword: "계란" } });
import axios from "axios";

const api = axios.create({
  // 백엔드 주소. 바꾸려면 frontend/.env에 VITE_API_URL=주소 를 적는다
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8044",
  // 로그인 쿠키(access_token, refresh_token)를 같이 보내고 받기 위해 꼭 필요
  withCredentials: true,
  timeout: 10000, // 서버 응답이 없으면 재시도할 수 있도록 오류를 표시
});


// [11/24 조현기] 사진 올리기 — 게시글 · 레시피 사진이 같이 씀
//   쓰는 법: const url = await uploadImage(file);   // file: <input type="file">에서 고른 사진
//   서버(POST /images)가 backend/uploads 폴더에 저장하고 사진 주소를 돌려줌 → 그 주소를 DB에 저장
//   FormData: 파일을 보낼 때 쓰는 상자. "file"이라는 이름으로 담음 (백엔드 image.py의 file과 같은 이름)
//   실패하면(로그인 안 함 · 종류 · 크기) 오류를 그대로 던짐 → 부르는 쪽 try/catch에서 처리
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/images", formData, { timeout: 30000 });  // 큰 사진은 오래 걸릴 수 있어 30초
  return data.url;
}

// [11/24 조현기] 레시피 사진의 썸네일(작은 사진) 주소 — 목록 카드가 큰 원본 대신 이걸 먼저 받음 (로딩 속도)
//   규칙
//   - 우리 서버에 올린 사진  …/uploads/3f2a…e1.jpg  →  …/uploads/3f2a…e1_thumb.webp (POST /images가 같이 만듦)
//   - 식약처 레시피 사진     (foodsafetykorea 주소)  →  /thumbs/레시피번호.webp (make_thumbnails.py로 만든 것, frontend/public/thumbs)
//   - 그 밖의 주소 · 사진 없음 → 그대로
//   썸네일 파일이 없을 수도 있으니(스크립트를 아직 안 돌림 · Pillow 없음), 쓰는 쪽에서 onError로 원본으로 넘어가게 함
//   (RecipeCard.jsx의 <img> 참고)
export function thumbUrl(recipeId, imageUrl) {
  if (!imageUrl) return imageUrl;
  const uploaded = imageUrl.match(/^(.*\/uploads\/[0-9a-f]+)\.(jpg|png|webp)$/);   // ( …/uploads/이름 ) . (확장자)
  if (uploaded) return `${uploaded[1]}_thumb.webp`;
  if (imageUrl.includes("foodsafetykorea")) return `/thumbs/${recipeId}.webp`;
  return imageUrl;
}

// [11/24 조현기] 썸네일이 없어서 깨졌을 때 원본 사진으로 바꾸는 함수 — <img onError={…}>에 씀
//   쓰는 법: <img src={thumbUrl(id, url)} onError={(e) => fallbackToOriginal(e, url)} />
//   dataset.fallback: 한 번만 바꾸게 표시 (원본도 깨졌으면 더 바꾸지 않음 → 무한 반복 방지)
export function fallbackToOriginal(event, originalUrl) {
  const img = event.currentTarget;
  if (!originalUrl || img.dataset.fallback) return;
  img.dataset.fallback = "1";
  img.src = originalUrl;
}

export default api;
