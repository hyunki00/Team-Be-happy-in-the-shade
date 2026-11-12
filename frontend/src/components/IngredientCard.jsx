// 담당: 정호진 (임시화면입니다~)

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

  return (
    <div className="border rounded p-3">
      {/* 카드 클릭 시 해당 재료 선택 */}
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left"
      >
        <p className="font-bold">{item.ing_name}</p>

        <p>
          {item.amount}
          {item.unit}
        </p>

        {dday === null && <p>소비기한 없음</p>}

        {dday !== null && dday > 0 && <p>D-{dday}</p>}

        {dday === 0 && <p>오늘까지</p>}

        {dday !== null && dday < 0 && <p>기한 지남</p>}
      </button>

      {/* 소비기한이 지난 재료만 확인 버튼 표시 */}
      {dday !== null && dday < 0 && (
        <button
          type="button"
          onClick={onDeleteClick}
          className="mt-2 underline"
        >
          확인
        </button>
      )}
    </div>
  );
}

export default IngredientCard;