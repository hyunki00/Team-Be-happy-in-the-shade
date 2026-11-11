// 담당: 정호진 (임시화면입니다~) 

import { useState } from "react";

import IngredientCard from "../components/IngredientCard";
import IngredientForm from "../components/IngredientForm";

import { mockFridge } from "../mockData";

function FridgePage() {
  // 냉장고에 있는 재료 목록
  const [ingredients, setIngredients] = useState(mockFridge);

  // 사용자가 수정하려고 선택한 재료
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  // 검색어
  const [keyword, setKeyword] = useState("");

  // 카드 선택
  function handleSelectIngredient(item) {
    setSelectedIngredient(item);
  }

  // 수정 영역 닫기
  function handleCloseIngredient() {
    setSelectedIngredient(null);
  }

  // 재료 수정
  function handleUpdateIngredient(formData) {
    const updatedIngredients = ingredients.map((item) => {
      if (item.user_ing_id === selectedIngredient.user_ing_id) {
        return {
          ...item,
          ...formData,
        };
      }

      return item;
    });

    setIngredients(updatedIngredients);

    // 저장 후 수정 영역 닫기
    setSelectedIngredient(null);
  }

  // 재료 삭제
  function handleDeleteIngredient(userIngId) {
    // 임시 확인창: 공통 알림 함수가 정해지면 교체
    const isConfirmed = window.confirm("이 재료를 삭제할까요?");

    if (!isConfirmed) {
      return;
    }

    const updatedIngredients = ingredients.filter(
      (item) => item.user_ing_id !== userIngId
    );

    setIngredients(updatedIngredients);

    // 삭제한 재료의 수정 영역이 열려 있다면 닫기
    if (selectedIngredient?.user_ing_id === userIngId) {
      setSelectedIngredient(null);
    }
  }

  // 검색 결과
  const filteredIngredients = ingredients
    .filter((item) => item.ing_name.includes(keyword.trim()))
    .sort((first, second) => {
      // 소비기한이 없는 재료는 목록 뒤에 배치
      if (!first.expiration_date && !second.expiration_date) {
        return 0;
      }

      if (!first.expiration_date) {
        return 1;
      }

      if (!second.expiration_date) {
        return -1;
      }

      return first.expiration_date.localeCompare(second.expiration_date);
    });

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">내 냉장고</h1>

      <p className="mt-4">
        식재료 {ingredients.length}
      </p>

      {/* 재료 검색 */}
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="내 재료 찾기"
        className="border rounded p-2 mt-4"
      />

      <p className="mt-2">소비기한 임박순</p>

      {/* 재료 카드 목록 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
        {filteredIngredients.map((item) => (
          <IngredientCard
            key={item.user_ing_id}
            item={item}
            onClick={() => handleSelectIngredient(item)}
            onDeleteClick={() => handleDeleteIngredient(item.user_ing_id)}
          />
        ))}
      </div>

      {filteredIngredients.length === 0 && (
        <p className="mt-4">표시할 재료가 없습니다.</p>
      )}

      {/* 선택한 재료의 수정 영역 */}
      {selectedIngredient && (
        <div className="mt-6">
          <IngredientForm
            key={selectedIngredient.user_ing_id}
            mode="edit"
            initialValue={selectedIngredient}
            onSubmit={handleUpdateIngredient}
            onClose={handleCloseIngredient}
          />

          <button
            type="button"
            onClick={() =>
              handleDeleteIngredient(selectedIngredient.user_ing_id)
            }
            className="border px-4 py-1 mt-2"
          >
            삭제
          </button>
        </div>
      )}
    </main>
  );
}

export default FridgePage;