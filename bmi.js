/*
 * bmi.js – VÝPOČTY A PRAVIDLA
 *
 * V tomto souboru jsou jen výpočty. Nic tady nemění webovou stránku.
 * Díky tomu můžeme výpočty snadno vyzkoušet automatickými testy
 * (viz soubor tests/bmi.test.js).
 *
 * Se stránkou pracuje až soubor script.js.
 */

// Od kolika let používáme hranice BMI pro dospělé.
const ADULT_AGE = 18;

// Rozsahy, ve kterých musí být zadané hodnoty.
// Nejde o lékařské hranice – jen kontrolujeme, že čísla dávají smysl.
const LIMITS = {
  weight: { min: 5, max: 350 }, // kilogramy
  height: { min: 50, max: 250 }, // centimetry
  age: { min: 2, max: 120 }, // roky (BMI kalkulačky se používají od 2 let)
};

// Kategorie BMI pro dospělé podle WHO.
// "from" = od této hodnoty (včetně), "upTo" = do této hodnoty (už ne včetně).
// Příklad: normální hmotnost je od 18,5 do 24,9 – tedy "méně než 25".
const ADULT_CATEGORIES = [
  { id: "underweight", name: "Podváha", from: 0, upTo: 18.5 },
  { id: "normal", name: "Normální hmotnost", from: 18.5, upTo: 25 },
  { id: "overweight", name: "Nadváha", from: 25, upTo: 30 },
  { id: "obesity", name: "Obezita", from: 30, upTo: Infinity },
];

// Rozsah barevné stupnice na stránce (BMI 15 až 35).
const SCALE_MIN = 15;
const SCALE_MAX = 35;

/**
 * Převede text z formuláře na číslo.
 * V češtině píšeme desetinnou čárku (70,5), JavaScript ale chce tečku (70.5),
 * proto čárku nahradíme tečkou.
 * Když text není číslo, vrátí NaN ("Not a Number" = není číslo).
 */
function parseNumber(text) {
  const cleaned = String(text).trim().replace(",", ".");
  if (cleaned === "") {
    return NaN;
  }
  return Number(cleaned);
}

/**
 * Spočítá BMI.
 * Vzorec: BMI = hmotnost (kg) / výška (m)²
 * Výšku dostáváme v centimetrech, proto ji nejdřív vydělíme 100.
 */
function calculateBmi(weightKg, heightCm) {
  const heightM = heightCm / 100; // 175 cm → 1,75 m
  const heightSquared = heightM * heightM; // výška na druhou
  return weightKg / heightSquared;
}

/**
 * Zaokrouhlí číslo na jedno desetinné místo.
 * Trik: 22,857 × 10 = 228,57 → zaokrouhlit → 229 → ÷ 10 = 22,9
 */
function roundToOneDecimal(value) {
  return Math.round(value * 10) / 10;
}

/**
 * Je člověk dospělý (18 let a více)?
 */
function isAdult(age) {
  return age >= ADULT_AGE;
}

/**
 * Najde kategorii WHO pro dospělé.
 * Používáme ZAOKROUHLENÉ BMI, aby kategorie vždy odpovídala číslu,
 * které uživatel vidí. (Např. 24,96 se zobrazí jako 25,0 → nadváha.)
 */
function getAdultCategory(roundedBmi) {
  for (const category of ADULT_CATEGORIES) {
    if (roundedBmi >= category.from && roundedBmi < category.upTo) {
      return category;
    }
  }
  return null; // sem by se program neměl nikdy dostat
}

/**
 * Rozhodne, jak výsledek vyhodnotit.
 * - Dospělý: vrátí kategorii WHO.
 * - Dítě nebo dospívající: kategorii pro dospělé NEPOUŽIJE,
 *   protože u dětí se BMI hodnotí podle percentilových grafů.
 */
function interpretBmi(roundedBmi, age) {
  if (isAdult(age)) {
    return { group: "adult", category: getAdultCategory(roundedBmi) };
  }
  return { group: "child", category: null };
}

/**
 * Spočítá, kam na barevné stupnici (0 až 100 %) patří značka výsledku.
 * Hodnoty mimo stupnici "přilepíme" na její okraj.
 */
function getScalePosition(bmi) {
  const limited = Math.min(Math.max(bmi, SCALE_MIN), SCALE_MAX);
  return ((limited - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;
}

/**
 * Zkontroluje jedno číslo z formuláře.
 * Vrátí text chyby, nebo prázdný text "", když je vše v pořádku.
 */
function checkNumber(value, limits, messages) {
  if (Number.isNaN(value)) {
    return messages.notNumber;
  }
  if (value < limits.min || value > limits.max) {
    return messages.outOfRange;
  }
  return "";
}

/**
 * Zkontroluje všechny údaje z formuláře.
 * Dostane texty tak, jak je uživatel napsal.
 * Vrátí:
 *   values – převedená čísla
 *   errors – chybové zprávy podle políček (prázdný objekt = žádná chyba)
 */
function validateInputs(input) {
  const errors = {};

  const weight = parseNumber(input.weight);
  const height = parseNumber(input.height);
  const age = parseNumber(input.age);
  const sex = input.sex;

  // Hmotnost
  if (String(input.weight).trim() === "") {
    errors.weight = "Zadejte hmotnost.";
  } else {
    const message = checkNumber(weight, LIMITS.weight, {
      notNumber: "Hmotnost musí být číslo, například 70 nebo 70,5.",
      outOfRange: "Zadejte hmotnost v rozmezí 5–350 kg.",
    });
    if (message) errors.weight = message;
  }

  // Výška
  if (String(input.height).trim() === "") {
    errors.height = "Zadejte výšku.";
  } else if (height > 0 && height < 3) {
    // Častá chyba: výška v metrech (1,75) místo v centimetrech (175).
    errors.height = "Vypadá to na výšku v metrech. Zadejte ji v centimetrech, například 175.";
  } else {
    const message = checkNumber(height, LIMITS.height, {
      notNumber: "Výška musí být číslo, například 175.",
      outOfRange: "Zadejte výšku v rozmezí 50–250 cm.",
    });
    if (message) errors.height = message;
  }

  // Věk
  if (String(input.age).trim() === "") {
    errors.age = "Zadejte věk.";
  } else if (Number.isNaN(age)) {
    errors.age = "Věk musí být číslo, například 13.";
  } else if (!Number.isInteger(age)) {
    errors.age = "Zadejte věk v celých letech.";
  } else if (age < LIMITS.age.min) {
    errors.age =
      "Kalkulačka je pro věk od 2 let. U menších dětí se růst hodnotí jinými grafy.";
  } else if (age > LIMITS.age.max) {
    errors.age = "Zadejte věk v rozmezí 2–120 let.";
  }

  // Pohlaví
  if (sex !== "male" && sex !== "female") {
    errors.sex = "Vyberte pohlaví.";
  }

  return {
    values: { weight, height, age, sex },
    errors,
  };
}
