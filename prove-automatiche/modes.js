const { chromium, GIOCA } = require('./comune');
const ok = [], ko = [];
const chk = (c, m) => (c ? ok : ko).push(m);
const URL = GIOCA;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1280,height:950} });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  await p.goto(URL);

  chk(!(await p.$('#sel-mode')) && !(await p.$('#sel-ai')),
      'la testata non ha piu selettori di modalita o difficolta');

  chk(await p.isVisible('#s-mode'), 'entrando nel gioco si sceglie subito chi gioca');
  chk(!(await p.isVisible('#s-team')), 'il roster arriva dopo la scelta');
  chk(!(await p.isVisible('#btn-modeback')), 'alla prima apertura non c e niente a cui tornare');
  /* dalla scelta al campo: squadra rapida, riepilogo, arena */
  const inCampo = async () => {
    await p.click('#btn-modego'); await p.waitForTimeout(120);
    await p.click('#btn-auto'); await p.waitForTimeout(80);
    await p.click('#btn-start'); await p.waitForTimeout(80);
    await p.click('#btn-toarena'); await p.waitForTimeout(250);
  };

  // ---- le tre carte ----
  const carte = await p.evaluate(() => [...document.querySelectorAll('#modes .modecard')].map(c => ({
    mode: c.dataset.mode,
    parole: [...c.querySelectorAll('.who b')].map(b => b.textContent),
    icone: [...c.querySelectorAll('.who')].map(w => w.querySelector('svg.ico') ? 'si' : 'no'),
    on: c.getAttribute('aria-pressed')
  })));
  chk(carte.length === 3, 'ci sono tre modalita (' + carte.length + ')');
  chk(JSON.stringify(carte.map(c => c.mode)) === '["hvp","hvh","pvp"]', 'Human vs PC, Human vs Human, PC vs PC');
  chk(JSON.stringify(carte.map(c => c.parole.join(' vs '))) ===
      JSON.stringify(['Human vs PC','Human vs Human','PC vs PC']), 'le etichette sono quelle chieste');
  chk(carte.every(c => c.icone.join() === 'si,si'), 'ogni parola ha la sua icona di fianco');
  chk(carte[0].on === 'true' && carte[1].on === 'false', 'Human vs PC e la scelta di partenza');

  const iconaDi = async (mode, i) => p.evaluate(([m,k]) => {
    const w = document.querySelectorAll('#modes [data-mode="'+m+'"] .who')[k];
    return w.querySelector('svg.ico').innerHTML.includes('circle') ? 'umano' : 'pc';
  }, [mode, i]);
  chk(await iconaDi('hvp',0) === 'umano' && await iconaDi('hvp',1) === 'pc', 'Human vs PC: icona umana e icona PC');
  chk(await iconaDi('hvh',0) === 'umano' && await iconaDi('hvh',1) === 'umano', 'Human vs Human: due icone umane');
  chk(await iconaDi('pvp',0) === 'pc' && await iconaDi('pvp',1) === 'pc', 'PC vs PC: due icone PC');

  // ---- difficolta per modalita ----
  chk(await p.$('#lv-e') !== null && await p.$('#lv-p') === null,
      'in Human vs PC si sceglie la difficolta dell avversario');
  await p.selectOption('#lv-e', '4'); await p.waitForTimeout(80);
  chk((await p.innerText('#lvdesc')).includes('Campione'), 'la descrizione segue il livello scelto');
  await p.click('[data-mode="hvh"]'); await p.waitForTimeout(80);
  chk(await p.$('#lv-e') === null, 'in Human vs Human la difficolta non serve');
  await p.click('[data-mode="pvp"]'); await p.waitForTimeout(80);
  chk(await p.$('#lv-p') !== null && await p.$('#lv-e') !== null,
      'in PC vs PC si sceglie la difficolta di tutti e due');
  await p.selectOption('#lv-p', '1'); await p.selectOption('#lv-e', '4'); await p.waitForTimeout(80);
  const desc = await p.innerText('#lvdesc');
  chk(desc.includes('Principiante') && desc.includes('Campione'), 'le due descrizioni convivono');
  const liv = await p.evaluate(() => ({p: levelOf('p'), e: levelOf('e')}));
  chk(liv.p === 1 && liv.e === 4, 'i livelli scelti arrivano ai due lati (' + JSON.stringify(liv) + ')');

  // ---- la scelta si ricorda ----
  await p.reload(); await p.waitForTimeout(250);
  chk(await p.isVisible('#s-mode'), 'riaprendo il gioco si riparte dalla scelta');
  chk(await p.evaluate(() => S.vs === 'pvp'), 'la modalita scelta viene ricordata');
  const dopo = await p.evaluate(() => [$('#lv-p').value, $('#lv-e').value]);
  chk(dopo[0] === '1' && dopo[1] === '4', 'i livelli restano dopo un ricaricamento (' + dopo + ')');

  // ---- dal roster si torna alla scelta ----
  await p.click('#btn-modego'); await p.waitForTimeout(150);
  chk(await p.isVisible('#s-team'), 'confermata la modalita si passa al roster');
  const banner = await p.innerText('#team-who');
  chk(banner.includes('PC') && banner.includes('Cambia'), 'il roster ricorda chi gioca: "' + banner.replace(/\n/g,' ') + '"');
  await p.click('#btn-chmode'); await p.waitForTimeout(150);
  chk(await p.isVisible('#s-mode') && await p.isVisible('#btn-modeback'),
      'il pulsante Cambia riapre la scelta, con il ritorno alla squadra');
  await p.click('#btn-modeback'); await p.waitForTimeout(120);
  chk(await p.isVisible('#s-team'), 'e si torna indietro senza perdere la squadra');
  await p.click('#btn-chmode'); await p.waitForTimeout(120);

  // ---- PC vs PC gioca da solo ----
  const prima = await p.evaluate(() => ({r:S.rankIdx, n:S.round}));
  await inCampo();
  chk(await p.isVisible('#s-battle'), 'PC vs PC entra in campo senza schierare');
  chk(await p.evaluate(() => S.phase === 'battle'), 'niente fase di schieramento');
  chk(await p.evaluate(() => document.querySelectorAll('#layer [data-uid]').length) === 10,
      'dieci pedine in campo dal primo istante');
  chk(!(await p.isVisible('#btn-end')), 'il pulsante fine turno sparisce');
  chk(await p.isVisible('#btn-quit'), 'compare invece la via d uscita dalla partita di prova');
  const mosseIniziali = await p.evaluate(() => S.units.map(u => u.x + ',' + u.y).join('|'));
  await p.waitForTimeout(2500);
  const mosseDopo = await p.evaluate(() => S.units.map(u => u.x + ',' + u.y).join('|'));
  chk(mosseIniziali !== mosseDopo, 'la partita va avanti da sola');
  const pill = await p.innerText('#turnpill');
  chk(/PC in (basso|alto)/.test(pill), 'il turno dice quale PC sta giocando: "' + pill + '"');

  for (let i = 0; i < 120 && !(await p.$('#s-result.on')); i++) await p.waitForTimeout(500);
  chk(await p.$('#s-result.on') !== null, 'la partita fra computer arriva in fondo');
  const testo = await p.innerText('#r-text');
  chk(/non si muove|prova/.test(testo), 'il risultato dice che il torneo non si muove');
  const dopoM = await p.evaluate(() => ({r:S.rankIdx, n:S.round}));
  chk(dopoM.r === prima.r && dopoM.n === prima.n, 'rank e round restano dove erano');
  chk((await p.innerText('#btn-next')).includes("Un'altra"), 'si puo rilanciare un altra partita di prova');
  await p.click('#btn-newteams'); await p.waitForTimeout(150);
  chk(await p.isVisible('#s-team'), 'da PC vs PC si torna al roster');

  // ---- si puo abbandonare una partita di prova a meta ----
  await p.click('#btn-start'); await p.waitForTimeout(80);
  await p.click('#btn-toarena'); await p.waitForTimeout(900);
  await p.click('#btn-quit'); await p.waitForTimeout(200);
  chk(await p.isVisible('#s-team'), 'il pulsante interrompe la partita e riporta al roster');
  const fermo = await p.evaluate(() => S.units.map(u => u.x + ',' + u.y).join('|'));
  await p.waitForTimeout(1500);
  chk(fermo === await p.evaluate(() => S.units.map(u => u.x + ',' + u.y).join('|')),
      'una volta abbandonata la partita non va piu avanti da sola');
  chk(await p.isVisible('#b-rank'), 'i badge del torneo tornano subito');

  // ---- Human vs PC continua a funzionare ----
  await p.click('#btn-chmode'); await p.waitForTimeout(120);
  await p.click('[data-mode="hvp"]'); await p.waitForTimeout(80);
  await p.selectOption('#lv-e', '3'); await p.waitForTimeout(60);
  await p.click('#btn-modego'); await p.waitForTimeout(120);
  await p.click('#btn-start'); await p.waitForTimeout(80);
  await p.click('#btn-toarena'); await p.waitForTimeout(250);
  chk(await p.evaluate(() => S.phase === 'deploy'), 'Human vs PC passa dallo schieramento');
  chk((await p.innerText('#b-opp')).includes('Esperto'), 'in campo si legge il livello scelto');
  await p.click('#btn-rand'); await p.waitForTimeout(150);
  await p.click('#btn-fight'); await p.waitForTimeout(250);
  chk(await p.evaluate(() => S.phase === 'battle' && S.turn === 'p'), 'la battaglia parte dal giocatore');
  chk(await p.isVisible('#btn-end'), 'con un umano in campo il fine turno torna');

  console.log(ok.map(m => '  OK  ' + m).join('\n'));
  if (ko.length) console.log(ko.map(m => '  KO  ' + m).join('\n'));
  console.log('\nerrori console: ' + (errs.length ? errs.join(' | ') : 'nessuno'));
  console.log(ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
