/*
 * srdce-page.js – ANIMACE A OVLÁDÁNÍ NA STRÁNCE O SRDCI
 *
 * Tento soubor rozpohybuje obrázky srdce a krevního oběhu, reaguje
 * na posuvník a tlačítka a vypisuje výsledky. Všechna čísla bere
 * z funkcí v srdce.js – sám nic nepočítá.
 *
 * Jak animace funguje:
 *   1. Pamatujeme si, kolik sekund uběhlo od začátku aktuálního úderu
 *      (proměnná timeInCycle).
 *   2. Prohlížeč nás asi 60× za sekundu zavolá (requestAnimationFrame).
 *      Pokaždé posuneme čas o to, kolik ho mezitím uběhlo.
 *   3. Funkce getPhaseAt ze srdce.js řekne, ve které fázi srdce je.
 *      Podle toho zmenšíme dutiny, otevřeme chlopně a posuneme tečky krve.
 */

// ---------- Prvky stránky ----------

const heartSvg = document.getElementById("heart-svg");
const circulationHeart = document.getElementById("circ-heart");
const chambers = {
  atria: [document.getElementById("chamber-ra"), document.getElementById("chamber-la")],
  ventricles: [document.getElementById("chamber-rv"), document.getElementById("chamber-lv")],
};

const bpmInput = document.getElementById("bpm");
const bpmValue = document.getElementById("bpm-value");
const presetsBox = document.getElementById("presets");
const playButton = document.getElementById("play-toggle");
const stepButton = document.getElementById("step");

const phaseName = document.getElementById("phase-name");
const phaseText = document.getElementById("phase-text");
const phaseAnnounce = document.getElementById("phase-announce");

const cycleDurationText = document.getElementById("cycle-duration");
const timelineMarker = document.getElementById("timeline-marker");

const dotsGroup = document.getElementById("blood-dots");

// ---------- Nastavení animace ----------

// O kolik se dutina při stahu zmenší (0,12 = o 12 %).
const SQUEEZE = 0.12;

// Za kolik úderů oběhne tečka krve jednu smyčku. Není to skutečný čas,
// jen aby byl pohyb dobře vidět.
const BEATS_PER_LAP = 6;

// Kolik teček krve je na každé smyčce.
const DOTS_PER_LOOP = 6;

// Uživatel si v systému vypnul animace? Pak se animace nespustí sama.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Stav ----------

let bpm = PRESETS.find((p) => p.id === "rest").bpm;
let timeInCycle = 0; // sekundy od začátku aktuálního úderu
let lapProgress = 0; // jak daleko jsou tečky krve na smyčce (0 až 1)
let playing = !reducedMotion;
let lastFrameTime = null;
let shownPhaseId = null;

// ---------- Příprava ----------

/**
 * Střed obdélníku dutiny – kolem něj budeme dutinu zmenšovat.
 * Spočítáme ho jen jednou na začátku.
 */
function getCenter(element) {
  const box = element.getBBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

const centers = new Map();
for (const element of [...chambers.atria, ...chambers.ventricles, circulationHeart]) {
  centers.set(element, getCenter(element));
}

/**
 * Zmenší (nebo vrátí do původní velikosti) prvek kolem jeho středu.
 * scale = 1 znamená původní velikost, 0,9 = o 10 % menší.
 */
function setScale(element, scale) {
  const c = centers.get(element);
  element.setAttribute(
    "transform",
    `translate(${c.x} ${c.y}) scale(${scale}) translate(${-c.x} ${-c.y})`
  );
}

/**
 * Jak moc je dutina stažená v daném okamžiku stahu.
 * progress = 0 (začátek stahu) … 1 (konec). Uprostřed je stažená nejvíc,
 * na začátku a na konci má původní velikost. K tomu se hodí funkce sinus.
 */
function squeezeAt(progress, strength) {
  return 1 - strength * Math.sin(Math.PI * progress);
}

// Tečky krve: na každé smyčce několik teček rozmístěných rovnoměrně.
//   first / second = barva v první a druhé polovině smyčky
//   (malý oběh: do plic modrá, z plic červená; velký naopak).
const SVG_NS = "http://www.w3.org/2000/svg";
const loops = [
  { path: document.getElementById("loop-small"), first: "dot-blue", second: "dot-red" },
  { path: document.getElementById("loop-large"), first: "dot-red", second: "dot-blue" },
];
const dots = [];
for (const loop of loops) {
  const length = loop.path.getTotalLength();
  for (let i = 0; i < DOTS_PER_LOOP; i++) {
    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("r", "6");
    circle.classList.add("blood-dot");
    dotsGroup.append(circle);
    dots.push({ circle, loop, length, offset: i / DOTS_PER_LOOP });
  }
}

// Tlačítka předvoleb (Spánek, Klid, Chůze, Běh) podle PRESETS ze srdce.js.
const presetButtons = PRESETS.map((preset) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button preset";
  button.textContent = `${preset.name} (${preset.bpm})`;
  button.addEventListener("click", () => setBpm(preset.bpm));
  presetsBox.append(button);
  return { button, preset };
});

// ---------- Vykreslení ----------

/**
 * Nakreslí aktuální stav: dutiny, chlopně, tečky krve, popis fáze a časovou osu.
 */
function draw() {
  const { phase, progress } = getPhaseAt(bpm, timeInCycle);

  // Chlopně a šipky přepíná CSS podle atributu data-phase (viz styles.css).
  heartSvg.dataset.phase = phase.id;

  // Stahující se dutiny zmenšíme, ostatní mají původní velikost.
  const atriaScale = phase.id === "atria" ? squeezeAt(progress, SQUEEZE) : 1;
  const ventriclesScale = phase.id === "ventricles" ? squeezeAt(progress, SQUEEZE) : 1;
  chambers.atria.forEach((el) => setScale(el, atriaScale));
  chambers.ventricles.forEach((el) => setScale(el, ventriclesScale));
  // Srdce ve schématu oběhu "pulzuje" se stahem komor.
  setScale(circulationHeart, phase.id === "ventricles" ? squeezeAt(progress, SQUEEZE / 2) : 1);

  // Popis fáze měníme jen tehdy, když začne jiná fáze.
  if (phase.id !== shownPhaseId) {
    phaseName.textContent = phase.name;
    phaseText.textContent = phase.text;
    shownPhaseId = phase.id;
  }

  // Značka na časové ose: kolik procent úderu už uběhlo.
  const percent = (timeInCycle / getCycleDuration(bpm)) * 100;
  timelineMarker.style.left = `${percent}%`;

  // Tečky krve: každá je o kousek dál po své smyčce.
  for (const dot of dots) {
    const position = (lapProgress + dot.offset) % 1; // 0 až 1 po smyčce
    const point = dot.loop.path.getPointAtLength(position * dot.length);
    dot.circle.setAttribute("cx", point.x);
    dot.circle.setAttribute("cy", point.y);
    // V plicích (resp. v těle) – v polovině smyčky – krev změní barvu.
    const inFirstHalf = position < 0.5;
    dot.circle.classList.toggle(dot.loop.first, inFirstHalf);
    dot.circle.classList.toggle(dot.loop.second, !inFirstHalf);
  }
}

/**
 * Vypíše čísla, která závisí na tepu: posuvník, výsledky a délky fází.
 */
function showNumbers() {
  bpmInput.value = bpm;
  bpmValue.textContent = bpm;

  cycleDurationText.textContent = `${formatNumber(getCycleDuration(bpm), 2)} s`;
  document.getElementById("stat-output").textContent =
    `${formatNumber(getCardiacOutput(bpm), 1)} l`;
  document.getElementById("stat-beats").textContent = formatNumber(getBeatsPerDay(bpm), 0);
  document.getElementById("stat-liters").textContent =
    `${formatNumber(getLitersPerDay(bpm), 0)} l`;

  // Časová osa: každý úsek je tak široký, kolik procent úderu fáze trvá.
  const durations = getPhaseDurations(bpm);
  const cycle = getCycleDuration(bpm);
  for (const phase of PHASES) {
    const percent = (durations[phase.id] / cycle) * 100;
    document.getElementById(`timeline-${phase.id}`).style.width = `${percent}%`;
  }

  // Zvýrazníme předvolbu, která odpovídá aktuálnímu tepu.
  for (const { button, preset } of presetButtons) {
    button.setAttribute("aria-pressed", String(preset.bpm === bpm));
  }
}

// ---------- Změny ----------

/**
 * Nastaví nový tep. Abychom nepřeskočili do jiné fáze, zachováme,
 * jak velká část úderu už uběhla (např. polovina zůstane polovinou).
 */
function setBpm(value) {
  const checked = validateBpm(value);
  if (checked.error) return; // posuvník jiné hodnoty nedovolí, jen pro jistotu

  const share = timeInCycle / getCycleDuration(bpm);
  bpm = checked.value;
  timeInCycle = share * getCycleDuration(bpm);

  showNumbers();
  draw();
}

/**
 * Posune čas animace o "seconds" sekund.
 */
function advance(seconds) {
  timeInCycle = (timeInCycle + seconds) % getCycleDuration(bpm);
  lapProgress = (lapProgress + (seconds * bpm) / 60 / BEATS_PER_LAP) % 1;
}

/**
 * Jeden snímek animace. Prohlížeč ji volá asi 60× za sekundu.
 * now = čas v milisekundách, který nám prohlížeč předá.
 */
function animate(now) {
  if (!playing) return;
  if (lastFrameTime !== null) {
    // Když byla záložka na pozadí, neskočíme o dlouhou dobu najednou.
    const seconds = Math.min((now - lastFrameTime) / 1000, 0.1);
    advance(seconds);
  }
  lastFrameTime = now;
  draw();
  requestAnimationFrame(animate);
}

function setPlaying(value) {
  playing = value;
  playButton.textContent = playing ? "Pozastavit" : "Přehrát";
  if (playing) {
    lastFrameTime = null;
    requestAnimationFrame(animate);
  }
}

/**
 * Tlačítko Krok: zastaví animaci a skočí doprostřed další fáze
 * (uprostřed je stah nejlépe vidět).
 */
function stepToNextPhase() {
  setPlaying(false);

  const current = getPhaseAt(bpm, timeInCycle).phase;
  const next = getNextPhase(current.id);
  const target = getPhaseStart(bpm, next.id) + getPhaseDurations(bpm)[next.id] / 2;

  // O kolik sekund jsme se posunuli (přes konec úderu počítáme dál od nuly).
  let seconds = target - timeInCycle;
  if (seconds <= 0) seconds += getCycleDuration(bpm);
  lapProgress = (lapProgress + (seconds * bpm) / 60 / BEATS_PER_LAP) % 1;
  timeInCycle = target;

  draw();
  phaseAnnounce.textContent = `${next.name}. ${next.text}`;
}

// ---------- Ovládání ----------

bpmInput.addEventListener("input", () => setBpm(bpmInput.value));
playButton.addEventListener("click", () => setPlaying(!playing));
stepButton.addEventListener("click", stepToNextPhase);

// ---------- Start ----------

// Začneme uprostřed stahu síní, aby i zastavený obrázek něco ukazoval.
timeInCycle = getPhaseDurations(bpm).atria / 2;
showNumbers();
draw();
setPlaying(playing);
