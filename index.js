const BASE_URL = "https://www.themealdb.com/api/json/v1/1";
const STORAGE_KEY = "nutriplan_food_log";

let currentViewMode = "grid";
let currentMeals = [];
let currentMeal = null;


async function getAllMeals() {
  try {
    let res = await fetch(`${BASE_URL}/search.php?s=`);
    let data = await res.json();
    return data.meals || [];
  } catch (err) {
    console.error("Error fetching meals:", err);
    return [];
  }
}

async function getMealsBySearch(query) {
  try {
    let res = await fetch(`${BASE_URL}/search.php?s=${query}`);
    let data = await res.json();
    return data.meals || [];
  } catch (err) {
    return [];
  }
}

async function getMealsByCategory(category) {
  try {
    let res = await fetch(`${BASE_URL}/filter.php?c=${category}`);
    let data = await res.json();
    let meals = data.meals || [];
    if (category === "Pasta") meals = meals.slice(0, 12);
    else if (category === "Vegan") meals = meals.slice(0, 7);
    else if (category === "Starter") meals = meals.slice(0, 14); 
    else meals = meals.slice(0, 20);
    return meals;
  } catch (err) {
    return [];
  }
}

async function getMealsByArea(area) {
  try {
    let res = await fetch(`${BASE_URL}/filter.php?a=${area}`);
    let data = await res.json();
    return (data.meals || []).slice(0, 20);
  } catch (err) {
    return [];
  }
}

async function getMealDetails(id) {
  try {
    let res = await fetch(`${BASE_URL}/lookup.php?i=${id}`);
    let data = await res.json();
    return data.meals ? data.meals[0] : null;
  } catch (err) {
    return null;
  }
}

async function getCategories() {
  try {
    let res = await fetch(`${BASE_URL}/categories.php`);
    let data = await res.json();
    return data.categories || [];
  } catch (err) {
    return [];
  }
}

async function getAreas() {
  try {
    let res = await fetch(`${BASE_URL}/list.php?a=list`);
    let data = await res.json();
    return data.meals || [];
  } catch (err) {
    return [];
  }
}


async function searchProducts(query) {
  try {
    let res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=20`);
    let data = await res.json();
    return data.products || [];
  } catch (err) {
    return [];
  }
}

async function getProductByBarcode(barcode) {
  try {
    let res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    let data = await res.json();
    return data.status === 1 ? data.product : null;
  } catch (err) {
    return null;
  }
}


function getLogs() {
  let data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function addLog(item) {
  let logs = getLogs();
  let timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  logs.push({ ...item, id: Date.now(), date: "Saturday, Oct 31", time: timeStr });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

function removeLog(id) {
  let logs = getLogs();
  logs = logs.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  renderFoodLog();
}

function clearFoodLogs() {
  localStorage.removeItem(STORAGE_KEY);
  renderFoodLog();
}

function getTotals() {
  let logs = getLogs();
  return logs.reduce((acc, item) => {
    acc.calories += Number(item.calories || 0);
    acc.protein += Number(item.protein || 0);
    acc.carbs += Number(item.carbs || 0);
    acc.fat += Number(item.fat || 0);
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });   
}

function handleRoute() {
  let hash = window.location.hash.replace("#", "") || "meals";
  if (hash === "home" || hash === "") hash = "meals";
  
  showSection(hash);

  if (hash === "scanner") {
    renderScannerUI();
    renderProducts([{
      product_name: "Product Name",
      brands: "Brand Name",
      image_front_url: "https://images.openfoodfacts.org/images/products/316/893/015/9742/front_fr.54.400.jpg",
      nutriscore_grade: "a",
      nutriments: { "energy-kcal_100g": 350, proteins_100g: 8.5, carbohydrates_100g: 45.2, fat_100g: 12.3 }
    }]);
  } else if (hash === "foodlog") {
    renderFoodLog();
  }
}

function showSection(name) {
  let isHome = (name === "meals");
  let isDetails = (name === "details");
  let isScanner = (name === "scanner");
  let isFoodLog = (name === "foodlog");

  let searchSec = document.getElementById("search-filters-section");
  let catSec = document.getElementById("meal-categories-section");
  let recipesSec = document.getElementById("all-recipes-section");
  let detailsSec = document.getElementById("meal-details");
  let productsSec = document.getElementById("products-section");
  let foodlogSec = document.getElementById("foodlog-section");

  if (searchSec) searchSec.style.display = isHome ? "block" : "none";
  if (catSec) catSec.style.display = isHome ? "block" : "none";
  if (recipesSec) recipesSec.style.display = isHome ? "block" : "none";
  if (detailsSec) detailsSec.style.display = isDetails ? "block" : "none";
  if (productsSec) productsSec.style.display = isScanner ? "block" : "none";
  if (foodlogSec) foodlogSec.style.display = isFoodLog ? "block" : "none";

  document.querySelectorAll(".nav-link").forEach((link, idx) => {
    if ((isHome || isDetails) && idx === 0) {
      link.className = "nav-link flex items-center gap-3 px-3 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg transition-all";
    } else if (isScanner && idx === 1) {
      link.className = "nav-link flex items-center gap-3 px-3 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg transition-all";
    } else if (isFoodLog && idx === 2) {
      link.className = "nav-link flex items-center gap-3 px-3 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg transition-all";
    } else {
      link.className = "nav-link flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-all";
    }
  });
}


async function initApp() {
  let dateEl = document.getElementById("foodlog-date");
  if (dateEl) dateEl.innerText = "Saturday, Oct 31";

  window.addEventListener("hashchange", handleRoute);

  try {
    let meals = await getAllMeals();
    currentMeals = meals.slice(0, 20);
    renderMeals(currentMeals);
    await renderCategories();
    await renderAreas();
  } catch (err) {
    console.error("Error loading initial data:", err);
  } finally {
    let overlay = document.getElementById("app-loading-overlay");
    if (overlay) {
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 500);
    }
  }

  initEvents();
  handleRoute();
}

function renderMeals(meals) {
  currentMeals = meals;
  let grid = document.getElementById("recipes-grid");
  let countEl = document.getElementById("recipes-count");
  if (!grid) return;

  if (countEl) countEl.innerText = `Showing ${meals.length} recipes`;

  if (meals.length === 0) {
    grid.innerHTML = `<div class="col-span-4 text-center py-12 text-gray-500">No recipes found.</div>`;
    return;
  }

  if (currentViewMode === "grid") {
    grid.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5";
    grid.innerHTML = meals.map(meal => `
      <div class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group" onclick="openMealDetails('${meal.idMeal}')">
        <div class="relative h-48 overflow-hidden">
          <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy" />
          <div class="absolute bottom-3 left-3 flex gap-2">
            ${meal.strCategory ? `<span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-full text-gray-700"><i class="fa-solid fa-utensils text-emerald-600 mr-1"></i>${meal.strCategory}</span>` : ''}
            ${meal.strArea ? `<span class="px-2 py-1 bg-emerald-500 text-xs font-semibold rounded-full text-white"><i class="fa-solid fa-globe text-white mr-1"></i>${meal.strArea}</span>` : ''}
          </div>
        </div>
        <div class="p-4">
          <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">${meal.strMeal}</h3>
          <p class="text-xs text-gray-600 mb-3 line-clamp-2">Delicious recipe to try!</p>
        </div>
      </div>
    `).join("");
  } else {
    grid.className = "grid grid-cols-1 md:grid-cols-2 gap-4";
    grid.innerHTML = meals.map(meal => `
      <div class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center p-3 gap-4 group" onclick="openMealDetails('${meal.idMeal}')">
        <div class="w-24 h-24 rounded-lg overflow-hidden shrink-0 relative">
          <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src="${meal.strMealThumb}" alt="${meal.strMeal}" loading="lazy" />
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            ${meal.strCategory ? `<span class="px-2 py-0.5 bg-gray-100 text-xs font-semibold rounded-full text-gray-700"><i class="fa-solid fa-utensils text-emerald-600 mr-1"></i>${meal.strCategory}</span>` : ''}
            ${meal.strArea ? `<span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full"><i class="fa-solid fa-globe text-blue-500 mr-1"></i>${meal.strArea}</span>` : ''}
          </div>
          <h3 class="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-1">${meal.strMeal}</h3>
          <p class="text-[11px] text-gray-500 mt-1 line-clamp-1">View ingredients and video tutorial.</p>
        </div>
      </div>
    `).join("");
  }
}

async function renderCategories() {
  let categories = await getCategories();
  let grid = document.getElementById("categories-grid");
  if (!grid) return;

  grid.innerHTML = categories.map(cat => `
    <div class="category-card bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl p-3 hover:shadow-md cursor-pointer transition-all group flex items-center gap-3" onclick="filterByCategory('${cat.strCategory}')">
      <div class="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center text-xs group-hover:scale-110 transition-transform shadow-xs shrink-0">
        <i class="fa-solid fa-utensils"></i>
      </div>
      <h3 class="text-xs font-bold">${cat.strCategory}</h3>
    </div>
  `).join("");
}

async function filterByCategory(cat) {
  let meals = await getMealsByCategory(cat);
  renderMeals(meals);
}

async function renderAreas() {
  let areas = await getAreas();
  let container = document.querySelector("#search-filters-section .flex.items-center.gap-3.overflow-x-auto");
  if (!container) return;

  let limitedAreas = areas.slice(0, 10);
  let html = `
    <button onclick="filterByArea('')" class="cuisine-btn px-4 py-2 bg-emerald-600 text-white rounded-full font-medium text-sm whitespace-nowrap hover:bg-emerald-700 transition-all">
      All Cuisines
    </button>
  `;
  
  html += limitedAreas.map(a => `
    <button onclick="filterByArea('${a.strArea}')" class="cuisine-btn px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-medium text-sm whitespace-nowrap hover:bg-gray-200 transition-all">
      ${a.strArea}
    </button>
  `).join("");

  container.innerHTML = html;
}

async function filterByArea(area) {
  if (!area) {
    let meals = await getAllMeals();
    renderMeals(meals.slice(0, 20));
  } else {
    let meals = await getMealsByArea(area);
    renderMeals(meals);
  }
}

async function openMealDetails(id) {
  window.location.hash = "details";
  let meal = await getMealDetails(id);
  if (!meal) return;
  currentMeal = meal;

  let titleEl = document.querySelector("#meal-details h1");
  if (titleEl) titleEl.innerText = meal.strMeal;

  let logBtn = document.getElementById("log-meal-btn");
  if (logBtn) {
    logBtn.onclick = () => {
      addLog({
        name: meal.strMeal,
        calories: 1270,
        protein: 42,
        carbs: 180,
        fat: 35
      });
      Swal.fire({
        icon: 'success',
        title: 'Logged Successfully!',
        text: `${meal.strMeal} added to your Food Log.`,
        timer: 1500,
        showConfirmButton: false
      });
    };
  }
}

function renderFoodLog() {
  let logs = getLogs();
  let totals = getTotals();
  let foodlogSec = document.getElementById("foodlog-section");
  if (!foodlogSec) return;

  let calPercent = Math.min(100, (totals.calories / 2000) * 100);
  let proPercent = Math.min(100, (totals.protein / 50) * 100);
  let carbPercent = Math.min(100, (totals.carbs / 250) * 100);
  let fatPercent = Math.min(100, (totals.fat / 65) * 100);

  foodlogSec.innerHTML = `
    <div class="max-w-7xl mx-auto">
      <div class="bg-purple-600 rounded-2xl p-6 text-white mb-6 shadow-md flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <i class="fa-solid fa-book-medical text-xl"></i>
            <h2 class="text-xl font-bold">Daily Food Log</h2>
          </div>
          <p class="text-purple-100 text-sm">Track and monitor your daily nutrition intake</p>
        </div>
        <div class="bg-purple-700/80 backdrop-blur-sm px-4 py-2 rounded-xl text-right">
          <div class="text-xs text-purple-200 font-semibold">Today</div>
          <div id="foodlog-date" class="text-sm font-bold">Saturday, Oct 31</div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-gray-900 text-base flex items-center gap-2">
            <i class="fa-solid fa-fire text-orange-500"></i> Today's Nutrition
          </h3>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-emerald-50 rounded-xl p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-gray-700">Calories</span>
              <span class="text-sm text-gray-500">${totals.calories} / 2000 kcal</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div class="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style="width: ${calPercent}%"></div>
            </div>
          </div>
          <div class="bg-blue-50 rounded-xl p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-gray-700">Protein</span>
              <span class="text-sm text-gray-500">${totals.protein} / 50 g</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div class="bg-blue-500 h-2.5 rounded-full transition-all duration-500" style="width: ${proPercent}%"></div>
            </div>
          </div>
          <div class="bg-amber-50 rounded-xl p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-gray-700">Carbs</span>
              <span class="text-sm text-gray-500">${totals.carbs} / 250 g</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div class="bg-amber-500 h-2.5 rounded-full transition-all duration-500" style="width: ${carbPercent}%"></div>
            </div>
          </div>
          <div class="bg-purple-50 rounded-xl p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-gray-700">Fat</span>
              <span class="text-sm text-gray-500">${totals.fat} / 65 g</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5">
              <div class="bg-purple-500 h-2.5 rounded-full transition-all duration-500" style="width: ${fatPercent}%"></div>
            </div>
          </div>
        </div>

        <div class="border-t pt-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-bold text-gray-800 text-sm">Logged Items (${logs.length})</h4>
            <button onclick="clearFoodLogs()" class="text-xs text-red-500 hover:text-red-700 font-semibold" style="display: ${logs.length > 0 ? 'inline-block' : 'none'};">Clear All</button>
          </div>
          <div id="logged-items-list" class="space-y-3">
            ${logs.length === 0 ? `
              <div class="text-center py-8 text-gray-500">
                <i class="fa-solid fa-utensils text-4xl mb-3 text-gray-300"></i>
                <p class="font-medium text-sm">No food logged today</p>
                <p class="text-xs text-gray-400 mt-0.5">Start tracking your nutrition by logging meals or scanning products</p>
                <div class="flex justify-center gap-3 mt-4">
                  <a href="#meals" class="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-all">+ Browse Recipes</a>
                  <a href="#scanner" class="px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-all"><i class="fa-solid fa-barcode mr-1"></i> Scan Product</a>
                </div>
              </div>
            ` : logs.map(item => `
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <h5 class="font-bold text-gray-900 text-sm">${item.name}</h5>
                  <p class="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                    <span><i class="fa-solid fa-clock text-gray-400 mr-1"></i>${item.time || "12:00 PM"}</span>
                    <span>•</span>
                    <span>${item.calories || 0} kcal | P: ${item.protein || 0}g, C: ${item.carbs || 0}g, F: ${item.fat || 0}g</span>
                  </p>
                </div>
                <button onclick="removeLog(${item.id})" class="text-red-500 hover:text-red-700 text-sm"><i class="fa-solid fa-trash"></i></button>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderScannerUI() {
  let productsSec = document.getElementById("products-section");
  if (!productsSec) return;

  productsSec.innerHTML = `
    <div class="max-w-7xl mx-auto">
      <div class="bg-teal-700 rounded-2xl p-6 text-white mb-6 shadow-md">
        <div class="flex items-center gap-3 mb-2">
          <i class="fa-solid fa-barcode text-2xl"></i>
          <h2 class="text-xl font-bold">Product Search & Barcode Scanner</h2>
        </div>
        <p class="text-teal-100 text-sm mb-6">Search packaged food products to view nutrition information</p>
        
        <div class="flex gap-2 mb-3">
          <div class="relative flex-1">
            <input type="text" id="product-search-input" placeholder="Search by product name..." class="w-full pl-10 pr-4 py-3 bg-white text-gray-800 rounded-xl text-sm focus:outline-none shadow-sm" />
          </div>
          <button id="search-product-btn" onclick="handleProductSearch()" class="px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white font-semibold rounded-xl text-sm transition-all shadow-sm">
            Search
          </button>
        </div>

        <div class="text-center text-teal-200 text-xs my-2 font-medium">or</div>

        <div class="flex gap-2">
          <div class="relative flex-1">
            <input type="text" id="barcode-input" placeholder="Enter barcode number..." class="w-full pl-10 pr-4 py-3 bg-white text-gray-800 rounded-xl text-sm focus:outline-none shadow-sm" />
          </div>
          <button id="lookup-barcode-btn" onclick="handleBarcodeLookup()" class="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center gap-2">
            <i class="fa-solid fa-magnifying-glass"></i> Lookup
          </button>
        </div>
      </div>

      <div>
        <div class="flex items-center justify-between mb-4">
          <h3 id="products-count" class="font-bold text-gray-900 text-sm">Showing 0 products</h3>
        </div>
        <div id="products-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"></div>
      </div>
    </div>
  `;
}

async function handleProductSearch() {
  let input = document.getElementById("product-search-input");
  if (!input) return;
  let query = input.value.trim();
  if (!query) return;
  let products = await searchProducts(query);
  renderProducts(products);
}

async function handleBarcodeLookup() {
  let input = document.getElementById("barcode-input");
  if (!input) return;
  let barcode = input.value.trim();
  if (!barcode) return;
  let product = await getProductByBarcode(barcode);
  if (product) {
    renderProducts([product]);
  } else {
    Swal.fire("Not Found", "No product found with this barcode.", "error");
  }
}

function renderProducts(products) {
  let grid = document.getElementById("products-grid");
  let countEl = document.getElementById("products-count");
  if (!grid) return;

  if (countEl) countEl.innerText = `Showing ${products.length} products`;

  if (products.length === 0) {
    grid.innerHTML = `<div class="col-span-4 text-center py-12 text-gray-400">No products to display</div>`;
    return;
  }

  grid.innerHTML = products.map(p => {
    let name = p.product_name || "Unknown Product";
    let brand = p.brands || "Unknown Brand";
    let img = p.image_front_url || "https://images.openfoodfacts.org/images/products/316/893/015/9742/front_fr.54.400.jpg";
    let nutriscore = (p.nutriscore_grade || "a").toUpperCase();
    let calories = p.nutriments?.["energy-kcal_100g"] || 0;
    let proteins = p.nutriments?.proteins_100g || 0;
    let carbs = p.nutriments?.carbohydrates_100g || 0;
    let fat = p.nutriments?.fat_100g || 0;

    return `
      <div class="product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group">
        <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
          <img class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" src="${img}" alt="${name}" loading="lazy" />
          <div class="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded uppercase">
            Nutri-Score ${nutriscore}
          </div>
        </div>
        <div class="p-4">
          <p class="text-xs text-emerald-600 font-semibold mb-1 truncate">${brand}</p>
          <h3 class="font-bold text-gray-900 mb-2 line-clamp-2">${name}</h3>
          <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <span><i class="fa-solid fa-fire mr-1"></i>${calories} kcal/100g</span>
          </div>
          <button onclick="logProductItem('${name.replace(/'/g, "")}', ${calories}, ${proteins}, ${carbs}, ${fat})" class="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-all">
            Add to Food Log
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function logProductItem(name, calories, protein, carbs, fat) {
  addLog({ name, calories, protein, carbs, fat });
  Swal.fire({
    icon: 'success',
    title: 'Product Logged!',
    text: `${name} added to your Food Log.`,
    timer: 1500,
    showConfirmButton: false
  });
}

function initEvents() {
  let searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", async (e) => {
      let query = e.target.value.trim();
      if (query.length > 0) {
        let meals = await getMealsBySearch(query);
        renderMeals(meals.slice(0, 20));
      } else {
        let meals = await getAllMeals();
        renderMeals(meals.slice(0, 20));
      }
    });
  }

  let gridBtn = document.getElementById("grid-view-btn");
  let listBtn = document.getElementById("list-view-btn");
  if (gridBtn && listBtn) {
    gridBtn.addEventListener("click", () => {
      currentViewMode = "grid";
      gridBtn.className = "px-3 py-1.5 bg-white rounded-md shadow-sm";
      gridBtn.querySelector("i").className = "fa-solid fa-table-cells text-gray-700";
      listBtn.className = "px-3 py-1.5";
      listBtn.querySelector("i").className = "fa-solid fa-list text-gray-500";
      renderMeals(currentMeals);
    });

    listBtn.addEventListener("click", () => {
      currentViewMode = "list";
      listBtn.className = "px-3 py-1.5 bg-white rounded-md shadow-sm";
      listBtn.querySelector("i").className = "fa-solid fa-list text-gray-700";
      gridBtn.className = "px-3 py-1.5";
      gridBtn.querySelector("i").className = "fa-solid fa-table-cells text-gray-500";
      renderMeals(currentMeals);
    });
  }

  document.querySelectorAll(".nav-link").forEach((link, index) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (index === 0) window.location.hash = "meals";
      if (index === 1) window.location.hash = "scanner";
      if (index === 2) window.location.hash = "foodlog";
    });
  });

  let backBtn = document.getElementById("back-to-meals-btn");
  if (backBtn) {
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.hash = "meals";
    });
  }
}


window.addEventListener("DOMContentLoaded", initApp);