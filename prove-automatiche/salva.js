const { chromium, SERVITO } = require('./comune');
const ok=[],ko=[]; const chk=(c,m)=>(c?ok:ko).push(m);
const URL = SERVITO + 'gioca.html';

(async () => {
  const b = await chromium.launch();

  // ---- contesto 1: si fanno progressi e si esporta ----
  const c1 = await b.newContext({ viewport:{width:1220,height:950} });
  const p = await c1.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  await p.goto(URL); await p.waitForTimeout(250);

  // progressi finti ma realistici: rank C, round 2, squadra scelta, campione
  await p.evaluate(() => {
    S.champion = true; S.rankIdx = 2; S.round = 1;
    S.team = UNITS.filter(unlocked).slice(0,5).map(u => u.id);
    S.kingId = S.team[0]; S.lvl = { e:3, p:0 };
    save();
  });
  const grezzo = await p.evaluate(() => JSON.parse(localStorage.getItem('insectron')));
  const schema = await p.evaluate(() => SCHEMA);
  chk(grezzo.sv === schema, 'il salvataggio porta il numero di versione corrente (sv=' + grezzo.sv + ')');

  await p.click('#btn-save'); await p.waitForTimeout(150);
  chk(await p.isVisible('#save-box'), 'la finestra del salvataggio si apre');
  chk(await p.evaluate(() => document.activeElement.id) === 'btn-copy', 'il fuoco entra nella finestra');
  const sum = await p.innerText('#save-sum');
  chk(/Rank C/.test(sum) && /round 2/.test(sum) && /campione/.test(sum),
      'il riepilogo dice dove sei: "' + sum.replace(/\s+/g,' ') + '"');
  const codice = await p.inputValue('#save-code');
  chk(codice.startsWith('INSECTRON-') && codice.includes('.'), 'il codice ha marca e impronta');
  chk(codice.length < 400, 'il codice sta in poche righe (' + codice.length + ' caratteri)');

  // chiusura con Esc e fuoco restituito
  await p.keyboard.press('Escape'); await p.waitForTimeout(120);
  chk(!(await p.isVisible('#save-box')), 'Esc chiude la finestra');
  chk(await p.evaluate(() => document.activeElement.id) === 'btn-save', 'il fuoco torna al pulsante');

  // scaricamento del file
  await p.click('#btn-save'); await p.waitForTimeout(120);
  const [dl] = await Promise.all([ p.waitForEvent('download'), p.click('#btn-dl') ]);
  chk(/^insectron-\d{4}-\d{2}-\d{2}\.txt$/.test(dl.suggestedFilename()),
      'il file scaricato ha un nome con la data: ' + dl.suggestedFilename());
  await p.close();

  // ---- contesto 2: browser "nuovo", si ripristina ----
  const c2 = await b.newContext({ viewport:{width:1220,height:950} });
  const q = await c2.newPage();
  q.on('pageerror',e=>errs.push(e.message));
  q.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  q.on('dialog', d => d.accept());
  await q.goto(URL); await q.waitForTimeout(250);
  chk(await q.evaluate(() => S.rankIdx === 0 && !S.champion), 'il secondo browser parte da zero');

  await q.click('#btn-save'); await q.waitForTimeout(120);
  // prima i rifiuti
  const rifiuta = async (testo, atteso, nome) => {
    await q.fill('#load-code', testo);
    await q.click('#btn-restore'); await q.waitForTimeout(120);
    const msg = await q.innerText('#save-msg');
    const cls = await q.getAttribute('#save-msg', 'class');
    chk(cls.includes('ko') && new RegExp(atteso, 'i').test(msg), nome + ' — "' + msg + '"');
  };
  await rifiuta('', 'incollato', 'campo vuoto rifiutato');
  await rifiuta('ciao mondo', 'non è un codice', 'testo estraneo rifiutato');
  await rifiuta(codice.slice(0, codice.length - 3), 'danneggiato|illeggibile', 'codice troncato rifiutato');
  await rifiuta('INSECTRON-' + codice.slice(10, 40), 'incompleto|illeggibile|danneggiato', 'codice mutilato rifiutato');
  chk(await q.evaluate(() => localStorage.getItem('insectron') === null),
      'nessun tentativo fallito ha toccato il salvataggio');

  // poi quello buono, con spazi e a capo in mezzo come succede copiando
  await q.fill('#load-code', codice.slice(0,50) + '\n  ' + codice.slice(50));
  await q.click('#btn-restore'); await q.waitForTimeout(250);
  const dopo = await q.evaluate(() => ({ r:S.rankIdx, n:S.round, c:S.champion, t:S.team.length, e:S.lvl.e,
                                         salvato: !!localStorage.getItem('insectron') }));
  chk(dopo.r === 2 && dopo.n === 1 && dopo.c === true && dopo.t === 5 && dopo.e === 3,
      'il ripristino riporta rank, round, campione, squadra e difficoltà: ' + JSON.stringify(dopo));
  chk(dopo.salvato, 'e il salvataggio viene riscritto in questo browser');
  chk(!(await q.isVisible('#save-box')) && await q.isVisible('#s-team'),
      'la finestra si chiude e si torna al roster');
  chk((await q.innerText('#b-rank')).includes('C'), 'la testata mostra il rank ripristinato');

  // ---- salvataggio vecchio, senza numero di versione ----
  await q.evaluate(() => {
    localStorage.setItem('insectron', JSON.stringify(
      { r:1, n:3, t:[UNITS[0].id], k:UNITS[0].id, c:0, a:0 }));
  });
  await q.reload(); await q.waitForTimeout(300);
  const vecchio = await q.evaluate(() => ({ r:S.rankIdx, n:S.round, t:S.team.length,
                                            sv: JSON.parse(localStorage.getItem('insectron')).sv }));
  chk(vecchio.r === 1 && vecchio.n === 3 && vecchio.t === 1, 'un salvataggio senza versione viene letto lo stesso');
  await q.evaluate(() => save());
  const riscritto = await q.evaluate(() => JSON.parse(localStorage.getItem('insectron')).sv);
  chk(riscritto === schema, 'e alla prima scrittura viene portato alla versione corrente (sv=' + riscritto + ')');

  // ---- salvataggio dal futuro ----
  await q.evaluate(() => {
    localStorage.setItem('insectron', JSON.stringify(
      { sv: 99, r:5, n:4, t:[UNITS[0].id], k:UNITS[0].id, c:1 }));
  });
  await q.reload(); await q.waitForTimeout(300);
  const futuro = await q.evaluate(() => ({ r:S.rankIdx, hint: $('#roster-hint').textContent,
                                           intatto: JSON.parse(localStorage.getItem('insectron')).sv }));
  chk(futuro.r === 0, 'un salvataggio dal futuro non viene interpretato a caso');
  chk(/pi.\s*recente/i.test(futuro.hint), 'e la cosa viene detta a schermo');
  chk(futuro.intatto === 99, 'il salvataggio dal futuro resta intatto, non sovrascritto');

  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
