const { chromium, GIOCA, DEMO } = require('../comune');
const IMG = require('path').join(DEMO, 'img') + require('path').sep;

const DIR = IMG;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1220,height:800}, deviceScaleFactor:1 });
  /* Le nuvolette dei suggerimenti si aprono da sole la prima volta: nelle
     immagini della vetrina coprirebbero proprio quello che devono mostrare. */
  await p.addInitScript(() => { try { localStorage.setItem('insectron-spiega',
    JSON.stringify({ squadra:true, campo:true, zoo:true, mondo:true })); } catch(e){} });
  await p.goto(GIOCA);
  await p.waitForTimeout(250);
  await p.locator('#s-mode .card').screenshot({ path: DIR+'modalita.png' });
  await b.close(); console.log('fatto');
})();
