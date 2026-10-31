/*
 * script.js – PRÁCE SE STRÁNKOU
 *
 * Tento soubor čte údaje z formuláře, nechá je zkontrolovat a spočítat
 * (funkcemi z bmi.js) a výsledek zobrazí na stránce.
 */

// Najdeme na stránce prvky, se kterými budeme pracovat.
const form = document.getElementById("bmi-form");
const resultEmpty = document.getElementById("result-empty");
const result = document.getElementById("result");
const resultTitle = document.getElementById("result-title");
const adultResult = document.getElementById("adult-result");
const childResult = document.getElementById("child-result");

// Krátké vysvětlení ke každé kategorii pro dospělé.
const CATEGORY_TEXTS = {
  underweight:
    "BMI je nižší než 18,5. Hmotnost je vzhledem k výšce nižší, než je rozmezí, které WHO označuje jako normální.",
  normal:
    "BMI je v rozmezí 18,5–24,9, které WHO u dospělých označuje jako normální hmotnost.",
  overweight:
    "BMI je v rozmezí 25,0–29,9, které WHO u dospělých označuje jako nadváhu.",
  obesity:
    "BMI je 30,0 nebo více, což WHO u dospělých označuje jako obezitu.",
};

/**
 * Zapíše číslo česky: s desetinnou čárkou (22,9 místo 22.9).
 * maxDecimals = kolik nejvýš desetinných míst ukázat.
 */
function formatNumber(value, maxDecimals) {
  return value.toLocaleString("cs-CZ", { maximumFractionDigits: maxDecimals });
}

/**
 * Zapíše BMI vždy s jedním desetinným místem (např. 25,0).
 */
function formatBmi(value) {
  return value.toLocaleString("cs-CZ", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/**
 * Správný tvar slova podle čísla: 1 rok, 2–4 roky, 5 a více let.
 */
function formatYears(age) {
  if (age === 1) return "1 rok";
  if (age >= 2 && age <= 4) return age + " roky";
  return age + " let";
}

/**
 * Vrátí "=", když je výsledek přesný, nebo "≈" (přibližně), když jsme zaokrouhlili.
 */
function equalsSign(exact, rounded) {
  return Math.abs(exact - rounded) < 1e-9 ? "=" : "≈";
}

/**
 * Zobrazí nebo smaže chybové zprávy u políček formuláře.
 */
function showErrors(errors) {
  for (const field of ["weight", "height", "age", "sex"]) {
    const message = errors[field] || "";
    document.getElementById(field + "-error").textContent = message;

    // aria-invalid říká čtečkám obrazovky, že políčko je vyplněné špatně
    const inputs = form.querySelectorAll(`[name="${field}"]`);
    for (const input of inputs) {
      if (message) {
        input.setAttribute("aria-invalid", "true");
      } else {
        input.removeAttribute("aria-invalid");
      }
    }
  }
}

/**
 * Vypíše výpočet krok za krokem s dosazenými čísly.
 */
function showCalculation(weight, height, bmi) {
  const heightM = height / 100;
  const heightSquared = heightM * heightM;
  const shownSquared = Math.round(heightSquared * 10000) / 10000; // 4 desetinná místa

  document.getElementById("step-height").textContent =
    `${formatNumber(height, 1)} cm = ${formatNumber(heightM, 3)} m`;

  document.getElementById("step-square").textContent =
    `${formatNumber(heightM, 3)} × ${formatNumber(heightM, 3)} ` +
    `${equalsSign(heightSquared, shownSquared)} ${formatNumber(shownSquared, 4)}`;

  const exactBmi = weight / heightSquared;
  document.getElementById("step-divide").textContent =
    `${formatNumber(weight, 1)} ÷ ${formatNumber(shownSquared, 4)} ` +
    `${equalsSign(exactBmi, bmi)} ${formatBmi(bmi)}`;
}

/**
 * Zobrazí výsledek pro dospělého: kategorii, text a barevnou stupnici.
 */
function showAdultResult(bmi, category) {
  document.getElementById("category-name").textContent = category.name;
  document.getElementById("category-text").textContent = CATEGORY_TEXTS[category.id];

  // Posuneme značku na stupnici na správné místo
  const marker = document.getElementById("scale-marker");
  marker.style.left = getScalePosition(bmi) + "%";
  marker.dataset.category = category.id;

  // Zvýrazníme řádek legendy s kategorií uživatele
  for (const item of document.querySelectorAll(".legend li")) {
    item.classList.toggle("is-active", item.dataset.category === category.id);
  }

  adultResult.hidden = false;
  childResult.hidden = true;
}

/**
 * Zobrazí výsledek pro dítě nebo dospívajícího – BEZ kategorií pro dospělé.
 */
function showChildResult(bmi, age, sex) {
  document.getElementById("child-age").textContent = formatYears(age);
  document.getElementById("child-bmi").textContent = formatBmi(bmi);
  document.getElementById("child-sex").textContent = sex === "male" ? "chlapce" : "dívky";

  childResult.hidden = false;
  adultResult.hidden = true;
}

/**
 * Hlavní funkce: spustí se po stisknutí tlačítka "Spočítat BMI".
 */
function handleSubmit(event) {
  // Zabráníme tomu, aby prohlížeč formulář odeslal a znovu načetl stránku.
  event.preventDefault();

  // 1. Přečteme, co uživatel napsal.
  const checkedSex = form.querySelector('input[name="sex"]:checked');
  const input = {
    weight: form.weight.value,
    height: form.height.value,
    age: form.age.value,
    sex: checkedSex ? checkedSex.value : "",
  };

  // 2. Zkontrolujeme údaje.
  const { values, errors } = validateInputs(input);
  showErrors(errors);

  const firstWrongField = Object.keys(errors)[0];
  if (firstWrongField) {
    // Přesuneme kurzor na první špatně vyplněné políčko.
    form.querySelector(`[name="${firstWrongField}"]`).focus();
    return;
  }

  // 3. Spočítáme BMI a zaokrouhlíme ho.
  const bmi = roundToOneDecimal(calculateBmi(values.weight, values.height));

  // 4. Zobrazíme výsledek.
  document.getElementById("result-value").textContent = formatBmi(bmi);
  showCalculation(values.weight, values.height, bmi);

  const interpretation = interpretBmi(bmi, values.age);
  if (interpretation.group === "adult") {
    showAdultResult(bmi, interpretation.category);
  } else {
    showChildResult(bmi, values.age, values.sex);
  }

  resultEmpty.hidden = true;
  result.hidden = false;

  // Přesuneme pozornost na výsledek (čtečka obrazovky ho přečte, na mobilu se k němu posune).
  resultTitle.focus();
}

form.addEventListener("submit", handleSubmit);
