const { chromium, SERVITO, DEMO } = require('../comune');
const IMG = require('path').join(DEMO, 'img') + require('path').sep;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1220,height:900} });
  /* Le nuvolette dei suggerimenti si aprono da sole la prima volta: nelle
     immagini della vetrina coprirebbero proprio quello che devono mostrare. */
  await p.addInitScript(() => { try { localStorage.setItem('insectron-spiega',
    JSON.stringify({ squadra:true, campo:true, zoo:true, mondo:true })); } catch(e){} });
  await p.goto(SERVITO + 'gioca.html'); await p.waitForTimeout(200);
  await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForTimeout(300);
  await p.evaluate(() => guidaSpegni());
  await p.screenshot({ path:IMG + 'sfida.png', clip:{x:0,y:0,width:1220,height:640} });
  console.log('sfida fatta');
  await p.click('#btn-modego'); await p.waitForTimeout(200);
  await p.evaluate(() => {
    const visti = UNITS.slice(0, 19);
    visti.forEach(u => S.visti[u.id] = 1);
    S.trofei = { prima:'2026-09-26', invitto:'2026-09-27', adulto:'2026-09-27', cattura:'2026-09-28' };
    apriCollezione();
  });
  await p.waitForTimeout(350);
  await p.locator('#s-coll .card').screenshot({ path:IMG + 'collezione.png' });
  console.log('collezione fatta');
  await b.close();
})();
