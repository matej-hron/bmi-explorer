/*
 * quiz.js – PRAVIDLA KVÍZU (společná pro všechny moduly)
 *
 * Stejně jako bmi.js tady nic nemění webovou stránku. Jsou tu jen funkce,
 * které míchají odpovědi a počítají skóre. Díky tomu je můžeme vyzkoušet
 * automatickými testy (viz soubor tests/quiz.test.js).
 *
 * Otázky jsou v samostatných souborech – každá stránka si načte své:
 *   quiz-bmi.js   = otázky o BMI (index.html)
 *   quiz-srdce.js = otázky o srdci a krevním oběhu (srdce.html)
 * Oba soubory vytvoří seznam se stejným jménem QUIZ_QUESTIONS,
 * proto se na jedné stránce nesmí načíst oba.
 *
 * Se stránkou pracuje až soubor quiz-page.js.
 */

/**
 * Zamíchá pole náhodně (Fisher–Yatesův algoritmus) a vrátí NOVÉ pole.
 * Původní pole nezmění.
 * random = funkce, která vrací číslo od 0 do 1 (obvykle Math.random).
 * V testech jí můžeme podstrčit vlastní funkci, aby výsledek byl pokaždé stejný.
 */
function shuffle(items, random = Math.random) {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Připraví kvíz: otázky nechá ve stejném pořadí (jdou podle kapitol teorie),
 * ale u každé zamíchá možnosti odpovědí.
 */
function prepareQuiz(questions = QUIZ_QUESTIONS, random = Math.random) {
  return questions.map((q) => ({ ...q, options: shuffle(q.options, random) }));
}

/**
 * Je odpověď správná? Vrátí true nebo false.
 */
function isCorrect(question, optionId) {
  return question.correct === optionId;
}

/**
 * Najde text správné odpovědi.
 */
function getCorrectOption(question) {
  return question.options.find((o) => o.id === question.correct);
}

/**
 * Spočítá, kolik odpovědí je správně.
 * answers = objekt { idOtázky: idOdpovědi }, např. { formula: "b" }.
 */
function countCorrect(questions, answers) {
  return questions.filter((q) => isCorrect(q, answers[q.id])).length;
}

/**
 * Hodnocení podle skóre (kolik procent otázek je správně).
 */
function getScoreMessage(score, total) {
  const share = score / total;
  if (share === 1) return "Výborně! Všechno správně – tohle téma máte v malíčku.";
  if (share >= 0.7) return "Moc dobře! Většinu toho už víte.";
  if (share >= 0.4) return "Dobrý začátek. Projděte si kapitoly u otázek, kde jste chybovali.";
  return "Nevadí – přečtěte si teorii a zkuste to znovu.";
}

