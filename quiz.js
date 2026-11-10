/*
 * quiz.js – OTÁZKY A PRAVIDLA KVÍZU
 *
 * Stejně jako bmi.js tady nic nemění webovou stránku. Jsou tu jen otázky
 * a funkce, které míchají odpovědi a počítají skóre. Díky tomu je můžeme
 * vyzkoušet automatickými testy (viz soubor tests/quiz.test.js).
 *
 * Se stránkou pracuje až soubor quiz-page.js.
 */

// Otázky kvízu. U každé otázky:
//   id          = krátký název otázky (jen pro program)
//   question    = text otázky
//   options     = možnosti odpovědí; každá má vlastní "id" (a, b, c, d)
//   correct     = id správné odpovědi
//   explanation = vysvětlení, které se ukáže po odpovědi
//   chapter     = odkaz na kapitolu teorie, kde se o tom dá dočíst
//
// Pořadí možností se při každém spuštění kvízu zamíchá,
// takže písmeno správné odpovědi tady nic neprozrazuje.
const QUIZ_QUESTIONS = [
  {
    id: "formula",
    question: "Jak se počítá BMI?",
    options: [
      { id: "a", text: "hmotnost (kg) ÷ výška (m)" },
      { id: "b", text: "hmotnost (kg) ÷ výška (m)²" },
      { id: "c", text: "hmotnost (kg) ÷ výška (cm)²" },
      { id: "d", text: "výška (m)² ÷ hmotnost (kg)" },
    ],
    correct: "b",
    explanation:
      "Hmotnost v kilogramech se dělí výškou v metrech na druhou. Výška musí být v metrech, ne v centimetrech.",
    chapter: { id: "vypocet", name: "Jak se BMI počítá?" },
  },
  {
    id: "calculation",
    question: "Člověk váží 70 kg a měří 175 cm. Kolik je jeho BMI?",
    options: [
      { id: "a", text: "40,0" },
      { id: "b", text: "18,5" },
      { id: "c", text: "22,9" },
      { id: "d", text: "0,002" },
    ],
    correct: "c",
    explanation:
      "175 cm = 1,75 m. 1,75 × 1,75 = 3,0625. 70 ÷ 3,0625 ≈ 22,9. " +
      "Kdo zapomene výšku umocnit, dostane 40,0. Kdo nechá výšku v centimetrech, dostane 0,002.",
    chapter: { id: "vypocet", name: "Jak se BMI počítá?" },
  },
  {
    id: "why-squared",
    question: "Proč se ve vzorci BMI výška umocňuje na druhou?",
    options: [
      { id: "a", text: "Protože hmotnost dospělých roste přibližně s druhou mocninou výšky." },
      { id: "b", text: "Protože dvakrát vyšší člověk bývá osmkrát těžší." },
      { id: "c", text: "Aby vysocí lidé vycházeli s vyšším BMI." },
      { id: "d", text: "Aby výsledek vyšel v kilogramech." },
    ],
    correct: "a",
    explanation:
      "Adolphe Quetelet zjistil, že hmotnost dospělých roste přibližně s druhou mocninou výšky. " +
      "Vydělením výškou na druhou dostaneme číslo, které na samotné výšce téměř nezávisí. " +
      "„Osmkrát těžší“ by platilo pro třetí mocninu, tak ale lidé nerostou.",
    chapter: { id: "vypocet", name: "Jak se BMI počítá?" },
  },
  {
    id: "normal-range",
    question: "Jaké rozmezí BMI označuje WHO u dospělých jako normální hmotnost?",
    options: [
      { id: "a", text: "17,0–22,9" },
      { id: "b", text: "18,5–24,9" },
      { id: "c", text: "20,0–27,9" },
      { id: "d", text: "25,0–29,9" },
    ],
    correct: "b",
    explanation:
      "Normální hmotnost je od 18,5 do méně než 25. Pod 18,5 je podváha, 25,0–29,9 je nadváha.",
    chapter: { id: "dospeli", name: "Jak se BMI hodnotí u dospělých?" },
  },
  {
    id: "obesity-threshold",
    question: "Od jaké hodnoty BMI mluví WHO u dospělých o obezitě?",
    options: [
      { id: "a", text: "od 25,0" },
      { id: "b", text: "od 27,5" },
      { id: "c", text: "od 30,0" },
      { id: "d", text: "od 35,0" },
    ],
    correct: "c",
    explanation:
      "Obezita začíná u BMI 30,0. WHO ji ještě dělí na tři stupně: I. (30,0–34,9), II. (35,0–39,9) a III. (40 a více).",
    chapter: { id: "dospeli", name: "Jak se BMI hodnotí u dospělých?" },
  },
  {
    id: "muscles",
    question: "Koho BMI nejspíš chybně zařadí do nadváhy, i když má tuku málo?",
    options: [
      { id: "a", text: "člověka, který celý den sedí v kanceláři" },
      { id: "b", text: "štíhlého vytrvalostního běžce" },
      { id: "c", text: "kulturistu s velkými svaly" },
      { id: "d", text: "staršího člověka s malým množstvím svalů" },
    ],
    correct: "c",
    explanation:
      "BMI nerozliší svaly od tuku. Svaly jsou těžké, takže svalnatý člověk může mít BMI v pásmu nadváhy. " +
      "U člověka s málo svaly je to naopak: může mít „normální“ BMI, i když má tuku hodně.",
    chapter: { id: "omezeni", name: "Jaká jsou omezení BMI?" },
  },
  {
    id: "body-fat",
    question: "Měří BMI přímo, kolik má člověk v těle tuku?",
    options: [
      { id: "a", text: "Ano, BMI je přesně procento tuku v těle." },
      { id: "b", text: "Ano, ale jen u dospělých." },
      { id: "c", text: "Ne. Počítá se jen z hmotnosti a výšky a s tukem souvisí jen přibližně." },
      { id: "d", text: "Ne. BMI měří množství svalů." },
    ],
    correct: "c",
    explanation:
      "BMI se počítá jen z hmotnosti a výšky. S množstvím tuku souvisí, ale ne přesně. " +
      "Proto je to orientační ukazatel, ne diagnóza.",
    chapter: { id: "omezeni", name: "Jaká jsou omezení BMI?" },
  },
  {
    id: "waist",
    question: "Proč se kromě BMI někdy měří i obvod pasu?",
    options: [
      { id: "a", text: "Aby se ověřilo, že byla správně změřená výška." },
      { id: "b", text: "Protože BMI nepočítá s výškou." },
      { id: "c", text: "Protože BMI nepozná, kde je v těle tuk uložený, a na tom pro zdraví záleží." },
      { id: "d", text: "Protože z obvodu pasu se dá přesně spočítat procento tuku." },
    ],
    correct: "c",
    explanation:
      "Pro zdraví záleží i na tom, kde je tuk uložený. BMI to nepozná, obvod pasu dá aspoň přibližnou představu o tuku na břiše.",
    chapter: { id: "omezeni", name: "Jaká jsou omezení BMI?" },
  },
  {
    id: "children",
    question: "Jak se hodnotí BMI dětí a dospívajících?",
    options: [
      { id: "a", text: "Stejně jako u dospělých, podle hranic 18,5, 25 a 30." },
      { id: "b", text: "Porovná se s dětmi stejného věku a pohlaví pomocí percentilů." },
      { id: "c", text: "U dětí se BMI nepočítá vůbec." },
      { id: "d", text: "Podle hranic pro dospělé, jen se výsledek vynásobí věkem." },
    ],
    correct: "b",
    explanation:
      "Děti rostou a BMI se během dětství přirozeně mění, chlapci a dívky se vyvíjejí jinak. " +
      "Proto se BMI dítěte porovnává s vrstevníky stejného věku a pohlaví a výsledkem je percentil.",
    chapter: { id: "deti", name: "Jak se BMI hodnotí u dětí a dospívajících?" },
  },
  {
    id: "percentile",
    question: "Dítě je na 85. percentilu BMI. Co to znamená?",
    options: [
      { id: "a", text: "Má v těle 85 % tuku." },
      { id: "b", text: "Jeho BMI je 85." },
      { id: "c", text: "Má vyšší BMI než asi 85 ze 100 dětí stejného věku a pohlaví." },
      { id: "d", text: "Je o 85 % těžší než průměrné dítě." },
    ],
    correct: "c",
    explanation:
      "Percentil říká, kde dítě stojí mezi 100 vrstevníky seřazenými podle BMI. " +
      "Od 85. percentilu CDC u dětí mluví o nadváze.",
    chapter: { id: "deti", name: "Jak se BMI hodnotí u dětí a dospívajících?" },
  },
];

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
  if (share === 1) return "Výborně! Všechno správně – BMI máte v malíčku.";
  if (share >= 0.7) return "Moc dobře! Většinu toho o BMI už víte.";
  if (share >= 0.4) return "Dobrý začátek. Projděte si kapitoly u otázek, kde jste chybovali.";
  return "Nevadí – přečtěte si teorii a zkuste to znovu.";
}

