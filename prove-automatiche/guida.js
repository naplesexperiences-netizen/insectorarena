const { chromium, SERVITO } = require('./comune');
const ok=[],ko=[]; const chk=(c,m)=>(c?ok:ko).push(m);
const URL = SERVITO + 'gioca.html';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1280,height:1000} });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  p.on('dialog', d => d.accept());
  await p.goto(URL); await p.waitForTimeout(150);
  await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForTimeout(300);

  // --- primo passo: comporre la squadra ---
  await p.click('#btn-modego'); await p.waitForTimeout(200);
  chk(await p.isVisible('#guida'), 'a un giocatore nuovo la guida compare');
  chk((await p.innerText('#guida-n')) === '1 di 4', 'e parte dal primo dei quattro passi');
  chk(/cinque/.test(await p.innerText('#guida-testo')), 'il primo passo chiede cinque Insector');

  // scelgo quattro: la guida resta
  await p.evaluate(() => { S.team = UNITS.filter(unlocked).slice(0,4).map(u => u.id);
                           drawRoster(); drawSlots(); });
  await p.waitForTimeout(150);
  chk((await p.innerText('#guida-n')) === '1 di 4', 'con quattro pedine è ancora al primo passo');

  // il quinto porta al passo del Re
  await p.evaluate(() => { S.team = UNITS.filter(unlocked).slice(0,5).map(u => u.id);
                           S.kingId = null; drawRoster(); drawSlots(); });
  await p.waitForTimeout(150);
  await p.click('#btn-start'); await p.waitForTimeout(250);
  chk((await p.innerText('#guida-n')) === '2 di 4', 'composta la squadra, si passa al Re');
  chk(/Re/.test(await p.innerText('#guida-testo')), 'e il testo parla del Re');

  // scelto il Re, la guida passa allo schieramento
  await p.evaluate(() => { S.kingId = S.team[0]; drawBrief(); });
  await p.waitForTimeout(200);
  await p.click('#btn-toarena'); await p.waitForTimeout(350);
  chk((await p.innerText('#guida-n')) === '3 di 4', 'in campo, il passo diventa lo schieramento');
  chk(/illuminate/.test(await p.innerText('#guida-testo')), 'e spiega dove si piazza');

  // schierate le pedine, si passa al movimento
  await p.click('#btn-rand'); await p.waitForTimeout(200);
  await p.click('#btn-fight'); await p.waitForTimeout(400);
  chk((await p.innerText('#guida-n')) === '4 di 4', 'iniziata la battaglia, si spiega il movimento');
  chk(/una volta/.test(await p.innerText('#guida-testo')), 'e si dice che si muove una volta sola');

  // selezionata una pedina, il quarto passo sparisce e la guida si spegne
  const mia = await p.evaluate(() => { const u = S.units.filter(x => x.side === 'p' && x.alive)[0];
                                       click(u.x, u.y); return !!S.sel; });
  await p.waitForTimeout(250);
  chk(mia, 'si seleziona una pedina');
  chk(!(await p.isVisible('#guida')), 'e la guida sparisce');
  chk(await p.evaluate(() => guidaViva === false && localStorage.getItem('insectron-guida') === 'fatta'),
      'finiti i quattro passi si spegne per sempre');

  // --- non torna piu' ---
  await p.reload(); await p.waitForTimeout(300);
  await p.click('#btn-modego'); await p.waitForTimeout(200);
  chk(!(await p.isVisible('#guida')), 'ricaricando non ricompare');

  // --- «salta la guida» ---
  await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForTimeout(300);
  await p.click('#btn-modego'); await p.waitForTimeout(200);
  chk(await p.isVisible('#guida'), 'azzerando tutto, a un nuovo giocatore ricompare');
  await p.click('#btn-guida-basta'); await p.waitForTimeout(150);
  chk(!(await p.isVisible('#guida')), '«Salta la guida» la chiude subito');
  await p.reload(); await p.waitForTimeout(300);
  await p.click('#btn-modego'); await p.waitForTimeout(200);
  chk(!(await p.isVisible('#guida')), 'e non torna nemmeno dopo un ricaricamento');

  // --- chi ha gia' una partita non e' un principiante ---
  await p.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('insectron', JSON.stringify({ sv:3, r:2, n:1, t:[], k:null, c:0, z:[], p:{} }));
  });
  await p.reload(); await p.waitForTimeout(300);
  await p.click('#btn-modego'); await p.waitForTimeout(200);
  chk(await p.evaluate(() => guidaViva === false),
      'chi torna con un torneo in corso non vede la guida');

  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
