# Abfahrt Wien & NÖ

**Version 1.0.7** · November 2026

Kleine Web-App (PWA): Bahnhof oder Haltestelle in Wien oder Niederösterreich wählen und die Live-Abfahrten wie auf der Bahnhofsanzeige sehen.

**Adresse:** https://einschlawiner-technic.github.io/abfahrt/  
**Testversion (Beta):** https://einschlawiner-technic.github.io/beta-abfahrt/  
**Experimentierversion:** https://einschlawiner-technic.github.io/experimental-abfahrt/

---

## Inhalt

1. [Was die App kann](#was-die-app-kann)
2. [Installation am Handy und PC](#installation)
3. [Technik im Überblick](#technik-im-überblick)
4. [Dateien](#dateien)
5. [Woher die Daten kommen](#woher-die-daten-kommen)
6. [Wie die App intern abläuft](#wie-die-app-intern-abläuft)
7. [Anzeige-Logik (Farben, Punkte, Hinweise)](#anzeige-logik)
8. [Offline und Updates (Service Worker)](#offline-und-updates)
9. [Änderungen machen und veröffentlichen](#änderungen-machen-und-veröffentlichen)
10. [Drei Kanäle: Produktiv, Beta, Experimental](#drei-kanäle-produktiv-beta-experimental)
11. [Grenzen und Risiken](#grenzen-und-risiken)
12. [Versionen](#versionen)

---

## Was die App kann

- **Bahnhof wählen:** feste Liste mit 46 Bahnhöfen in Wien und Niederösterreich, dazu eine Suche, die jeden Halt in Wien/NÖ über die ÖBB-Stationssuche findet.
- **Abfahrtstafel** im Stil der Bahnhofsanzeige: Zeit, Zug, Ziel, Steig.
- **Live-Daten:** Verspätungen (neue Zeit in Gelb), Ausfälle (durchgestrichen), Gleisänderungen, Zusatzfahrten.
- **Statuspunkte** wie am Bahnhof: grün = planmäßig, gelb = verspätet, rot = fällt aus; der Punkt blinkt in den letzten 2 Minuten vor der Abfahrt.
- **Automatische Aktualisierung** alle 30 Sekunden und sofort, wenn die App wieder in den Vordergrund kommt; oben steht, wie alt der Stand ist.
- **Filter:** „Nur Züge“ oder „Alle Verkehrsmittel“ (inkl. U-Bahn, Straßenbahn, Bus). Bahnhöfe öffnen standardmäßig mit „Nur Züge“, Haltestellen ohne Bahnverkehr mit „Alle Verkehrsmittel“ (erkannt am Feld `prodClass` der Stationssuche: die unteren 6 Bits stehen für Bahn). Umschalten gilt nur für die aktuelle Ansicht.
- **Favoriten** (Stern) und **zuletzt gewählte** Bahnhöfe, gespeichert auf dem jeweiligen Gerät.
- **Direktlinks** pro Bahnhof, z. B. `?id=1290401&n=Wien Hbf` – damit lassen sich Shortcuts für einzelne Bahnhöfe anlegen.

## Installation

| Gerät | So geht's |
|---|---|
| **Android** | Adresse in Chrome öffnen → Menü ⋮ → „App installieren“ / „Zum Startbildschirm hinzufügen“. Langes Drücken auf das Icon zeigt Kurzauswahl (Wien Hbf, Meidling, St. Pölten). |
| **iPhone** | Adresse in **Safari** öffnen → Teilen-Symbol → „Zum Home-Bildschirm“. (Keine Kurzauswahl per langem Drücken.) |
| **PC (Chrome)** | Installieren-Symbol rechts in der Adressleiste, oder ⋮ → „Streamen, speichern und teilen“ → „Seite als App installieren“. |
| **PC (Edge)** | ⋯ → „Apps“ → „Diese Website als App installieren“. |

Shortcut für einen einzelnen Bahnhof: Tafel des Bahnhofs im Browser öffnen und „Zum Startbildschirm hinzufügen“ wählen.

## Technik im Überblick

| Thema | Lösung |
|---|---|
| **Sprachen** | HTML, CSS und JavaScript – ohne Framework, ohne Build-Schritt |
| **App-Typ** | PWA (Progressive Web App): eine Webseite, die sich wie eine App installieren lässt |
| **Hosting** | GitHub Pages (kostenlos, HTTPS), veröffentlicht per GitHub Actions; ein Repository je Kanal (`abfahrt`, `beta-abfahrt`, `experimental-abfahrt`) |
| **Server** | keiner – jedes Gerät holt die Daten direkt bei der ÖBB |
| **Daten** | ÖBB-Fahrplanauskunft „Scotty“ (HAFAS-System) |
| **Speicher** | `localStorage` im Browser für Favoriten, Verlauf und Filter |

Warum so einfach? Für eine Anzeige-App reicht der Browser vollständig. Ohne Framework und Build-Werkzeuge kann man jede Datei direkt bearbeiten und hochladen – es gibt nichts zu kompilieren.

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | Die ganze App: Aufbau (HTML), Aussehen (CSS im `<style>`-Block) und Logik (JavaScript im `<script>`-Block) |
| `stations.js` | Liste der Bahnhöfe mit Name, Gruppe (Wien/NÖ), ÖBB-Stations-ID und Koordinaten |
| `features.js` | Funktionsschalter: welche Funktion in welchem Kanal aktiv ist |
| `manifest.json` | Web-App-Manifest: Name, Farben, Icons, Kurzauswahl – macht die Seite installierbar (`manifest-beta.json`, `manifest-experimental.json` für die anderen Kanäle) |
| `sw.js` | Service Worker: speichert die App-Dateien für schnellen Start und offline |
| `icon.svg` | App-Icon als Vektorgrafik (auch Browser-Tab-Symbol); `-beta` (orange) und `-experimental` (lila) für die anderen Kanäle |
| `icon-192.png`, `icon-512.png` | Icons für Android und PC |
| `apple-touch-icon.png` | Icon für das iPhone (180 × 180) |

## Woher die Daten kommen

Die ÖBB betreiben ihre Fahrplanauskunft auf dem System **HAFAS** unter `fahrplan.oebb.at`. Die App nutzt zwei Adressen davon:

**1. Abfahrten** (dieselbe Quelle wie der Abfahrtsmonitor von Scotty)

```
https://fahrplan.oebb.at/bin/stboard.exe/dn
  ?L=vs_scotty.vs_liveticker
  &evaId=1290401              ← Stations-ID
  &boardType=dep              ← Abfahrten
  &productsFilter=1111110000000000   ← welche Verkehrsmittel
  &showJourneys=40            ← Anzahl
  &outputMode=tickerDataOnly
  &start=yes&eqstops=true&tickerID=dep&dirInput=&additionalTime=0
```

Die Antwort ist kein reines JSON, sondern ein Stück JavaScript:

```js
journeysObj = {
  "stationName": "Wien Hbf (U)",
  "journey": [
    { "ti": "20:33", "da": "31.10.2026", "pr": "S 80", "st": "Mödling",
      "lastStop": "Mödling Bahnhof", "tr": "3", "trChg": false,
      "rt": { "status": null, "dlm": "2", "dlt": "20:35" } },
    ...
  ]
}
```

| Feld | Bedeutung |
|---|---|
| `ti` / `da` | planmäßige Abfahrtszeit / Datum |
| `pr` | Zug (z. B. `RJX 167`, `S 2`, `REX 1`) |
| `st` | Ziel laut Anzeige |
| `lastStop` | tatsächliche Endstation |
| `tr` | Steig/Gleis |
| `trChg` | `true` = Gleisänderung |
| `rt` | Echtzeit: `false` = keine Abweichung gemeldet; sonst Objekt mit `dlm` (Verspätung in Minuten), `dlt` (neue Zeit), `status` (z. B. „Neu“ = Zusatzfahrt) |

**`productsFilter`** ist eine Reihe aus 16 Schaltern (1 = an, 0 = aus), je einer pro Verkehrsmittel-Gruppe. Die ersten sechs sind Bahn (Fernverkehr, Regionalzüge, S-Bahn), die Stellen 9 und 10 sind U-Bahn und Straßenbahn, dahinter folgen u. a. Busse.
- „Nur Züge“: `1111110000000000`
- „Alle“: `1111111111111111`

**2. Stationssuche**

```
https://fahrplan.oebb.at/bin/ajax-getstop.exe/dn?REQ0JourneyStopsS0A=1&REQ0JourneyStopsB=25&js=true&S=<Suchtext>
```

Antwort: `SLs.sls={"suggestions":[{"value":"Baden b.Wien Bahnhof","extId":"001230601","xcoord":"16242726","ycoord":"48004060","type":"1",...}]};SLs.showSuggestion();`

Die App behält nur Bahnhöfe/Haltestellen (`type` = 1), die geografisch in Wien oder Niederösterreich liegen (Länge 14,4–17,2°, Breite 47,4–49,1° – die Koordinaten kommen in Millionstel Grad).

### Der Trick mit dem `<script>`-Tag

Ein Browser darf Daten von einer fremden Adresse normalerweise nur per `fetch` lesen, wenn der fremde Server das ausdrücklich erlaubt (CORS). Der ÖBB-Server erlaubt das nicht. **Skripte** von fremden Adressen darf eine Seite aber immer laden – und weil die ÖBB-Antwort ein Skript ist (`journeysObj = {...}`), lädt die App sie als `<script>` und liest danach die Variable `window.journeysObj` aus. Das ist die Funktion `loadScript()` in `index.html`.

Dabei wichtig:
- Zeichensatz `ISO-8859-1` setzen, sonst werden Umlaute falsch.
- Anfragen nacheinander statt gleichzeitig ausführen, weil alle in dieselbe globale Variable schreiben.
- Umlaute kommen teils als HTML-Codes (`M&#246;dling`) und werden mit `unescapeHtml()` umgewandelt.

### Stations-IDs ermitteln

Die IDs in `stations.js` stammen aus der Stationssuche oben (Feld `extId`, führende Nullen entfernt). Neuen Bahnhof hinzufügen:

1. Im Browser aufrufen: `https://fahrplan.oebb.at/bin/ajax-getstop.exe/dn?REQ0JourneyStopsS0A=1&js=true&S=Tulln`
2. Den passenden Eintrag suchen, `extId` notieren (z. B. `001132135` → `1132135`).
3. In `stations.js` eine Zeile ergänzen: `{ g: "Niederösterreich", n: "Tulln an der Donau", id: "1132135" },`

## Wie die App intern abläuft

```
Start
 ├─ URL hat ?id=…  → direkt Tafel dieses Bahnhofs öffnen
 └─ sonst           → Auswahlliste (Favoriten, Zuletzt, Wien, NÖ)

Bahnhof antippen
 ├─ in „Zuletzt“ speichern, URL auf ?id=…&n=… setzen (Zurück-Taste funktioniert)
 └─ load()
      ├─ ÖBB-Abfahrten per <script> laden
      ├─ render(): Tabelle neu aufbauen
      └─ in 30 s wieder load()

App kommt in den Vordergrund → sofort load()
Jede Sekunde → „vor x s aktualisiert“ neu anzeigen
```

Wichtige Funktionen in `index.html`:

| Funktion | Aufgabe |
|---|---|
| `loadScript(url, name)` | ÖBB-Antwort als Skript laden, Ergebnis zurückgeben |
| `renderLists()` | Auswahlliste aufbauen |
| `openStation(st)` / `showPicker()` | zwischen Tafel und Auswahl wechseln |
| `load()` | Abfahrten holen, anzeigen, nächste Aktualisierung planen |
| `render(data)` | Tabellenzeilen erzeugen (Punkt, Zeit, Zug, Ziel, Hinweise, Steig) |
| `badgeClass(pr)` | Farbe des Zug-Abzeichens bestimmen |
| `minutesUntil(da, ti)` | Minuten bis zur Abfahrt (für das Blinken) |
| `showUpdated()` | Anzeige „vor x s aktualisiert“ |

Einstellbare Werte stehen oben im Skript, z. B. `REFRESH_MS = 30000` (Aktualisierung in Millisekunden).

## Anzeige-Logik

**Zug-Abzeichen**

| Farbe | Züge |
|---|---|
| Rot | Fernverkehr: RJ, RJX, IC, EC, ICE, NJ, EN, D, WB |
| Blau | S-Bahn |
| Weiß | Regionalverkehr: CJX, REX, R |
| Grau | sonstiges (Bus, U-Bahn, Straßenbahn); Schienenersatzverkehr heißt „SEV“ |

**Statuspunkt**

| Punkt | Bedeutung |
|---|---|
| Grün | keine Abweichung gemeldet (planmäßig) |
| Gelb | verspätet (`dlm` > 0); neue Zeit steht unter der Planzeit |
| Rot | fällt aus (Status enthält „Ausfall“, „fällt“ oder „entfällt“) |
| Blinkend | Abfahrt (bei Verspätung: neue Zeit) ist in höchstens 2 Minuten oder vor höchstens 1 Minute |

Das Blinken (1,8 s pro Takt) ist in CSS die Animation `blink`; die Geschwindigkeit steht bei `.dot.blink`. Wer am Gerät „Bewegung reduzieren“ eingestellt hat, sieht einen ruhigen Punkt.

**Hinweise unter dem Ziel:** „ca. +X min“ ab 5 Minuten Verspätung, „Zug fällt aus“, „Zusatzfahrt“ (Status „Neu“), „Gleisänderung“ (Steig wird dann gelb).

## Offline und Updates

Der Service Worker (`sw.js`) speichert die App-Dateien im Browser und steuert die Updates:

- **Cache zuerst:** Die App startet immer aus der gespeicherten Version – schnell und auch ohne Netz (Abfahrten gibt es dann natürlich keine). Die Abfahrtsdaten selbst werden **nie** zwischengespeichert.
- **Neue Version erkennen:** Beim Öffnen, beim Zurückkehren in die App und alle 30 Minuten fragt der Browser, ob sich `sw.js` geändert hat. Wenn ja, lädt er die neue Version im Hintergrund, aktiviert sie aber noch nicht.
- **Hinweis:** Unten erscheint „Neue Version verfügbar – Favoriten bleiben erhalten“ mit dem Button **Aktualisieren**.
- **Aktualisieren** löscht „Zuletzt gewählt“ und alte Einstellungen, behält die **Favoriten**, aktiviert die neue Version, löscht den alten Cache und lädt die App neu.
- Unten in der App steht die aktuelle **Versionsnummer**.

**Bei jeder Änderung die Versionsnummer des betroffenen Kanals in `VERSIONS` (in `sw.js`) erhöhen.** Nur dann erkennen installierte Apps, dass es etwas Neues gibt. Schema:
- kleine Korrekturen: `1.0` → `1.0.1`
- neue Funktionen: `1.0` → `1.1`
- große Umbauten: `1.x` → `2.0`

Zu jeder Version einen Eintrag unter [Versionen](#versionen) ergänzen und den Stand in Git markieren: `git tag v1.1 && git push origin v1.1`.

## Änderungen machen und veröffentlichen

Lokal testen (im Ordner der App):

```bash
python -m http.server 8765
```

Dann im Browser `http://localhost:8765` öffnen.

Veröffentlichen:

```bash
git add -A
git commit -m "Beschreibung der Änderung"
git push
```

GitHub Pages baut die Seite danach automatisch neu; nach etwa einer Minute ist die neue Version online. Installierte Apps zeigen dann beim nächsten Öffnen den Hinweis „Neue Version verfügbar“ (vorausgesetzt, die Versionsnummer in `sw.js` wurde erhöht).

Kleine Änderungen gehen auch direkt auf github.com: Datei öffnen → Stift-Symbol → bearbeiten → „Commit changes“.

**Icons neu erzeugen:** `icon.svg` ist die Vorlage. Die PNG-Dateien wurden mit Python/Pillow daraus nachgezeichnet; alternativ jedes Grafikprogramm verwenden und als 512 × 512, 192 × 192 und 180 × 180 (`apple-touch-icon.png`) exportieren. Das Motiv sollte im inneren Kreis (80 % der Breite) bleiben, weil Android Icons rund zuschneiden kann.

## Drei Kanäle: Produktiv, Beta, Experimental

| | Produktiv | Beta | Experimental |
|---|---|---|---|
| Zweck | tägliche Nutzung | freigegebene Änderungen, letzte Probe vor Produktiv | Spielwiese; manches bleibt für immer hier |
| Branch (im Repo `abfahrt`) | `main` | `beta` | `experimental` |
| Veröffentlicht aus Repo | `abfahrt` | `beta-abfahrt` | `experimental-abfahrt` |
| Adresse | `…/abfahrt/` | `…/beta-abfahrt/` | `…/experimental-abfahrt/` |
| App-Name | Abfahrt | Abfahrt Beta | Abfahrt Experimental |
| Icon / Kennzeichen | rot | orange, „BETA“ | lila, „EXP“ |
| Speicher-Präfix | – | `beta:` | `exp:` |
| Versionsnummer | z. B. `1.0.7` | z. B. `1.1-beta.1` | z. B. `1.1-exp.3` |

Alle drei lassen sich gleichzeitig installieren; Favoriten, „Zuletzt“ und Zwischenspeicher sind je Kanal getrennt.

**Falls Chrome (Android) beim Installieren „Diese App wurde bereits installiert“ meldet**, obwohl sie es nicht ist („App konnte nicht geöffnet werden“): Chrome hat sich von einem früheren Versuch einen falschen Zustand gemerkt. Abhilfe: in Chrome die Browserdaten löschen (Menü ⋮ → Verlauf → Browserdaten löschen) und dann installieren; bei mehreren Kanälen zwischen jeder Installation wiederholen. Nachsehen, was Chrome wirklich installiert hat, geht unter `chrome://webapks`. Ausweichen lässt sich auch auf Samsung Internet (Menü → „Seite hinzufügen zu“ → „Startbildschirm“).

**Warum heißen die Adressen so?** Android ordnet installierte Web-Apps nach dem **Anfang** ihrer Adresse zu. Die Produktiv-App gehört zu `…/abfahrt`; jede Adresse, die ebenfalls mit `/abfahrt` beginnt – ob `…/abfahrt/beta/` oder `…/abfahrt-beta/` –, hielt Chrome für die Produktiv-App („bereits installiert“, „App konnte nicht geöffnet werden“) und überschrieb sie beim Installieren. Deshalb hat jeder Kanal ein eigenes Repository, dessen Name **nicht** mit „abfahrt“ beginnt. Unter den früheren Adressen `…/abfahrt/beta/` und `…/abfahrt/experimental/` liegt nur noch eine Umleitung.

**Ein Code, drei Kanäle.** Der gesamte Code liegt im Repository `abfahrt` mit den Branches `main`, `beta` und `experimental`. `index.html` und `sw.js` erkennen am Pfad (`/beta-abfahrt/`, `/experimental-abfahrt/`), in welchem Kanal sie laufen (`CHANNEL`), und wählen danach Name, Manifest, Icons, Speicher-Präfix und Cache-Namen. Die Versionsnummern stehen für alle Kanäle gemeinsam in `VERSIONS` in `sw.js`. Veröffentlicht wird so:

- `main` → per Push ins Repo `abfahrt` (Workflow `.github/workflows/pages.yml` baut die Seite)
- `beta` → zusätzlich als `main` ins Repo `beta-abfahrt` geschoben
- `experimental` → zusätzlich als `main` ins Repo `experimental-abfahrt` geschoben

In jedem der drei Repos steht *Settings → Pages → Source: GitHub Actions*. Die Git-Fernziele heißen lokal `origin`, `beta-site` und `experimental-site`.

**Funktionsschalter (`features.js`).** Jede neue Funktion bekommt einen Schalter mit der Liste der Kanäle, in denen sie aktiv ist, und wird im Code mit `feature("name")` abgefragt:

```js
const FEATURES = {
  livemap: ["experimental"],              // nur in Experimental
  // neueFunktion: ["experimental", "beta"],   // freigegeben für Beta
  // fertigeFunktion: ["experimental", "beta", "produktiv"],
};
```

Ist eine Funktion überall angekommen, kann ihr Schalter entfallen.

**Ablauf.** Die Branches liegen immer hintereinander: `experimental` ist am weitesten, `beta` folgt, `main` zuletzt. Übernommen wird immer der ganze Stand (Fast-Forward), nie einzelne Änderungen – darum gibt es keine Konflikte.

1. **Neue Idee:** im Branch `experimental` bauen, mit Schalter `["experimental"]`, Experimental-Version erhöhen (z. B. `1.1-exp.4`), dann
   ```bash
   git push origin experimental && git push experimental-site experimental:main
   ```
   Am Handy in „Abfahrt Experimental“ testen.
2. **Für Beta freigeben:** Schalter um `"beta"` ergänzen, Beta-Version erhöhen, committen, dann `beta` nachziehen:
   ```bash
   git switch beta && git merge --ff-only experimental
   git push origin beta && git push beta-site beta:main
   ```
   Alles, was noch nicht freigegeben ist, kommt dabei zwar als Code mit, bleibt aber per Schalter aus.
3. **Produktiv machen:** Schalter um `"produktiv"` ergänzen, Produktiv-Version erhöhen (z. B. `1.1`), Eintrag unter [Versionen](#versionen), committen, dann:
   ```bash
   git switch beta && git merge --ff-only experimental
   git switch main && git merge --ff-only beta
   git tag v1.1 && git push origin main beta experimental v1.1
   git push beta-site beta:main && git push experimental-site experimental:main
   ```
4. **Korrekturen**, die alle Kanäle betreffen, ebenfalls in `experimental` machen und wie oben bis `main` durchreichen.

Wichtig: Änderungen ohne Schalter (Korrekturen, Umbauten) wirken in jedem Kanal, sobald der Stand dorthin übernommen wird. Darum alles Neue hinter einen Schalter legen.

## Grenzen und Risiken

- **Inoffizielle Schnittstelle:** Die ÖBB bieten diese Adressen nicht offiziell für fremde Apps an. Ändern sie etwas, zeigt die App „Keine Verbindung zu ÖBB“ oder leere Tafeln, bis der Code angepasst ist. Die Daten dienen nur der persönlichen Information.
- **„Grün“ heißt „keine Abweichung gemeldet“:** Die ÖBB liefern Echtzeitdaten nur bei Abweichungen. Bei Zügen ohne Echtzeit-Erfassung bedeutet Grün daher nur „laut Plan“.
- **Favoriten pro Gerät:** Sie liegen im `localStorage` des Browsers und werden nicht zwischen Handy und PC abgeglichen. Browserdaten löschen entfernt sie.
- **Öffentlich:** Das Repository und die Seite sind öffentlich einsehbar (nötig für kostenloses GitHub Pages). Es sind keine persönlichen Daten darin.

## Versionen

### 1.1-exp.3 – Experimental

- Knopf „Livekarte“ (Schalter `livemap`) öffnet direkt die ÖBB-Livekarte, zentriert auf die gewählte Station (Link-Parameter `showLivemap=true&X=…&Y=…`; Zoomstufe und Verkehrsmittel legt die ÖBB-Seite fest)

### 1.0.7 – November 2026 (Produktiv und Beta)

- Beta und Experimental unter `…/beta-abfahrt/` und `…/experimental-abfahrt/`: Adressen, die mit `/abfahrt` beginnen, ordnete Android der Produktiv-App zu

### 1.0.6 – November 2026 (Produktiv und Beta)

- Beta und Experimental haben eigene Adressen (`…/abfahrt-beta/`, `…/abfahrt-experimental/`) statt Unterordnern – Android hielt sie sonst für die Produktiv-App
- Unter den alten Unterordnern liegt nur noch eine Umleitung

### 1.0.5 – November 2026 (Produktiv und Beta)

- Drei Kanäle: Produktiv, Beta und neu Experimental, jeweils mit eigenem Namen, Icon und eigenen Daten
- Funktionsschalter (`features.js`) bestimmen, welche Funktion in welchem Kanal aktiv ist
- Stationsliste mit Koordinaten

### 1.0.4 – November 2026

- Im Hintergrund keine Abfragen mehr; beim Zurückkehren sofortige Aktualisierung
- Einzelne Verbindungsaussetzer werden nach 5 s still wiederholt; eine Fehlermeldung erscheint erst nach zwei Fehlversuchen in Folge

### 1.0.3 – November 2026

- Korrektur: Produktiv- und Beta-Version haben eigene App-Kennungen und lassen sich gleichzeitig installieren

### 1.0.2 – November 2026

- Korrektur: Die Beta-Adresse funktioniert jetzt auch ohne Schrägstrich am Ende (`…/abfahrt/beta`)

### 1.0.1 – November 2026

- Grundlage für die Beta-Version: Produktiv- und Testversion laufen getrennt nebeneinander (eigene Daten, eigener Name, eigenes Icon)
- Veröffentlichung per GitHub Actions
- Korrektur: Update-Hinweis erscheint nicht mehr fälschlich bei der Erstinstallation

### 1.0 – November 2026

Erste offizielle Version.

- Stationsauswahl: 46 Bahnhöfe in Wien und Niederösterreich, Suche nach jedem Bahnhof und jeder Haltestelle in Wien/NÖ
- Live-Abfahrtstafel im Bahnhofsstil mit Verspätungen, Ausfällen, Gleisänderungen und Zusatzfahrten
- Statuspunkte (grün/gelb/rot), Blinken kurz vor der Abfahrt
- Automatische Aktualisierung alle 30 Sekunden mit Anzeige des Datenstands
- Filter „Nur Züge“ / „Alle Verkehrsmittel“; Standard je nach Bahnhof oder Haltestelle
- Favoriten und zuletzt gewählte Stationen, Direktlinks pro Station
- Installierbar auf Android, iPhone und PC; Kurzauswahl am Android-Icon
- Hinweis auf neue Versionen mit „Aktualisieren“-Button (Favoriten bleiben erhalten)
- Offline-Start der App
