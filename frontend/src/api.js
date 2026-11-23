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

export default api;
