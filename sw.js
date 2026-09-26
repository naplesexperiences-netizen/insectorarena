/* Service worker di Insectron Arena.
   Scopo: il gioco e' un file unico senza dipendenze, quindi una volta in cache
   funziona anche offline — in metropolitana, in aereo, con la rete che va e viene.

   Due politiche diverse, per ragioni diverse:
   - le pagine si prendono prima dalla rete, cosi' chi ha campo vede subito la
     versione aggiornata; se la rete manca si serve la copia in cache;
   - il resto (icone, immagini, manifest) si prende prima dalla cache: sono file
     che cambiano solo quando cambia la versione qui sotto.

   Quando si pubblica una modifica va alzato VERSIONE: e' quello che fa buttare
   via la cache vecchia. Senza, chi ha gia' aperto il sito resta alla copia
   precedente finche' non svuota i dati del browser. */
const VERSIONE = "insectron-v3";
const GUSCIO = [
  "./",
  "./index.html",
  "./gioca.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./favicon-32.png"
];

self.addEventListener("install", ev => {
  ev.waitUntil(
    caches.open(VERSIONE)
      .then(c => c.addAll(GUSCIO))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", ev => {
  ev.waitUntil(
    caches.keys()
      .then(nomi => Promise.all(nomi.filter(n => n !== VERSIONE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", ev => {
  const req = ev.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  if (req.mode === "navigate"){
    ev.respondWith(
      fetch(req)
        .then(res => {
          const copia = res.clone();
          caches.open(VERSIONE).then(c => c.put(req, copia));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match("./gioca.html")))
    );
    return;
  }

  ev.respondWith(
    caches.match(req).then(inCache => inCache || fetch(req).then(res => {
      if (res.ok && res.type === "basic"){
        const copia = res.clone();
        caches.open(VERSIONE).then(c => c.put(req, copia));
      }
      return res;
    }))
  );
});
