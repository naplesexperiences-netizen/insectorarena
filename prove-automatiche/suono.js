const { chromium, SERVITO } = require('./comune');
const ok=[],ko=[]; const chk=(c,m)=>(c?ok:ko).push(m);
const URL = SERVITO + 'gioca.html';
(async () => {
  const b = await chromium.launch({ args:['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport:{width:1280,height:980} });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  const rete = [];
  p.on('request', r => { if (!r.url().startsWith(URL) && !r.url().startsWith('data:')) rete.push(r.url()); });
  await p.goto(URL); await p.waitForTimeout(300);

  // --- niente audio prima che serva ---
  chk(await p.evaluate(() => actx === null),
      'al caricamento nessun AudioContext: si crea al primo suono, non prima');
  chk(await p.evaluate(() => audioOn === true), 'il suono parte acceso');
  await p.click('#btn-menu'); await p.waitForTimeout(150);
  chk(await p.isVisible('#btn-audio'), 'il pulsante del suono sta nel menu');

  // --- il catalogo ---
  const cat = await p.evaluate(() => Object.keys(SUONI));
  chk(cat.length >= 12, 'il catalogo ha ' + cat.length + ' suoni: ' + cat.join(', '));
  const forma = await p.evaluate(() => Object.values(SUONI).every(v =>
    Array.isArray(v) && v.length && v.every(x => (x.n === true || x.f > 0) && x.d > 0)));
  chk(forma, 'ogni suono è fatto di voci con durata e frequenza valide');

  // --- suonare davvero ---
  const primo = await p.evaluate(() => ({ partito: suona('colpo'), ctx: actx !== null,
                                          stato: actx && actx.state }));
  chk(primo.partito && primo.ctx, 'il primo suono crea il contesto e parte');
  chk(primo.stato === 'running' || primo.stato === 'suspended',
      'il contesto è in uno stato valido (' + primo.stato + ')');
  chk(await p.evaluate(() => Object.keys(SUONI).every(n => suona(n) === true)),
      'tutti i suoni del catalogo si riproducono senza errori');
  chk(await p.evaluate(() => suona('questo-non-esiste') === false),
      'un nome inventato non rompe niente: torna false');

  // --- spegnere ---
  await p.click('#btn-audio'); await p.waitForTimeout(120);
  chk(await p.evaluate(() => audioOn === false), 'il pulsante spegne il suono');
  chk(await p.isVisible('#btn-musica'),
      'e il menu resta aperto: si possono toccare tutti e due gli interruttori');
  chk(await p.evaluate(() => suona('colpo') === false), 'e da spento non parte più niente');
  chk(await p.evaluate(() => $('#btn-audio').title.includes('spento') &&
                             $('#btn-audio').classList.contains('spento')),
      'il pulsante dice come sta, col titolo e col tratto sopra');
  chk(await p.evaluate(() => $('#btn-audio').getAttribute('aria-checked') === 'false'),
      'e lo dice anche a chi usa uno screen reader');

  await p.reload(); await p.waitForTimeout(300);
  chk(await p.evaluate(() => audioOn === false), 'la scelta sopravvive al ricaricamento');
  await p.click('#btn-menu'); await p.waitForTimeout(150);
  await p.click('#btn-audio'); await p.waitForTimeout(120);
  chk(await p.evaluate(() => audioOn === true), 'e si riaccende');

  // --- il gioco suona dove deve ---
  const agganci = await p.evaluate(() => {
    const visti = []; const vero = window.suona;
    window.suona = n => { visti.push(n); return vero(n); };
    S.rankIdx = 0; S.team = UNITS.filter(unlocked).slice(0,5).map(u => u.id); S.kingId = S.team[0];
    startBattle();
    const mio = S.units.filter(u => u.side === 'p' && u.alive)[0];
    const suo = S.units.filter(u => u.side === 'e' && u.alive)[0];
    S.phase = 'battle'; S.turn = 'p'; S.busy = false; S.over = false;
    click(mio.x, mio.y);                       /* selezione */
    suo.x = mio.x; suo.y = mio.y - 1;          /* accostato, per l'attacco */
    basicAttack(mio, suo);
    suo.hp = 1; ko(suo, 'colpo');
    finish(true);
    window.suona = vero;
    return visti;
  });
  chk(agganci.includes('seleziona'), 'selezionare una pedina fa un suono');
  chk(agganci.includes('colpo'), 'un attacco fa un suono');
  chk(agganci.includes('ko'), 'un K.O. fa un suono');
  chk(agganci.includes('vittoria'), 'e la vittoria ha il suo');

  // --- muto se il browser non sa suonare ---
  const senza = await p.evaluate(() => {
    const A = window.AudioContext, W = window.webkitAudioContext;
    window.AudioContext = undefined; window.webkitAudioContext = undefined;
    actx = null;
    const r = suona('colpo');
    window.AudioContext = A; window.webkitAudioContext = W; actx = null;
    return r;
  });
  chk(senza === false, 'su un browser senza audio il gioco resta muto invece di rompersi');

  chk(rete.length === 0, 'nessun file scaricato: i suoni sono generati qui' +
      (rete.length ? ' (' + rete.join(' | ') + ')' : ''));
  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
