# BMI Explorer

Vzdělávací webová aplikace o indexu tělesné hmotnosti (BMI).
Ročníkový projekt – Vojta, Scio škola, 2026. **1. milník.**

Aplikace má dvě části:

1. **Kalkulačka BMI** – spočítá BMI, ukáže výpočet krok za krokem a vysvětlí výsledek.
   - Dospělým (18+) ukáže kategorii podle WHO a barevnou stupnici.
   - Dětem a dospívajícím (2–17 let) spočítá **BMI percentil** podle věku a pohlaví
     (data CDC), ukáže kategorii pro děti a rozmezí BMI pro jejich věk.
     Hranice pro dospělé u dětí nikdy nepoužije.
2. **Teorie** – co je BMI, jak se počítá, jak se hodnotí u dospělých a u dětí,
   jaká má omezení a zajímavosti. Na konci je seznam ověřených zdrojů.

## Jak aplikaci spustit

Stačí otevřít soubor `index.html` v prohlížeči (dvojklikem). Není potřeba
nic instalovat ani spouštět žádný server.

## Soubory

| Soubor | Co v něm je |
|---|---|
| `index.html` | Obsah stránky: navigace, formulář, místo pro výsledek, texty teorie, zdroje |
| `styles.css` | Vzhled: barvy, rozložení, úpravy pro mobil |
| `bmi.js` | **Výpočty a pravidla**: vzorec BMI, kategorie WHO, percentily dětí podle CDC, kontrola zadaných údajů. Nesahá na stránku. |
| `script.js` | **Práce se stránkou**: přečte formulář, zavolá funkce z `bmi.js` a zobrazí výsledek |
| `tests/bmi.test.js` | Automatické testy výpočtů |

Výpočty (`bmi.js`) jsou schválně oddělené od práce se stránkou (`script.js`).
Díky tomu jdou výpočty otestovat bez prohlížeče a každý soubor má jednu úlohu.

### Jak to funguje (zjednodušeně)

1. Uživatel vyplní formulář a stiskne **Spočítat BMI**.
2. `script.js` přečte hodnoty a předá je funkci `validateInputs()` z `bmi.js`.
3. Když je něco špatně, u políčka se ukáže chyba.
4. Jinak `calculateBmi()` spočítá BMI a `roundToOneDecimal()` ho zaokrouhlí.
5. `interpretBmi()` rozhodne: dospělý → kategorie WHO, dítě → `getBmiPercentile()`
   spočítá percentil a `getChildCategory()` k němu najde kategorii CDC.
6. `script.js` výsledek vypíše na stránku.

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
- kontrolu zadaných údajů (prázdná políčka, písmena, nesmyslné hodnoty, výška v metrech).

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
   `https://UZIVATEL.github.io/bmi-explorer/`.

## Odborná rozhodnutí

Tato rozhodnutí se hodí znát při obhajobě projektu:

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

Aplikace slouží ke vzdělávání a nenahrazuje radu lékaře.
