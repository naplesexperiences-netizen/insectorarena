const { chromium, SERVITO, DEMO } = require('../comune');
const IMG = require('path').join(DEMO, 'img') + require('path').sep;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1220,height:820} });
  /* Le nuvolette dei suggerimenti si aprono da sole la prima volta: nelle
     immagini della vetrina coprirebbero proprio quello che devono mostrare. */
  await p.addInitScript(() => { try { localStorage.setItem('insectron-spiega',
    JSON.stringify({ squadra:true, campo:true, zoo:true, mondo:true })); } catch(e){} });
  await p.goto(SERVITO + 'gioca.html'); await p.waitForTimeout(200);
  await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForTimeout(250);
  await p.click('#btn-modego'); await p.waitForTimeout(150);
  await p.evaluate(() => {
    guidaSpegni(); S.rankIdx = 4; S.zoo = []; ZOO_SEQ = 0; S.cop = [];
    const m = nuovoEsemplare('hercules_beetle'); m.speso = 22; m.b = { hp:34, str:11, def:7 };
    const f = nuovoEsemplare('hercules_beetle'); f.speso = 18; f.b = { hp:16, str:5, def:12 };
    const t = nuovoEsemplare('mantis'); t.speso = 12; t.b = { hp:9, str:3, def:2 };
    const l = nuovoEsemplare('faerie'); l.speso = 3;
    S.zoo = [m, f, t, l];
    apriCoppia();
    S.cop = [m.u, f.u]; drawCoppia();
  });
  await p.waitForTimeout(350);
  await p.locator('#s-cop .card').screenshot({ path:IMG + 'accoppiamento.png' });
  console.log('schermata fatta');
  const q = await b.newPage({ viewport:{width:390,height:900} });
  await q.goto(SERVITO + 'gioca.html'); await q.waitForTimeout(200);
  await q.evaluate(() => localStorage.clear());
  await q.reload(); await q.waitForTimeout(250);
  await q.click('#btn-modego'); await q.waitForTimeout(150);
  await q.evaluate(() => {
    guidaSpegni(); S.rankIdx = 4; S.zoo = []; ZOO_SEQ = 0;
    const m = nuovoEsemplare('hercules_beetle'); m.speso = 22; m.b = { hp:34, str:11, def:7 };
    const f = nuovoEsemplare('hercules_beetle'); f.speso = 18; f.b = { hp:16, str:5, def:12 };
    S.zoo = [m, f]; apriCoppia(); S.cop = [m.u, f.u]; drawCoppia();
  });
  await q.waitForTimeout(300);
  const largo = await q.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  console.log('telefono, nessuno scorrimento orizzontale:', largo);
  await b.close();
})();
