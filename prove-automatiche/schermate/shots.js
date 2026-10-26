const { chromium, GIOCA, DEMO } = require('../comune');
const IMG = require('path').join(DEMO, 'img') + require('path').sep;

const DIR = IMG;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1220,height:800} });
  /* Le nuvolette dei suggerimenti si aprono da sole la prima volta: nelle
     immagini della vetrina coprirebbero proprio quello che devono mostrare. */
  await p.addInitScript(() => { try { localStorage.setItem('insectron-spiega',
    JSON.stringify({ squadra:true, campo:true, zoo:true, mondo:true })); } catch(e){} });
  const url = GIOCA;

  // 1) roster
  await p.goto(url); await p.waitForTimeout(300);
  if (await p.$('#s-mode.on')) { await p.click('#btn-modego'); await p.waitForTimeout(150); }
  await p.click('#btn-auto'); await p.waitForTimeout(200);
  await p.locator('#s-team .two').screenshot({ path: DIR+'roster.png' });

  // 2) schieramento
  await p.click('#btn-start'); await p.waitForTimeout(200); await p.click('#btn-toarena'); await p.waitForTimeout(350);
  await p.click('#btn-rand'); await p.waitForTimeout(250);
  await p.locator('.boardwrap').screenshot({ path: DIR+'schieramento.png' });

  // 3) battaglia con un colpo in corso
  await p.click('#btn-fight'); await p.waitForTimeout(300);
  await p.evaluate(() => {
    const mio = S.units.find(u=>u.side==='p'&&u.alive&&FAMS[u.d.fam].sp==='sickle_dance') || S.units.find(u=>u.side==='p'&&u.alive);
    const foes = S.units.filter(u=>u.side==='e'&&u.alive);
    mio.x=2; mio.y=3;
    foes[0].x=2; foes[0].y=2; foes[1].x=1; foes[1].y=2; foes[2].x=3; foes[2].y=3;
    draw();
    foes.slice(0,3).forEach(f => strike(mio, f, .75, 'falcia'));
    wave(mio, FAMS[mio.d.fam].col, 3); anim(mio, 'cast', 560);
  });
  await p.waitForTimeout(430);
  await p.locator('.boardwrap').screenshot({ path: DIR+'battaglia.png' });
  await b.close();
  console.log('screenshot fatti');
})();
