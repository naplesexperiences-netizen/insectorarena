/* Fase 3 del piano grafico: il Mondo.
   La mappa coi cinque luoghi su un sentiero (e che stia sul telefono), la
   nebbia sui luoghi inesplorati e la sua memoria nel salvataggio, le trappole
   posate visibili sulla mappa, la scheda del luogo con le sagome di chi ci
   abita, trappole ed esche come carte, la probabilita' come arco -- che deve
   dire lo stesso numero che decide l'esito -- e la rivelazione della cattura,
   che si salta e col movimento ridotto non c'e'. */
const { chromium, SERVITO } = require('./comune');
const ok=[],ko=[]; const chk=(c,m)=>(c?ok:ko).push(m);
const URL = SERVITO + 'gioca.html';
const SPIEGA = () => { try { localStorage.setItem('insectron-spiega',
  JSON.stringify({ squadra:true, campo:true, zoo:true, mondo:true })); } catch(e){} };

const prepara = () => {
  S.rankIdx = 5; S.giocate = 10; S.mondo.seme = 'K7F2QA'; MONDO_CACHE = { seme:null, luoghi:null };
  S.mondo.trappole = { 1:2, 2:1, 3:1 }; S.mondo.poste = []; S.mondo.e = 0;
  S.dispensa = { 'Frutto del Vesuvio':3, 'Pietrafuoco':2 };
  S.luogo = 'frutteto'; S.trapSel = 1; S.escaSel = 'Frutto del Vesuvio'; apriMondo();
};

(async () => {
  const b = await chromium.launch();

  // --- la mappa sta in ogni larghezza, telefono piccolo compreso ---
  for (const [w, h] of [[1280, 900], [900, 800], [390, 844], [360, 640]]){
    const p = await b.newPage({ viewport:{ width:w, height:h } });
    await p.addInitScript(SPIEGA);
    await p.goto(URL); await p.waitForTimeout(250);
    await p.click('#btn-modego'); await p.waitForTimeout(150);
    await p.evaluate(prepara); await p.waitForTimeout(250);
    const m = await p.evaluate(() => {
      const box = $('#luoghi').getBoundingClientRect();
      const ls = [...document.querySelectorAll('#luoghi .luogo')];
      const r = ls.map(l => l.getBoundingClientRect());
      let sov = 0;
      for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++)
        if (r[i].left < r[j].right && r[j].left < r[i].right && r[i].top < r[j].bottom && r[j].top < r[i].bottom) sov++;
      return { n: ls.length, sov,
        fuori: r.filter(x => x.left < box.left - 1 || x.right > box.right + 1 || x.top < box.top - 1 || x.bottom > box.bottom + 1).length,
        scroll: document.documentElement.scrollWidth > innerWidth + 1,
        assoluti: ls.every(l => getComputedStyle(l).position === 'absolute') };
    });
    chk(m.n === 5 && m.assoluti, w + '×' + h + ': i cinque luoghi sono pulsanti posati sulla mappa, non righe di un elenco');
    chk(m.sov === 0 && m.fuori === 0, w + '×' + h + ': nessun luogo ne copre un altro o esce dalla mappa');
    chk(!m.scroll, w + '×' + h + ': niente scorrimento di lato');
    await p.close();
  }

  const p = await b.newPage({ viewport:{ width:1280, height:900 } });
  const errs=[]; p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(SPIEGA);
  await p.goto(URL); await p.waitForTimeout(250);
  await p.click('#btn-modego'); await p.waitForTimeout(150);
  await p.evaluate(prepara); await p.waitForTimeout(250);

  // --- sentiero e scene, disegnati da codice ---
  const mappa = await p.evaluate(() => ({
    tratti: [...document.querySelectorAll('#luoghi .sentiero path')].map(x => (x.getAttribute('d').match(/[ML]/g) || []).length),
    scene: [...document.querySelectorAll('#luoghi .luogo')].every(l => l.querySelector('.scena svg path, .scena svg circle')),
    immagini: document.querySelectorAll('#luoghi img').length,
    tinte: [...document.querySelectorAll('#luoghi .luogo')].map(l => getComputedStyle(l.querySelector('.scena')).borderTopColor),
    scelto: document.querySelector('#luoghi .luogo.on').getAttribute('aria-pressed')
  }));
  chk(mappa.tratti.length === 2 && mappa.tratti.every(n => n === 5), 'un sentiero passa per i cinque luoghi (uno per lo schermo largo, uno a zig-zag per il telefono)');
  chk(mappa.scene && mappa.immagini === 0, 'ogni luogo ha la sua scena disegnata da codice, nessun file immagine');
  chk(new Set(mappa.tinte).size === 5, 'e la sua tinta: cinque luoghi, cinque colori');
  chk(mappa.scelto === 'true', 'il luogo scelto lo dice anche allo screen reader (aria-pressed)');

  // --- la nebbia: inesplorato finche' non ci posi una trappola ---
  const neb = await p.evaluate(() => {
    const prima = document.querySelectorAll('#luoghi .luogo.nebbia').length;
    const etich = document.querySelector('#luoghi [data-luogo="frutteto"]').getAttribute('aria-label');
    piazzaTrappola();
    const dopo = [...document.querySelectorAll('#luoghi .luogo.nebbia')].map(l => l.dataset.luogo);
    const lista = m => HABITAT.map(h => h.id).filter(id => esplorato(m, id));
    const salvato = lista(mondoSano(JSON.parse(JSON.stringify(S.mondo))));
    const vecchio = lista(mondoSano({ seme:'K7F2QA', trappole:{1:1}, poste:[{ n:1, h:'cava', t:1, quando:3, esca:'Rubino' }] }));
    const finto = mondoSano({ seme:'K7F2QA', e: 1 | 1 << 9 }).e;
    return { prima, etich, dopo, salvato, vecchio, finto };
  });
  chk(neb.prima === 5, 'in un mondo appena nato i cinque luoghi sono nella nebbia');
  chk(/Inesplorato/.test(neb.etich), 'e lo screen reader sente «Inesplorato»');
  chk(neb.dopo.length === 4 && !neb.dopo.includes('frutteto'), 'posata una trappola nel Frutteto, la sua nebbia si dirada');
  chk(neb.salvato.join() === 'frutteto', 'e il salvataggio se lo ricorda');
  chk(neb.vecchio.join() === 'cava', 'un salvataggio di prima, che non lo sapeva, ricava gli esplorati dalle trappole in giro');
  chk(neb.finto === 1, 'e da un codice scritto a mano tiene solo i bit dei luoghi che esistono');
  const nuovoMondo = await p.evaluate(() => { cambiaMondo('ZZZ999'); return document.querySelectorAll('#luoghi .luogo.nebbia').length; });
  chk(nuovoMondo === 5, 'cambiando mondo, tutto torna da scoprire');
  await p.evaluate(prepara);

  // --- la trappola posata si vede sulla mappa ---
  const tac = await p.evaluate(() => {
    S.mondo.poste = [{ n:7, h:'cava', t:1, esca:'Rubino', quando:S.giocate + 1 }];
    drawMondo();
    const t = document.querySelector('#luoghi [data-luogo="cava"] .tacche');
    const r = { c: !!t, tot: t && t.querySelectorAll('i').length, piene: t && t.querySelectorAll('i.ok').length,
      pronta: t && t.classList.contains('pronta'), altrove: document.querySelectorAll('#luoghi .tacche').length };
    S.giocate += 1; drawMondo();
    r.oraPronta = document.querySelector('#luoghi [data-luogo="cava"] .tacche').classList.contains('pronta');
    S.giocate -= 1; S.mondo.poste = []; drawMondo();
    return r;
  });
  chk(tac.c && tac.altrove === 1, 'una trappola posata compare sulla mappa, nel suo luogo e solo li’');
  chk(tac.tot === 2 && tac.piene === 1 && !tac.pronta, 'con una tacca per partita: dopo una delle due, una piena e una vuota');
  chk(tac.oraPronta, 'quando e’ pronta pulsa in verde');

  // --- la scheda del luogo ---
  const sch = await p.evaluate(() => {
    S.visti = { mantis:1 }; S.luogo = 'frutteto'; drawMondo();
    const l = luogoDi('frutteto');
    const sag = [...document.querySelectorAll('#spedizione .sagoma')];
    const attese = l.fam.map(f => ({ f, visto: UNITS.some(u => u.fam === f && S.visti[u.id]),
      attira: (ESCA_FAM['Frutto del Vesuvio'] || []).includes(f) }));
    return {
      testata: !!document.querySelector('#spedizione .testata-luogo.b-frutteto'),
      part: document.querySelectorAll('#spedizione .testata-luogo .part').length,
      n: sag.length, attese: attese.length,
      giuste: sag.every((s, i) => s.classList.contains('ombra') === !attese[i].visto &&
                               s.classList.contains('attira') === attese[i].attira),
      ombre: sag.filter(s => s.classList.contains('ombra')).every(s => s.textContent.trim() === '?' && /mai incontrata/.test(s.getAttribute('aria-label'))),
      carte: $('#sc-trap').classList.contains('carte') && $('#sc-esca').classList.contains('carte'),
      giusta: [...document.querySelectorAll('#sc-esca button')].every(x => x.classList.contains('giusta') === escaGiusta(l, x.dataset.esca))
    };
  });
  chk(sch.testata && sch.part === 6, 'la scheda del luogo si apre con una testata nella sua tinta, e qualche particella che sale');
  chk(sch.n === sch.attese && sch.giuste, 'chi abita qui compare come sagoma: a colori chi hai gia’ incontrato, in ombra gli altri, in verde chi l’esca attira');
  chk(sch.ombre, 'chi non hai mai incontrato resta un punto interrogativo, anche per lo screen reader');
  chk(sch.carte, 'trappole ed esche sono carte con la loro icona');
  chk(sch.giusta, 'e l’esca giusta per il luogo ha il bordo verde');

  // --- l'arco dice lo stesso numero che decide ---
  const arco = await p.evaluate(() => {
    const out = [];
    [['Frutto del Vesuvio', 1], ['Pietrafuoco', 1], ['Frutto del Vesuvio', 2]].forEach(([e, t]) => {
      S.escaSel = e; S.trapSel = t; drawMondo();
      const pe = document.querySelector('#spedizione .pieno');
      const L = parseFloat(pe.getAttribute('stroke-dasharray')), off = parseFloat(pe.getAttribute('stroke-dashoffset'));
      const vera = stimaCattura(luogoDi('frutteto'), t, e);
      out.push({ arco: 1 - off / L, vera, scritto: document.querySelector('#spedizione .grande').textContent });
    });
    S.dispensa = {}; S.escaSel = null; drawMondo();
    const pe = document.querySelector('#spedizione .pieno');
    const vuoto = { off: parseFloat(pe.getAttribute('stroke-dashoffset')), L: parseFloat(pe.getAttribute('stroke-dasharray')),
      scritto: document.querySelector('#spedizione .grande').textContent };
    S.dispensa = { 'Frutto del Vesuvio':3, 'Pietrafuoco':2 }; S.escaSel = 'Frutto del Vesuvio'; S.trapSel = 1; drawMondo();
    return { out, vuoto };
  });
  chk(arco.out.every(a => Math.abs(a.arco - a.vera) < .002 && a.scritto === Math.round(a.vera * 100) + '%'),
      'l’arco si riempie esattamente della probabilita’ che decide l’esito, e il numero al centro e’ lo stesso (' +
      arco.out.map(a => a.scritto).join(', ') + ')');
  chk(arco.out[0].arco > arco.out[1].arco, 'cambiando esca l’arco si muove: si vede quanto conta la scelta');
  chk(Math.abs(arco.vuoto.off - arco.vuoto.L) < .1 && arco.vuoto.scritto === '—', 'senza esca l’arco e’ vuoto e al posto del numero c’e’ la lineetta');

  // --- la rivelazione ---
  const riv = await p.evaluate(async () => {
    const vero = esitoSpedizione;
    const attendi = ms => new Promise(r => setTimeout(r, ms));
    const out = {};
    S.zoo = []; S.visti = {}; S.giocate = 10;
    S.mondo.poste = [{ n:20, h:'frutteto', t:1, esca:'Frutto del Vesuvio', quando:5 }];
    esitoSpedizione = () => ({ id:'faerie', b:{ hp:0, str:0, def:0 } });
    raccogli(20);
    const r = document.querySelector('.rivela');
    out.c = !!r; out.nascosta = r && r.getAttribute('aria-hidden') === 'true';
    out.subito = /Preso/.test($('#mondo-esito').textContent);
    out.nuovo = !!(r && r.querySelector('.nuovo'));
    out.ombra = r && getComputedStyle(r.querySelector('.chi .art')).filter;
    await attendi(1100);
    out.fase2 = r.classList.contains('fase2');
    r.click(); out.chiusa = !document.querySelector('.rivela');
    /* una seconda Lusinga non e' piu' nuova */
    S.mondo.poste = [{ n:21, h:'frutteto', t:1, esca:'Frutto del Vesuvio', quando:5 }];
    raccogli(21);
    out.secondaNuova = !!document.querySelector('.rivela .nuovo');
    document.dispatchEvent(new KeyboardEvent('keydown', { key:'Escape' }));
    out.tasto = !document.querySelector('.rivela');
    /* vuota */
    S.mondo.poste = [{ n:22, h:'frutteto', t:1, esca:'Frutto del Vesuvio', quando:5 }];
    esitoSpedizione = () => null;
    raccogli(22);
    out.vuota = document.querySelector('.rivela .tit').textContent;
    show('s-team'); out.via = !document.querySelector('.rivela');
    await attendi(3300);
    esitoSpedizione = vero; apriMondo();
    return out;
  });
  chk(riv.c && riv.subito, 'raccogliendo, la trappola si apre in scena; l’esito e’ gia’ scritto sotto, la scena non lo ritarda');
  chk(riv.nascosta, 'la scena e’ decorativa: aria-hidden, lo screen reader legge l’esito');
  chk(/brightness\(0\)/.test(riv.ombra) && riv.fase2, 'prima la trappola trema, poi la sagoma nera si accende nel colore della famiglia');
  chk(riv.nuovo && !riv.secondaNuova, '«Nuovo nella collezione» solo la prima volta che lo incontri');
  chk(riv.chiusa && riv.tasto, 'un tocco o un tasto la chiudono subito');
  chk(riv.vuota === 'Vuota', 'una trappola vuota resta li\u2019, spenta, con «Vuota»');
  chk(riv.via, 'cambiando schermata la scena sparisce');
  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await p.close();

  // --- movimento ridotto ---
  const ctx = await b.newContext({ viewport:{ width:1280, height:900 }, reducedMotion:'reduce' });
  const q = await ctx.newPage();
  await q.addInitScript(SPIEGA);
  await q.goto(URL); await q.waitForTimeout(250);
  await q.click('#btn-modego'); await q.waitForTimeout(150);
  await q.evaluate(prepara); await q.waitForTimeout(200);
  const rid = await q.evaluate(() => {
    const part = getComputedStyle(document.querySelector('#spedizione .part')).display;
    S.mondo.poste = [{ n:30, h:'frutteto', t:1, esca:'Frutto del Vesuvio', quando:5 }];
    esitoSpedizione = () => ({ id:'faerie', b:{ hp:0, str:0, def:0 } });
    raccogli(30);
    return { part, scena: !!document.querySelector('.rivela'), esito: $('#mondo-esito').textContent.length };
  });
  chk(rid.part === 'none', 'col movimento ridotto le particelle non ci sono');
  chk(!rid.scena && rid.esito > 10, 'e la raccolta non ha scena: il risultato si legge subito');
  await ctx.close();

  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
