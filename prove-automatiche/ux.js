const { chromium, SERVITO } = require('./comune');
const ok=[],ko=[]; const chk=(c,m)=>(c?ok:ko).push(m);
const URL = SERVITO + 'gioca.html';

/* Il gesto e' cambiato: il tocco breve mette in squadra, la scheda si apre
   tenendo premuto. Le suite che vogliono la scheda tengono premuto davvero. */
async function premiLungo(p, sel, ms){
  const box = await p.locator(sel).first().boundingBox();
  await p.mouse.move(box.x + box.width/2, box.y + box.height/2);
  await p.mouse.down(); await p.waitForTimeout(ms || 700); await p.mouse.up();
  await p.waitForTimeout(250);
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1280,height:900} });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  await p.goto(URL); await p.waitForTimeout(200);
  await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForTimeout(250);
  await p.click('#btn-modego'); await p.waitForTimeout(150);
  await p.evaluate(() => guidaSpegni());

  // --- nel roster ci sono solo gli Insector che puoi usare ---
  const ros = await p.evaluate(() => ({
    carte: document.querySelectorAll('#roster .mon').length,
    lucchetti: document.querySelectorAll('#roster .mon.locked').length,
    sbloccati: UNITS.filter(unlocked).length,
    totale: UNITS.length,
    hint: document.querySelector('#roster-hint').innerText
  }));
  chk(ros.carte === ros.sbloccati && ros.lucchetti === 0,
      'il roster mostra solo i ' + ros.sbloccati + ' disponibili, nessun lucchetto');
  chk(ros.hint.includes(String(ros.sbloccati)) && ros.hint.includes(String(ros.totale - ros.sbloccati)),
      'ma dice quanti sono e quanti ne restano da sbloccare');
  const dopoRank = await p.evaluate(() => {
    const prima = document.querySelectorAll('#roster .mon').length;
    S.rankIdx = 4; drawRoster();
    const dopo = document.querySelectorAll('#roster .mon').length;
    S.rankIdx = 0; drawRoster();
    return { prima, dopo };
  });
  chk(dopoRank.dopo > dopoRank.prima,
      'avanzando nel torneo la lista cresce (' + dopoRank.prima + ' → ' + dopoRank.dopo + ')');

  // --- la scheda e' un pop-up, e porta con se' l'azione ---
  chk(await p.evaluate(() => !document.querySelector('#detail')),
      'la colonna della scheda non c’è più: era quella che costringeva a scorrere');
  await premiLungo(p, '#roster .mon');
  const sch = await p.evaluate(() => {
    const d = document.querySelector('.modalbox.scheda');
    return {
      aperto: !document.querySelector('#uni-box').hidden,
      ruolo: d.getAttribute('role'), modale: d.getAttribute('aria-modal'),
      etichetta: d.getAttribute('aria-labelledby'),
      nome: (document.querySelector('#uni-nome') || {}).textContent,
      statistiche: /VITA/.test(d.innerText) && /FORZA/.test(d.innerText) && /DIFESA/.test(d.innerText),
      aggiunge: !!document.querySelector('#btn-metto'),
      fuocoDentro: !!document.activeElement.closest('#uni-box')
    };
  });
  chk(sch.aperto && sch.nome, 'toccando un Insector si apre la sua scheda: ' + sch.nome);
  chk(sch.statistiche, 'con dentro le caratteristiche');
  chk(sch.aggiunge, 'e il pulsante per metterlo in squadra');
  chk(sch.ruolo === 'dialog' && sch.modale === 'true' && sch.etichetta === 'uni-nome',
      'è un dialogo vero, annunciato col nome dell’Insector');
  chk(sch.fuocoDentro, 'e il fuoco ci entra dentro');

  await p.click('#btn-metto'); await p.waitForTimeout(250);
  const dopoAgg = await p.evaluate(() => ({
    chiusa: document.querySelector('#uni-box').hidden,
    squadra: S.team.length,
    conta: document.querySelector('#team-count').textContent,
    fuoco: document.activeElement.closest('#roster') ? 'roster' : document.activeElement.tagName
  }));
  chk(dopoAgg.chiusa && dopoAgg.squadra === 1,
      'scelto, il pop-up si chiude e la pedina è in squadra (' + dopoAgg.conta + ')');
  chk(dopoAgg.fuoco === 'roster', 'e il fuoco torna sulla carta da cui eri partito');

  // --- si chiude in tutti i modi che uno si aspetta ---
  for (const [come, azione] of [
    ['Esc', async () => { await p.keyboard.press('Escape'); }],
    ['il pulsante tondo', async () => { await p.click('#btn-uni-x'); }],
    ['toccando fuori', async () => { await p.mouse.click(30, 30); }],
    ['cambiando schermata', async () => { await p.evaluate(() => show('s-team')); }]
  ]){
    await premiLungo(p, '#roster .mon', 650);
    await azione(); await p.waitForTimeout(200);
    chk(await p.evaluate(() => document.querySelector('#uni-box').hidden),
        'la scheda si chiude con ' + come);
  }

  // --- riepilogo: schede compatte, prosa solo a richiesta ---
  await p.evaluate(() => { $('#btn-auto').click(); });
  await p.waitForTimeout(200);
  await p.click('#btn-start'); await p.waitForTimeout(300);
  const bri = await p.evaluate(() => ({
    schede: document.querySelectorAll('.bcard').length,
    prosa: document.querySelectorAll('.bcard .sp').length,
    tondi: document.querySelectorAll('.bcard .info').length,
    numeri: document.querySelectorAll('.bcard .num').length,
    nomina: document.querySelectorAll('.bcard .scegli').length,
    etichetta: document.querySelector('.bcard .info').getAttribute('aria-label')
  }));
  chk(bri.schede === 5 && bri.numeri === 5, 'il riepilogo ha cinque schede con le caratteristiche');
  chk(bri.prosa === 0, 'e nessuna descrizione a parole: quella sta nel pop-up');
  chk(bri.tondi === 5 && /Scheda di /.test(bri.etichetta),
      'ogni scheda ha il suo tondo info, con un nome parlato');

  const rePrima = await p.evaluate(() => S.kingId);
  await p.click('.bcard .info'); await p.waitForTimeout(250);
  const daInfo = await p.evaluate(rePrima => ({
    rePrima,
    aperto: !document.querySelector('#uni-box').hidden,
    prosa: document.querySelector('#uni-corpo .desc').innerText.length > 20,
    re: S.kingId
  }), rePrima);
  chk(daInfo.aperto && daInfo.prosa, 'il tondo apre la scheda intera, descrizione compresa');
  chk(daInfo.re === daInfo.rePrima, 'e aprirla non cambia il Re: il tondo informa, non sceglie');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  await p.click('.bcard'); await p.waitForTimeout(200);
  chk(await p.evaluate(() => !!S.kingId), 'toccando la scheda invece si nomina il Re');

  // --- una schermata sola, su schermo largo e su telefono ---
  for (const [nome, w, h] of [['schermo largo',1280,900], ['telefono',412,915], ['telefono piccolo',360,740]]){
    await p.setViewportSize({ width:w, height:h }); await p.waitForTimeout(250);
    await p.evaluate(() => show('s-team')); await p.waitForTimeout(250);
    const squadra = await p.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1);
    await p.evaluate(() => show('s-brief')); await p.waitForTimeout(250);
    const riepilogo = await p.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1);
    const mis = { squadra, riepilogo };
    chk(mis.squadra, 'la schermata della squadra sta in una finestra (' + nome + ')');
    chk(mis.riepilogo, 'e anche il riepilogo (' + nome + ')');
  }

  // --- la striscia della squadra, sul telefono, e' orizzontale ---
  await p.setViewportSize({ width:360, height:740 }); await p.waitForTimeout(250);
  await p.evaluate(() => { show('s-team'); drawSlots(); }); await p.waitForTimeout(300);
  const str = await p.evaluate(() => {
    const el = document.querySelector('#slots');
    const chip = [...el.querySelectorAll('.slot.full')];
    return {
      riga: getComputedStyle(el).flexDirection === 'row',
      scorre: getComputedStyle(el).overflowX === 'auto',
      alta: Math.round(el.getBoundingClientRect().height),
      pedine: chip.length,
      tolgo: chip.every(c => !!c.querySelector('.kbtn')),
      dentro: chip.every(c => c.getBoundingClientRect().top >= el.getBoundingClientRect().top - 1 &&
                              c.getBoundingClientRect().bottom <= el.getBoundingClientRect().bottom + 1)
    };
  });
  chk(str.riga && str.scorre, 'sul telefono le cinque scelte sono una striscia che scorre di lato');
  chk(str.pedine === 5 && str.dentro, 'con tutte e cinque le pedine dentro la striscia, in riga');
  chk(str.alta < 140, 'alta ' + str.alta + ' px invece delle cinque righe in colonna');
  chk(str.tolgo, 'e ognuna si toglie dal suo pulsante');
  const hint = await p.evaluate(() => document.querySelector('#roster-hint').innerText);
  chk(/toccane uno/i.test(hint), 'la riga sotto al roster dice anche come si apre la scheda');
  chk(await p.evaluate(() => getComputedStyle(document.querySelector('#squadra-hint')).display === 'none'),
      'e quella del riquadro squadra non la ripete');

  // --- sotto i 640 px di altezza la pagina torna a scorrere, ma non taglia ---
  await p.setViewportSize({ width:740, height:360 }); await p.waitForTimeout(300);
  await p.evaluate(() => show('s-team')); await p.waitForTimeout(250);
  const basso = await p.evaluate(() => {
    const w = document.querySelector('.wrap');
    return { altezza: getComputedStyle(w).height, scorre: document.documentElement.scrollHeight > innerHeight,
             tagliato: w.scrollHeight > Math.ceil(w.getBoundingClientRect().height) + 1 };
  });
  chk(basso.scorre && !basso.tagliato,
      'di traverso la pagina scorre invece di nascondere qualcosa');
  for (const id of ['#btn-auto','#btn-clear','#btn-start']) {
    await p.evaluate(s => document.querySelector(s).scrollIntoView(), id);
    chk(await p.isVisible(id), 'e ' + id + ' resta raggiungibile');
  }

  // --- il menu resta dentro la finestra a ogni larghezza ---
  //     (la testata va a capo: il pulsante Menu finisce ora a destra ora a sinistra)
  const fuori = [];
  for (const w of [320,360,390,412,430,450,500,600,760,900,1280]){
    await p.setViewportSize({ width:w, height:900 }); await p.waitForTimeout(220);
    await p.evaluate(() => { if (document.querySelector('#menu-box').hidden) document.querySelector('#btn-menu').click(); });
    await p.waitForTimeout(180);
    const r = await p.evaluate(() => { const q = document.querySelector('#menu-box').getBoundingClientRect();
      return { l:Math.round(q.left), r:Math.round(q.right), w:Math.round(q.width), vw:innerWidth }; });
    if (r.l < 0 || r.r > r.vw) fuori.push(w + 'px: ' + r.l + '..' + r.r);
    if (r.w < 150) fuori.push(w + 'px: pannello largo solo ' + r.w);
  }
  chk(fuori.length === 0, 'il menu sta dentro la finestra a ogni larghezza' + (fuori.length ? ': ' + fuori.join(', ') : ''));
  await p.evaluate(() => document.querySelector('#btn-menu').click()); await p.waitForTimeout(150);

  // --- «Scegli la squadra» non si va a cercare scorrendo ---
  for (const [nome,w,h] of [['schermo largo',1280,900], ['telefono',412,915], ['telefono piccolo',360,740]]){
    await p.setViewportSize({ width:w, height:h }); await p.waitForTimeout(250);
    await p.evaluate(() => openModes(false)); await p.waitForTimeout(300);
    const m = await p.evaluate(() => {
      const b = document.querySelector('#btn-modego').getBoundingClientRect();
      const sc = document.querySelector('#mode-scroll');
      return { pagina: document.documentElement.scrollHeight <= innerHeight + 1,
               visibile: b.top >= 0 && b.bottom <= innerHeight + 1,
               scorre: sc.scrollHeight - sc.clientHeight > 2,
               sfuma: document.querySelector('#s-mode .card').classList.contains('giu') };
    });
    chk(m.pagina, 'la scelta della partita sta in una finestra (' + nome + ')');
    chk(m.visibile, 'e «Scegli la squadra» si vede senza scorrere (' + nome + ')');
    chk(!m.scorre || m.sfuma, 'se sotto c\'e\' altro, l\'ultima riga sfuma (' + nome + ')');
  }
  // e in fondo all'elenco la sfumatura sparisce
  await p.evaluate(() => { const sc = document.querySelector('#mode-scroll'); sc.scrollTop = sc.scrollHeight; sc.dispatchEvent(new Event('scroll')); });
  await p.waitForTimeout(220);
  chk(!(await p.evaluate(() => document.querySelector('#s-mode .card').classList.contains('giu'))),
      'arrivati in fondo la sfumatura sparisce');
  chk(await p.isVisible('#sfidabox'), 'e la sfida del giorno resta raggiungibile');

  // --- e dove la pagina scorre comunque, il passo avanti resta appoggiato in basso ---
  for (const [nome,w,h] of [['schermo basso',320,568], ['di traverso',740,360]]){
    await p.setViewportSize({ width:w, height:h }); await p.waitForTimeout(280);
    await p.evaluate(() => openModes(false)); await p.waitForTimeout(300);
    const m = await p.evaluate(() => {
      const b = document.querySelector('#btn-modego').getBoundingClientRect();
      return { scorre: document.documentElement.scrollHeight > innerHeight,
               visibile: b.top >= 0 && b.bottom <= innerHeight + 1 };
    });
    chk(m.scorre && m.visibile,
        'la pagina scorre ma «Scegli la squadra» resta a vista (' + nome + ')');
  }

  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
