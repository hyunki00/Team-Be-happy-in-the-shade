// 담당: 정호진 — 재료 등록 · 수정, 수량은 숫자로 전송합니다.
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
    <form onSubmit={handleSubmit} className="border rounded p-4">
      <h2 className="font-bold">{initialValue.ing_name} {mode === "create" ? "등록" : "수정"}</h2>
      <fieldset disabled={isSaving} className="flex flex-wrap items-end gap-4 mt-4">
        <label>수량
          <input aria-label="수량" name="amount" type="number" min={AMOUNT_MIN} max={amountMax} step="1" value={formData.amount} onChange={handleChange} required className="border rounded p-2 ml-2 w-24" />
        </label>
        <label>단위
          <select aria-label="단위" name="unit" value={formData.unit} onChange={handleChange} disabled={isMeat} className="border rounded p-2 ml-2">
            {isMeat ? <option value={UNIT_MEAT}>{UNIT_MEAT}</option> : <><option value={UNIT_DEFAULT}>{UNIT_DEFAULT}</option><option value={UNIT_DRINK}>{UNIT_DRINK}</option></>}
          </select>
        </label>
        <label>소비기한
          <input aria-label="소비기한" name="expiration_date" type="date" value={formData.expiration_date} onChange={handleChange} className="border rounded p-2 ml-2" />
        </label>
        <button type="submit" disabled={!isValid || !hasChanges} className="border rounded px-4 py-2 disabled:opacity-40">{isSaving ? "저장 중..." : "저장"}</button>
        <button type="button" onClick={onClose} className="border rounded px-4 py-2">취소</button>
      </fieldset>
      {!isValid && <p role="alert" className="mt-2">수량은 {AMOUNT_MIN}~{amountMax} 사이 정수로 입력해 주세요.</p>}
    </form>
  );
}
export default IngredientForm;
