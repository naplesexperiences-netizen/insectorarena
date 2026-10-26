const { chromium, GIOCA } = require('../comune');
/* Confronta il gioco di adesso con una copia di prima:
     node misure/invariati.js /percorso/a/gioca-prima.html
   Serve a provare che un ritocco a art() non ha toccato chi non doveva. */
const arg = process.argv[2];
if (!arg){ console.error('uso: node misure/invariati.js <gioca-prima.html>'); process.exit(1); }
const PRIMA = arg.startsWith('file://') ? arg : 'file://' + require('path').resolve(arg);
/* Chi e' solo nella sua famiglia, e gli sprite dei luoghi del Mondo (che
   chiedono un rango che in quella famiglia non esiste), devono essere rimasti
   identici: il confronto e' sul testo dell'SVG, a meno dell'id del gradiente
   che e' progressivo per costruzione. */
const CASI = [
  ['Ventalidi', 4], ['Coccinidi', 3], ['Corsidi', 1], ['Tonantidi', 1],
  ['Corsidi', 3], ['Tonantidi', 3],            /* i due luoghi col rango che non esiste */
  ['Silfidi', 3], ['Sferidi', 3], ['Tenaglidi', 3]   /* i tre luoghi col rango che esiste */
];
(async () => {
  const b = await chromium.launch();
  const leggi = async (url) => {
    const p = await b.newPage({ viewport:{width:800,height:600} });
    await p.goto(url); await p.waitForTimeout(400);
    const r = await p.evaluate(casi => casi.map(([f, r]) =>
      art(f, false, r).replace(/gr\d+/g, 'GID')), CASI_IN);
    await p.close(); return r;
  };
  global.CASI_IN = CASI;
  const prima = await (async () => {
    const p = await b.newPage({ viewport:{width:800,height:600} });
    await p.goto(PRIMA);
    await p.waitForTimeout(400);
    const r = await p.evaluate(casi => casi.map(([f, rk]) => art(f, false, rk).replace(/gr\d+/g, 'GID')), CASI);
    await p.close(); return r;
  })();
  const dopo = await (async () => {
    const p = await b.newPage({ viewport:{width:800,height:600} });
    await p.goto(GIOCA); await p.waitForTimeout(400);
    const r = await p.evaluate(casi => casi.map(([f, rk]) => art(f, false, rk).replace(/gr\d+/g, 'GID')), CASI);
    await p.close(); return r;
  })();
  let ok = 0, ko = 0;
  CASI.forEach(([f, r], i) => {
    const uguale = prima[i] === dopo[i];
    if (uguale) ok++; else ko++;
    console.log((uguale ? '  OK  ' : '  KO  ') + f + ' rank ' + r + (uguale ? ' invariato' : ' CAMBIATO'));
  });
  console.log('\n' + ok + ' invariati, ' + ko + ' cambiati');
  await b.close();
})();
