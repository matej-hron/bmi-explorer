# BMI Explorer

Vzdělávací webová aplikace o indexu tělesné hmotnosti (BMI).
Ročníkový projekt – Vojta, Scio škola, 2026. **1. milník.**

Aplikace má dvě části:

1. **Kalkulačka BMI** – spočítá BMI, ukáže výpočet krok za krokem a vysvětlí výsledek.
   - Dospělým (18+) ukáže kategorii podle WHO a barevnou stupnici.
   - Dětem a dospívajícím (2–17 let) kategorii pro dospělé **neukazuje** a vysvětlí,
     že se jejich BMI hodnotí podle percentilových růstových grafů.
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
| `bmi.js` | **Výpočty a pravidla**: vzorec BMI, kategorie WHO, kontrola zadaných údajů. Nesahá na stránku. |
| `script.js` | **Práce se stránkou**: přečte formulář, zavolá funkce z `bmi.js` a zobrazí výsledek |
| `tests/bmi.test.js` | Automatické testy výpočtů |

Výpočty (`bmi.js`) jsou schválně oddělené od práce se stránkou (`script.js`).
Díky tomu jdou výpočty otestovat bez prohlížeče a každý soubor má jednu úlohu.

### Jak to funguje (zjednodušeně)

1. Uživatel vyplní formulář a stiskne **Spočítat BMI**.
2. `script.js` přečte hodnoty a předá je funkci `validateInputs()` z `bmi.js`.
3. Když je něco špatně, u políčka se ukáže chyba.
4. Jinak `calculateBmi()` spočítá BMI a `roundToOneDecimal()` ho zaokrouhlí.
5. `interpretBmi()` rozhodne: dospělý → kategorie WHO, dítě → bez kategorie.
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
- **Žádné percentily.** Aplikace percentily nepočítá. Potřebovala by k tomu velké
  tabulky referenčních dat a různé organizace (WHO, CDC, český SZÚ) používají
  různá data i hranice. Proto u dětí ukazuje jen matematické BMI a vysvětlení.
  Graf v teorii je jen schematický a nemá skutečné hodnoty.
- **Pohlaví.** U dospělých výsledek nemění (hranice WHO jsou pro muže i ženy stejné).
  U dětí se použije v textu: určuje, který růstový graf by se měl použít.
- **Desetinná čárka.** Kalkulačka přijímá „70,5“ i „70.5“.

## Zdroje

Úplný seznam s odkazy je přímo v aplikaci (sekce **Zdroje**). Hlavní zdroje:

- WHO – [Obesity and overweight](https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight)
- WHO – [Growth reference data for 5–19 years](https://www.who.int/tools/growth-reference-data-for-5to19-years)
- CDC – [Adult BMI Calculator](https://www.cdc.gov/bmi/adult-calculator/)
- CDC – [Child and Teen BMI Calculator](https://www.cdc.gov/bmi/child-teen-calculator/)
- CDC – [About BMI](https://www.cdc.gov/bmi/about/index.html)
- SZÚ – [Růstové grafy ke stažení](https://szu.gov.cz/publikace-szu/data/hodnoceni-rustu-a-vyvoje/rustove-grafy-ke-stazeni/)
- Odborné články z PubMed (Eknoyan 2008, Keys 1972, Nuttall 2015, Romero-Corral 2008,
  Rolland-Cachera 1984, WHO Expert Consultation 2004)

Aplikace slouží ke vzdělávání a nenahrazuje radu lékaře.
