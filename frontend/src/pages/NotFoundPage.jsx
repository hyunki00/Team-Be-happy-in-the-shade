// 담당: 조현기
// 없는 주소로 들어왔을 때 보이는 화면 (시안 F 카드 모양)
import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-4 rounded-card bg-surface p-12 text-center shadow-card">
      <p className="text-6xl font-black text-accent">404</p>
      <h1 className="text-2xl font-black">페이지를 찾을 수 없습니다</h1>
      <p className="text-muted">주소가 바뀌었거나 없는 페이지입니다.</p>
      <Link
        to="/"
        className="mt-2 inline-flex items-center h-12 px-6 rounded-pill bg-accent text-white font-bold hover:bg-accent-dark"
      >
        홈으로 가기
      </Link>
    </div>
  );
}

export default NotFoundPage;
