// 담당: 정호진 — 재료 등록 · 수정, 수량은 숫자로 전송합니다.
// [디자인 11/22 조현기] 시안 F 적용 — className(모양)만 바꿈, 입력 · 검사 로직은 그대로
//   1. 폼: 흰 둥근 카드에 검정 테두리 (지금 고치는 재료라는 표시)
//   2. 라벨은 입력칸 위에 작게, 입력칸 · 버튼은 둥근 모양 (저장 = 포인트색)
import { useState } from "react";
import { AMOUNT_MIN, AMOUNT_MAX, MEAT_AMOUNT_MAX, UNIT_MEAT, UNIT_DRINK, UNIT_DEFAULT } from "../constants";

function IngredientForm({ mode, initialValue, onSubmit, onClose, isSaving = false, isMeat = false }) {
  const [formData, setFormData] = useState({
    amount: initialValue.amount ?? AMOUNT_MIN,
    unit: isMeat ? UNIT_MEAT : (initialValue.unit === UNIT_DRINK ? UNIT_DRINK : UNIT_DEFAULT),
    expiration_date: initialValue.expiration_date || "",
  });
  const amount = Number(formData.amount);
  const amountMax = isMeat ? MEAT_AMOUNT_MAX : AMOUNT_MAX;
  const isValid = formData.amount !== "" && Number.isInteger(amount) && amount >= AMOUNT_MIN && amount <= amountMax;
  const hasChanges = mode === "create" || amount !== initialValue.amount || formData.unit !== initialValue.unit || formData.expiration_date !== (initialValue.expiration_date || "");
  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }
  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || !hasChanges || isSaving) return;
    onSubmit({ amount, unit: formData.unit, expiration_date: formData.expiration_date || null });
  }
  return (
    <form onSubmit={handleSubmit} className="rounded-card bg-surface p-6 shadow-card ring-2 ring-ink">
      <h2 className="text-lg font-bold">{initialValue.ing_name} {mode === "create" ? "등록" : "수정"}</h2>
      <fieldset disabled={isSaving} className="flex flex-wrap items-end gap-4 mt-4">
        <label className="flex flex-col gap-1 text-sm text-muted">수량
          <input aria-label="수량" name="amount" type="number" min={AMOUNT_MIN} max={amountMax} step="1" value={formData.amount} onChange={handleChange} required className="h-11 w-28 text-base text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">단위
          <select aria-label="단위" name="unit" value={formData.unit} onChange={handleChange} disabled={isMeat} className="h-11 text-base text-ink">
            {isMeat ? <option value={UNIT_MEAT}>{UNIT_MEAT}</option> : <><option value={UNIT_DEFAULT}>{UNIT_DEFAULT}</option><option value={UNIT_DRINK}>{UNIT_DRINK}</option></>}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">소비기한
          <input aria-label="소비기한" name="expiration_date" type="date" value={formData.expiration_date} onChange={handleChange} className="h-11 text-base text-ink" />
        </label>
        <button type="submit" disabled={!isValid || !hasChanges} className="inline-flex items-center h-11 px-6 rounded-pill bg-accent text-white font-bold hover:bg-accent-dark disabled:opacity-40">{isSaving ? "저장 중..." : "저장"}</button>
        <button type="button" onClick={onClose} className="inline-flex items-center h-11 px-6 rounded-pill bg-gray-100 font-medium hover:bg-gray-200">취소</button>
      </fieldset>
      {!isValid && <p role="alert" className="mt-3 text-sm text-miss">수량은 {AMOUNT_MIN}~{amountMax} 사이 정수로 입력해 주세요.</p>}
    </form>
  );
}
export default IngredientForm;
