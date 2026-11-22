// 담당: 정호진 (임시화면입니다~)
// [디자인 11/22 조현기] 시안 F 적용 — 모양만 바꿈, D-day 계산은 그대로
//   1. 흰 둥근 카드 + 그림자, 재료 이름은 크게
//   2. D-day 색: 3일 이하 · 오늘까지 · 기한 지남 = 빨강, 그 외 = 회색
//   3. 기한 지난 재료의 '확인' 버튼은 연한 빨간 알약 버튼

function IngredientCard({ item, onClick, onDeleteClick }) {
  // 소비기한까지 남은 날짜 계산
  function calcDday(expirationDate) {
    if (!expirationDate) {
      return null;
    }

    // 시간은 제외하고 날짜만 비교
    const today = new Date();
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const [year, month, day] = expirationDate.split("-").map(Number);

    const expiryDate = new Date(year, month - 1, day);

    const difference = expiryDate - todayDate;

    return Math.round(difference / (1000 * 60 * 60 * 24));
  }

  const dday = calcDday(item.expiration_date);

  const isUrgent = dday !== null && dday <= 3;

  return (
    <div className={`flex h-full flex-col rounded-[24px] bg-surface p-5 shadow-card ${dday !== null && dday < 0 ? "ring-2 ring-miss-soft" : ""}`}>
      {/* 카드 클릭 시 해당 재료 선택 */}
      <button
        type="button"
        onClick={onClick}
        className="flex w-full flex-1 flex-col gap-1 text-left"
      >
        <p className="text-lg font-bold">{item.ing_name}</p>

        <p className="text-sm text-ink-soft">
          {item.amount}
          {item.unit}
        </p>

        <div className={`mt-auto pt-2 text-sm font-bold ${isUrgent ? "text-miss" : "text-muted"}`}>
          {dday === null && <p>소비기한 없음</p>}

          {dday !== null && dday > 0 && <p>D-{dday}</p>}

          {dday === 0 && <p>오늘까지</p>}

          {dday !== null && dday < 0 && <p>기한 지남</p>}
        </div>
      </button>

      {/* 소비기한이 지난 재료만 확인 버튼 표시 */}
      {dday !== null && dday < 0 && (
        <button
          type="button"
          onClick={onDeleteClick}
          className="mt-3 inline-flex items-center justify-center h-9 rounded-pill bg-miss-soft text-sm font-bold text-miss"
        >
          확인
        </button>
      )}
    </div>
  );
}

export default IngredientCard;