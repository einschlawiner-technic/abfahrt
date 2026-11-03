// Speichert die App-Hülle; Abfahrtsdaten kommen immer live von ÖBB.
// Bei jeder Änderung VERSION erhöhen – dann erkennt das Handy die neue Version
// und zeigt den Hinweis „Neue Version verfügbar“.
const VERSION = "8";
const CACHE = "abfahrt-v" + VERSION;
const SHELL = ["./", "index.html", "stations.js", "manifest.json", "icon.svg", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

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
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== "GET") return;
  // Cache zuerst: die App bleibt auf ihrer Version, bis aktualisiert wird; offline klappt der Start.
  // Seitenaufrufe mit ?id=… bekommen immer die gespeicherte index.html.
  const key = e.request.mode === "navigate" ? "index.html" : e.request;
  e.respondWith(
    caches.open(CACHE)
      .then((c) => c.match(key, { ignoreSearch: true }))
      .then((hit) => hit || fetch(e.request))
  );
});
