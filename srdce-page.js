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
const timelineSegments = {};
for (const phase of PHASES) {
  timelineSegments[phase.id] = document.getElementById(`timeline-${phase.id}`);
}

const circulationSvg = document.getElementById("circulation-svg");
const circuitToggle = document.getElementById("circuit-toggle");

// ---------- Nastavení animace ----------

// O kolik se dutina při stahu zmenší (0,12 = o 12 %).
const SQUEEZE = 0.12;

// O kolik bodů obrázku se tečky krve posunou za jeden úder srdce.
// Není to skutečná rychlost krve, jen aby byl pohyb dobře vidět.
// Všechny tečky jedou stejně rychle, takže krátkou cestu do plic
// oběhnou dřív než dlouhou cestu do nohou.
const DISTANCE_PER_BEAT = 40;

// Jak daleko od sebe jsou tečky krve na cévě (v bodech obrázku).
const DOT_SPACING = 45;

// Uživatel si v systému vypnul animace? Pak se animace nespustí sama.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Stav ----------

let bpm = PRESETS.find((p) => p.id === "rest").bpm;
let timeInCycle = 0; // sekundy od začátku aktuálního úderu
let bloodDistance = 0; // kolik bodů obrázku už tečky krve ujely
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

// Okruhy krve v obrázku oběhu. Každý okruh (g.circuit v srdce.html) má
// tepnu (data-part="out", krev teče ze srdce) a žílu (data-part="back",
// krev teče zpátky do srdce). Tečka jede nejdřív po tepně, pak po žíle.
const SVG_NS = "http://www.w3.org/2000/svg";
const circuits = [];
for (const group of circulationSvg.querySelectorAll(".circuit")) {
  const parts = ["out", "back"].map((name) => {
    const path = group.querySelector(`[data-part="${name}"]`);

    // Pod každou cévu dáme její širokou průsvitnou kopii – "záři",
    // aby byly oběhy dobře vidět.
    const glow = path.cloneNode();
    glow.removeAttribute("data-part");
    glow.classList.add("loop-glow");
    group.insertBefore(glow, path);

    return {
      path,
      length: path.getTotalLength(),
      color: path.classList.contains("loop-red") ? "dot-red" : "dot-blue",
    };
  });
  const length = parts[0].length + parts[1].length;

  // Na delší okruh přijde víc teček, aby byly všude stejně husté.
  const count = Math.max(2, Math.round(length / DOT_SPACING));
  const dots = [];
  for (let i = 0; i < count; i++) {
    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("r", "4.5");
    circle.classList.add("blood-dot");
    group.append(circle);
    dots.push({ circle, offset: i / count });
  }
  circuits.push({ parts, length, dots });
}

/**
 * Kde je tečka krve a jakou má barvu.
 * position = 0 až 1: jak daleko je tečka na svém okruhu.
 */
function getDotPlace(circuit, position) {
  let distance = position * circuit.length;
  const [out, back] = circuit.parts;
  const part = distance < out.length ? out : back;
  if (part === back) distance -= out.length;
  return { point: part.path.getPointAtLength(distance), color: part.color };
}

// Tlačítka nad obrázkem oběhu: zvýraznit oba oběhy, jen malý, nebo jen velký.
// Ten druhý CSS ztlumí podle atributu data-show (viz styles.css).
circuitToggle.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  circulationSvg.dataset.show = button.dataset.show;
  for (const other of circuitToggle.querySelectorAll("button")) {
    other.setAttribute("aria-pressed", String(other === button));
  }
});

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
 * Popis fáze pod obrázky.
 *
 * Když animace běží, fáze se střídají i několikrát za sekundu – text by
 * jen blikal a nedal se přečíst (a na telefonu by celý panel poskakoval).
 * Proto při přehrávání ukážeme jednu stálou nápovědu a popis fáze
 * až tehdy, když animaci pozastavíme nebo stiskneme Krok.
 */
function showPhaseText(phase) {
  const key = playing ? "playing" : phase.id;
  if (key === shownPhaseId) return; // text se nezměnil, nic nepřepisujeme
  shownPhaseId = key;

  if (playing) {
    phaseName.textContent = "Srdce bije…";
    phaseText.textContent =
      "Ve které fázi srdce právě je, ukazuje barevná osa níže. " +
      "Popis fáze se objeví, když animaci pozastavíte nebo stisknete Krok.";
  } else {
    phaseName.textContent = phase.name;
    phaseText.textContent = phase.text;
  }
}

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

  showPhaseText(phase);

  // Na časové ose zvýrazníme úsek fáze, která právě běží.
  for (const p of PHASES) {
    timelineSegments[p.id].classList.toggle("is-active", p.id === phase.id);
  }

  // Značka na časové ose: kolik procent úderu už uběhlo.
  const percent = (timeInCycle / getCycleDuration(bpm)) * 100;
  timelineMarker.style.left = `${percent}%`;

  // Tečky krve: každá je o kousek dál po svém okruhu.
  for (const circuit of circuits) {
    // Jak daleko je okruh "ujetý" (0 až 1). Krátký okruh se oběhne rychleji.
    const lap = bloodDistance / circuit.length;
    for (const dot of circuit.dots) {
      const { point, color } = getDotPlace(circuit, (lap + dot.offset) % 1);
      dot.circle.setAttribute("cx", point.x);
      dot.circle.setAttribute("cy", point.y);
      // Na tepně a na žíle má krev jinou barvu (v plicích zčervená, v těle zmodrá).
      dot.circle.classList.toggle("dot-red", color === "dot-red");
      dot.circle.classList.toggle("dot-blue", color === "dot-blue");
    }
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
    timelineSegments[phase.id].style.width = `${percent}%`;
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
  bloodDistance += ((seconds * bpm) / 60) * DISTANCE_PER_BEAT;
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
  draw(); // přepne popis fáze (při přehrávání jen nápověda)
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
  bloodDistance += ((seconds * bpm) / 60) * DISTANCE_PER_BEAT;
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
