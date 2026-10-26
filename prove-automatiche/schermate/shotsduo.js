const { chromium, GIOCA, DEMO } = require('../comune');
const IMG = require('path').join(DEMO, 'img') + require('path').sep;

const DIR = IMG;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1220,height:760} });
  /* Le nuvolette dei suggerimenti si aprono da sole la prima volta: nelle
     immagini della vetrina coprirebbero proprio quello che devono mostrare. */
  await p.addInitScript(() => { try { localStorage.setItem('insectron-spiega',
    JSON.stringify({ squadra:true, campo:true, zoo:true, mondo:true })); } catch(e){} });
  await p.goto(GIOCA);
  await p.waitForTimeout(200);
  await p.click('[data-mode="hvh"]'); await p.waitForTimeout(100);
  await p.fill('#n1','Ada'); await p.fill('#n2','Bruno');
  await p.click('#btn-modego'); await p.waitForTimeout(150);
  const squadra = async () => {
    await p.click('#btn-auto'); await p.waitForTimeout(80);
    await p.click('#btn-start'); await p.waitForTimeout(80);
    await p.click('#btn-toarena'); await p.waitForTimeout(200);
  };
  await squadra();                       // prima squadra -> consegna
  await p.click('#btn-pass'); await p.waitForTimeout(150);
  await squadra();                       // seconda squadra -> schieramento
  await p.click('#btn-pass'); await p.waitForTimeout(200);
  await p.click('#btn-rand'); await p.waitForTimeout(150);
  await p.click('#btn-fight'); await p.waitForTimeout(150);
  await p.click('#btn-pass'); await p.waitForTimeout(150);
  await p.click('#btn-rand'); await p.waitForTimeout(150);
  await p.click('#btn-fight'); await p.waitForTimeout(150);
  await p.click('#btn-pass'); await p.waitForTimeout(300);
  await p.evaluate(() => { const u = S.units.find(x=>x.alive&&x.side==='p'); if(u){ u.y = Math.max(2,u.y-2); draw(); } });
  await p.click('#btn-end'); await p.waitForTimeout(300);
  await p.screenshot({ path: DIR+'due-giocatori.png' });
  console.log('fatto');
  await b.close();
})();
