// Speichert die App-Hülle; Abfahrtsdaten kommen immer live von ÖBB.
// Bei jeder Änderung die Versionsnummer des betroffenen Kanals erhöhen – dann erkennt das Handy
// die neue Version und zeigt den Hinweis „Neue Version verfügbar“.
const VERSIONS = {
  produktiv: "1.0.5",
  beta: "1.0.5",
  experimental: "1.1-exp.1",
};

// Dieselbe Datei läuft in drei Kanälen: Produktiv (…/abfahrt/), Beta (…/beta/) und Experimental (…/experimental/).
// Jeder bekommt eigene Cache-Namen, so kommen sie sich nicht in die Quere.
const isSubChannelPath = (p) => /\/(beta|experimental)(\/|$)/.test(p);   // auch ohne Schrägstrich am Ende
const CHANNEL = /\/experimental(\/|$)/.test(self.location.pathname) ? "experimental"
              : /\/beta(\/|$)/.test(self.location.pathname) ? "beta" : "produktiv";
const VERSION = VERSIONS[CHANNEL];
const PREFIX = { produktiv: "abfahrt-v", beta: "abfahrt-beta-v", experimental: "abfahrt-exp-v" }[CHANNEL];
const CACHE = PREFIX + VERSION;
const SHELL = [
  "./", "index.html", "stations.js", "features.js",
  "manifest.json", "icon.svg", "icon-192.png", "icon-512.png", "apple-touch-icon.png",
  "manifest-beta.json", "icon-beta.svg", "icon-beta-192.png", "icon-beta-512.png", "apple-touch-icon-beta.png",
  "manifest-experimental.json", "icon-experimental.svg", "icon-experimental-192.png", "icon-experimental-512.png", "apple-touch-icon-experimental.png",
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
  // Die Produktivversion lässt alles unter /beta/ und /experimental/ in Ruhe – das gehört den anderen Kanälen
  if (CHANNEL === "produktiv" && isSubChannelPath(url.pathname)) return;
  // Cache zuerst: die App bleibt auf ihrer Version, bis aktualisiert wird; offline klappt der Start.
  // Seitenaufrufe mit ?id=… bekommen immer die gespeicherte index.html.
  const key = e.request.mode === "navigate" ? "index.html" : e.request;
  e.respondWith(
    caches.open(CACHE)
      .then((c) => c.match(key, { ignoreSearch: true }))
      .then((hit) => hit || fetch(e.request))
  );
});
