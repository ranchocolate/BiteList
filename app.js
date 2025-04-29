const meals = [
  {
    name: "Spaghetti Carbonara",
    type: "dinner",
    cuisine: "italian",
    ingredients: [
      { item: "Spaghetti", quantity: 200, unit: "g", department: "Pasta" },
      { item: "Bacon", quantity: 100, unit: "g", department: "Meat" },
      { item: "Egg", quantity: 2, unit: "pcs", department: "Dairy" },
      { item: "Parmesan", quantity: 50, unit: "g", department: "Dairy" }
    ],
    dietaryTags: ["glutenfree"]
  },
  {
    name: "Chicken Tikka Masala",
    type: "dinner",
    cuisine: "indian",
    ingredients: [
      { item: "Chicken Breast", quantity: 500, unit: "g", department: "Meat" },
      { item: "Tomato Sauce", quantity: 250, unit: "ml", department: "Canned Goods" },
      { item: "Yogurt", quantity: 125, unit: "ml", department: "Dairy" },
      { item: "Spices", quantity: 2, unit: "tbsp", department: "Spices" }
    ],
    dietaryTags: ["glutenfree", "nutfree"]
  }
];

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
let weekPlan = {};
weekDays.forEach(day => {
  weekPlan[day] = { breakfast: [], lunch: [], dinner: [], snack: [] };
});

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("mealType").addEventListener("change", displayMeals);
  document.getElementById("cuisine").addEventListener("change", displayMeals);
  document.getElementById("dietaryRestriction").addEventListener("change", displayMeals);
  document.getElementById("numServings").addEventListener("input", displayMeals);
  document.getElementById("unitSystem").addEventListener("change", displayMeals);
  displayMeals();
  displayWeekPlan();
});

function displayMeals() {
  const mealList = document.getElementById("mealList");
  mealList.innerHTML = "";

  const type = document.getElementById("mealType").value;
  const cuisine = document.getElementById("cuisine").value;
  const restriction = document.getElementById("dietaryRestriction").value.toLowerCase();
  const servings = parseInt(document.getElementById("numServings").value);
  const unitSystem = document.getElementById("unitSystem").value;

  const filtered = meals.filter(m => {
    const matchesType = type === "all" || m.type === type;
    const matchesCuisine = cuisine === "all" || m.cuisine === cuisine;
    const matchesDiet = restriction === "all" || (m.dietaryTags || []).map(t => t.toLowerCase()).includes(restriction);
    return matchesType && matchesCuisine && matchesDiet;
  });

  filtered.forEach(meal => {
    const div = document.createElement("div");
    div.className = "meal";
    const title = document.createElement("div");
    title.className = "meal-title";
    title.textContent = `${meal.name} (${meal.cuisine})`;
    div.appendChild(title);

    meal.ingredients.forEach(ing => {
      const qty = adjustQuantity(ing.quantity, unitSystem, ing.unit, servings);
      const p = document.createElement("div");
      p.textContent = `${ing.item}: ${qty.value} ${qty.unit} (${ing.department})`;
      div.appendChild(p);
    });

    const daySelect = document.createElement("select");
    daySelect.innerHTML = weekDays.map(d => `<option value="${d}">${d}</option>`).join("");
    const mealTypeSelect = document.createElement("select");
    ["breakfast", "lunch", "dinner", "snack"].forEach(type => {
      const opt = document.createElement("option");
      opt.value = type;
      opt.textContent = type.charAt(0).toUpperCase() + type.slice(1);
      mealTypeSelect.appendChild(opt);
    });

    const btn = document.createElement("button");
    btn.textContent = "Add to Day";
    btn.onclick = () => {
      const day = daySelect.value;
      const mealType = mealTypeSelect.value;
      weekPlan[day][mealType].push(meal);
      displayWeekPlan();
      updateGroceryList();
    };

    div.appendChild(daySelect);
    div.appendChild(mealTypeSelect);
    div.appendChild(btn);
    mealList.appendChild(div);
  });
}

function displayWeekPlan() {
  const container = document.getElementById("weekPlan");
  container.innerHTML = "";
  for (let day of weekDays) {
    const section = document.createElement("div");
    section.className = "week-day";
    section.innerHTML = `<h3>${day}</h3>`;
    ["breakfast", "lunch", "dinner", "snack"].forEach(type => {
      if (weekPlan[day][type].length) {
        const list = document.createElement("ul");
        list.innerHTML = `<strong>${type.charAt(0).toUpperCase() + type.slice(1)}:</strong>`;
        weekPlan[day][type].forEach(m => {
          const item = document.createElement("li");
          item.textContent = m.name;
          list.appendChild(item);
        });
        section.appendChild(list);
      }
    });
    container.appendChild(section);
  }
}

function updateGroceryList() {
  const grocery = {};
  for (let day in weekPlan) {
    for (let type in weekPlan[day]) {
      weekPlan[day][type].forEach(meal => {
        meal.ingredients.forEach(ing => {
          const key = `${ing.item}|${ing.department}|${ing.unit}`;
          grocery[key] = grocery[key] || { ...ing, total: 0 };
          grocery[key].total += ing.quantity;
        });
      });
    }
  }

  const list = document.getElementById("groceryList");
  list.innerHTML = "";
  for (let key in grocery) {
    const { item, total, unit, department } = grocery[key];
    const li = document.createElement("li");
    li.textContent = `${item}: ${total} ${unit} (${department})`;
    list.appendChild(li);
  }
}

function adjustQuantity(value, system, unit, servings) {
  const scale = servings / 2;
  let val = value * scale;
  if (system === "imperial") {
    if (unit === "g") return { value: (val * 0.0353).toFixed(1), unit: "oz" };
    if (unit === "ml") return { value: (val * 0.0042).toFixed(1), unit: "cups" };
  }
  return { value: val.toFixed(1), unit };
}
