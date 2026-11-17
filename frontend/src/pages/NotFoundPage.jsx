// 담당: 조현기
// 없는 주소로 들어왔을 때 보이는 화면
import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 p-16">
      <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p>주소가 바뀌었거나 없는 페이지입니다.</p>
      <Link to="/" className="underline">
        홈으로 가기
      </Link>
    </div>
  );
}

export default NotFoundPage;
