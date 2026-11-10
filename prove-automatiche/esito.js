const { chromium, GIOCA } = require('./comune');
/* Se la suite si ferma a meta' lo dice come un controllo fallito: senza,
   la batteria leggerebbe zero controlli e zero errori, cioe' un silenzio. */
process.on('unhandledRejection', e => {
  console.log('  KO  la suite si e\' fermata: ' + String(e && e.message || e).split('\n').slice(0, 3).join(' / '));
  process.exit(1);
});
/* La sconfitta e il risultato: un rank perdona una sconfitta prima di
   ripartire dal primo avversario, e la schermata di fine partita mostra i
   cinque round e i numeri della battaglia. */
(async () => {
  const b = await chromium.launch();
  const ok=[], ko=[]; const chk=(c,n)=>{ (c?ok:ko).push(n); };
  const errs=[];
  const p = await b.newPage({ viewport:{ width:1280, height:950 } });
  p.on('pageerror', e=>errs.push(e.message));
  p.on('console', m=>{ if(m.type()==='error') errs.push(m.text()); });
  /* Niente script d'avvio che scrive in localStorage: su file://, dopo un
     ricaricamento, a volte si porta via il salvataggio (vedi comune.js). Le
     nuvolette si segnano come viste da dentro la pagina. */
  const zitte = () => p.evaluate(() => { spiegaFatte.squadra = spiegaFatte.campo = true; chiudiSpiega(); });
  await p.goto(GIOCA); await p.waitForTimeout(300); await zitte();
  if (await p.$('#s-mode.on')) await p.click('#btn-modego');
  await p.click('#btn-auto');
  const entra = async () => {
    await p.click('#btn-start'); await p.click('#btn-toarena'); await p.click('#btn-rand'); await p.click('#btn-fight');
    await p.waitForTimeout(250);
  };
  const chiudi = async (vinco) => {
    await p.evaluate(v => { S.units.filter(u => u.side === (v ? 'e' : 'p')).forEach(u => u.alive = false); checkEnd(); }, vinco);
    await p.waitForSelector('#s-result.on'); await p.waitForTimeout(150);
    return p.evaluate(() => ({
      round: S.round, rank: S.rankIdx, usata: S.usata,
      titolo: document.querySelector('#r-title').textContent, testo: document.querySelector('#r-text').textContent,
      pieni: document.querySelectorAll('#r-tappe .pt i.v').length, ora: [...document.querySelectorAll('#r-tappe .pt i')].findIndex(i => i.classList.contains('ora')),
      tappe: !document.querySelector('#r-tappe').hidden, voce: (document.querySelector('#r-tappe .pt') || {getAttribute(){}}).getAttribute('aria-label'),
      bis: (document.querySelector('#r-tappe .bis') || {className:''}).className,
      cifre: [...document.querySelectorAll('#r-cifre div')].map(d => d.textContent), cifreVis: !document.querySelector('#r-cifre').hidden,
      subito: document.querySelector('#btn-subito').hidden ? '' : document.querySelector('#btn-subito').textContent,
      salvato: JSON.parse(localStorage.getItem('insectron') || '{}')
    }));
  };

  // ---------- la testata dice che la seconda possibilita' c'e'
  chk(await p.$eval('#b-round .bis', e => !e.classList.contains('usata') && /disponibile/.test(e.getAttribute('aria-label'))),
      'accanto al round la testata mostra la seconda possibilita’, disponibile');
  chk((await p.$eval('#b-round', e => e.textContent)) === 'Round 1/5', 'senza cambiare il testo del round');

  // ---------- due round vinti, poi la prima sconfitta
  await entra(); let r = await chiudi(true);
  chk(r.round === 1 && r.pieni === 1 && r.ora === 1 && r.tappe, 'vinto il primo round, la barra ne mostra uno pieno e indica il secondo');
  chk(r.voce === 'Round vinti: 1 su 5', 'e lo dice anche a chi non la vede');
  await p.click('#btn-subito'); await p.waitForTimeout(300);
  r = await chiudi(true);
  chk(r.round === 2 && r.pieni === 2, 'vinto il secondo, due pieni');
  await p.click('#btn-subito'); await p.waitForTimeout(300);
  r = await chiudi(false);
  chk(r.round === 2 && r.usata === true, 'la prima sconfitta del rank non azzera: il round resta il terzo');
  chk(/seconda possibilit/.test(r.testo) && /si rigioca/.test(r.testo) && /prossima sconfitta/.test(r.testo), 'e il testo spiega che si rigioca, e che cosa succede alla prossima');
  chk(r.pieni === 2 && r.ora === 2 && /usata/.test(r.bis), 'la barra tiene i due round vinti e segna la possibilita’ come spesa');
  chk(r.subito === 'Riprova subito', 'con «Riprova subito» per rigiocarlo');
  chk(r.salvato.x === 1 && r.salvato.n === 2, 'e il salvataggio lo ricorda');
  await p.click('#btn-subito'); await p.waitForTimeout(300);
  chk(/Round 3\/5/.test(await p.innerText('#log')), 'il round che si rigioca e’ lo stesso');
  chk(await p.$eval('#b-round .bis', e => e.classList.contains('usata') && /usata/.test(e.getAttribute('aria-label'))), 'e la testata la mostra spesa');

  // ---------- ricaricando resta spesa
  await p.reload(); await p.waitForTimeout(300);
  await zitte();
  chk(await p.evaluate(() => S.usata === true && S.round === 2), 'ricaricando la pagina resta spesa, e il round e’ ancora il terzo');
  if (await p.$('#s-mode.on')) await p.click('#btn-modego');

  // ---------- la seconda sconfitta fa ripartire il rank
  await entra(); r = await chiudi(false);
  chk(r.round === 0 && r.usata === false, 'la seconda sconfitta fa ripartire il rank dal primo avversario');
  chk(/riparte dal primo avversario/.test(r.testo) && /torna disponibile/.test(r.testo), 'il testo lo dice, e dice che la possibilita’ torna');
  chk(r.pieni === 0 && r.ora === 0 && !/usata/.test(r.bis), 'la barra torna vuota');
  chk(r.salvato.x === undefined && r.salvato.n === 0, 'e nel salvataggio il campo sparisce: c’e’ solo quando serve');
  await p.click('#btn-next'); await p.waitForTimeout(200);

  // ---------- conquistare il rank la rinnova
  await entra(); r = await chiudi(false);
  chk(r.usata === true, 'nel giro nuovo la possibilita’ si puo’ spendere di nuovo');
  await p.click('#btn-next'); await p.waitForTimeout(200);
  await entra();
  await p.evaluate(() => { S.round = 4; });
  r = await chiudi(true);
  chk(r.rank === 1 && r.round === 0 && r.usata === false, 'conquistato il rank, quello dopo comincia con la possibilita’ intera');
  chk(r.pieni === 5 && r.ora === -1, 'e la barra mostra cinque round pieni');
  await p.click('#btn-next'); await p.waitForTimeout(200);

  // ---------- i numeri della partita
  await entra();
  const veri = await p.evaluate(() => {
    const m = S.units.find(u => u.side === 'p' && u.alive && !u.isKing), f = S.units.find(u => u.side === 'e' && u.alive && !u.isKing);
    const g = S.units.find(u => u.side === 'e' && u.alive && !u.isKing && u !== f);
    f.guard = 0; m.guard = 0;
    const v0 = f.hp, d1 = strike(m, f, 1, 'attacca');
    const mio0 = m.hp, d2 = strike(g, m, 1, 'attacca');
    /* il colpo di grazia non conta piu' della vita che restava */
    f.hp = 3; const d3 = strike(m, f, 1, 'attacca');
    return { dati: d1 + 3, presi: d2, part: JSON.parse(JSON.stringify(PART)), d3 };
  });
  chk(veri.part.dati === veri.dati && veri.part.presi === veri.presi && veri.d3 > 3,
      'i danni si contano mentre si gioca, e il colpo di grazia vale la vita che restava (' + veri.part.dati + ' dati, ' + veri.part.presi + ' presi)');
  await p.waitForTimeout(700);
  await p.evaluate(() => { newTurn('p'); newTurn('p'); });
  r = await chiudi(true);
  chk(r.cifreVis && r.cifre.length === 4, 'il risultato mostra quattro numeri');
  chk(r.cifre[0] === '3turni' && /\/5pedine rimaste$/.test(r.cifre[1]) && r.cifre[2] === veri.dati + 'danni inflitti' && r.cifre[3] === veri.presi + 'danni subiti',
      'turni, pedine rimaste, danni inflitti e subiti sono quelli della partita (' + r.cifre.join(' · ') + ')');
  await p.click('#btn-subito'); await p.waitForTimeout(300);
  chk(await p.evaluate(() => PART.turni === 1 && PART.dati === 0 && PART.presi === 0), 'la partita dopo riparte da zero');

  // ---------- fuori dal torneo niente barra
  await p.evaluate(() => { leaveMatch(); S.vs = 'pvp'; startPvp(); });
  await p.waitForTimeout(200);
  await p.evaluate(() => { S.units.filter(u => u.side === 'e').forEach(u => u.alive = false); checkEnd(); });
  await p.waitForSelector('#s-result.on'); await p.waitForTimeout(150);
  chk(await p.evaluate(() => document.querySelector('#r-tappe').hidden && document.querySelector('#r-cifre').hidden),
      'in una partita fuori dal torneo la barra dei round non compare');
  chk(await p.evaluate(() => S.usata === false || S.usata === true) && await p.evaluate(() => JSON.parse(localStorage.getItem('insectron')).n) === 1,
      'e il torneo non si muove');

  // ---------- telefono: i numeri stanno nella scheda
  const q = await b.newPage({ viewport:{ width:360, height:740 }, hasTouch:true });
  q.on('pageerror', e=>errs.push(e.message));
  await q.goto(GIOCA); await q.waitForTimeout(300);
  if (await q.$('#s-mode.on')) await q.click('#btn-modego');
  await q.click('#btn-auto'); await q.click('#btn-start'); await q.click('#btn-toarena'); await q.click('#btn-rand'); await q.click('#btn-fight');
  await q.waitForTimeout(250);
  await q.evaluate(() => { S.units.filter(u => u.side === 'e').forEach(u => u.alive = false); checkEnd(); });
  await q.waitForSelector('#s-result.on'); await q.waitForTimeout(200);
  const tel = await q.evaluate(() => {
    const c = document.querySelector('.result').getBoundingClientRect();
    const dentro = [...document.querySelectorAll('#r-cifre div, #r-tappe .pt i')].every(e => { const r = e.getBoundingClientRect(); return r.left >= c.left && r.right <= c.right + 1; });
    return { dentro, sw: document.documentElement.scrollWidth, iw: innerWidth,
      piccolo: Math.min(...[...document.querySelectorAll('#r-cifre div, #r-cifre b, #r-tappe')].map(e => parseFloat(getComputedStyle(e).fontSize))) };
  });
  chk(tel.dentro && tel.sw <= tel.iw, 'su un telefono da 360 px barra e numeri stanno nella scheda, senza scorrimento orizzontale');
  chk(tel.piccolo >= 10.8, 'e nessuna scritta scende sotto il pavimento (' + tel.piccolo + ' px)');

  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
