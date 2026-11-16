// 담당: 권우정
import { Link } from "react-router-dom";

//recipe : 부모 컴포넌트(RecipeListPage.jsx)가 전달하는 레시피 한 개
//showMatch=false : 일치율 표시 여부의 기본값
function RecipeCard({recipe, showMatch=false}) {

  return (
    <Link to={`/recipes/${recipe.recipe_id}`} style={{ display: "inline-block", width: "220px" }}>
      <div style={{ width: "220px" }}>
        <img 
          src={recipe.image_url}
          alt={recipe.recipe_title}
          width="200"        
        />

        <h3>{recipe.recipe_title}</h3>
        <p>조리 시간 : {recipe.cooking_time}분</p>
        <p>난이도 : {recipe.level}</p>
        <p>작성자 : {recipe.nickname}</p>
        {showMatch && <p>재료 일치율 : {recipe.match_rate*100}%</p>}
        {showMatch && (
          <p>
            {recipe.missing_ingredients.length === 0
              ? "부족한 재료 없음"
              : `부족한 재료 : ${recipe.missing_ingredients
                .map((ingredient) => ingredient.ing_name)
                .join(", ")}`
              }
          </p>
        )}
      </div>
    </Link>
  );
}

export default RecipeCard;
