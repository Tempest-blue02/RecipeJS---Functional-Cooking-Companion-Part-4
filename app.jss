(() => {
  // ─────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────
  let state = {
    recipes: [],              // recipe data
    filterType: "all",
    sortType: "default",
    searchQuery: "",
    favorites: JSON.parse(localStorage.getItem("recipeFavorites")) || []
  };

  let debounceTimer = null;

  // ─────────────────────────────────────────────────────────────
  // DOM REFERENCES
  // ─────────────────────────────────────────────────────────────
  const container = document.querySelector("#recipe-container");
  const counterEl = document.querySelector("#recipe-counter");
  const searchInput = document.querySelector("#search-input");
  const clearSearchBtn = document.querySelector("#clear-search");

  const filterGroup = document.querySelector(".filter-group");
  const sortGroup = document.querySelector(".sort-group");

  // ─────────────────────────────────────────────────────────────
  // DATA (You may replace with your dataset)
  // ─────────────────────────────────────────────────────────────
  state.recipes = [
    {
      id: 1,
      title: "Pasta",
      type: "veg",
      time: 20,
      description: "A quick Italian pasta.",
      ingredients: ["pasta", "tomato", "cheese"],
      steps: [
        "Boil pasta",
        { title: "Make sauce", steps: ["Heat pan", "Add tomatoes"] }
      ]
    },
    {
      id: 2,
      title: "Chicken Curry",
      type: "non-veg",
      time: 45,
      description: "Classic Indian curry.",
      ingredients: ["chicken", "spices", "onion"],
      steps: ["Marinate chicken", "Cook spices", "Add chicken"]
    }
    // add your full recipe list here…
  ];

  // ─────────────────────────────────────────────────────────────
  // FAVORITES – PERSISTENCE
  // ─────────────────────────────────────────────────────────────
  const saveFavorites = () => {
    localStorage.setItem("recipeFavorites", JSON.stringify(state.favorites));
  };

  const toggleFavorite = (recipeId) => {
    const id = Number(recipeId);
    if (state.favorites.includes(id)) {
      state.favorites = state.favorites.filter(f => f !== id);
    } else {
      state.favorites.push(id);
    }
    saveFavorites();
    updateDisplay();
  };

  // ─────────────────────────────────────────────────────────────
  // SEARCH FILTER
  // ─────────────────────────────────────────────────────────────
  const searchFilter = (recipes, query) => {
    if (!query.trim()) return recipes;
    const lower = query.toLowerCase().trim();

    return recipes.filter(r => {
      const titleMatch = r.title.toLowerCase().includes(lower);

      const ingredientMatch = r.ingredients.some(ing =>
        ing.toLowerCase().includes(lower)
      );

      const descMatch = r.description.toLowerCase().includes(lower);

      return titleMatch || ingredientMatch || descMatch;
    });
  };

  // ─────────────────────────────────────────────────────────────
  // TYPE FILTER
  // ─────────────────────────────────────────────────────────────
  const applyFilter = (recipes, filterType) => {
    switch (filterType) {
      case "veg":
        return recipes.filter(r => r.type === "veg");
      case "non-veg":
        return recipes.filter(r => r.type === "non-veg");
      case "favorites":
        return recipes.filter(r => state.favorites.includes(r.id));
      default:
        return recipes;
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SORTING
  // ─────────────────────────────────────────────────────────────
  const applySort = (recipes, sortType) =>
    sortType === "time"
      ? [...recipes].sort((a, b) => a.time - b.time)
      : sortType === "time-desc"
      ? [...recipes].sort((a, b) => b.time - a.time)
      : recipes;

  // ─────────────────────────────────────────────────────────────
  // UI HELPERS
  // ─────────────────────────────────────────────────────────────
  const updateCounter = (count, total) => {
    counterEl.textContent = `Showing ${count} of ${total} recipes`;
  };

  // Recursively render nested steps
  const renderSteps = (steps) => {
    return steps
      .map(step =>
        typeof step === "string"
          ? `<li>${step}</li>`
          : `
            <li>
              <strong>${step.title}</strong>
              <ul>${renderSteps(step.steps)}</ul>
            </li>
          `
      )
      .join("");
  };

  // ─────────────────────────────────────────────────────────────
  // CARD CREATION
  // ─────────────────────────────────────────────────────────────
  const createRecipeCard = (recipe) => {
    const isFav = state.favorites.includes(recipe.id) ? "active" : "";

    return `
      <div class="recipe-card">
        <button class="favorite-btn ${isFav}" data-recipe-id="${recipe.id}">
          ❤️
        </button>

        <h3>${recipe.title}</h3>
        <p>${recipe.description}</p>
        <p><strong>Time:</strong> ${recipe.time} min</p>

        <div class="toggle-btn" data-toggle="ingredients-${recipe.id}">
          Ingredients ▼
        </div>
        <ul id="ingredients-${recipe.id}" class="hidden">
          ${recipe.ingredients.map(i => `<li>${i}</li>`).join("")}
        </ul>

        <div class="toggle-btn" data-toggle="steps-${recipe.id}">
          Steps ▼
        </div>
        <ul id="steps-${recipe.id}" class="hidden">
          ${renderSteps(recipe.steps)}
        </ul>
      </div>
    `;
  };

  // ─────────────────────────────────────────────────────────────
  // DISPLAY UPDATE
  // ─────────────────────────────────────────────────────────────
  const updateDisplay = () => {
    let result = state.recipes;

    result = searchFilter(result, state.searchQuery);
    result = applyFilter(result, state.filterType);
    result = applySort(result, state.sortType);

    updateCounter(result.length, state.recipes.length);

    container.innerHTML = result.map(createRecipeCard).join("");
  };

  // ─────────────────────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    clearTimeout(debounceTimer);

    const value = e.target.value;
    clearSearchBtn.classList.toggle("hide", !value);

    debounceTimer = setTimeout(() => {
      state.searchQuery = value;
      updateDisplay();
    }, 300);
  };

  const clearSearch = () => {
    searchInput.value = "";
    state.searchQuery = "";
    clearSearchBtn.classList.add("hide");
    updateDisplay();
  };

  const handleCardClick = (e) => {
    const favId = e.target.dataset.recipeId;
    if (favId) return toggleFavorite(favId);

    const toggleId = e.target.dataset.toggle;
    if (toggleId) {
      const el = document.getElementById(toggleId);
      el.classList.toggle("hidden");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SETUP
  // ─────────────────────────────────────────────────────────────
  const setupEventListeners = () => {
    searchInput.addEventListener("input", handleSearch);
    clearSearchBtn.addEventListener("click", clearSearch);

    filterGroup.addEventListener("click", (e) => {
      if (e.target.dataset.filter) {
        state.filterType = e.target.dataset.filter;
        updateDisplay();
      }
    });

    sortGroup.addEventListener("click", (e) => {
      if (e.target.dataset.sort) {
        state.sortType = e.target.dataset.sort;
        updateDisplay();
      }
    });

    container.addEventListener("click", handleCardClick);
  };

  const init = () => {
    setupEventListeners();
    updateDisplay();
    console.log("RecipeJS initialized.");
  };

  init();
})();
