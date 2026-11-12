// 담당: 권우정 
import {mockRecipes} from "../mockData";
import RecipeCard from "../components/RecipeCard";
import { useState } from "react";

function RecipeListPage() {
  // //검색어 저장 변수 생성(keyword : 현재 검색창에 입력된 글자/setKeyword : 검색어 변경 함수)
  // const [keyword, setKeyword] = useState("");
  // //난이도 필터링 변수 생성
  // const [level, setLevel] = useState("전체");
  // //조리 시간 필터링 변수 생성
  // const [cookingTime, setCookingTime] = useState("전체");
  // //요리 종류 필터링 변수 생성
  // const [category, setCategory] = useState("전체");
  // // 정렬 기준 저장 (기본값: 가나다순)
  // const [sortType, setSortType] = useState("name");  

  // 검색 및 필터 조건을 하나의 객체로 관리
  const [filters, setFilters] = useState({
    keyword: "", //검색어
    ingredients: [], //재료
    r_category_id: null, //요리 종류
    level: null, //요리 난이도
    cooking_time: null, //조리 시간
    sort: "name", //정렬
  });  

  //filter() : 배열에서 조건에 맞는 데이터만 골라서 새로운 배열을 만드는 함수
  const filteredRecipes = mockRecipes.filter((recipe) => {
    //레시피 제목에 검색어 포함 -> true
    //앞 뒤 공백 제거해서 검색, 영어 대소문자 구분 없이 검색 가능
    const matchKeyword = recipe.recipe_title.toLowerCase().includes(filters.keyword.trim().toLowerCase());
    //난이도를 선택하지 않았거나, 선택한 난이도와 레시피 난이도가 같으면 true
    const matchLevel = filters.level === null || recipe.level === filters.level;
    //조리 시간을 선택하지 않았으면 전체 허용
    //"초과" 선택 시 60분 초과, 그 외에는 선택한 시간 이하만 허용
    const matchTime =
    filters.cooking_time === null ||
    (filters.cooking_time === "초과"
      ? recipe.cooking_time > 60
      : recipe.cooking_time <= Number(filters.cooking_time));
    //요리 종류를 선택하지 않았거나, 선택한 카테고리 ID가 같으면 true
    const matchCategory =
      filters.r_category_id === null ||
      recipe.r_category_id === filters.r_category_id; 

    //검색, 난이도, 조리시간, 요리 종류 선택 모두 만족해야 출력
    return matchKeyword && matchLevel && matchTime && matchCategory;
  }); 

  // 정렬 기준에 따라 가나다순 또는 일치율순 정렬
  const sortedRecipes = [...filteredRecipes].sort((a, b) => {
    //일치율 높은 레시피부터 정렬(내림차순)
    if (filters.sort === "match_rate") {
      return b.match_rate - a.match_rate;
    }
    return a.recipe_title.localeCompare(b.recipe_title, "ko");
  });

  // 검색어, 필터, 정렬 기준 초기화
  const handleReset = () => {
    setFilters({
      keyword: "",
      ingredients: [],
      r_category_id: null,
      level: null,
      cooking_time: null,
      sort: "name",
    });
  };

  return (
    <div>
      <h1>레시피 목록</h1>
      <input
        type="text"
        placeholder="레시피 제목 검색"
        value={filters.keyword}
        onChange={(e) =>
          setFilters({
            ...filters,
            keyword: e.target.value,
          })
        }
      /> 
      <p>현재 검색어 : {filters.keyword}</p> <br />

      {/* filters.level이 null 또는 undefined이면 빈 문자열 "" 사용 */}
      <select
        value={filters.level ?? ""}
        onChange={(e) =>
          setFilters({
            ...filters,
            level: e.target.value === "" ? null : e.target.value,
          })
        }
      >
        <option value="">전체 난이도</option>
        <option value="초급">초급</option>
        <option value="중급">중급</option>
        <option value="고급">고급</option>
      </select> <br />

      <select
        value={filters.cooking_time ?? ""}
        onChange={(e) =>
          setFilters({
            ...filters,
            cooking_time:
              e.target.value === ""
                ? null
                : e.target.value === "초과"
                ? "초과"
                : Number(e.target.value),
          })
        }
      >
        <option value="">전체 시간</option>
        <option value="15">15분 이하</option>
        <option value="30">30분 이하</option>
        <option value="60">60분 이하</option>
        <option value="초과">60분 초과</option>
      </select> <br />      

      <select
        value={filters.r_category_id ?? ""}
        onChange={(e) =>
          setFilters({
            ...filters,
            r_category_id:
              e.target.value === "" ? null : Number(e.target.value),
          })
        }
      >
        <option value="">전체 요리</option>
        <option value="1">밥</option>
        <option value="4">반찬</option>
      </select> <br />

      <select
        value={filters.sort}
        onChange={(e) =>
          setFilters({
            ...filters,
            sort: e.target.value,
          })
        }
      >
        <option value="name">가나다순</option>
        <option value="match_rate">일치율 높은 순</option>
      </select> <br />      

      <button type="button" onClick={handleReset}>
        검색 조건 초기화
      </button> <br />     

      <p>검색 결과: {filteredRecipes.length}개</p>

      {filteredRecipes.length === 0 && (
        <p>검색 결과가 없습니다.</p>
      )}

      {sortedRecipes.map((recipe)=>(
        <RecipeCard
         key={recipe.recipe_id}
         recipe={recipe}
         showMatch={true}
        />
      ))}
    </div>
  );
}

export default RecipeListPage;
