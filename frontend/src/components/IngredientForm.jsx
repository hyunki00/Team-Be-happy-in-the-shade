// 담당: 정호진 (임시화면입니다~)
import { useState } from "react";

import {
  AMOUNT_MIN,
  AMOUNT_MAX,
  MEAT_AMOUNT_MAX,
  UNIT_MEAT,
} from "../constants";

function IngredientForm({ mode, initialValue, onSubmit, onClose }) {
  // 수정 중인 값
  const [formData, setFormData] = useState({
    amount: initialValue.amount,
    expiration_date: initialValue.expiration_date || "",
  });

  // 육류는 최대 999, 나머지는 최대 99
  const amountMax =
    initialValue.unit === UNIT_MEAT ? MEAT_AMOUNT_MAX : AMOUNT_MAX;

  // 처음 값과 현재 값 비교
  const hasChanges =
    formData.amount !== initialValue.amount ||
    formData.expiration_date !== (initialValue.expiration_date || "");

  // 숫자 범위와 정수 여부 확인
  const amount = Number(formData.amount);

  const isValidAmount =
    formData.amount !== "" &&
    Number.isInteger(amount) &&
    amount >= AMOUNT_MIN &&
    amount <= amountMax;

  // 입력칸 변경
  function handleChange(e) {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  // 수량 변경 버튼
  function handleAmountChange(value) {
    const currentAmount = Number(formData.amount);

    // 입력값이 비었거나 잘못됐다면 최솟값부터 시작
    if (!isValidAmount) {
      setFormData({
        ...formData,
        amount: String(AMOUNT_MIN),
      });

      return;
    }

    const nextAmount = currentAmount + value;

    // 허용 범위를 벗어나면 변경하지 않음
    if (nextAmount < AMOUNT_MIN || nextAmount > amountMax) {
      return;
    }

    setFormData({
      ...formData,
      amount: String(nextAmount),
    });
  }

  // 저장 버튼
  function handleSubmit(e) {
    e.preventDefault();

    if (!hasChanges || !isValidAmount) {
      return;
    }

    onSubmit({
      ...formData,
      // 날짜가 비어 있으면 기존 데이터처럼 null 사용
      expiration_date: formData.expiration_date || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded p-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold">
          {initialValue.ing_name} {mode === "edit" ? "수정" : "등록"}
        </h2>

        <button type="button" onClick={onClose}>
          닫기
        </button>
      </div>

      {/* 수량 */}
      <div className="mt-4">
        <label htmlFor="amount">수량</label>

        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            onClick={() => handleAmountChange(-1)}
            className="border px-3"
          >
            −
          </button>

          <input
            id="amount"
            type="number"
            name="amount"
            min={AMOUNT_MIN}
            max={amountMax}
            step="1"
            value={formData.amount}
            onChange={handleChange}
            className="border w-24 p-1"
          />

          <button
            type="button"
            onClick={() => handleAmountChange(1)}
            className="border px-3"
          >
            +
          </button>

          <span>{initialValue.unit}</span>
        </div>

        {!isValidAmount && (
          <p className="mt-1">
            수량은 {AMOUNT_MIN}부터 {amountMax}까지 정수로 입력해 주세요.
          </p>
        )}
      </div>

      {/* 소비기한 */}
      <div className="mt-4">
        <label htmlFor="expiration_date">소비기한</label>

        <input
          id="expiration_date"
          type="date"
          name="expiration_date"
          value={formData.expiration_date}
          onChange={handleChange}
          className="border p-1 ml-2"
        />
      </div>

      {/* 값이 변경되지 않았거나 수량이 잘못되면 저장 불가 */}
      <button
        type="submit"
        disabled={!hasChanges || !isValidAmount}
        className="border px-4 py-1 mt-4 disabled:opacity-40"
      >
        저장
      </button>
    </form>
  );
}

export default IngredientForm;