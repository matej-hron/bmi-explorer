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

// Kategorie BMI pro děti a dospívající (2–17 let) podle CDC.
// U dětí se nerozhoduje podle BMI, ale podle PERCENTILU (viz getBmiPercentile).
// "from" = od tohoto percentilu (včetně), "upTo" = do tohoto percentilu (už ne včetně).
// "z" = z-skóre, které odpovídá spodní hranici (5., 85. a 95. percentil).
const CHILD_CATEGORIES = [
  { id: "child-underweight", name: "Podváha", from: 0, upTo: 5, z: -Infinity },
  { id: "child-normal", name: "Normální hmotnost", from: 5, upTo: 85, z: -1.6448536 },
  { id: "child-overweight", name: "Nadváha", from: 85, upTo: 95, z: 1.0364334 },
  { id: "child-obesity", name: "Obezita", from: 95, upTo: Infinity, z: 1.6448536 },
];

// Referenční data CDC pro BMI dětí (CDC 2000, soubor bmiagerev.csv,
// https://www.cdc.gov/growthcharts/data/zscore/bmiagerev.csv).
// CDC popisuje každý růstový graf třemi čísly L, M, S pro každý měsíc věku:
//   M = medián (50. percentil) – "prostřední" BMI dětí daného věku,
//   S = jak moc se BMI dětí rozptyluje kolem mediánu,
//   L = jak moc je rozdělení "nesouměrné" (BMI se víc rozptyluje nahoru než dolů).
// Věk zadáváme v celých letech, proto bereme STŘED roku: 13 let → 13,5 roku
// (162 měsíců). Hodnoty jsou průměrem dvou sousedních řádků tabulky CDC
// (např. 161,5 a 162,5 měsíce).
// Formát řádku: [věk v letech, L, M, S]
const CHILD_LMS = {
  male: [
    [2, -1.66846, 16.2728, 0.0758237],
    [3, -1.42713, 15.8098, 0.0715331],
    [4, -2.11603, 15.5116, 0.0733225],
    [5, -2.95582, 15.3813, 0.0789205],
    [6, -3.30995, 15.4239, 0.0870225],
    [7, -3.27636, 15.6207, 0.096665],
    [8, -3.0883, 15.9458, 0.106609],
    [9, -2.87395, 16.3762, 0.11576],
    [10, -2.68126, 16.8921, 0.123385],
    [11, -2.52132, 17.4759, 0.129112],
    [12, -2.39079, 18.1114, 0.132873],
    [13, -2.28128, 18.7835, 0.134831],
    [14, -2.18338, 19.4775, 0.135314],
    [15, -2.08947, 20.1794, 0.134756],
    [16, -1.99693, 20.8743, 0.133669],
    [17, -1.91201, 21.5468, 0.132619],
  ],
  female: [
    [2, -1.48912, 16.0351, 0.0812101],
    [3, -2.5786, 15.4818, 0.0779082],
    [4, -3.24479, 15.2025, 0.0806773],
    [5, -3.33071, 15.1581, 0.0882862],
    [6, -3.09692, 15.3064, 0.0989458],
    [7, -2.78034, 15.6098, 0.110799],
    [8, -2.49176, 16.0353, 0.122315],
    [9, -2.26579, 16.5532, 0.132416],
    [10, -2.10609, 17.1357, 0.140466],
    [11, -2.00679, 17.7572, 0.146208],
    [12, -1.96044, 18.3935, 0.149683],
    [13, -1.96024, 19.0224, 0.151152],
    [14, -1.99965, 19.6233, 0.15104],
    [15, -2.07096, 20.1779, 0.149902],
    [16, -2.16299, 20.6701, 0.148409],
    [17, -2.25863, 21.0861, 0.147346],
  ],
};

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
 * Najde čísla L, M, S z tabulky CDC pro daný věk (2–17 let) a pohlaví.
 */
function getChildLms(age, sex) {
  const row = CHILD_LMS[sex].find((r) => r[0] === age);
  return { L: row[1], M: row[2], S: row[3] };
}

/**
 * Normální (Gaussovo) rozdělení: jaká část všech hodnot leží pod z-skóre z.
 * Vrací číslo 0 až 1 (0,85 = 85 %).
 * Přesný vzorec nejde spočítat "na kalkulačce", proto používáme známé
 * přibližné řešení (Abramowitz a Stegun, vzorec 7.1.26) s chybou menší
 * než 0,0000002 – to nám bohatě stačí.
 */
function normalCdf(z) {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const poly =
    t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-x * x);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

/**
 * Spočítá BMI percentil dítěte (0 až 100) metodou LMS, kterou používá CDC.
 * 1. Z-skóre říká, o kolik "směrodatných odchylek" je BMI nad nebo pod mediánem:
 *      z = ((BMI / M)^L − 1) / (L × S)
 * 2. Z-skóre převedeme na percentil pomocí normálního rozdělení.
 */
function getBmiPercentile(bmi, age, sex) {
  const { L, M, S } = getChildLms(age, sex);
  const z = (Math.pow(bmi / M, L) - 1) / (L * S);
  return normalCdf(z) * 100;
}

/**
 * Opačný výpočet: jaké BMI odpovídá danému z-skóre (např. 85. percentilu).
 *   BMI = M × (1 + L × S × z)^(1/L)
 */
function getBmiForZ(z, age, sex) {
  const { L, M, S } = getChildLms(age, sex);
  return M * Math.pow(1 + L * S * z, 1 / L);
}

/**
 * Najde kategorii CDC podle percentilu (celé číslo, zaokrouhlené dolů).
 */
function getChildCategory(percentile) {
  for (const category of CHILD_CATEGORIES) {
    if (percentile >= category.from && percentile < category.upTo) {
      return category;
    }
  }
  return null; // sem by se program neměl nikdy dostat
}

/**
 * Pro daný věk a pohlaví spočítá, jaké BMI patří do jednotlivých kategorií.
 * Hodnoty jsou zaokrouhlené na desetiny stejně jako BMI na stránce:
 * "from" je nejmenší BMI (na desetiny), které už do kategorie patří.
 * Příklad: 85. percentil je BMI 22,23 → nadváha začíná na 22,3.
 */
function getChildRanges(age, sex) {
  return CHILD_CATEGORIES.map((category, index) => {
    const next = CHILD_CATEGORIES[index + 1];
    return {
      id: category.id,
      name: category.name,
      from: index === 0 ? 0 : Math.ceil(getBmiForZ(category.z, age, sex) * 10) / 10,
      upTo: next ? Math.ceil(getBmiForZ(next.z, age, sex) * 10) / 10 : Infinity,
    };
  });
}

/**
 * Rozhodne, jak výsledek vyhodnotit.
 * - Dospělý: vrátí kategorii WHO (pevné hranice 18,5 / 25 / 30).
 * - Dítě nebo dospívající: spočítá BMI percentil podle věku a pohlaví
 *   a kategorii CDC. Hranice pro dospělé se u dětí NIKDY nepoužijí.
 * Percentil zaokrouhlujeme DOLŮ na celé číslo: 84,7 je ještě "pod 85."
 * percentilem, takže to musí být 84 – jinak by číslo neodpovídalo kategorii.
 */
function interpretBmi(roundedBmi, age, sex) {
  if (isAdult(age)) {
    return { group: "adult", category: getAdultCategory(roundedBmi) };
  }
  const percentile = Math.floor(getBmiPercentile(roundedBmi, age, sex));
  return {
    group: "child",
    percentile,
    category: getChildCategory(percentile),
    ranges: getChildRanges(age, sex),
  };
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
