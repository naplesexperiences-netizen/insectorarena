/* I percorsi, in un posto solo.
   Le suite sono nate dentro una cartella di lavoro con percorsi assoluti
   scritti a mano; qui diventano relativi alla posizione di questo file, cosi'
   la batteria gira su qualsiasi macchina e da qualsiasi clone. */
const path = require("path");
const fs = require("fs");

/* Playwright puo' stare nei node_modules del progetto, in quelli globali, o in
   un percorso dichiarato a mano. Si prova in quest'ordine e, se non c'e', si
   dice che cosa installare invece di morire con uno stack trace. */
function playwright(){
  const posti = [
    process.env.PLAYWRIGHT_PATH,
    "playwright",
    "/opt/node22/lib/node_modules/playwright",
    "/usr/lib/node_modules/playwright",
    "/usr/local/lib/node_modules/playwright"
  ].filter(Boolean);
  for (const p of posti){
    try { return require(p); } catch(e){ /* si prova il prossimo */ }
  }
  console.error(
    "\nPlaywright non trovato. Installalo con:\n" +
    "  npm i -D playwright && npx playwright install chromium\n" +
    "oppure indica dove si trova:\n" +
    "  PLAYWRIGHT_PATH=/percorso/a/playwright sh batteria.sh\n");
  process.exit(1);
}

const DEMO = path.resolve(__dirname, "..");        /* la cartella del gioco */
const url = n => "file://" + path.join(DEMO, n);

/* Alcune prove hanno bisogno di un'origine vera (localStorage, service
   worker): batteria.sh alza un server statico e passa la porta qui. */
const PORTA = process.env.INSECTRON_PORTA || "8232";
const SERVITO = "http://127.0.0.1:" + PORTA + "/";

/* La radice servita deve avere, oltre al gioco, manifest, service worker e
   icone: senza, le prove sul sito installabile (pwa.js) non hanno che
   guardare e lo dicono. Qui dentro ce li ha la radice del repository; i
   percorsi di scorta servono a chi tiene il gioco in un'altra cartella --
   la copia dentro all'hub delle demo, o il pacchetto zip. */
function radiceSito(){
  if (process.env.INSECTRON_SITO) return process.env.INSECTRON_SITO;
  const candidati = [
    DEMO,                                          /* questo repository */
    path.resolve(DEMO, "../../../insectorarena"),  /* i due repository affiancati */
    path.resolve(DEMO, "../insectorarena"),
    path.resolve(DEMO, "../sito")                  /* il pacchetto zip */
  ];
  for (const c of candidati)
    if (fs.existsSync(path.join(c, "sw.js"))) return c;
  return DEMO;
}

/* Il gioco di questo repository registra un service worker, e servito su
   un'origine vera lo registra davvero. Per le prove e' un terzo incomodo:
   intercetta le richieste, serve dalla cache e cambia i tempi di quello che
   si sta misurando. Quindi di base si blocca, e chi lo deve provare per
   davvero -- pwa.js -- lo riattiva con { serviceWorkers: 'allow' }. */
function senzaServiceWorker(chromium){
  return Object.assign(Object.create(chromium), {
    async launch(opt){
      const b = await chromium.launch(opt);
      const conDifesa = f => (o = {}) =>
        f.call(b, Object.assign({ serviceWorkers: 'block' }, o));
      const np = b.newPage, nc = b.newContext;
      b.newPage = conDifesa(np);
      b.newContext = conDifesa(nc);
      return b;
    }
  });
}

module.exports = {
  chromium: senzaServiceWorker(playwright().chromium),
  DEMO, RADICE_SITO: radiceSito(), PORTA, SERVITO,
  GIOCA: url("gioca.html"),
  INDEX: url("index.html"),
  PRIVACY: url("privacy.html"),
  CREA_DEMO: path.join(DEMO, "crea-demo.sh")
};
