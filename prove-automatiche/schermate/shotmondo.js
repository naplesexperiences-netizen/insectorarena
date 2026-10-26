const { chromium, SERVITO, DEMO } = require('../comune');
const IMG = require('path').join(DEMO, 'img') + require('path').sep;

const DIR = IMG;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1220,height:1000} });
  /* Le nuvolette dei suggerimenti si aprono da sole la prima volta: nelle
     immagini della vetrina coprirebbero proprio quello che devono mostrare. */
  await p.addInitScript(() => { try { localStorage.setItem('insectron-spiega',
    JSON.stringify({ squadra:true, campo:true, zoo:true, mondo:true })); } catch(e){} });
  await p.goto(SERVITO + 'gioca.html'); await p.waitForTimeout(250);
  await p.click('#btn-modego'); await p.waitForTimeout(120);
  await p.evaluate(() => {
    S.rankIdx = 4; S.champion = false; S.giocate = 12;
    S.mondo.seme = 'K7F2QA'; MONDO_CACHE = { seme:null, luoghi:null };
    S.mondo.trappole = { 1:2, 2:1, 3:1 };
    S.mondo.poste = [
      { n:1, h:'cava',    t:2, esca:'Rubino',          quando:14 },
      { n:2, h:'pantano', t:1, esca:'Anguilla elettrica',  quando:11 }
    ];
    S.mondo.seq = 3;
    S.dispensa = { 'Frutto del Vesuvio':3, 'Rubino':1, 'Pietrafuoco':2, 'Frutto regale':1 };
    S.luogo = 'frutteto'; S.trapSel = 3; S.escaSel = 'Frutto del Vesuvio';
    apriMondo();
  });
  await p.waitForTimeout(350);
  await p.locator('#s-mondo .card').screenshot({ path: DIR + 'mondo.png' });
  console.log('schermata mondo fatta');
  /* e la stessa a larghezza di telefono, per controllare che regga */
  const q = await b.newPage({ viewport:{width:390,height:900} });
  await q.goto(SERVITO + 'gioca.html'); await q.waitForTimeout(250);
  await q.click('#btn-modego'); await q.waitForTimeout(120);
  await q.evaluate(() => { S.rankIdx = 4; S.dispensa = { 'Frutto del Vesuvio':3 };
    S.mondo.trappole = { 1:2, 2:1, 3:0 }; apriMondo(); });
  await q.waitForTimeout(300);
  const largo = await q.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  console.log('telefono, nessuno scroll orizzontale:', largo);
  await q.screenshot({ path: require('path').join(require('os').tmpdir(), 'mondo-390.png'), fullPage:true });
  await b.close();
})();
