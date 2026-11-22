/*
 * quiz-srdce.js – OTÁZKY KVÍZU O SRDCI A KREVNÍM OBĚHU
 *
 * Jen seznam otázek pro stránku srdce.html. Pravidla kvízu (míchání,
 * vyhodnocení, skóre) jsou společná pro všechny moduly v souboru quiz.js.
 *
 * U každé otázky:
 *   id          = krátký název otázky (jen pro program)
 *   question    = text otázky
 *   options     = možnosti odpovědí; každá má vlastní "id" (a, b, c, d)
 *   correct     = id správné odpovědi
 *   explanation = vysvětlení, které se ukáže po odpovědi
 *   chapter     = odkaz na kapitolu teorie, kde se o tom dá dočíst
 *
 * Pořadí možností se při každém spuštění kvízu zamíchá,
 * takže písmeno správné odpovědi tady nic neprozrazuje.
 */

const QUIZ_QUESTIONS = [
  {
    id: "chambers",
    question: "Kolik dutin má lidské srdce?",
    options: [
      { id: "a", text: "Dvě" },
      { id: "b", text: "Tři" },
      { id: "c", text: "Čtyři" },
      { id: "d", text: "Šest" },
    ],
    correct: "c",
    explanation:
      "Srdce má čtyři dutiny: dvě síně nahoře (krev do nich přitéká) " +
      "a dvě komory dole (krev z nich vytéká).",
    chapter: { id: "stavba", name: "Jak je srdce postavené?" },
  },
  {
    id: "thick-wall",
    question: "Proč má levá komora mnohem silnější stěnu než pravá?",
    options: [
      { id: "a", text: "Tlačí krev do celého těla, a potřebuje proto větší tlak" },
      { id: "b", text: "Vejde se do ní mnohem víc krve" },
      { id: "c", text: "Ohřívá krev, než odteče do těla" },
      { id: "d", text: "Leží blíž k plicím" },
    ],
    correct: "a",
    explanation:
      "Obě komory přečerpají stejné množství krve. Pravá ji posílá jen do plic, " +
      "levá ale celým tělem, a na to potřebuje silnější sval.",
    chapter: { id: "stavba", name: "Jak je srdce postavené?" },
  },
  {
    id: "valves",
    question: "K čemu jsou v srdci chlopně?",
    options: [
      { id: "a", text: "Vyrábějí krev" },
      { id: "b", text: "Zajišťují, aby krev tekla jen jedním směrem" },
      { id: "c", text: "Měří, jak rychle srdce bije" },
      { id: "d", text: "Čistí krev od nečistot" },
    ],
    correct: "b",
    explanation:
      "Chlopně fungují jako dvířka, která se otevírají jen jedním směrem. " +
      "Krev pustí dopředu, ale zpátky ne.",
    chapter: { id: "stavba", name: "Jak je srdce postavené?" },
  },
  {
    id: "artery",
    question: "Co platí o tepnách?",
    options: [
      { id: "a", text: "Vedou krev od srdce" },
      { id: "b", text: "Vedou vždycky okysličenou krev" },
      { id: "c", text: "Vedou krev do srdce" },
      { id: "d", text: "Jsou jen v plicích" },
    ],
    correct: "a",
    explanation:
      "Tepny vedou krev od srdce, žíly k srdci. Rozhoduje směr, ne kyslík: " +
      "plicní tepna vede odkysličenou krev ze srdce do plic.",
    chapter: { id: "obeh", name: "Malý a velký krevní oběh" },
  },
  {
    id: "small-circulation",
    question: "K čemu slouží malý (plicní) krevní oběh?",
    options: [
      { id: "a", text: "Rozvádí živiny do svalů" },
      { id: "b", text: "Ohřívá krev" },
      { id: "c", text: "V plicích krev odevzdá CO₂ a nabere kyslík" },
      { id: "d", text: "Odvádí krev z mozku" },
    ],
    correct: "c",
    explanation:
      "Malý oběh vede z pravé komory do plic a zpět do levé síně. " +
      "V plicích krev odevzdá oxid uhličitý a nabere kyslík.",
    chapter: { id: "obeh", name: "Malý a velký krevní oběh" },
  },
  {
    id: "heart-sounds",
    question: "Co je slyšet, když srdce dělá „lub-dub“?",
    options: [
      { id: "a", text: "Proudění krve v plicích" },
      { id: "b", text: "Elektrický signál v srdci" },
      { id: "c", text: "Stahování svalů hrudníku" },
      { id: "d", text: "Zavírání srdečních chlopní" },
    ],
    correct: "d",
    explanation:
      "„Lub“ je zavření cípatých chlopní na začátku stahu komor, " +
      "„dub“ je zavření poloměsíčitých chlopní na začátku diastoly.",
    chapter: { id: "cyklus", name: "Srdeční cyklus: stah a odpočinek" },
  },
  {
    id: "fast-heart",
    question: "Srdce zrychlí, třeba při běhu. Která část úderu se zkrátí nejvíc?",
    options: [
      { id: "a", text: "Diastola (odpočinek a plnění srdce)" },
      { id: "b", text: "Systola síní" },
      { id: "c", text: "Systola komor" },
      { id: "d", text: "Všechny části stejně" },
    ],
    correct: "a",
    explanation:
      "Stah komor se zkrátit moc nedá, takže při rychlém tepu ubývá hlavně " +
      "času na diastolu. Je to vidět na časové ose ve vizualizaci.",
    chapter: { id: "cyklus", name: "Srdeční cyklus: stah a odpočinek" },
  },
  {
    id: "pacemaker",
    question: "Co spouští každý úder srdce?",
    options: [
      { id: "a", text: "Mozek pošle před každým úderem povel" },
      { id: "b", text: "Elektrický signál ze sinusového uzlu v pravé síni" },
      { id: "c", text: "Každý nádech plic" },
      { id: "d", text: "Tlak krve v aortě" },
    ],
    correct: "b",
    explanation:
      "Každý úder začíná elektrickým signálem ze sinusového (SA) uzlu. " +
      "Srdce tak bije samo, tělo umí tempo jen zrychlit nebo zpomalit.",
    chapter: { id: "vzruch", name: "Kdo srdci udává rytmus?" },
  },
  {
    id: "resting-hr",
    question: "Jaký je běžný klidový tep dospělého člověka?",
    options: [
      { id: "a", text: "30–50 tepů za minutu" },
      { id: "b", text: "60–100 tepů za minutu" },
      { id: "c", text: "120–160 tepů za minutu" },
      { id: "d", text: "180–220 tepů za minutu" },
    ],
    correct: "b",
    explanation:
      "U dospělých je běžný klidový tep 60 až 100 tepů za minutu. " +
      "Trénovaní sportovci mívají méně, děti naopak více.",
    chapter: { id: "tep", name: "Tep a minutový objem" },
  },
  {
    id: "cardiac-output",
    question:
      "Srdce udělá 70 úderů za minutu a při každém vypudí 70 ml krve. " +
      "Kolik krve přečerpá za minutu?",
    options: [
      { id: "a", text: "0,49 litru" },
      { id: "b", text: "4,9 litru" },
      { id: "c", text: "49 litrů" },
      { id: "d", text: "140 ml" },
    ],
    correct: "b",
    explanation:
      "Minutový objem = tep × tepový objem: 70 × 70 ml = 4 900 ml, " +
      "a to je 4,9 litru.",
    chapter: { id: "tep", name: "Tep a minutový objem" },
  },
];
