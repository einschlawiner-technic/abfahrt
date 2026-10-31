# Abfahrt Wien & NÖ

Kleine Web-App (PWA): Bahnhof in Wien oder Niederösterreich wählen und die Live-Abfahrten wie auf der Bahnhofsanzeige sehen.

**Adresse:** https://einschlawiner-technic.github.io/abfahrt/

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
10. [Grenzen und Risiken](#grenzen-und-risiken)

---

## Was die App kann

- **Bahnhof wählen:** feste Liste mit 46 Bahnhöfen in Wien und Niederösterreich, dazu eine Suche, die jeden Halt in Wien/NÖ über die ÖBB-Stationssuche findet.
- **Abfahrtstafel** im Stil der Bahnhofsanzeige: Zeit, Zug, Ziel, Steig.
- **Live-Daten:** Verspätungen (neue Zeit in Gelb), Ausfälle (durchgestrichen), Gleisänderungen, Zusatzfahrten.
- **Statuspunkte** wie am Bahnhof: grün = planmäßig, gelb = verspätet, rot = fällt aus; der Punkt blinkt in den letzten 2 Minuten vor der Abfahrt.
- **Automatische Aktualisierung** alle 30 Sekunden und sofort, wenn die App wieder in den Vordergrund kommt; oben steht, wie alt der Stand ist.
- **Filter:** „Nur Züge“ oder „Alle Verkehrsmittel“ (inkl. U-Bahn, Straßenbahn, Bus).
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
| **Hosting** | GitHub Pages (kostenlos, HTTPS) direkt aus dem Branch `main` |
| **Server** | keiner – jedes Gerät holt die Daten direkt bei der ÖBB |
| **Daten** | ÖBB-Fahrplanauskunft „Scotty“ (HAFAS-System) |
| **Speicher** | `localStorage` im Browser für Favoriten, Verlauf und Filter |

Warum so einfach? Für eine Anzeige-App reicht der Browser vollständig. Ohne Framework und Build-Werkzeuge kann man jede Datei direkt bearbeiten und hochladen – es gibt nichts zu kompilieren.

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | Die ganze App: Aufbau (HTML), Aussehen (CSS im `<style>`-Block) und Logik (JavaScript im `<script>`-Block) |
| `stations.js` | Liste der Bahnhöfe mit Name, Gruppe (Wien/NÖ) und ÖBB-Stations-ID |
| `manifest.json` | Web-App-Manifest: Name, Farben, Icons, Kurzauswahl – macht die Seite installierbar |
| `sw.js` | Service Worker: speichert die App-Dateien für schnellen Start und offline |
| `icon.svg` | App-Icon als Vektorgrafik (auch Browser-Tab-Symbol) |
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

Der Service Worker (`sw.js`) speichert die App-Dateien im Browser:
- Er versucht immer zuerst das Netz – Änderungen kommen also sofort an.
- Ohne Netz liefert er die gespeicherte Version, damit die App trotzdem startet (Abfahrten gibt es dann natürlich keine).
- Die Abfahrtsdaten selbst werden **nie** zwischengespeichert.

Bei jeder Änderung die Versionsnummer in `sw.js` erhöhen (`const CACHE = "abfahrt-v5"` → `"abfahrt-v6"`), damit alte Kopien sicher gelöscht werden.

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

GitHub Pages baut die Seite danach automatisch neu; nach etwa einer Minute ist die neue Version online. Installierte Apps holen sie beim nächsten Öffnen (notfalls App ganz schließen und neu öffnen).

Kleine Änderungen gehen auch direkt auf github.com: Datei öffnen → Stift-Symbol → bearbeiten → „Commit changes“.

**Icons neu erzeugen:** `icon.svg` ist die Vorlage. Die PNG-Dateien wurden mit Python/Pillow daraus nachgezeichnet; alternativ jedes Grafikprogramm verwenden und als 512 × 512, 192 × 192 und 180 × 180 (`apple-touch-icon.png`) exportieren. Das Motiv sollte im inneren Kreis (80 % der Breite) bleiben, weil Android Icons rund zuschneiden kann.

## Grenzen und Risiken

- **Inoffizielle Schnittstelle:** Die ÖBB bieten diese Adressen nicht offiziell für fremde Apps an. Ändern sie etwas, zeigt die App „Keine Verbindung zu ÖBB“ oder leere Tafeln, bis der Code angepasst ist. Die Daten dienen nur der persönlichen Information.
- **„Grün“ heißt „keine Abweichung gemeldet“:** Die ÖBB liefern Echtzeitdaten nur bei Abweichungen. Bei Zügen ohne Echtzeit-Erfassung bedeutet Grün daher nur „laut Plan“.
- **Favoriten pro Gerät:** Sie liegen im `localStorage` des Browsers und werden nicht zwischen Handy und PC abgeglichen. Browserdaten löschen entfernt sie.
- **Öffentlich:** Das Repository und die Seite sind öffentlich einsehbar (nötig für kostenloses GitHub Pages). Es sind keine persönlichen Daten darin.
