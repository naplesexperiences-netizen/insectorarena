const { chromium, SERVITO } = require('./comune');
const ok=[],ko=[]; const chk=(c,m)=>(c?ok:ko).push(m);
const URL = SERVITO + 'gioca.html';
(async () => {
  const b = await chromium.launch({ args:['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport:{width:1280,height:980} });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  const rete=[]; p.on('request', r => { if (!r.url().startsWith(URL) && !r.url().startsWith('data:')) rete.push(r.url()); });
  await p.goto(URL); await p.waitForTimeout(150);
  await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForTimeout(300);

  // --- niente musica prima di un gesto ---
  chk(await p.evaluate(() => musicaOn === true && musTimer === null && actx === null),
      'la musica è accesa ma non suona: prima di un gesto non parte, e nessun contesto audio');
  await p.click('#btn-menu'); await p.waitForTimeout(150);
  chk(await p.isVisible('#btn-musica'), 'il pulsante della musica sta nel menu');
  await p.keyboard.press('Escape'); await p.waitForTimeout(120);

  // --- parte entrando nel gioco ---
  await p.click('#btn-modego'); await p.waitForTimeout(400);
  const via = await p.evaluate(() => ({ timer: musTimer !== null, brano: musBrano,
                                        ctx: actx !== null, quando: musQuando }));
  chk(via.timer && via.ctx, 'entrando nel gioco la musica parte');
  chk(via.brano === 'roster', 'fuori dal campo suona il tema del roster');
  chk(via.quando > 0, 'e i passi sono già programmate in avanti');

  // --- programma nel futuro, non "adesso" ---
  const anticipo = await p.evaluate(() => {
    const viste = [], vera = window.voce;
    window.voce = (c, v, bus, quando) => { viste.push({ quando, ora: c.currentTime }); return vera(c, v, bus, quando); };
    musQuando = actx.currentTime + 0.1; musPasso = 0; musicaGiro();
    window.voce = vera;
    return { n: viste.length, futuro: viste.every(x => x.quando >= x.ora) };
  });
  chk(anticipo.n > 0, 'la finestra di anticipo programma ' + anticipo.n + ' note');
  chk(anticipo.futuro, 'e le programma tutte nel futuro del clock audio, non "adesso"');

  // --- la scena cambia con la schermata ---
  await p.evaluate(() => { S.team = UNITS.filter(unlocked).slice(0,5).map(u => u.id);
                           S.kingId = S.team[0]; startBattle(); show('s-battle'); });
  await p.waitForTimeout(250);
  chk(await p.evaluate(() => musBrano === 'campo'), 'in battaglia passa al tema del campo');
  chk(await p.evaluate(() => BRANI.campo.bpm > BRANI.roster.bpm),
      'che va piu\u0300 svelto (' + (await p.evaluate(() => BRANI.campo.bpm)) + ' contro ' +
      (await p.evaluate(() => BRANI.roster.bpm)) + ' bpm)');
  chk(await p.evaluate(() => musPasso === 0 || musPasso < 8),
      'e riparte dalla prima battuta invece di riprendere a meta\u0300');
  await p.evaluate(() => show('s-team')); await p.waitForTimeout(200);
  chk(await p.evaluate(() => musBrano === 'roster'), 'tornando al roster torna il suo tema');

  // --- le melodie sono scritte, quindi si ripetono identiche ---
  const scritte = await p.evaluate(() => {
    const leggi = (brano, da, a) => {
      const viste = [], vera = window.voce;
      window.voce = (c, v, bus, q) => { viste.push(Math.round(v.f || 0)); };
      for (let n = da; n < a; n++) pianificaPasso(actx, BRANI[brano], n, actx.currentTime + 1);
      window.voce = vera;
      return viste.join(',');
    };
    const B = BRANI.roster, L = B.lung;
    return { giro1: leggi('roster', 0, L), giro2: leggi('roster', L, L * 2),
             lung: L, diverso: leggi('campo', 0, 16) !== leggi('roster', 0, 16) };
  });
  chk(scritte.lung === 64, 'il tema del roster e\u0300 lungo quattro battute (' + scritte.lung + ' passi)');
  chk(scritte.giro1 === scritte.giro2 && scritte.giro1.length > 0,
      'ed e\u0300 scritto, non improvvisato: il secondo giro e\u0300 identico al primo');
  chk(scritte.diverso, 'i due brani suonano note diverse');

  // --- le note stanno nella scala del brano ---
  const scala = await p.evaluate(() => {
    const ammessi = [0,2,3,5,7,8,10];
    return Object.keys(BRANI).every(k => BRANI[k].voci.every(v => v.n || v.note.every(e =>
      e[0] === null || ammessi.indexOf(((e[0] % 12) + 12) % 12) >= 0)));
  });
  chk(scala, 'tutte le note dei due brani stanno in la\u0300 minore naturale');

  // --- la musica sta sotto agli effetti ---
  chk(await p.evaluate(() => musBus.gain.value < 1 && master.gain.value <= 0.3),
      'la musica ha un suo bus, più basso degli effetti');

  // --- interruttori indipendenti ---
  await p.click('#btn-menu'); await p.waitForTimeout(150);
  await p.click('#btn-musica'); await p.waitForTimeout(200);
  chk(await p.evaluate(() => musicaOn === false && musTimer === null),
      'il pulsante spegne la musica e ferma il generatore');
  chk(await p.evaluate(() => audioOn === true && suona('colpo') === true),
      'ma gli effetti continuano: sono due interruttori separati');
  await p.click('#btn-audio'); await p.waitForTimeout(150);
  await p.click('#btn-musica'); await p.waitForTimeout(250);
  chk(await p.evaluate(() => musicaOn === true && musTimer !== null && audioOn === false),
      'e si può avere la musica senza gli effetti');
  chk(await p.evaluate(() => $('#btn-musica').getAttribute('aria-checked') === 'true' &&
                             $('#btn-audio').getAttribute('aria-checked') === 'false'),
      'lo stato dei due pulsanti è detto anche a chi usa uno screen reader');

  // --- la scelta resta ---
  await p.evaluate(() => { audioImposta(true); musicaImposta(false); });
  await p.reload(); await p.waitForTimeout(300);
  chk(await p.evaluate(() => musicaOn === false && audioOn === true),
      'le due scelte sopravvivono al ricaricamento, separatamente');
  await p.evaluate(() => musicaImposta(true));
  await p.click('#btn-modego'); await p.waitForTimeout(300);

  // --- scheda in secondo piano ---
  const fermata = await p.evaluate(() => { musicaVisibilita(true); return musTimer === null; });
  chk(fermata, 'con la scheda in secondo piano la musica si ferma');
  const ripresa = await p.evaluate(() => { musicaVisibilita(false); return musTimer !== null; });
  chk(ripresa, 'e riprende tornando in primo piano');

  // --- muto se il browser non sa suonare ---
  const senza = await p.evaluate(() => {
    musicaFerma();
    const A = window.AudioContext, W = window.webkitAudioContext;
    window.AudioContext = undefined; window.webkitAudioContext = undefined;
    const vecchio = actx; actx = null;
    const r = musicaAvvia();
    window.AudioContext = A; window.webkitAudioContext = W; actx = vecchio;
    return r;
  });
  chk(senza === false, 'su un browser senza audio la musica non parte e non rompe niente');

  // --- si ascolta davvero? rendering fuori linea e misura del segnale ---
  const misura = await p.evaluate(async () => {
    async function rendi(brano, secondi){
      const OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const c = new OC(1, 44100 * secondi, 44100);
      const busVero = musBus;
      musBus = null;
      const B = BRANI[brano], passo = durataPasso(B);
      let t = 0.05, n = 0;
      while (t < secondi - 0.5){ pianificaPasso(c, B, n++, t); t += passo; }
      const buf = await c.startRendering();
      musBus = busVero;
      const d = buf.getChannelData(0);
      let picco = 0, somma = 0, silenzio = 0;
      for (let i = 0; i < d.length; i++){
        const a = Math.abs(d[i]);
        if (a > picco) picco = a;
        somma += d[i] * d[i];
        if (a < 0.0005) silenzio++;
      }
      return { picco, rms: Math.sqrt(somma / d.length), silenzio: silenzio / d.length };
    }
    return { calma: await rendi('roster', 9), campo: await rendi('campo', 9) };
  });
  const c1 = misura.calma, c2 = misura.campo;
  chk(c1.rms > 0.004, 'il tema del roster produce un segnale udibile (rms ' + c1.rms.toFixed(4) + ')');
  chk(c1.picco < 0.99 && c2.picco < 0.99,
      'e nessuna delle due va in clipping (picchi ' + c1.picco.toFixed(2) + ' e ' + c2.picco.toFixed(2) + ')');
  const densita = await p.evaluate(() => {
    const conta = k => { const B = BRANI[k];
      return B.voci.reduce((n,v) => n + v.note.filter(e => e[0] !== null).length, 0) /
             (B.lung * durataPasso(B)); };
    griglia(BRANI.roster); griglia(BRANI.campo);
    return { roster: conta('roster'), campo: conta('campo') };
  });
  chk(densita.campo > densita.roster * 1.5,
      'il tema del campo e\u0300 molto piu\u0300 fitto (' + densita.campo.toFixed(1) +
      ' note al secondo contro ' + densita.roster.toFixed(1) + ')');
  /* Il campo e\u0300 piu\u0300 intenso perche\u0301 e\u0300 piu\u0300 fitto, non perche\u0301 e\u0300 piu\u0300 forte: i due
     temi devono stare allo stesso livello, altrimenti passare dal roster al
     campo suona come un salto di volume. */
  const salto = Math.abs(c2.rms - c1.rms) / c1.rms;
  chk(salto < 0.25, 'i due temi stanno allo stesso livello, quindi cambiare schermata non ' +
      'fa un salto di volume (' + Math.round(salto * 100) + '% di differenza)');
  chk(c1.silenzio < 0.75, 'e non lascia buchi lunghi di silenzio (' +
      Math.round(c1.silenzio * 100) + '% di campioni quasi muti)');

  chk(rete.length === 0, 'nessun file scaricato: la musica è generata qui' +
      (rete.length ? ' (' + rete.join(' | ') + ')' : ''));
  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
