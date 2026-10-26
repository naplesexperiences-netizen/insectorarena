const { chromium, GIOCA } = require('./comune');
/* La fase di spiegazione di allevamento e cattura: nuvolette ancorate, con
   avanti/indietro e chiusura. Si verifica che indichino davvero il pezzo di
   cui parlano, che restino dentro la finestra e che non tornino da sole. */
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1280,height:900} });
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  p.on('console', m=>{ if(m.type()==='error') errs.push(m.text()); });
  const ok=[], ko=[];
  const chk=(c,n)=>{ (c?ok:ko).push(n); };
  const URL = GIOCA;
  await p.goto(URL); await p.waitForTimeout(300);
  if (await p.$('#s-mode.on')) await p.click('#btn-modego');
  await p.waitForTimeout(350);

  // ---------- A. l'allevamento si spiega da solo la prima volta
  await p.evaluate(() => apriGabbie()); await p.waitForTimeout(500);
  chk(await p.isVisible('#nuvola'), 'entrando nelle Gabbie la nuvoletta si apre da sola');
  chk(await p.isVisible('#faro'), 'e il faro cerchia il pezzo di cui parla');
  const tit = await p.innerText('#nuvola-tit');
  chk(/Allevamento/i.test(tit), 'la nuvoletta dice di che giro fa parte', tit);

  const quanti = await p.evaluate(() => passiVivi('zoo').length);
  chk(quanti >= 4, 'il giro dell\'allevamento ha i suoi passi (' + quanti + ')');
  chk((await p.innerText('#nuvola-n')).trim() === '1 di ' + quanti, 'il contatore parte da 1');

  // ---------- B. il selettore avanti/indietro
  chk(await p.isDisabled('#btn-nuv-prec'), 'al primo passo «indietro» e spento');
  chk(!(await p.isDisabled('#btn-nuv-succ')), 'e «avanti» e acceso');
  const t1 = await p.innerText('#nuvola-testo');
  await p.click('#btn-nuv-succ'); await p.waitForTimeout(250);
  chk((await p.innerText('#nuvola-n')).trim() === '2 di ' + quanti, '«avanti» porta al secondo');
  chk((await p.innerText('#nuvola-testo')) !== t1, 'e il testo cambia');
  chk(!(await p.isDisabled('#btn-nuv-prec')), 'adesso «indietro» e acceso');
  await p.click('#btn-nuv-prec'); await p.waitForTimeout(250);
  chk((await p.innerText('#nuvola-n')).trim() === '1 di ' + quanti, '«indietro» riporta al primo');
  chk((await p.innerText('#nuvola-testo')) === t1, 'col testo di prima');

  // fino in fondo
  for (let i = 1; i < quanti; i++){ await p.click('#btn-nuv-succ'); await p.waitForTimeout(160); }
  chk((await p.innerText('#nuvola-n')).trim() === quanti + ' di ' + quanti, 'si arriva all\'ultimo');
  chk(await p.isDisabled('#btn-nuv-succ'), 'e li «avanti» si spegne');

  // ---------- C. la nuvoletta indica davvero il suo pezzo
  /* Il faro ha una transizione: va misurato a animazione finita, quindi un
     passo per volta con l'attesa in mezzo, non tutti dentro un evaluate solo. */
  const vicinanza = [];
  for (let i = 0; i < quanti; i++){
    await p.evaluate(k => { passoIdx = k; disegnaNuvola(); }, i);
    await p.waitForTimeout(260);
    vicinanza.push(await p.evaluate(k => {
      const t = bersaglio(passiVivi('zoo')[k]).getBoundingClientRect();
      const n = document.querySelector('#nuvola').getBoundingClientRect();
      const f = document.querySelector('#faro').getBoundingClientRect();
      const dx = Math.max(0, Math.max(t.left - n.right, n.left - t.right));
      const dy = Math.max(0, Math.max(t.top - n.bottom, n.top - t.bottom));
      return { i: k, distanza: Math.round(Math.hypot(dx, dy)),
        scartoFaro: Math.round(Math.max(Math.abs(f.left + 4 - t.left), Math.abs(f.top + 4 - t.top))),
        dentro: n.left >= -1 && n.top >= -1 && n.right <= innerWidth + 1 && n.bottom <= innerHeight + 1,
        sovrappone: !(n.right < t.left || n.left > t.right || n.bottom < t.top || n.top > t.bottom) };
    }, i));
  }
  const lontane = vicinanza.filter(v => v.distanza > 26);
  chk(lontane.length === 0, 'ogni nuvoletta sta attaccata al suo pezzo (max 26 px)' +
      (lontane.length ? ': ' + JSON.stringify(lontane) : ''));
  const scarti = vicinanza.map(v => v.scartoFaro);
  chk(scarti.every(d => d <= 1), 'e il faro cade sul bersaglio al pixel (scarto max ' +
      Math.max(...scarti) + ' px)');
  chk(vicinanza.every(v => v.dentro), 'nessuna nuvoletta esce dalla finestra');
  chk(vicinanza.every(v => !v.sovrappone), 'e nessuna copre quello che sta spiegando');

  // ---------- D. chiusura, e non torna da sola
  await p.click('#btn-nuv-chiudi'); await p.waitForTimeout(250);
  chk(!(await p.isVisible('#nuvola')), 'la × chiude la nuvoletta');
  chk(!(await p.isVisible('#faro')), 'e si spegne anche il faro');
  await p.evaluate(() => { show('s-team'); apriGabbie(); }); await p.waitForTimeout(500);
  chk(!(await p.isVisible('#nuvola')), 'rientrando non si riapre da sola: si era gia vista');
  chk(await p.evaluate(() => JSON.parse(localStorage.getItem('insectron-spiega')).zoo === true),
      'e la cosa resta memorizzata nel browser');

  // ---------- E. il punto interrogativo la riapre sempre
  chk(await p.isVisible('#btn-aiuto-zoo'), 'accanto al titolo c\'e il punto interrogativo');
  await p.click('#btn-aiuto-zoo'); await p.waitForTimeout(400);
  chk(await p.isVisible('#nuvola'), 'e riapre la spiegazione quando si vuole');
  chk((await p.innerText('#nuvola-n')).trim() === '1 di ' + quanti, 'ripartendo dal primo passo');

  // ---------- F. tastiera
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(200);
  chk((await p.innerText('#nuvola-n')).trim() === '2 di ' + quanti, 'la freccia destra va avanti');
  await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(200);
  chk((await p.innerText('#nuvola-n')).trim() === '1 di ' + quanti, 'la freccia sinistra torna indietro');
  await p.keyboard.press('Escape'); await p.waitForTimeout(250);
  chk(!(await p.isVisible('#nuvola')), 'Esc la chiude');

  // ---------- G. cambiando schermata sparisce
  await p.click('#btn-aiuto-zoo'); await p.waitForTimeout(350);
  await p.evaluate(() => show('s-team')); await p.waitForTimeout(250);
  chk(!(await p.isVisible('#nuvola')), 'cambiando schermata la nuvoletta sparisce');

  // ---------- H. lo stesso giro per la cattura
  await p.evaluate(() => apriMondo()); await p.waitForTimeout(600);
  chk(await p.isVisible('#nuvola'), 'entrando nel Mondo si apre il giro della cattura');
  chk(/Cattura/i.test(await p.innerText('#nuvola-tit')), 'col suo titolo');
  const qm = await p.evaluate(() => passiVivi('mondo').length);
  chk(qm >= 5, 'il giro della cattura ha i suoi passi (' + qm + ')');
  const vm = [];
  for (let i = 0; i < qm; i++){
    await p.evaluate(k => { passoIdx = k; disegnaNuvola(); }, i);
    await p.waitForTimeout(260);
    vm.push(await p.evaluate(k => {
      const t = bersaglio(passiVivi('mondo')[k]).getBoundingClientRect();
      const n = document.querySelector('#nuvola').getBoundingClientRect();
      const f = document.querySelector('#faro').getBoundingClientRect();
      const dx = Math.max(0, Math.max(t.left - n.right, n.left - t.right));
      const dy = Math.max(0, Math.max(t.top - n.bottom, n.top - t.bottom));
      return { i: k, distanza: Math.round(Math.hypot(dx, dy)),
        scartoFaro: Math.round(Math.max(Math.abs(f.left + 4 - t.left), Math.abs(f.top + 4 - t.top))),
        dentro: n.left >= -1 && n.top >= -1 && n.right <= innerWidth + 1 && n.bottom <= innerHeight + 1 };
    }, i));
  }
  chk(vm.every(v => v.distanza <= 26), 'anche qui ogni nuvoletta sta attaccata al suo pezzo' +
      ': ' + vm.map(v=>v.distanza).join(', ') + ' px');
  chk(vm.every(v => v.dentro), 'e nessuna esce dalla finestra');
  chk(vm.every(v => v.scartoFaro <= 1), 'col faro sul bersaglio al pixel');
  await p.click('#btn-nuv-chiudi'); await p.waitForTimeout(200);

  // ---------- I. sul telefono
  await p.setViewportSize({ width:360, height:740 }); await p.waitForTimeout(300);
  await p.click('#btn-aiuto-mondo'); await p.waitForTimeout(450);
  const tel = [];
  for (let i = 0; i < qm; i++){
    await p.evaluate(k => { passoIdx = k; disegnaNuvola(); }, i);
    await p.waitForTimeout(220);
    tel.push(await p.evaluate(() => {
      const n = document.querySelector('#nuvola').getBoundingClientRect();
      return { dentro: n.left >= -1 && n.top >= -1 && n.right <= innerWidth + 1 && n.bottom <= innerHeight + 1,
               largh: Math.round(n.width) };
    }));
  }
  chk(tel.every(v => v.dentro), 'sul telefono resta tutta dentro lo schermo' +
      (tel.every(v=>v.dentro) ? '' : ': ' + JSON.stringify(tel)));
  chk(tel.every(v => v.largh <= 340), 'e non e piu larga dello schermo (' + tel[0].largh + ' px)');
  const bers = await p.evaluate(() => ['#btn-nuv-prec','#btn-nuv-succ','#btn-nuv-chiudi']
    .map(s => Math.round(document.querySelector(s).getBoundingClientRect().height)));
  chk(bers.every(h => h >= 44), 'i tre comandi restano bersagli da 44 px (' + bers.join(', ') + ')');

  // ---------- L. nella demo non esistono
  await p.setViewportSize({ width:1280, height:900 });
  await p.evaluate(() => { localStorage.removeItem('insectron-spiega'); });
  await p.goto(URL); await p.waitForTimeout(300);
  await p.evaluate(() => { EDIZIONE = 'demo'; });
  const inDemo = await p.evaluate(() => apriSpiega('zoo', true));
  chk(inDemo === false, 'nella demo, dove gabbie e mondo non esistono, non si apre');

  // ---------- M. il caso vero del primo ingresso: gabbie vuote, dispensa vuota
  await p.evaluate(() => { localStorage.removeItem('insectron-spiega'); });
  await p.goto(URL); await p.waitForTimeout(300);
  if (await p.$('#s-mode.on')) await p.click('#btn-modego');
  await p.waitForTimeout(300);
  await p.evaluate(() => { S.zoo = []; S.dispensa = {}; apriGabbie(); });
  await p.waitForTimeout(600);
  chk(await p.isVisible('#nuvola'), 'a gabbie e dispensa vuote la spiegazione si apre lo stesso');
  const vuoti = await p.evaluate(() => passiVivi('zoo').length);
  chk(vuoti >= 2 && vuoti <= 5, 'coi passi che hanno ancora un bersaglio (' + vuoti + ' di 5)');
  chk((await p.innerText('#nuvola-n')).trim() === '1 di ' + vuoti,
      'e il contatore dice quelli veri, non cinque');
  const vv = [];
  for (let i = 0; i < vuoti; i++){
    await p.evaluate(k => { passoIdx = k; disegnaNuvola(); }, i);
    await p.waitForTimeout(240);
    vv.push(await p.evaluate(k => {
      const t = bersaglio(passiVivi('zoo')[k]).getBoundingClientRect();
      const n = document.querySelector('#nuvola').getBoundingClientRect();
      const dx = Math.max(0, Math.max(t.left - n.right, n.left - t.right));
      const dy = Math.max(0, Math.max(t.top - n.bottom, n.top - t.bottom));
      return { d: Math.round(Math.hypot(dx, dy)), vuoto: t.width < 2 || t.height < 2 };
    }, i));
  }
  chk(vv.every(v => !v.vuoto), 'nessun passo indica un pezzo di schermo vuoto');
  chk(vv.every(v => v.d <= 26), 'e tutte restano attaccate al loro pezzo (' + vv.map(v=>v.d).join(', ') + ' px)');
  await p.click('#btn-nuv-chiudi'); await p.waitForTimeout(200);

  // ---------- N. la nuvoletta non si mangia i clic di quello che copre
  await p.evaluate(() => {
    localStorage.removeItem('insectron-spiega');
    S.zoo = []; ["mantis","hercules_beetle"].forEach(id => S.zoo.push(nuovoEsemplare(id)));
    S.dispensa = { "Mangime":3, "Lapislazzuli":2, "Pietrafuoco":1, "Ambrosia":1, "Diamante":1 };
    S.nutri = S.zoo[0].u; apriGabbie();
  });
  await p.waitForTimeout(400);
  await p.evaluate(() => apriSpiega('zoo', true));
  await p.waitForTimeout(400);
  chk(await p.isVisible('#nuvola'), 'con le gabbie piene la spiegazione si apre');
  /* Si cerca un pulsante che finisca davvero sotto alla nuvoletta: se ce n'e'
     uno, deve restare cliccabile lo stesso. */
  const coperto = await p.evaluate(() => {
    const n = document.querySelector('#nuvola').getBoundingClientRect();
    for (const b of document.querySelectorAll('#dispensa .cibo, #gabbie .gab')){
      const r = b.getBoundingClientRect();
      const sx = Math.min(n.right, r.right) - Math.max(n.left, r.left);
      const sy = Math.min(n.bottom, r.bottom) - Math.max(n.top, r.top);
      if (sx > 8 && sy > 8){
        const cx = Math.max(n.left, r.left) + sx/2, cy = Math.max(n.top, r.top) + sy/2;
        const sopra = document.elementFromPoint(cx, cy);
        return { trovato: true, nome: b.className,
                 passa: b === sopra || b.contains(sopra) };
      }
    }
    return { trovato: false };
  });
  chk(!coperto.trovato || coperto.passa,
      coperto.trovato ? 'un pulsante coperto dalla nuvoletta resta cliccabile'
                      : 'nessun pulsante finisce sotto alla nuvoletta, qui');
  const comandi = await p.evaluate(() => {
    const b = document.querySelector('#btn-nuv-succ').getBoundingClientRect();
    const sopra = document.elementFromPoint(b.left + b.width/2, b.top + b.height/2);
    return !!sopra && sopra.closest('#btn-nuv-succ') !== null;
  });
  chk(comandi, 'ma i suoi comandi intercettano il clic, quelli si');
  await p.click('#btn-nuv-chiudi'); await p.waitForTimeout(200);

  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
