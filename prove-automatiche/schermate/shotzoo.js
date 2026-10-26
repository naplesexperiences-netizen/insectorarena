const { chromium, SERVITO, DEMO } = require('../comune');
const IMG = require('path').join(DEMO, 'img') + require('path').sep;

const DIR = IMG;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1220,height:900} });
  /* Le nuvolette dei suggerimenti si aprono da sole la prima volta: nelle
     immagini della vetrina coprirebbero proprio quello che devono mostrare. */
  await p.addInitScript(() => { try { localStorage.setItem('insectron-spiega',
    JSON.stringify({ squadra:true, campo:true, zoo:true, mondo:true })); } catch(e){} });
  await p.goto(SERVITO + 'gioca.html'); await p.waitForTimeout(250);
  await p.click('#btn-modego'); await p.waitForTimeout(120);
  await p.evaluate(() => {
    S.champion = true; S.rankIdx = 3;
    const scelte = ["Falcidi","Bastidi","Silfidi"];
    S.zoo = []; ZOO_SEQ = 0;
    scelte.forEach((fam, i) => {
      const u = UNITS.filter(x => x.fam === fam)[0];
      const e = nuovoEsemplare(u.id);
      e.speso = [12, 5, 24][i];
      e.b = [{hp:22,str:6,def:4},{hp:5,str:0,def:2},{hp:34,str:9,def:8}][i];
      e.res = { kb:0, cf:2, ct:0, ex:2, th:0, po:0 };
      S.zoo.push(e);
    });
    S.dispensa = { "Lapislazzuli":3, "Rubino":2, "Frutto del Vesuvio":1, "Frutto regale":1, "Onice scura":2 };
    apriGabbie(S.zoo[2].u);
  });
  await p.waitForTimeout(350);
  await p.locator('#s-zoo .card').screenshot({ path: DIR + 'gabbie.png' });
  console.log('schermata gabbie fatta');
  await b.close();
})();
