const { chromium, SERVITO, DEMO } = require('../comune');
const IMG = require('path').join(DEMO, 'img') + require('path').sep;

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
    S.rankIdx = 2; S.round = 3;
    ECO.n = { partite:9, vinte:6, perse:3, hvp:8, hvh:1, pvp:0 };
    ECO.t = { apre:'2026-09-25', squadra:'2026-09-25', prima:'2026-09-25', rankD:'2026-09-26' };
    ECO.giorni = 3; ECO.primo = '2026-09-25'; ecoSalva();
    S.zoo = [nuovoEsemplare('mantis')]; S.mondo.presi = 2;
    apriEco();
    $('#eco-nota').value = 'Bel gioco. La scacchiera che gira in due giocatori è la cosa che mi è piaciuta di più. Il roster all’inizio mi ha un po’ spaventato.';
  });
  await p.waitForTimeout(300);
  await p.locator('#eco-box .modalbox').screenshot({ path: IMG + 'feedback.png' });
  console.log('pannello fatto');
  // l'invito sulla schermata dei risultati
  await p.evaluate(() => { chiudiEco(); ECO.n.invito = 0; ecoSalva(); S.rankIdx = 1; S.round = 1; finish(true); });
  await p.waitForTimeout(300);
  await p.locator('#s-result .result').screenshot({ path: require('path').join(require('os').tmpdir(), 'invito.png') });
  console.log('invito fatto');
  await b.close();
})();
