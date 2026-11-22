# Health & Fitness Explorer

Vzdělávací webová aplikace o lidském těle, zdraví a sportu.
Ročníkový projekt – Vojta, Scio škola, 2026–2027. Postup je popsaný
v [plánu projektu](docs/project-plan.md).

Aplikace má zatím dva moduly. Mezi nimi se přepíná v hlavičce stránky
(„BMI | Srdce a oběh“). Každý modul má tři části: Explorer – Theory – Knowledge Check.

## Modul 1: BMI Explorer (`index.html`)

1. **Kalkulačka BMI** – spočítá BMI, ukáže výpočet krok za krokem a vysvětlí výsledek.
   - Dospělým (18+) ukáže kategorii podle WHO a barevnou stupnici.
   - Dětem a dospívajícím (2–17 let) spočítá **BMI percentil** podle věku a pohlaví
     (data CDC), ukáže kategorii pro děti a rozmezí BMI pro jejich věk.
     Hranice pro dospělé u dětí nikdy nepoužije.
2. **Teorie** – co je BMI, jak se počítá, jak se hodnotí u dospělých a u dětí,
   jaká má omezení a zajímavosti. Na konci je seznam ověřených zdrojů.
3. **Kvíz** – 10 otázek s výběrem ze čtyř možností. Po každé odpovědi ukáže,
   jestli byla správně, vysvětlí proč a odkáže na kapitolu teorie. Na konci
   ukáže skóre. Pořadí možností se při každém spuštění zamíchá, takže se
   správné odpovědi nedají naučit „podle písmena“.

## Modul 2: Srdce a krevní oběh (`srdce.html`)

První část lednového modulu Heart Rate Explorer: nejdřív teorie a vizualizace,
měření tepu z Bluetooth měřiče přijde v další části.

1. **Vizualizace** – animované srdce v řezu (4 dutiny, chlopně, cévy) a vedle něj
   schéma malého a velkého krevního oběhu s tečkami krve.
   - Posuvník tepu (40–200) a předvolby Spánek / Klid / Chůze / Běh srdce zrychlí.
   - Tlačítka **Pozastavit** a **Krok** – fázemi srdečního cyklu se dá procházet
     jednu po druhé (systola síní → systola komor → diastola).
   - Časová osa jednoho úderu ukazuje, že při rychlém tepu se nejvíc zkracuje diastola.
   - Spočítá, kolik krve srdce přečerpá za minutu a za den a kolikrát za den udeří.
2. **Teorie** – 7 kapitol: k čemu je oběh, stavba srdce a chlopně, malý a velký oběh
   (tepny × žíly), srdeční cyklus a ozvy „lub-dub“, sinusový uzel, tep a minutový
   objem (včetně tabulky tepu dětí a návodu, jak si tep změřit), omezení modelu.
3. **Kvíz** – 10 otázek, funguje stejně jako kvíz o BMI.

## Jak aplikaci spustit

Stačí otevřít soubor `index.html` (nebo `srdce.html`) v prohlížeči (dvojklikem).
Není potřeba nic instalovat ani spouštět žádný server.

## Soubory

| Soubor | Co v něm je |
|---|---|
| `index.html` | Stránka modulu BMI: navigace, formulář, místo pro výsledek, texty teorie, kvíz, zdroje |
| `srdce.html` | Stránka modulu Srdce a oběh: obrázky srdce a oběhu (SVG), ovládání, teorie, kvíz, zdroje |
| `styles.css` | Vzhled obou stránek: barvy, rozložení, úpravy pro mobil |
| `bmi.js` | **Výpočty BMI**: vzorec, kategorie WHO, percentily dětí podle CDC, kontrola zadaných údajů. Nesahá na stránku. |
| `script.js` | **Kalkulačka BMI na stránce**: přečte formulář, zavolá funkce z `bmi.js` a zobrazí výsledek |
| `srdce.js` | **Výpočty pro srdce**: délka úderu a fází, ve které fázi srdce je, minutový objem, údery a litry za den. Nesahá na stránku. |
| `srdce-page.js` | **Animace srdce na stránce**: zmenšuje dutiny, přepíná chlopně, posouvá tečky krve, obsluhuje posuvník a tlačítka |
| `quiz.js` | **Pravidla kvízu** (společná pro oba moduly): míchání odpovědí, vyhodnocení, skóre. Nesahá na stránku. |
| `quiz-bmi.js`, `quiz-srdce.js` | **Otázky kvízu** – každá stránka si načte jen svůj soubor |
| `quiz-page.js` | **Kvíz na stránce**: vykreslí otázky, reaguje na kliknutí, ukáže vysvětlení a výsledek |
| `tests/bmi.test.js` | Automatické testy výpočtů BMI |
| `tests/srdce.test.js` | Automatické testy výpočtů pro srdce |
| `tests/quiz.test.js` | Automatické testy kvízu (obě sady otázek) |
| `docs/project-plan.md` | Plán celého projektu po měsících |
| `docs/srdce-navrh.md` | Návrh modulu Srdce a oběh (co a proč jsme se rozhodli udělat) |

Výpočty (`bmi.js`, `srdce.js`) jsou schválně oddělené od práce se stránkou
(`script.js`, `srdce-page.js`). Stejně tak kvíz: pravidla jsou v `quiz.js`,
otázky v `quiz-bmi.js` / `quiz-srdce.js` a práce se stránkou v `quiz-page.js`.
Díky tomu jdou výpočty otestovat bez prohlížeče a každý soubor má jednu úlohu.

### Jak funguje kalkulačka BMI (zjednodušeně)

1. Uživatel vyplní formulář a stiskne **Spočítat BMI**.
2. `script.js` přečte hodnoty a předá je funkci `validateInputs()` z `bmi.js`.
3. Když je něco špatně, u políčka se ukáže chyba.
4. Jinak `calculateBmi()` spočítá BMI a `roundToOneDecimal()` ho zaokrouhlí.
5. `interpretBmi()` rozhodne: dospělý → kategorie WHO, dítě → `getBmiPercentile()`
   spočítá percentil a `getChildCategory()` k němu najde kategorii CDC.
6. `script.js` výsledek vypíše na stránku.

### Jak funguje animace srdce (zjednodušeně)

1. `srdce-page.js` si pamatuje, kolik sekund uběhlo od začátku aktuálního úderu.
2. Prohlížeč ho asi 60× za sekundu zavolá (`requestAnimationFrame`) a čas se posune.
3. `getPhaseAt()` ze `srdce.js` řekne, ve které fázi srdce je a jak daleko v ní.
4. Podle toho se dutina, která se právě stahuje, zmenší (víc uprostřed stahu, funkce sinus).
   Chlopně a šipky přepíná CSS podle atributu `data-phase` na obrázku.
5. Tečky krve se posouvají po smyčkách oběhu (`getPointAtLength`). V polovině smyčky,
   tedy v plicích nebo v těle, změní barvu.
6. Když uživatel změní tep, `getCardiacOutput()`, `getBeatsPerDay()` a `getPhaseDurations()`
   přepočítají čísla a časovou osu.

## Testy

Pro spuštění testů je potřeba [Node.js](https://nodejs.org/) (verze 18 nebo novější).
Ve složce projektu spusťte:

```bash
node --test
```

Testy kontrolují například:
- příklad ze zadání (70 kg, 175 cm → 22,9),
- hranice kategorií 18,5 / 25 / 30,
- že pod 18 let se nikdy nepoužijí kategorie pro dospělé,
- percentily dětí proti hodnotám z tabulky CDC (5., 50., 85. a 95. percentil),
- že rozmezí BMI v legendě pro děti přesně odpovídají kategoriím (všechny věky, obě pohlaví),
- kontrolu zadaných údajů (prázdná políčka, písmena, nesmyslné hodnoty, výška v metrech),
- srdce: délka úderu (75 tepů → 0,8 s), délky fází v klidu (0,1 / 0,3 / 0,4 s),
  že fáze dají dohromady vždy celý úder, že při rychlém tepu se nejvíc zkrátí
  diastola, minutový objem (70 × 70 ml = 4,9 l), údery za den, kontrola tepu
  a české psaní čísel,
- kvíz (obě sady otázek): každá otázka má 4 různé možnosti a právě jednu správnou,
  odkazy vedou na existující kapitoly na správné stránce, početní otázky souhlasí
  s výpočty, míchání nemění správné odpovědi a skóre se počítá správně.

## Zveřejnění na GitHub Pages

1. Vytvořte na GitHubu nový repozitář (například `bmi-explorer`).
2. Nahrajte do něj všechny soubory z této složky. Buď přes webové rozhraní
   (**Add file → Upload files**), nebo příkazy:

   ```bash
   git init
   git add .
   git commit -m "BMI Explorer – 1. milník"
   git branch -M main
   git remote add origin https://github.com/UZIVATEL/bmi-explorer.git
   git push -u origin main
   ```

3. V repozitáři otevřete **Settings → Pages**.
4. V části **Build and deployment** zvolte **Source: Deploy from a branch**,
   větev **main** a složku **/ (root)**. Klikněte na **Save**.
5. Za minutu nebo dvě bude stránka na adrese
   `https://UZIVATEL.github.io/bmi-explorer/` (modul o srdci na `…/srdce.html`).

## Odborná rozhodnutí

Tato rozhodnutí se hodí znát při obhajobě projektu:

### Modul BMI

- **Zaokrouhlení a kategorie.** Kategorie se určuje ze zaokrouhleného BMI
  (na jedno desetinné místo), aby vždy odpovídala číslu, které uživatel vidí.
  Příklad: BMI 24,96 se zobrazí jako 25,0, a proto je to nadváha.
  Odpovídá to i pravidlu „normální hmotnost = 18,5 až méně než 25“.
- **Hranice 18 let.** Podle zadání se kategorie pro dospělé používají od 18 let
  (WHO uvádí údaje o dospělých od 18 let). Organizace se tu ale úplně neshodnou:
  dětská data WHO sahají do 19 let a americké CDC používá kalkulačku pro dospělé až od 20 let.
- **Děti pod 2 roky.** Kalkulačka přijímá věk od 2 let. U menších dětí se růst
  běžně hodnotí jinými grafy (CDC počítá dětské BMI od 2 let).
- **Percentily dětí podle CDC.** U dětí (2–17 let) aplikace počítá BMI percentil
  z referenčních dat CDC 2000 (soubor `bmiagerev.csv`, metoda LMS). CDC jsme zvolili,
  protože jedna tabulka pokrývá celý věk 2–20 let a má jasné hranice kategorií:
  pod 5. percentilem podváha, 5.–84. normální hmotnost, 85.–94. nadváha,
  95. a výš obezita. WHO by potřebovalo dvě různé sady dat (do 5 let a 5–19 let)
  s jinými hranicemi a české grafy SZÚ nejsou zveřejněné v podobě, ze které jde
  percentil spočítat. Výsledek se proto od hodnocení českým lékařem může mírně lišit.
  Graf v teorii je jen schematický a nemá skutečné hodnoty.
- **Střed roku.** Věk se zadává v celých letech, ale percentily se mění měsíc
  od měsíce. Počítáme proto se středem roku (13 let → 13,5 roku = 162 měsíců).
  Tabulka v `bmi.js` obsahuje jen tyto řádky (16 věků × 2 pohlaví), ne celý soubor CDC.
- **Percentil se zaokrouhluje dolů.** Percentil 84,7 je ještě pod hranicí 85,
  proto se ukáže jako 84 a kategorie je normální hmotnost. Číslo tak vždy
  odpovídá kategorii (stejná myšlenka jako u zaokrouhlení BMI dospělých).
- **Pohlaví.** U dospělých výsledek nemění (hranice WHO jsou pro muže i ženy stejné).
  U dětí je nutné: chlapci a dívky mají každý svou tabulku percentilů.
- **Desetinná čárka.** Kalkulačka přijímá „70,5“ i „70.5“.

### Modul Srdce a oběh

- **Tři fáze místo více.** Fyziologie dělí srdeční cyklus jemněji. Pro vizualizaci
  stačí tři fáze, které jsou dobře vidět: systola síní, systola komor, diastola.
- **Délky fází jednoduchým pravidlem.** Systola síní = osmina úderu, systola komor
  = 0,3 s (nejvýš polovina úderu), diastola = zbytek. Při 75 tepech to dá
  0,1 / 0,3 / 0,4 s. Učebnice OpenStax uvádí asi 100 / 270 / 430 ms, takže model
  čísla zaokrouhluje, ale ukazuje hlavní věc: při rychlém tepu se zkracuje hlavně diastola.
- **Tepový objem pevně 70 ml.** Je to hodnota pro dospělého v klidu (OpenStax).
  Ve skutečnosti se liší podle člověka a při sportu roste, takže minutový objem
  při běhu je ve skutečnosti vyšší. Na stránce je to vysvětleno.
- **Schéma, ne anatomie.** Srdce je nakreslené jako v učebnici: dutiny jsou obdélníky
  a cévy se nekříží, aby bylo jasné, kudy teče krev. Pravá polovina srdce je na
  obrázku vlevo, protože se na člověka díváme zepředu.
- **Modrá a červená.** Odkysličená krev je na obrázcích modrá jen podle zvyklosti,
  ve skutečnosti je tmavě červená. Na stránce je to vysvětleno.
- **Rychlost teček není skutečná.** Tečka oběhne smyčku za 6 úderů. Je to tak,
  aby byl pohyb dobře vidět a zrychloval s tepem.
- **Vypnuté animace.** Kdo má v systému zapnuté „omezit pohyb“
  (`prefers-reduced-motion`), tomu se animace nespustí sama a fázemi prochází tlačítkem Krok.
- **Tep dětí** uvádíme z tabulky Cleveland Clinic. Ruční měření tepu popisujeme
  podle NHLBI (počítat 30 s a vynásobit dvěma).

## Zdroje

Úplný seznam s odkazy je přímo v aplikaci (sekce **Zdroje**). Hlavní zdroje:

- WHO – [Obesity and overweight](https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight)
- WHO – [Growth reference data for 5–19 years](https://www.who.int/tools/growth-reference-data-for-5to19-years)
- CDC – [Adult BMI Calculator](https://www.cdc.gov/bmi/adult-calculator/)
- CDC – [Child and Teen BMI Calculator](https://www.cdc.gov/bmi/child-teen-calculator/)
- CDC – [About BMI](https://www.cdc.gov/bmi/about/index.html)
- CDC – [Data Table of BMI-for-age Charts](https://www.cdc.gov/growthcharts/cdc-data-files.htm) (data L, M, S pro percentily dětí)
- SZÚ – [Růstové grafy ke stažení](https://szu.gov.cz/publikace-szu/data/hodnoceni-rustu-a-vyvoje/rustove-grafy-ke-stazeni/)
- Odborné články z PubMed (Eknoyan 2008, Keys 1972, Nuttall 2015, Romero-Corral 2008,
  Rolland-Cachera 1984, WHO Expert Consultation 2004)

Modul Srdce a oběh:

- NHLBI – [How the Heart Works](https://www.nhlbi.nih.gov/health/heart/anatomy)
  (stavba srdce, průtok krve, jak srdce bije)
- American Heart Association – [All About Heart Rate](https://www.heart.org/en/health-topics/high-blood-pressure/the-facts-about-high-blood-pressure/all-about-heart-rate-pulse)
- Cleveland Clinic – [Heart](https://my.clevelandclinic.org/health/articles/21704-heart),
  [Cardiac Output](https://my.clevelandclinic.org/health/diagnostics/23344-cardiac-output),
  [Children's Vital Signs](https://health.clevelandclinic.org/pediatric-vital-signs/),
  [Facts About Your Heart](https://health.clevelandclinic.org/facts-about-the-heart)
- OpenStax – Anatomy and Physiology 2e, kapitoly
  [19.1 Heart Anatomy](https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy)
  a [19.3 Cardiac Cycle](https://openstax.org/books/anatomy-and-physiology-2e/pages/19-3-cardiac-cycle)
- Live Science – [If blood is red, why do veins look bluish?](https://www.livescience.com/why-veins-blue-arteries-red)

Aplikace slouží ke vzdělávání a nenahrazuje radu lékaře.
