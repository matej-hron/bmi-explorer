/*
 * Automatické testy výpočtů z srdce.js (modul Srdce a krevní oběh).
 *
 * Spuštění ve složce projektu:
 *   node --test
 *
 * Stejně jako u bmi.js načteme soubor do "pískoviště" (modul vm)
 * a vytáhneme si z něj funkce.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const code = fs.readFileSync(path.join(__dirname, "..", "srdce.js"), "utf8");
const heart = vm.runInNewContext(
  code +
    "\n({ BPM_LIMITS, STROKE_VOLUME_ML, PHASES, PRESETS, getCycleDuration," +
    " getPhaseDurations, getPhaseAt, getPhaseStart, getNextPhase, getCardiacOutput," +
    " getBeatsPerDay, getLitersPerDay, validateBpm, formatNumber })"
);

// Porovnání desetinných čísel (počítač počítá s malou nepřesností)
function near(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: ${actual} ≠ ${expected}`);
}

test("délka jednoho srdečního cyklu", () => {
  near(heart.getCycleDuration(60), 1, "60 tepů → 1 s");
  near(heart.getCycleDuration(75), 0.8, "75 tepů → 0,8 s");
  near(heart.getCycleDuration(120), 0.5, "120 tepů → 0,5 s");
});

test("fáze cyklu jdou v pořadí: síně → komory → diastola", () => {
  // [...] převede pole z "pískoviště" na obyčejné pole, aby šlo porovnat.
  assert.deepEqual(
    [...heart.PHASES.map((p) => p.id)],
    ["atria", "ventricles", "diastole"]
  );
  for (const phase of heart.PHASES) {
    assert.ok(phase.name.length > 3, phase.id);
    assert.ok(phase.text.length > 20, phase.id);
  }
});

test("délky fází v klidu (75 tepů) odpovídají učebnici", () => {
  const d = heart.getPhaseDurations(75);
  near(d.atria, 0.1, "systola síní");
  near(d.ventricles, 0.3, "systola komor");
  near(d.diastole, 0.4, "diastola");
});

test("součet fází je vždy celý cyklus", () => {
  for (let bpm = heart.BPM_LIMITS.min; bpm <= heart.BPM_LIMITS.max; bpm++) {
    const d = heart.getPhaseDurations(bpm);
    near(d.atria + d.ventricles + d.diastole, heart.getCycleDuration(bpm), `${bpm} tepů`);
    assert.ok(d.diastole > 0, `${bpm} tepů: diastola musí zbýt`);
  }
});

test("při rychlém tepu se nejvíc zkrátí diastola", () => {
  const rest = heart.getPhaseDurations(60);
  const run = heart.getPhaseDurations(180);
  const loss = {
    atria: rest.atria - run.atria,
    ventricles: rest.ventricles - run.ventricles,
    diastole: rest.diastole - run.diastole,
  };
  assert.ok(loss.diastole > loss.ventricles, "diastola se zkrátí víc než systola komor");
  assert.ok(loss.diastole > loss.atria, "diastola se zkrátí víc než systola síní");
});

test("getPhaseAt najde správnou fázi a jak daleko v ní jsme", () => {
  // 75 tepů: síně 0–0,1 s, komory 0,1–0,4 s, diastola 0,4–0,8 s
  let at = heart.getPhaseAt(75, 0);
  assert.equal(at.phase.id, "atria");
  near(at.progress, 0, "začátek");

  at = heart.getPhaseAt(75, 0.05);
  assert.equal(at.phase.id, "atria");
  near(at.progress, 0.5, "polovina systoly síní");

  at = heart.getPhaseAt(75, 0.25);
  assert.equal(at.phase.id, "ventricles");
  near(at.progress, 0.5, "polovina systoly komor");

  at = heart.getPhaseAt(75, 0.6);
  assert.equal(at.phase.id, "diastole");
  near(at.progress, 0.5, "polovina diastoly");
});

test("getPhaseAt počítá i s časem delším než jeden cyklus", () => {
  // 0,85 s při 75 tepech = 0,05 s do druhého cyklu
  const at = heart.getPhaseAt(75, 0.85);
  assert.equal(at.phase.id, "atria");
  near(at.progress, 0.5, "druhý cyklus");
});

test("getPhaseStart: kdy v cyklu začíná která fáze", () => {
  near(heart.getPhaseStart(75, "atria"), 0, "síně na začátku");
  near(heart.getPhaseStart(75, "ventricles"), 0.1, "komory po 0,1 s");
  near(heart.getPhaseStart(75, "diastole"), 0.4, "diastola po 0,4 s");
  // Začátek fáze musí getPhaseAt poznat jako tu samou fázi
  for (const phase of heart.PHASES) {
    assert.equal(heart.getPhaseAt(120, heart.getPhaseStart(120, phase.id)).phase.id, phase.id);
  }
});

test("getNextPhase jde dokola", () => {
  assert.equal(heart.getNextPhase("atria").id, "ventricles");
  assert.equal(heart.getNextPhase("ventricles").id, "diastole");
  assert.equal(heart.getNextPhase("diastole").id, "atria");
});

test("minutový objem = tep × tepový objem", () => {
  assert.equal(heart.STROKE_VOLUME_ML, 70);
  near(heart.getCardiacOutput(70), 4.9, "70 tepů × 70 ml");
  near(heart.getCardiacOutput(72), 5.04, "72 tepů × 70 ml");
  near(heart.getCardiacOutput(100, 100), 10, "vlastní tepový objem");
});

test("údery a litry za den", () => {
  assert.equal(heart.getBeatsPerDay(72), 103680);
  near(heart.getLitersPerDay(72), 7257.6, "litrů za den");
});

test("předvolby jsou v povoleném rozsahu", () => {
  for (const preset of heart.PRESETS) {
    assert.ok(preset.bpm >= heart.BPM_LIMITS.min && preset.bpm <= heart.BPM_LIMITS.max, preset.name);
  }
});

test("validateBpm hlídá rozsah a čísla", () => {
  assert.deepEqual({ ...heart.validateBpm(72) }, { value: 72, error: null });
  assert.deepEqual({ ...heart.validateBpm("90") }, { value: 90, error: null });
  assert.equal(heart.validateBpm(heart.BPM_LIMITS.min).error, null);
  assert.equal(heart.validateBpm(heart.BPM_LIMITS.max).error, null);
  assert.match(heart.validateBpm(39).error, /40–200/);
  assert.match(heart.validateBpm(201).error, /40–200/);
  assert.match(heart.validateBpm("abc").error, /40–200/);
  assert.match(heart.validateBpm(72.5).error, /celé číslo/);
});

test("formatNumber píše čísla česky", () => {
  assert.equal(heart.formatNumber(4.9, 1), "4,9");
  assert.equal(heart.formatNumber(5.04, 1), "5,0");
  // Mezi tisíci je pevná mezera (aby se číslo nezalomilo na dva řádky)
  assert.equal(heart.formatNumber(103680, 0).replace(/\s/g, " "), "103 680");
});
