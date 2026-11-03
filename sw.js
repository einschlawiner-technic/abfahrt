// Speichert die App-Hülle; Abfahrtsdaten kommen immer live von ÖBB.
// Bei jeder Änderung VERSION erhöhen – dann erkennt das Handy die neue Version
// und zeigt den Hinweis „Neue Version verfügbar“.
const VERSION = "1.1-beta.4";

// Dieselbe Datei läuft als Produktivversion (…/abfahrt/) und als Beta (…/abfahrt/beta/).
// Beide bekommen eigene Cache-Namen und kommen sich nicht in die Quere.
const isBetaPath = (p) => /\/beta(\/|$)/.test(p);   // auch „…/beta“ ohne Schrägstrich
const BETA = isBetaPath(self.location.pathname);
const PREFIX = BETA ? "abfahrt-beta-v" : "abfahrt-v";
const CACHE = PREFIX + VERSION;
const SHELL = [
  "./", "index.html", "stations.js",
  "manifest.json", "icon.svg", "icon-192.png", "icon-512.png", "apple-touch-icon.png",
  "manifest-beta.json", "icon-beta.svg", "icon-beta-192.png", "icon-beta-512.png", "apple-touch-icon-beta.png",
];

self.addEventListener("install", (e) => {
  // Neue Version vorab laden (am HTTP-Cache vorbei), aber noch nicht aktivieren:
  // sie wartet, bis der Nutzer auf „Aktualisieren“ tippt.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: "reload" })))));
});

self.addEventListener("message", (e) => {
  if (e.data === "update") self.skipWaiting();
  if (e.data === "version") e.source.postMessage({ version: VERSION });
});

self.addEventListener("activate", (e) => {
  // Nur die eigenen alten Caches löschen, nicht die der anderen Version
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== "GET") return;
  // Die Produktivversion lässt alles unter /beta/ in Ruhe – das gehört der Beta
  if (!BETA && isBetaPath(url.pathname)) return;
  // Cache zuerst: die App bleibt auf ihrer Version, bis aktualisiert wird; offline klappt der Start.
  // Seitenaufrufe mit ?id=… bekommen immer die gespeicherte index.html.
  const key = e.request.mode === "navigate" ? "index.html" : e.request;
  e.respondWith(
    caches.open(CACHE)
      .then((c) => c.match(key, { ignoreSearch: true }))
      .then((hit) => hit || fetch(e.request))
  );
});
