/*
 * Automatické testy výpočtů z bmi.js.
 *
 * Spuštění ve složce projektu (je potřeba mít nainstalovaný Node.js):
 *   node --test
 *
 * Soubor bmi.js je psaný pro prohlížeč, proto ho tady jen načteme
 * a spustíme v "pískovišti" (modul vm) a vytáhneme si z něj funkce.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const code = fs.readFileSync(path.join(__dirname, "..", "bmi.js"), "utf8");
const bmi = vm.runInNewContext(
  code +
    "\n({ parseNumber, calculateBmi, roundToOneDecimal, isAdult," +
    " getAdultCategory, interpretBmi, getScalePosition, validateInputs," +
    " normalCdf, getChildLms, getBmiPercentile, getChildCategory, getChildRanges })"
);

// Pomocná funkce: kategorie pro dospělého podle hmotnosti a výšky
function categoryFor(weight, height) {
  const rounded = bmi.roundToOneDecimal(bmi.calculateBmi(weight, height));
  return bmi.getAdultCategory(rounded).id;
}

test("výpočet BMI – příklad ze zadání (70 kg, 175 cm)", () => {
  const value = bmi.calculateBmi(70, 175);
  assert.ok(Math.abs(value - 22.857142857) < 1e-6);
  assert.equal(bmi.roundToOneDecimal(value), 22.9);
});

test("výpočet BMI – další příklady", () => {
  assert.equal(bmi.calculateBmi(100, 200), 25); // 100 / 2² = 25
  assert.equal(bmi.calculateBmi(81, 180), 25); // 81 / 1,8² = 25
  assert.equal(bmi.roundToOneDecimal(bmi.calculateBmi(50, 160)), 19.5);
});

test("zaokrouhlení na jedno desetinné místo", () => {
  assert.equal(bmi.roundToOneDecimal(22.857), 22.9);
  assert.equal(bmi.roundToOneDecimal(22.84), 22.8);
  assert.equal(bmi.roundToOneDecimal(30), 30);
});

test("kategorie dospělých – hranice WHO", () => {
  const cases = [
    [10, "underweight"],
    [18.4, "underweight"],
    [18.5, "normal"],
    [24.9, "normal"],
    [25.0, "overweight"],
    [29.9, "overweight"],
    [30.0, "obesity"],
    [45, "obesity"],
  ];
  for (const [value, expected] of cases) {
    assert.equal(bmi.getAdultCategory(value).id, expected, `BMI ${value}`);
  }
});

test("kategorie odpovídá zaokrouhlenému číslu, které uživatel vidí", () => {
  // výška 200 cm → výška² = 4 m², takže BMI = hmotnost / 4
  assert.equal(categoryFor(73.6, 200), "underweight"); // 18,4
  assert.equal(categoryFor(74, 200), "normal"); // 18,5
  assert.equal(categoryFor(99.6, 200), "normal"); // 24,9
  assert.equal(categoryFor(99.84, 200), "overweight"); // 24,96 → 25,0
  assert.equal(categoryFor(100, 200), "overweight"); // 25,0
  assert.equal(categoryFor(119.6, 200), "overweight"); // 29,9
  assert.equal(categoryFor(119.84, 200), "obesity"); // 29,96 → 30,0
});

test("hranice dospělosti je 18 let", () => {
  assert.equal(bmi.isAdult(17), false);
  assert.equal(bmi.isAdult(18), true);
  assert.equal(bmi.isAdult(40), true);
});

test("pod 18 let se nikdy nepoužijí kategorie pro dospělé", () => {
  const childIds = ["child-underweight", "child-normal", "child-overweight", "child-obesity"];
  for (let age = 2; age < 18; age++) {
    for (const sex of ["male", "female"]) {
      for (const value of [14, 18.5, 22, 25, 30, 40]) {
        const result = bmi.interpretBmi(value, age, sex);
        assert.equal(result.group, "child");
        assert.ok(childIds.includes(result.category.id), `věk ${age}, BMI ${value}`);
        assert.ok(result.percentile >= 0 && result.percentile <= 99);
      }
    }
  }
  const adult = bmi.interpretBmi(22.9, 18, "male");
  assert.equal(adult.group, "adult");
  assert.equal(adult.category.id, "normal");
});

test("normální rozdělení – známé hodnoty", () => {
  assert.ok(Math.abs(bmi.normalCdf(0) - 0.5) < 1e-6);
  assert.ok(Math.abs(bmi.normalCdf(1.6448536) - 0.95) < 1e-6);
  assert.ok(Math.abs(bmi.normalCdf(1.0364334) - 0.85) < 1e-6);
  assert.ok(Math.abs(bmi.normalCdf(-1.6448536) - 0.05) < 1e-6);
});

test("tabulka CDC – pro každý věk 2–17 a obě pohlaví", () => {
  for (let age = 2; age <= 17; age++) {
    for (const sex of ["male", "female"]) {
      const lms = bmi.getChildLms(age, sex);
      assert.ok(lms.M > 14 && lms.M < 23, `medián pro věk ${age}`);
    }
  }
});

test("percentil odpovídá hodnotám z tabulky CDC", () => {
  // Hodnoty P5, P50, P85 a P95 přímo ze souboru CDC bmiagerev.csv
  // (průměr řádků pro střed daného roku, např. 13 let → 162 měsíců).
  const cases = [
    [16.2728, 2, "male", 50],
    [15.6976, 13, "male", 5],
    [18.7835, 13, "male", 50],
    [22.2258, 13, "male", 85],
    [25.5862, 13, "male", 95],
    [18.6743, 8, "female", 85],
    [21.2005, 8, "female", 95],
  ];
  for (const [value, age, sex, expected] of cases) {
    const p = bmi.getBmiPercentile(value, age, sex);
    assert.ok(Math.abs(p - expected) < 0.2, `${sex} ${age} let, BMI ${value}: ${p}`);
  }
});

test("kategorie dětí – hranice percentilů CDC", () => {
  const cases = [
    [0, "child-underweight"],
    [4, "child-underweight"],
    [5, "child-normal"],
    [84, "child-normal"],
    [85, "child-overweight"],
    [94, "child-overweight"],
    [95, "child-obesity"],
    [99, "child-obesity"],
  ];
  for (const [percentile, expected] of cases) {
    assert.equal(bmi.getChildCategory(percentile).id, expected, `${percentile}. percentil`);
  }
});

test("dítě – příklad: chlapec 13 let, 45 kg, 155 cm", () => {
  const rounded = bmi.roundToOneDecimal(bmi.calculateBmi(45, 155)); // 18,7
  const result = bmi.interpretBmi(rounded, 13, "male");
  assert.equal(result.percentile, 48); // těsně pod mediánem 18,78
  assert.equal(result.category.id, "child-normal");
});

test("stejné BMI znamená v jiném věku a u jiného pohlaví něco jiného", () => {
  // BMI 19 je u 4letého chlapce obezita, u 15letého normální hmotnost
  assert.equal(bmi.interpretBmi(19, 4, "male").category.id, "child-obesity");
  assert.equal(bmi.interpretBmi(19, 15, "male").category.id, "child-normal");
  // u 8letých dětí: BMI 21 → chlapec obezita, dívka nadváha
  assert.equal(bmi.interpretBmi(21, 8, "male").category.id, "child-obesity");
  assert.equal(bmi.interpretBmi(21, 8, "female").category.id, "child-overweight");
});

test("rozmezí BMI v legendě přesně odpovídají kategoriím", () => {
  for (let age = 2; age <= 17; age++) {
    for (const sex of ["male", "female"]) {
      const ranges = bmi.getChildRanges(age, sex);
      assert.equal(ranges.length, 4);
      // projdeme všechna BMI 10,0–45,0 po desetinách
      for (let tenths = 100; tenths <= 450; tenths++) {
        const value = tenths / 10;
        const fromPercentile = bmi.interpretBmi(value, age, sex).category.id;
        const fromRanges = ranges.find((r) => value >= r.from && value < r.upTo).id;
        assert.equal(fromRanges, fromPercentile, `${sex} ${age} let, BMI ${value}`);
      }
    }
  }
});

test("převod textu na číslo (desetinná čárka i tečka)", () => {
  assert.equal(bmi.parseNumber("70"), 70);
  assert.equal(bmi.parseNumber("70,5"), 70.5);
  assert.equal(bmi.parseNumber(" 70.5 "), 70.5);
  assert.ok(Number.isNaN(bmi.parseNumber("")));
  assert.ok(Number.isNaN(bmi.parseNumber("abc")));
  assert.ok(Number.isNaN(bmi.parseNumber("70kg")));
});

test("validace – správné údaje projdou", () => {
  const result = bmi.validateInputs({ weight: "70,5", height: "175", age: "13", sex: "female" });
  assert.deepEqual({ ...result.errors }, {});
  assert.equal(result.values.weight, 70.5);
});

test("validace – chybějící údaje", () => {
  const { errors } = bmi.validateInputs({ weight: "", height: " ", age: "", sex: "" });
  assert.ok(errors.weight);
  assert.ok(errors.height);
  assert.ok(errors.age);
  assert.ok(errors.sex);
});

test("validace – nesmyslné hodnoty", () => {
  const ok = { weight: "70", height: "175", age: "30", sex: "male" };
  const errorsFor = (changes) => bmi.validateInputs({ ...ok, ...changes }).errors;

  assert.ok(errorsFor({ weight: "abc" }).weight);
  assert.ok(errorsFor({ weight: "0" }).weight);
  assert.ok(errorsFor({ weight: "-70" }).weight);
  assert.ok(errorsFor({ weight: "4,9" }).weight);
  assert.ok(errorsFor({ weight: "351" }).weight);
  assert.equal(errorsFor({ weight: "5" }).weight, undefined);
  assert.equal(errorsFor({ weight: "350" }).weight, undefined);

  assert.match(errorsFor({ height: "1,75" }).height, /metrech/);
  assert.ok(errorsFor({ height: "49" }).height);
  assert.ok(errorsFor({ height: "251" }).height);
  assert.equal(errorsFor({ height: "50" }).height, undefined);
  assert.equal(errorsFor({ height: "250" }).height, undefined);

  assert.ok(errorsFor({ age: "1" }).age);
  assert.ok(errorsFor({ age: "13,5" }).age);
  assert.ok(errorsFor({ age: "121" }).age);
  assert.ok(errorsFor({ age: "x" }).age);
  assert.equal(errorsFor({ age: "2" }).age, undefined);
  assert.equal(errorsFor({ age: "120" }).age, undefined);

  assert.ok(errorsFor({ sex: "other" }).sex);
});

test("pozice na stupnici (15–35) se drží v mezích 0–100 %", () => {
  assert.equal(bmi.getScalePosition(15), 0);
  assert.equal(bmi.getScalePosition(25), 50);
  assert.equal(bmi.getScalePosition(35), 100);
  assert.equal(bmi.getScalePosition(10), 0);
  assert.equal(bmi.getScalePosition(50), 100);
});
