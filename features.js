// Funktionsschalter: In welchen Kanälen ist eine Funktion aktiv?
// Neue Funktionen starten in "experimental". Freigeben = Kanal ergänzen, z. B. ["experimental", "beta"],
// und zuletzt "produktiv". Was nie produktiv gehen soll, bleibt einfach nur in "experimental".
const FEATURES = {
  // Knopf „Livekarte“: öffnet die ÖBB-Livekarte, zentriert auf die Station
  livemap: ["experimental"],
};

function feature(name) {
  return (FEATURES[name] || []).includes(CHANNEL);
}
