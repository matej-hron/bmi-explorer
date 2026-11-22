/*
 * srdce.js – VÝPOČTY PRO MODUL SRDCE A KREVNÍ OBĚH
 *
 * Stejně jako bmi.js tady nic nemění webovou stránku. Jsou tu jen čísla
 * a pravidla: jak dlouho trvá srdeční cyklus, ve které fázi srdce právě je
 * a kolik krve přečerpá. Díky tomu je můžeme vyzkoušet automatickými testy
 * (viz soubor tests/srdce.test.js).
 *
 * Se stránkou (obrázky a animací) pracuje až soubor srdce-page.js.
 */

// Rozsah tepu na posuvníku (údery za minutu).
// Nejde o lékařské hranice – jen rozumný rozsah pro vizualizaci.
const BPM_LIMITS = { min: 40, max: 200 };

// Tepový objem: kolik krve vypudí levá komora při jednom stahu.
// U dospělého v klidu je to zhruba 70 ml. Ve skutečnosti se při sportu
// zvětšuje, ale náš model ho pro jednoduchost nechává stejný.
const STROKE_VOLUME_ML = 70;

// Délka systoly komor v klidu (sekundy). Viz getPhaseDurations.
const VENTRICLE_SYSTOLE_REST = 0.3;

// Tři fáze srdečního cyklu v pořadí, jak jdou za sebou.
//   id   = krátký název (jen pro program)
//   name = název, který se ukáže na stránce
//   text = co se v té fázi děje
const PHASES = [
  {
    id: "atria",
    name: "Systola síní – síně se stahují",
    text:
      "Síně se stáhnou a dotlačí zbytek krve do komor. " +
      "Cípaté chlopně mezi síněmi a komorami jsou otevřené.",
  },
  {
    id: "ventricles",
    name: "Systola komor – komory se stahují",
    text:
      "Komory se stáhnou. Cípaté chlopně se zavřou (to je první ozva – „lub“), " +
      "aby krev netekla zpátky do síní. Krev vytéká poloměsíčitými chlopněmi " +
      "do plicní tepny a do aorty.",
  },
  {
    id: "diastole",
    name: "Diastola – srdce odpočívá a plní se",
    text:
      "Celé srdce povolí. Poloměsíčité chlopně se zavřou (druhá ozva – „dub“). " +
      "Krev z žil teče do síní a přes otevřené cípaté chlopně i do komor.",
  },
];

// Předvolby tepu pro tlačítka pod posuvníkem (přibližné hodnoty).
const PRESETS = [
  { id: "sleep", name: "Spánek", bpm: 50 },
  { id: "rest", name: "Klid", bpm: 70 },
  { id: "walk", name: "Chůze", bpm: 100 },
  { id: "run", name: "Běh", bpm: 160 },
];

/**
 * Jak dlouho trvá jeden srdeční cyklus (jeden úder) v sekundách.
 * Za minutu (60 s) proběhne "bpm" cyklů, proto 60 / bpm.
 * Příklad: 75 tepů za minutu → 60 / 75 = 0,8 s.
 */
function getCycleDuration(bpm) {
  return 60 / bpm;
}

/**
 * Jak dlouho trvají jednotlivé fáze cyklu (v sekundách).
 *
 * Zjednodušený model:
 *   - systola síní = osmina cyklu (v klidu při 75 tepech 0,1 s),
 *   - systola komor = 0,3 s, ale nejvýš polovina cyklu,
 *   - diastola = co zbývá.
 *
 * Model ukazuje skutečnou věc: když srdce zrychlí, zkracuje se hlavně
 * diastola (odpočinek a plnění). Stah komor se zkracuje mnohem méně.
 */
function getPhaseDurations(bpm) {
  const cycle = getCycleDuration(bpm);
  const atria = cycle / 8;
  const ventricles = Math.min(VENTRICLE_SYSTOLE_REST, cycle / 2);
  const diastole = cycle - atria - ventricles;
  return { atria, ventricles, diastole };
}

/**
 * Ve které fázi je srdce v čase "time" (sekundy od začátku animace)?
 * Vrátí { phase, progress }:
 *   phase    = jedna z PHASES
 *   progress = jak velká část fáze už uběhla (0 = začátek, 1 = konec)
 */
function getPhaseAt(bpm, time) {
  const durations = getPhaseDurations(bpm);
  // Zbytek po dělení: kolik sekund uběhlo od začátku AKTUÁLNÍHO cyklu.
  let t = time % getCycleDuration(bpm);

  for (const phase of PHASES) {
    const length = durations[phase.id];
    if (t < length) {
      return { phase, progress: t / length };
    }
    t -= length;
  }
  // Sem se dostaneme jen kvůli nepřesnosti počítání s desetinnými čísly.
  return { phase: PHASES[PHASES.length - 1], progress: 1 };
}

/**
 * Kdy (kolik sekund od začátku cyklu) začíná fáze "id".
 * Sečteme délky všech fází, které jsou před ní.
 * Příklad při 75 tepech: síně 0 s, komory 0,1 s, diastola 0,4 s.
 */
function getPhaseStart(bpm, id) {
  const durations = getPhaseDurations(bpm);
  let start = 0;
  for (const phase of PHASES) {
    if (phase.id === id) return start;
    start += durations[phase.id];
  }
  return 0;
}

/**
 * Která fáze přijde po fázi "id"? Po diastole začíná znovu systola síní.
 */
function getNextPhase(id) {
  const index = PHASES.findIndex((p) => p.id === id);
  return PHASES[(index + 1) % PHASES.length];
}

/**
 * Minutový objem srdce: kolik litrů krve přečerpá levá komora za minutu.
 * Minutový objem = tep × tepový objem.
 * Příklad: 70 tepů × 70 ml = 4 900 ml = 4,9 l za minutu.
 */
function getCardiacOutput(bpm, strokeVolumeMl = STROKE_VOLUME_ML) {
  return (bpm * strokeVolumeMl) / 1000; // ml → litry
}

/**
 * Kolikrát srdce udeří za den (24 hodin × 60 minut).
 */
function getBeatsPerDay(bpm) {
  return bpm * 60 * 24;
}

/**
 * Kolik litrů krve srdce přečerpá za den.
 */
function getLitersPerDay(bpm, strokeVolumeMl = STROKE_VOLUME_ML) {
  return getCardiacOutput(bpm, strokeVolumeMl) * 60 * 24;
}

/**
 * Kontrola tepu: musí to být celé číslo v rozsahu BPM_LIMITS.
 * Vrátí { value, error }; když je všechno v pořádku, error je null.
 */
function validateBpm(input) {
  const value = Number(input);
  const range = `${BPM_LIMITS.min}–${BPM_LIMITS.max}`;

  if (!Number.isFinite(value) || value < BPM_LIMITS.min || value > BPM_LIMITS.max) {
    return { value: null, error: `Tep musí být v rozmezí ${range} tepů za minutu.` };
  }
  if (!Number.isInteger(value)) {
    return { value: null, error: "Tep zadejte jako celé číslo." };
  }
  return { value, error: null };
}

/**
 * Zapíše číslo česky: desetinná čárka a mezera mezi tisíci.
 * decimals = počet desetinných míst.
 */
function formatNumber(value, decimals) {
  return value.toLocaleString("cs-CZ", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
