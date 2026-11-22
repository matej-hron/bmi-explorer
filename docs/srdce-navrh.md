# Návrh: 2. modul – Srdce a krevní oběh (1. část Heart Rate Exploreru)

## Kontext

Druhá fáze ročníkového plánu (`docs/project-plan.md`, leden 2027) je **Heart Rate Explorer**.
Domluvili jsme se, že začneme **teorií a vizualizací srdeční činnosti**. Měření tepu
přes Bluetooth přijde až jako další krok, v samostatné práci.
Modul dodrží společný princip: **Teorie → Explorer (vizualizace) → Kvíz**.
Cílová skupina: žák (14 let) a jeho spolužáci. Kód musí být srozumitelný a obhajitelný.

**Rozhodnuto s uživatelem:**
- Vizualizace = **srdce v řezu + schéma malého a velkého oběhu**, posuvník tepu zrychluje obojí.
- **Nová stránka** vedle BMI a **společná navigace** mezi moduly.

**Moje rozhodnutí (lze změnit):**
- Kreslení v ručně psaném SVG a animace v čistém JavaScriptu (`requestAnimationFrame`), bez knihoven.
- Stránka se dál otevírá dvojklikem (`file://`).
- Když má uživatel v systému vypnuté animace (`prefers-reduced-motion`), animace se nespustí sama a ovládá se tlačítkem „Krok“.
- Tepový objem je pevně 70 ml (dospělý v klidu). Že ve skutečnosti při sportu roste, bude vysvětleno jako omezení modelu.
- Návrh se uloží jako `docs/srdce-navrh.md`, česky a vedle `project-plan.md`. Do projektu žáka se nepřidá složka `superpowers`.

**Mimo rozsah:** Bluetooth, EKG křivka, zvuk ozev, přestěhování souborů do složek (to až v dubnu s Dashboardem).

## Přístupy (zvažováno)

- **A) Nová stránka v kořeni + společná navigace**: zvoleno. BMI se nerozbije a stránka jde dál otevřít dvojklikem.
- B) Složka pro každý modul + rozcestník: čistší, ale teď by se musel stěhovat hotový BMI modul. Odloženo na duben.
- C) Jedna stránka s přepínáním: `index.html` už má přes 700 řádků. Zamítnuto.

## Soubory

| Soubor | Změna |
|---|---|
| `srdce.html` | **nová** stránka: úvod, Vizualizace, Teorie, Kvíz, Zdroje |
| `srdce.js` | **nový**, jen výpočty, nesahá na stránku (stejně jako `bmi.js`) |
| `srdce-page.js` | **nový**, SVG animace, ovládání, výpis výpočtů |
| `tests/srdce.test.js` | **nový**, testy výpočtů (načítá skript přes `vm` jako ostatní testy) |
| `quiz.js` | jen pravidla kvízu (míchání, vyhodnocení, skóre). Otázky BMI se přesunou do `quiz-bmi.js` |
| `quiz-bmi.js`, `quiz-srdce.js` | **nové**, každý definuje `QUIZ_QUESTIONS` pro svou stránku |
| `quiz-page.js` | beze změny logiky, použije `QUIZ_QUESTIONS`, který stránka načetla |
| `tests/quiz.test.js` | kontrola obou sad otázek (odkazy na kapitoly existují v příslušném HTML) |
| `index.html` | nová společná hlavička, načte `quiz-bmi.js` |
| `styles.css` | styly přepínače modulů, vizualizace a ovládání; mobil od 320 px |
| `README.md`, `docs/project-plan.md` | popis modulu a rozdělení ledna na 1. a 2. část |

### Společná navigace

Hlavička na obou stránkách: logo **Health & Fitness Explorer** a pod ním přepínač
modulů `BMI | Srdce a oběh`. Aktivní modul bude zvýrazněný (`aria-current="page"`).
Vedle přepínače zůstanou odkazy na sekce dané stránky. Hlavička je v obou HTML stejná (bez šablon),
na začátku má komentář „při změně uprav i druhou stránku“. Navigace se musí na 320 px zalomit stejně jako dnes.

## Vizualizace (Explorer)

```
┌─ Srdce v řezu ───────┐  ┌─ Krevní oběh ───────┐
│ PS │ LS   (síně)     │  │     [ plíce ]       │
│ PK │ LK   (komory)   │  │   ↑ malý oběh ↓     │
│ chlopně, cévy        │  │     [ srdce ] ●●●   │
└──────────────────────┘  │   ↓ velký oběh ↑    │
Fáze: Komory se stahují   │     [ tělo ]        │
(systola komor)…          └─────────────────────┘
Tep: [────●──────] 72 /min   [Spánek][Klid][Chůze][Běh]  ▶/⏸  Krok
Za minutu ≈ 5,0 l krve · za den ≈ 103 680 úderů a ≈ 7 300 l
```

- **Srdce:** schematické, jako v učebnici. Má 4 dutiny, cévy (duté žíly, plicní tepna, plicní žíly, aorta)
  a chlopně (trojcípá, dvojcípá, plicnicová, aortální). Okysličená krev je červená, odkysličená modrá
  (v teorii bude vysvětleno, že jde jen o konvenci).
- **Fáze cyklu (3):** diastola (plnění), systola síní, systola komor. Dutina, která se stahuje, se zmenší.
  Chlopně se otevírají a zavírají podle fáze. Pod obrázkem je popis fáze v `aria-live`.
- **Oběh:** tečky krve se pohybují po dvou smyčkách. V plících zčervenají, v těle zmodrají. Rychlost odpovídá tepu.
- **Ovládání:** posuvník 40–200 tepů/min, předvolby Spánek 50 / Klid 70 / Chůze 100 / Běh 160,
  Přehrát/Pauza a Krok (o jednu fázi dál).

### Výpočty v `srdce.js` (testované)

- `getCycleDuration(bpm)` = 60 / bpm (s).
- `getPhaseDurations(bpm)`: systola síní = cyklus / 8; systola komor = min(0,3 s, cyklus / 2);
  diastola = zbytek. Je to zjednodušený model. Ukazuje, že **při rychlém tepu se zkracuje hlavně diastola**.
- `getPhaseAt(bpm, timeInCycle)`: vrátí aktuální fázi a kolik z ní už uběhlo (0–1).
- `getCardiacOutput(bpm, strokeVolumeMl = 70)`: litry za minutu.
- `getBeatsPerDay(bpm)` a `getLitersPerDay(bpm)`.
- `validateBpm(value)`: kontrola rozsahu 40–200.

## Teorie (kapitoly s `id` pro odkazy z kvízu)

1. `k-cemu`: k čemu je krev a oběh (kyslík, živiny, CO₂, teplo).
2. `stavba`: stavba srdce. Velikost pěsti, 4 dutiny, přepážka, chlopně, proč má levá komora silnější stěnu.
3. `obeh`: malý a velký oběh. Tepny a žíly (**tepna vede krev od srdce**, ne „okysličenou“; plicní tepna vede odkysličenou krev), vlásečnice.
4. `cyklus`: srdeční cyklus. Diastola a systola, chlopně brání zpětnému toku, ozvy „lub-dub“.
5. `vzruch`: kdo dává rytmus. Sinusový uzel, srdce bije samo (krátce, jako příprava na pozdější měření).
6. `tep`: tep a minutový objem. Klidová frekvence dospělých 60–100/min, u dětí vyšší, u sportovců nižší.
   Výpočet tep × tepový objem. Ruční měření tepu (30 s × 2 podle NHLBI) jako most k 2. části.
7. `omezeni`: omezení modelu a zajímavosti (počet úderů za den, objem krve asi 5 l u dospělého).

Všechny číselné údaje se při psaní ověří ve zdrojích. Do sekce Zdroje přijdou jen ověřené odkazy.

**Při psaní (22. 11. 2026):** údaje jsou ověřené v NHLBI, American Heart Association,
Cleveland Clinic, učebnici OpenStax Anatomy and Physiology 2e a článku Live Science.
Objem krve v těle (asi 5 l) jsme vypustili, protože se pro něj nenašel dost spolehlivý zdroj.
Stránky NCBI/StatPearls nešlo ověřit, proto mezi zdroji nejsou.

## Kvíz (`quiz-srdce.js`, asi 10 otázek)

Počet dutin; která komora pumpuje krev do těla; proč je levá komora silnější; co je tepna (záludnost s plicní tepnou);
k čemu je malý oběh; k čemu jsou chlopně; co dělá zvuk „lub-dub“; kdo udává rytmus; normální klidový tep;
výpočet 70 × 70 ml ≈ 4,9 l/min (test ho porovná s `getCardiacOutput`); co se při rychlém tepu zkracuje nejvíc.

## Postup

0. `git pull` (lokální `main` nemá kvíz z PR #2), nová větev `feature/srdce-obeh`.
   Uložit tento návrh jako `docs/srdce-navrh.md`.
1. TDD: nejdřív `tests/srdce.test.js`, potom `srdce.js`.
2. Rozdělit kvíz na `quiz.js` + `quiz-bmi.js`. Ověřit, že BMI kvíz funguje beze změny (testy zelené).
3. Společná hlavička na `index.html` a kostra `srdce.html`.
4. SVG srdce a oběh, `srdce-page.js` (animace, ovládání, výpočty na stránce, reduced-motion).
5. Teorie + zdroje (ověřené), `quiz-srdce.js` + testy.
6. README (soubory, jak modul funguje, odborná rozhodnutí) a `docs/project-plan.md`.
7. PR do `main` a zapnout auto-merge (`gh pr merge --auto --squash`). Až po zelených testech a ověření v prohlížeči.

## Ověření

- `node --test`: všechny testy BMI, kvízu i srdce zelené.
- Otevřít `index.html` i `srdce.html` dvojklikem (`file://`) a v Chrome přes Claude in Chrome vyzkoušet:
  přepínání modulů, posuvník, předvolby, Pauza/Krok, změnu fáze a výpočtů, oba kvízy.
  Konzole musí být bez chyb.
- Mobil 320–414 px: navigace se zalomí, vizualizace se vejde a nic nepřetéká do strany.
- Se zapnutým `prefers-reduced-motion` se animace nespustí sama a Krok funguje.
- Dobrovolně: Safari a Firefox (stránka nepoužívá nic, co by v nich nefungovalo).
