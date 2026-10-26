const { chromium, SERVITO } = require('./comune');
const ok=[],ko=[]; const chk=(c,m)=>(c?ok:ko).push(m);
const URL = SERVITO + 'gioca.html';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1280,height:1100} });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  p.on('dialog', d => d.accept());
  await p.goto(URL); await p.waitForTimeout(250);
  await p.click('#btn-modego'); await p.waitForTimeout(120);

  // --- il mondo esiste dal primo avvio ---
  const m0 = await p.evaluate(() => ({ seme:S.mondo.seme, tr:S.mondo.trappole[1], poste:S.mondo.poste.length }));
  chk(/^[A-HJ-NP-Z2-9]{6}$/.test(m0.seme), 'una partita nuova nasce con un mondo: ' + m0.seme);
  chk(m0.tr === 1 && m0.poste === 0, 'e con una Trappola I in dotazione, nessuna posata');

  await p.click('#btn-menu'); await p.waitForTimeout(150);
  await p.click('#btn-mondo'); await p.waitForTimeout(200);
  chk(await p.isVisible('#s-mondo'), 'dal menu, Mondo apre la schermata');
  chk((await p.innerText('#mondo-seme')) === m0.seme, 'la schermata mostra il seme del mondo');
  chk((await p.evaluate(() => document.querySelectorAll('#luoghi .luogo').length)) === 5,
      'ci sono cinque luoghi');

  // --- stesso seme, stesso mondo ---
  const due = await p.evaluate(() => {
    const a = JSON.stringify(luoghiDi('K7F2QA').map(l => [l.id, l.fam, l.fortuna]));
    MONDO_CACHE = { seme:null, luoghi:null };
    const b = JSON.stringify(luoghiDi('K7F2QA').map(l => [l.id, l.fam, l.fortuna]));
    const c = JSON.stringify(luoghiDi('ZZZ999').map(l => [l.id, l.fam, l.fortuna]));
    return { uguali: a === b, diversi: a !== c };
  });
  chk(due.uguali, 'lo stesso seme ricostruisce lo stesso mondo');
  chk(due.diversi, 'semi diversi danno mondi diversi');

  // --- gli abitanti di un luogo sono quelli del suo habitat ---
  const abitanti = await p.evaluate(() => luoghi().every(l => {
    const h = HABITAT.find(x => x.id === l.id);
    return l.fam.length >= 3 && l.fam.every(f => h.fam.indexOf(f) >= 0);
  }));
  chk(abitanti, 'ogni luogo è popolato solo dalle famiglie del suo habitat');

  // --- la probabilita dichiarata e quella applicata ---
  await p.evaluate(() => { S.mondo.seme = 'K7F2QA'; MONDO_CACHE = { seme:null, luoghi:null };
                           S.rankIdx = 5; S.luogo = 'frutteto'; S.trapSel = 1;
                           S.dispensa = { 'Frutto del Vesuvio': 3 }; S.escaSel = 'Frutto del Vesuvio';
                           S.mondo.trappole = { 1:1, 2:0, 3:0 }; drawMondo(); });
  await p.waitForTimeout(150);
  const prob = await p.evaluate(() => {
    const l = luogoDi('frutteto');
    const dichiarata = Math.round(stimaCattura(l, 1, 'Frutto del Vesuvio') * 100);
    const scritta = parseInt(document.querySelector('#spedizione .grande').textContent, 10);
    return { dichiarata, scritta, esatta: stimaCattura(l, 1, 'Frutto del Vesuvio') };
  });
  chk(prob.dichiarata === prob.scritta, 'la scheda scrive la probabilità vera (' + prob.scritta + '%)');
  const misura = await p.evaluate(pAttesa => {
    let presi = 0;
    for (let i = 0; i < 10000; i++){
      const r = rngDa((semeNum('K7F2QA') ^ Math.imul(i + 1, 2654435761)) >>> 0)();
      if (r <= pAttesa) presi++;
    }
    return presi / 10000;
  }, prob.esatta);
  chk(Math.abs(misura - prob.esatta) < 0.02,
      'e su 10.000 estrazioni esce davvero quella (' + Math.round(misura*100) + '% contro ' + Math.round(prob.esatta*100) + '%)');

  const senza = await p.evaluate(() => { S.dispensa = {}; S.escaSel = null; drawMondo();
    return document.querySelector('#spedizione .grande').textContent; });
  chk(senza === '\u2014', 'senza esca non dichiara nessuna percentuale, mette una lineetta');
  await p.evaluate(() => { S.dispensa = { 'Frutto del Vesuvio': 3 }; S.escaSel = 'Frutto del Vesuvio'; drawMondo(); });

  // --- l'esca giusta conta, e si vede ---
  const esche = await p.evaluate(() => {
    const l = luogoDi('frutteto');
    return { giusta: stimaCattura(l, 1, 'Frutto del Vesuvio'), sbagliata: stimaCattura(l, 1, 'Pietrafuoco'),
             segnata: escaGiusta(l, 'Frutto del Vesuvio'), no: escaGiusta(l, 'Pietrafuoco') };
  });
  chk(esche.giusta > esche.sbagliata, 'l’esca giusta rende di più di quella sbagliata');
  chk(esche.segnata && !esche.no, 'e il gioco sa distinguerle');

  // --- la trappola limita il rango, e il torneo pure ---
  const tetti = await p.evaluate(() => {
    S.rankIdx = 0; const basso = tettoCattura(3);
    S.rankIdx = 5; const alto = tettoCattura(3), piccola = tettoCattura(1);
    return { basso, alto, piccola };
  });
  chk(tetti.basso === 1, 'al Rank E non si cattura oltre il rango che il torneo ha aperto');
  chk(tetti.alto === 6 && tetti.piccola === 2, 'al Rank S la Trappola III arriva al rango 6, la I si ferma al 2');

  // --- posare una trappola costa esca e trappola ---
  await p.evaluate(() => { S.rankIdx = 5; S.giocate = 0; S.dispensa = { 'Frutto del Vesuvio': 2 };
                           S.mondo.trappole = { 1:1, 2:0, 3:0 }; S.mondo.poste = [];
                           S.luogo = 'frutteto'; S.trapSel = 1; S.escaSel = 'Frutto del Vesuvio'; drawMondo(); });
  await p.waitForTimeout(150);
  await p.click('#btn-posa'); await p.waitForTimeout(200);
  const dopo = await p.evaluate(() => ({ poste:S.mondo.poste.length, esca:S.dispensa['Frutto del Vesuvio']|0,
                                         tr:S.mondo.trappole[1], quando:S.mondo.poste[0].quando }));
  chk(dopo.poste === 1, 'la trappola viene posata');
  chk(dopo.esca === 1 && dopo.tr === 0, 'e costa un’esca e la trappola');
  chk(dopo.quando === 2, 'si raccoglie dopo due partite di torneo');
  chk((await p.innerText('#poste')).includes('fra 2 partite'), 'e la schermata dice quante ne mancano');

  // --- non si raccoglie prima del tempo ---
  const presto = await p.evaluate(() => {
    const n = S.mondo.poste[0].n; raccogli(n);
    return { ancora: S.mondo.poste.length, zoo: S.zoo.length,
             bloccato: document.querySelector('#poste .posta').disabled };
  });
  chk(presto.ancora === 1 && presto.zoo === 0, 'forzando la raccolta prima del tempo non succede niente');
  chk(presto.bloccato, 'e il pulsante è disattivato');

  // --- raccolta: o un esemplare, o la trappola che torna ---
  const raccolto = await p.evaluate(() => {
    S.giocate = 5; drawMondo();
    const n = S.mondo.poste[0].n, prima = S.mondo.trappole[1];
    raccogli(n);
    return { poste:S.mondo.poste.length, zoo:S.zoo.length, tr:S.mondo.trappole[1], prima,
             testo: document.querySelector('#mondo-esito').textContent };
  });
  chk(raccolto.poste === 0, 'a tempo scaduto la trappola si raccoglie');
  chk(raccolto.zoo === 1 ? raccolto.tr === raccolto.prima
                         : raccolto.tr === raccolto.prima + 1,
      raccolto.zoo === 1 ? 'ha preso un esemplare' : 'è tornata vuota, ma la trappola torna nel magazzino');

  // --- l'esemplare catturato e una larva selvatica ---
  const preso = await p.evaluate(() => {
    S.zoo = []; ZOO_SEQ = 0;
    const p2 = { n:99, h:'frutteto', t:3, esca:'Frutto del Vesuvio', quando:0 };
    S.mondo.poste = [p2]; S.giocate = 99; drawMondo();
    let e = null, giri = 0;
    while (!e && giri < 40){                       /* alcuni semi non prendono: si insiste */
      S.mondo.poste = [{ n:giri, h:'frutteto', t:3, esca:'Frutto del Vesuvio', quando:0 }];
      raccogli(giri); e = S.zoo[0]; giri++;
    }
    if (!e) return null;
    const u = byId[e.id];
    return { sel:e.sel, speso:e.speso, id:e.id, hp:u.hp, bhp:e.b.hp, bstr:e.b.str,
             fam:u.fam, rank:u.rank,
             diCasa: HABITAT.find(h => h.id === 'frutteto').fam.indexOf(u.fam) >= 0 };
  });
  chk(preso && preso.sel === true && preso.speso === 0, 'chi si cattura arriva come larva selvatica');
  chk(preso && preso.bhp <= Math.ceil(preso.hp * 0.10) && preso.bhp >= 0,
      'con un bonus di nascita entro il 10% (+' + (preso ? preso.bhp : '?') + ' su ' + (preso ? preso.hp : '?') + ')');
  chk(preso && preso.diCasa,
      'e appartiene a una famiglia che vive dove l’hai preso (' + (preso ? preso.fam : '?') + ')');

  // --- la scheda lo dichiara catturato ---
  await p.evaluate(() => { apriUnita('@' + S.zoo[0].u); });
  await p.waitForTimeout(120);
  chk((await p.innerText('#uni-corpo')).includes('catturato'), 'la scheda del roster dice che è catturato');

  // --- tre in regalo, poi si cattura ---
  const regalo = await p.evaluate(() => {
    S.zoo = []; ZOO_SEQ = 0; S.gratis = 0;
    const id = UNITS.filter(unlocked)[0].id;
    apriUnita(id);
    const primo = !!document.querySelector('#btn-alleva');
    S.gratis = ALLEVA_GRATIS; apriUnita(id);
    return { primo, dopo: !!document.querySelector('#btn-alleva'),
             mondo: !!document.querySelector('#btn-vaimondo'),
             testo: document.querySelector('#uni-corpo').textContent };
  });
  chk(regalo.primo && !regalo.dopo, 'i primi tre esemplari sono in regalo, il quarto no');
  chk(regalo.mondo && /catturano/.test(regalo.testo), 'e la scheda manda a catturarlo nel Mondo');

  // --- cambiare mondo ---
  const cambio = await p.evaluate(() => {
    S.mondo.trappole = { 1:0, 2:0, 3:0 };
    S.mondo.poste = [{ n:1, h:'cava', t:2, esca:'Rubino', quando:99 }];
    S.mondo.seme = 'AAAA22';
    const male = cambiaMondo('abc');
    const bene = cambiaMondo('k7f2qa');
    return { male: male.ok, benOk: bene.ok, seme: S.mondo.seme,
             poste: S.mondo.poste.length, resa: S.mondo.trappole[2] };
  });
  chk(!cambio.male, 'un seme storto viene rifiutato');
  chk(cambio.benOk && cambio.seme === 'K7F2QA', 'un seme valido cambia mondo (anche scritto minuscolo)');
  chk(cambio.poste === 0 && cambio.resa === 1, 'e le trappole posate tornano nel magazzino invece di sparire');

  // --- premi del torneo: anche una trappola ---
  const premio = await p.evaluate(() => {
    S.mondo.trappole = { 1:0, 2:0, 3:0 };
    S.rankIdx = 0; const a = premiaConTrappola();
    S.rankIdx = 5; const b = premiaConTrappola();
    return { a, b, uno:S.mondo.trappole[1], tre:S.mondo.trappole[3] };
  });
  chk(premio.uno === 1 && premio.tre === 1, 'conquistare un rank porta una trappola');
  chk(premio.a === 'Trappola I' && premio.b === 'Trappola III', 'e più sali, più è capiente');

  // --- salvataggio ---
  const salva = await p.evaluate(() => {
    const d = datiSalvataggio();
    const rientro = migra(JSON.parse(JSON.stringify(d)));
    return { sv:d.sv, atteso:SCHEMA, seme:d.m.seme, rientroSeme: rientro.m.seme, g:rientro.g, gi:rientro.gi };
  });
  chk(salva.sv === salva.atteso, 'il salvataggio porta il numero di schema corrente (' + salva.sv + ')');
  chk(salva.rientroSeme === salva.seme, 'e il mondo ci passa dentro (sei caratteri, non una mappa)');

  const vecchio = await p.evaluate(() => {
    const d = migra({ sv:2, r:2, n:1, t:[], k:null, c:0, z:[], p:{ Rubino:2 } });
    return { ok: !!d, mondo: d && d.m, gratis: d && d.g, rank: d && d.r };
  });
  chk(vecchio.ok && vecchio.rank === 2, 'un salvataggio di schema 2 si apre ancora');
  chk(vecchio.mondo === null, 'non porta un mondo, e il gioco gliene semina uno all’avvio');

  const storto = await p.evaluate(() => {
    const d = migra({ sv:3, r:0, n:0, t:[], k:null, c:0, z:[], p:{},
                      m:{ seme:'!!!', trappole:{1:-5}, poste:[{h:'nessunluogo',t:9,esca:'niente'}] } });
    return { m: d.m };
  });
  chk(storto.m === null, 'un mondo scritto a mano con un seme finto viene scartato');

  // --- il giro completo: posi, giochi due partite di torneo, raccogli ---
  /* si riparte puliti: le prove qui sopra hanno gia' scritto un salvataggio */
  await p.evaluate(() => localStorage.clear());
  await p.goto(URL); await p.waitForTimeout(250);
  await p.click('#btn-modego'); await p.waitForTimeout(150);
  await p.evaluate(() => { S.dispensa = { 'Frutto del Vesuvio': 2 }; S.mondo.trappole = { 1:1, 2:0, 3:0 };
                           S.luogo = 'frutteto'; S.trapSel = 1; S.escaSel = 'Frutto del Vesuvio'; apriMondo(); });
  await p.waitForTimeout(200);
  await p.click('#btn-posa'); await p.waitForTimeout(200);
  const g1 = await p.evaluate(() => ({ poste:S.mondo.poste.length, giocate:S.giocate }));
  chk(g1.poste === 1 && g1.giocate === 0, 'giro completo: la trappola parte con zero partite giocate');
  await p.evaluate(() => finish(true)); await p.waitForTimeout(150);
  await p.evaluate(() => finish(false)); await p.waitForTimeout(150);
  await p.click('#btn-menu'); await p.waitForTimeout(150);
  await p.click('#btn-mondo'); await p.waitForTimeout(250);
  const g2 = await p.evaluate(() => ({ giocate:S.giocate,
    pronta: !document.querySelector('#poste .posta').disabled }));
  chk(g2.giocate === 2, 'una vittoria e una sconfitta contano entrambe come partite giocate');
  chk(g2.pronta, 'e la trappola diventa raccoglibile dalla schermata');
  await p.click('#poste .posta'); await p.waitForTimeout(250);
  const g3 = await p.evaluate(() => ({ poste:S.mondo.poste.length,
    testo: document.querySelector('#mondo-esito').textContent.trim() }));
  chk(g3.poste === 0 && g3.testo.length > 10, 'si raccoglie con un clic, e il gioco dice com\u2019\u00e8 andata');

  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
