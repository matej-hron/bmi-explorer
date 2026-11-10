/*
 * quiz-page.js – KVÍZ NA STRÁNCE
 *
 * Tento soubor vykreslí otázky z quiz.js na stránku, reaguje na kliknutí
 * na odpověď, ukáže vysvětlení a na konci výsledek.
 */

const quizList = document.getElementById("quiz-list");
const quizResult = document.getElementById("quiz-result");
const quizResultTitle = document.getElementById("quiz-result-title");
const quizRestart = document.getElementById("quiz-restart");

// Písmena, která se ukazují před možnostmi (po zamíchání vždy A, B, C, D).
const LETTERS = ["A", "B", "C", "D", "E", "F"];

// Aktuální kvíz: otázky se zamíchanými možnostmi a odpovědi uživatele.
let quiz = [];
let answers = {};

/**
 * Pomocná funkce: vytvoří prvek stránky s třídou a textem.
 */
function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

/**
 * Vytvoří na stránce jednu otázku s tlačítky odpovědí.
 */
function renderQuestion(question, index) {
  const item = createElement("li", "card quiz-question");
  const titleId = "quiz-q-" + question.id;

  item.append(createElement("p", "quiz-number", `Otázka ${index + 1} z ${quiz.length}`));

  const title = createElement("h3", "quiz-text", question.question);
  title.id = titleId;
  item.append(title);

  const options = createElement("div", "quiz-options");
  options.setAttribute("role", "group");
  options.setAttribute("aria-labelledby", titleId);

  question.options.forEach((option, i) => {
    const button = createElement("button", "quiz-option");
    button.type = "button";
    button.dataset.option = option.id;
    button.append(
      createElement("span", "quiz-letter", LETTERS[i]),
      createElement("span", "quiz-option-text", option.text)
    );
    button.addEventListener("click", () => answerQuestion(question, option.id, item));
    options.append(button);
  });
  item.append(options);

  const feedback = createElement("div", "quiz-feedback");
  feedback.tabIndex = -1;
  feedback.hidden = true;
  item.append(feedback);

  return item;
}

/**
 * Uživatel klikl na odpověď: vyhodnotíme ji a ukážeme vysvětlení.
 */
function answerQuestion(question, optionId, item) {
  if (answers[question.id]) return; // na otázku už odpověděl

  answers[question.id] = optionId;
  const correct = isCorrect(question, optionId);

  // Obarvíme tlačítka a zamkneme je, aby odpověď nešla změnit.
  for (const button of item.querySelectorAll(".quiz-option")) {
    const id = button.dataset.option;
    button.disabled = true;
    if (id === question.correct) button.classList.add("is-correct");
    if (id === optionId && !correct) button.classList.add("is-wrong");
    if (id === optionId) button.setAttribute("aria-label", "Vaše odpověď: " + button.textContent);
  }

  // Vysvětlení
  const feedback = item.querySelector(".quiz-feedback");
  feedback.classList.add(correct ? "is-correct" : "is-wrong");
  feedback.append(
    createElement(
      "p",
      "quiz-verdict",
      correct ? "Správně!" : "Špatně. Správná odpověď: " + getCorrectOption(question).text
    ),
    createElement("p", "", question.explanation)
  );
  const more = createElement("p", "small", "Více v kapitole ");
  const link = createElement("a", "", question.chapter.name);
  link.href = "#" + question.chapter.id;
  more.append(link);
  feedback.append(more);
  feedback.hidden = false;

  // Tlačítka jsou zamčená, proto přesuneme pozornost na vysvětlení
  // (čtečka obrazovky ho přečte, klávesnice pokračuje odsud).
  feedback.focus();

  if (Object.keys(answers).length === quiz.length) {
    showQuizResult();
  }
}

/**
 * Všechno zodpovězeno: ukážeme skóre.
 */
function showQuizResult() {
  const score = countCorrect(quiz, answers);
  document.getElementById("quiz-score").textContent = `${score} z ${quiz.length}`;
  document.getElementById("quiz-score-text").textContent = getScoreMessage(score, quiz.length);
  quizResult.hidden = false;
}

/**
 * Spustí kvíz od začátku: zamíchá odpovědi a vykreslí otázky.
 */
function startQuiz() {
  quiz = prepareQuiz();
  answers = {};
  quizList.replaceChildren(...quiz.map(renderQuestion));
  quizResult.hidden = true;
}

quizRestart.addEventListener("click", () => {
  startQuiz();
  // Po novém spuštění se přesuneme na první otázku.
  quizList.querySelector(".quiz-option").focus();
});

startQuiz();
