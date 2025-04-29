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
  document.getElementById("fetchMealsBtn").addEventListener("click", async () => {
  const diets = getCheckedValues("dietCheckboxes");
  const types = getCheckedValues("typeCheckboxes");
  const cuisines = getCheckedValues("cuisineCheckboxes");

  const prompt = buildMealPrompt(diets, types, cuisines);
  const meals = await fetchMealsFromLLM(prompt);

  if (meals.length > 0) {
    meals.forEach(m => meals.push(m)); // Append or replace meals as needed
    displayMeals();
  } else {
    alert("No meals returned from AI. Try fewer filters.");
  }
});

function getCheckedValues(id) {
  const checkboxes = document.getElementById(id).querySelectorAll("input[type=checkbox]");
  return Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
}

function buildMealPrompt(diets, types, cuisines) {
  const parts = [];

  if (diets.length) parts.push(`${diets.join(", ")} diet`);
  if (cuisines.length) parts.push(`${cuisines.join(", ")} cuisine`);
  if (types.length) parts.push(`${types.join(", ")} meals`);
  else parts.push("meals");

  return `Give me 8 ${parts.join(" ")} suitable for 2 servings. Return as a JSON array. Each meal should include:
- name
- type
- cuisine
- dietaryTags (array)
- ingredients (array with item, quantity [in grams or ml], unit, department).`;
}

});

function displayMeals() {
  const container = document.getElementById("available-meals");
  container.innerHTML = "";

  meals.forEach((meal, i) => {
    const mealEl = document.createElement("div");
    mealEl.className = "meal";
    mealEl.innerHTML = `
      <strong>${meal.name}</strong><br>
      Type: ${meal.type} | Cuisine: ${meal.cuisine}<br>
      Tags: ${meal.dietaryTags?.join(", ") || "None"}<br>
      <button onclick="addMealToDay(${i})">Add to Day</button>
    `;
    container.appendChild(mealEl);
  });
}

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

  async function fetchMealsFromLLM(promptText) {
  const apiKey = "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"; // replace with your actual key

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral/mistral-7b-instruct",
      messages: [
        {
          role: "system",
          content: "You are a meal planner AI. Respond ONLY with valid JSON. No extra commentary, no markdown.",
        },
        {
          role: "user",
          content: promptText
        }
      ],
      max_tokens: 1200,
    }),
  });

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  try {
    // Extract array from full content if there's extra junk
    const jsonStart = content.indexOf("[");
    const jsonEnd = content.lastIndexOf("]");
    const jsonText = content.substring(jsonStart, jsonEnd + 1);

    const mealsFromAI = JSON.parse(jsonText);
    return mealsFromAI;
  } catch (e) {
    console.error("AI response parse failed:", e, content);
    alert("AI response couldn't be understood. Try again or reduce filter complexity.");
    return [];
  }
}
document.getElementById("fetchMealsBtn").addEventListener("click", () => {
  console.log("Fetch button clicked!");
});

