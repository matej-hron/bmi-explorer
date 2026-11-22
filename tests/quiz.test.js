/*
 * Automatické testy kvízu z quiz.js.
 *
 * Spuštění ve složce projektu:
 *   node --test
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

// Každá stránka má svůj kvíz: pravidla (quiz.js) jsou společná,
// otázky a výpočty jsou pro každý modul jiné. Pro každý modul proto
// načteme soubory do vlastního "pískoviště" – stejně jako na stránce.
// Výpočty (bmi.js, srdce.js) přidáváme, ať můžeme porovnat početní
// otázku se skutečným výpočtem.
const ENGINE = "shuffle, prepareQuiz, isCorrect, getCorrectOption, countCorrect, getScoreMessage";

const quiz = vm.runInNewContext(
  [read("bmi.js"), read("quiz.js"), read("quiz-bmi.js")].join("\n") +
    `\n({ QUIZ_QUESTIONS, ${ENGINE}, calculateBmi, roundToOneDecimal })`
);
const heartQuiz = vm.runInNewContext(
  [read("srdce.js"), read("quiz.js"), read("quiz-srdce.js")].join("\n") +
    `\n({ QUIZ_QUESTIONS, ${ENGINE}, getCardiacOutput, getPhaseDurations, formatNumber })`
);
const questions = quiz.QUIZ_QUESTIONS;

// Sady otázek: pro každou stránku jedna.
const QUESTION_SETS = [
  { name: "BMI", page: "index.html", questions: quiz.QUIZ_QUESTIONS },
  { name: "Srdce", page: "srdce.html", questions: heartQuiz.QUIZ_QUESTIONS },
];

// Jednoduchý "náhodný" generátor, který dává pokaždé stejná čísla.
function fakeRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

for (const set of QUESTION_SETS) {
  const questions = set.questions;

  test(`${set.name}: kvíz má 10 otázek a každá má jiné id`, () => {
    assert.equal(questions.length, 10);
    const ids = new Set(questions.map((q) => q.id));
    assert.equal(ids.size, questions.length);
  });

  test(`${set.name}: každá otázka má 4 různé možnosti a právě jedna je správná`, () => {
    for (const q of questions) {
      assert.equal(q.options.length, 4, q.id);
      const optionIds = q.options.map((o) => o.id);
      assert.equal(new Set(optionIds).size, 4, q.id);
      assert.equal(new Set(q.options.map((o) => o.text)).size, 4, q.id);
      assert.equal(optionIds.filter((id) => id === q.correct).length, 1, q.id);
      assert.ok(q.explanation.length > 20, q.id);
    }
  });

  test(`${set.name}: odkazy na kapitoly vedou na existující kapitolu teorie`, () => {
    const html = read(set.page);
    for (const q of questions) {
      assert.ok(html.includes(`id="${q.chapter.id}"`), `${q.id} → #${q.chapter.id}`);
    }
  });
}

test("početní otázka souhlasí s kalkulačkou (70 kg, 175 cm)", () => {
  const q = questions.find((x) => x.id === "calculation");
  const bmi = quiz.roundToOneDecimal(quiz.calculateBmi(70, 175));
  const expected = bmi.toFixed(1).replace(".", ",");
  assert.equal(quiz.getCorrectOption(q).text, expected);
});

test("srdce: početní otázka souhlasí s výpočtem minutového objemu (70 tepů × 70 ml)", () => {
  const q = heartQuiz.QUIZ_QUESTIONS.find((x) => x.id === "cardiac-output");
  const liters = heartQuiz.formatNumber(heartQuiz.getCardiacOutput(70), 1);
  assert.equal(heartQuiz.getCorrectOption(q).text, `${liters} litru`);
});

test("shuffle vrátí stejné prvky v jiném poli a původní pole nezmění", () => {
  const original = [1, 2, 3, 4, 5];
  const mixed = quiz.shuffle(original, fakeRandom(1));
  assert.deepEqual(original, [1, 2, 3, 4, 5]);
  assert.notEqual(mixed, original);
  assert.deepEqual([...mixed].sort(), [1, 2, 3, 4, 5]);
});

test("prepareQuiz zamíchá jen možnosti, otázky a správné odpovědi zůstanou", () => {
  const prepared = quiz.prepareQuiz(questions, fakeRandom(7));
  assert.deepEqual(
    prepared.map((q) => q.id),
    questions.map((q) => q.id)
  );
  prepared.forEach((q, i) => {
    assert.equal(q.correct, questions[i].correct);
    assert.equal(quiz.getCorrectOption(q).text, quiz.getCorrectOption(questions[i]).text);
  });
  // Původní otázky se nezměnily
  assert.deepEqual([...questions[0].options.map((o) => o.id)], ["a", "b", "c", "d"]);
});

test("po zamíchání není správná odpověď pořád na stejném místě", () => {
  const random = fakeRandom(3);
  const positions = new Set();
  for (let round = 0; round < 20; round++) {
    const q = quiz.prepareQuiz(questions, random)[0];
    positions.add(q.options.findIndex((o) => o.id === q.correct));
  }
  assert.ok(positions.size > 1);
});

test("isCorrect a countCorrect", () => {
  const first = questions[0];
  assert.equal(quiz.isCorrect(first, first.correct), true);
  assert.equal(quiz.isCorrect(first, "x"), false);
  assert.equal(quiz.isCorrect(first, undefined), false);

  const allRight = Object.fromEntries(questions.map((q) => [q.id, q.correct]));
  assert.equal(quiz.countCorrect(questions, allRight), 10);
  assert.equal(quiz.countCorrect(questions, {}), 0);
  assert.equal(quiz.countCorrect(questions, { formula: first.correct, waist: "x" }), 1);
});

test("hodnocení podle skóre", () => {
  assert.match(quiz.getScoreMessage(10, 10), /Výborně/);
  assert.match(quiz.getScoreMessage(7, 10), /Moc dobře/);
  assert.match(quiz.getScoreMessage(4, 10), /Dobrý začátek/);
  assert.match(quiz.getScoreMessage(3, 10), /zkuste to znovu/);
  assert.match(quiz.getScoreMessage(0, 10), /zkuste to znovu/);
});
