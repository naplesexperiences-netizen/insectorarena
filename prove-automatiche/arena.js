/* Fase 2 del piano grafico: arena e insetti.
   Il bordo che si legge come precipizio, le meta' campo tinte, il terreno che
   sale col rank, il mirino e l'area della speciale, gli anelli di squadra con
   due forme, il rank e gli stati sulla pedina, i numeri di danno sopra lo
   sprite, l'arresto sull'impatto e la caduta nel vuoto. Piu' un controllo che
   alla prova degli sprite sfuggiva: nessuna coordinata fuori dal disegno. */
const { chromium, SERVITO } = require('./comune');
const ok=[],ko=[]; const chk=(c,m)=>(c?ok:ko).push(m);
const URL = SERVITO + 'gioca.html';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{ width:1280, height:900 } });
  const errs=[]; p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(() => { try { localStorage.setItem('insectron-spiega',
    JSON.stringify({ squadra:true, campo:true, zoo:true, mondo:true })); } catch(e){} });
  await p.goto(URL); await p.waitForTimeout(300);

  // --- gli sprite: nessuna coordinata fuori dal viewBox, nemmeno capovolti ---
  const fuori = await p.evaluate(() => {
    const out = [];
    UNITS.forEach(u => [false, true].forEach(fl => {
      const d = document.createElement('div'); d.innerHTML = art(u.fam, fl, u.rank);
      const n = [...d.querySelectorAll('[d]')].flatMap(e => (e.getAttribute('d').match(/-?\d*\.?\d+/g) || []).map(Number));
      if (n.some(v => Math.abs(v) > 90)) out.push(u.name + (fl ? ' (capovolto)' : ''));
    }));
    return out;
  });
  chk(fuori.length === 0, 'nessuno dei 34 sprite ha pezzi disegnati lontano dalla sua casella, nemmeno capovolto' +
      (fuori.length ? ': ' + fuori.join(', ') : ' (la barba destra di Rasoio, Bipenne e Trinciaferro finiva a x=322)'));

  // --- si entra in campo ---
  await p.click('#btn-modego'); await p.waitForTimeout(150);
  await p.click('#btn-auto'); await p.click('#btn-start'); await p.waitForTimeout(150);
  await p.click('#btn-toarena'); await p.waitForTimeout(250);
  await p.click('#btn-rand'); await p.waitForTimeout(150);
  await p.click('#btn-fight'); await p.waitForTimeout(400);

  // --- il bordo e le meta' campo ---
  const campo = await p.evaluate(() => {
    const bd = $('#board'), cs = getComputedStyle(bd);
    const col = sel => getComputedStyle(document.querySelector(sel)).backgroundColor;
    return {
      cornice: /rgb\(5, 7, 11\) 0px 0px 0px 9px/.test(cs.boxShadow),
      home: col('#board .cell.home'), away: col('#board .cell.away'),
      linee: [getComputedStyle(document.querySelector('#board .cell.home')).borderBottomColor,
              getComputedStyle(document.querySelector('#board .cell.away')).borderTopColor]
    };
  });
  chk(campo.cornice, 'intorno al campo c’e’ il vuoto: una cornice scura e incassata, il bordo si legge come precipizio');
  chk(campo.home === 'rgb(23, 37, 54)' && campo.away === 'rgb(42, 26, 34)',
      'le due file di casa hanno la tinta di chi ci sta: ' + campo.home + ' / ' + campo.away);
  chk(campo.linee.every(c => /0\.45\)$/.test(c)), 'e le linee di meta’ campo salgono dal 32 al 45%');

  /* Il contrasto che conta: movimento e attacco contro le caselle su cui
     compaiono. Con le tinte deve essere almeno quello di prima, sulla casella
     neutra composta sul campo. */
  const contr = await p.evaluate(() => {
    const h = c => c.match(/\d+/g).slice(0, 3).map(Number);
    const L = c => { const v = c.map(x => { x /= 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); });
      return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
    const cr = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    const neutra = [32, 42, 60].map((v, i) => Math.round(v * .55 + [30, 40, 57][i] * .45));   /* sul centro del campo */
    const mv = [22, 64, 92], tg = [92, 31, 34];
    const ally = h(getComputedStyle(document.querySelector('#board .cell.home')).backgroundColor);
    const foe = h(getComputedStyle(document.querySelector('#board .cell.away')).backgroundColor);
    return { mvA: cr(mv, ally), mvF: cr(mv, foe), tgA: cr(tg, ally), tgF: cr(tg, foe), mvN: cr(mv, neutra), tgN: cr(tg, neutra) };
  });
  const f2 = v => v.toFixed(2);
  chk(contr.mvA >= contr.mvN && contr.mvF >= contr.mvN,
      'le caselle di movimento spiccano sulle tinte almeno quanto sulla casella neutra (' + f2(contr.mvA) + ', ' + f2(contr.mvF) + ' contro ' + f2(contr.mvN) + ')');
  chk(contr.tgA >= contr.tgN && contr.tgF >= contr.tgN,
      'e cosi’ quelle d’attacco (' + f2(contr.tgA) + ', ' + f2(contr.tgF) + ' contro ' + f2(contr.tgN) + ')');

  // --- il terreno sale col rank ---
  const terr = await p.evaluate(() => {
    const out = {};
    const prima = S.rankIdx;
    [0, 1, 2, 3, 4, 5].forEach(i => { S.rankIdx = i; draw(); out[RANKS[i].id] = $('#board').dataset.terreno; });
    out.img = getComputedStyle($('#board')).backgroundImage;
    const vs = S.vs, mm = S.matchMode; S.matchMode = 'hvh'; draw(); out.duo = $('#board').dataset.terreno;
    S.matchMode = mm; S.vs = vs; S.rankIdx = prima; draw();
    delete $('#board').dataset.terreno;
    out.senza = getComputedStyle($('#board')).backgroundImage;
    draw();
    return out;
  });
  chk(terr.E === 'terra' && terr.D === 'terra' && terr.C === 'corteccia' && terr.B === 'corteccia' &&
      terr.A === 'pietra' && terr.S === 'oro',
      'il terreno cambia salendo: terra per E e D, corteccia per C e B, pietra per A, pietra e oro per S');
  chk(/data:image\/svg\+xml/.test(terr.img) && /radial-gradient/.test(terr.img),
      'il terreno e’ un motivo SVG disegnato nel CSS, sopra il gradiente di sempre');
  chk(terr.duo === 'terra', 'fuori dal torneo (in due) il campo e’ terra battuta');
  chk(/radial-gradient/.test(terr.senza) && !/svg/.test(terr.senza), 'senza motivo il campo resta il gradiente di prima: giocabile comunque');

  // --- l'area della speciale: forma giusta per ogni famiglia ---
  const aree = await p.evaluate(() => {
    const salva = S.units.map(u => [u.x, u.y]);
    const u = S.units.find(x => x.side === 'p' && x.alive);
    S.units.forEach(x => { if (x !== u) x.x = -1; });            /* campo vuoto attorno */
    u.x = 2; u.y = 3;
    const fam0 = u.d.fam, out = {};
    Object.keys(FAMS).forEach(f => { u.d.fam = f; out[FAMS[f].sp] = specArea(u).length; });
    u.d.fam = fam0;
    S.units.forEach((x, i) => { x.x = salva[i][0]; x.y = salva[i][1]; });
    draw();
    return out;
  });
  const atteso = { cannon_blast:8, wing_flap:8, body_blow:2, sickle_dance:8, itsakick:2, fill_hole:1, emperors_rage:24,
    jumping_stab:4, crushing_horn:4, over_easy:4, scissor_throw:4, charm_beam:4, healing_jig:4 };
  const sbagliate = Object.keys(atteso).filter(k => aree[k] !== atteso[k]);
  chk(sbagliate.length === 0, 'l’area di ogni speciale ha la sua forma, a campo libero: linea, croce, anello, quadrato da 5' +
      (sbagliate.length ? ' (sbagliate: ' + sbagliate.map(k => k + '=' + aree[k]).join(', ') + ')' : ''));
  const coerente = await p.evaluate(() => {
    /* Chi la speciale colpisce davvero sta sempre dentro l'area mostrata. */
    let tot = 0, dentro = 0;
    for (let giro = 0; giro < 60; giro++){
      S.units.forEach(x => { if (x.alive){ x.x = Math.floor(Math.random() * NX); x.y = Math.floor(Math.random() * NY); } });
      S.units.filter(x => x.alive && !selfCast(x)).forEach(x => {
        const area = specArea(x);
        specTargets(x).forEach(t => { tot++; if (area.some(c => c.x === t.x && c.y === t.y)) dentro++; });
      });
    }
    return { tot, dentro };
  });
  chk(coerente.tot > 0 && coerente.dentro === coerente.tot,
      'chi la speciale colpisce davvero sta sempre dentro l’area mostrata (' + coerente.dentro + '/' + coerente.tot + ' su 60 schieramenti a caso)');

  // --- passando sul pulsante l'area si accende, uscendo si spegne ---
  await p.evaluate(() => {
    S.units.forEach(x => x.x = -1);
    const mio = S.units.find(u => u.side === 'p' && u.alive && !selfCast(u));
    const lui = S.units.find(u => u.side === 'e' && u.alive);
    mio.x = 2; mio.y = 4; lui.x = 2; lui.y = 3; mio.cd = 0; mio.acted = false; mio.moved = false;
    S.turn = meSide(); S.busy = false; S.sel = mio; S.mode = 'idle'; draw();
  });
  const spec = await p.$('#acts button.accento');
  await spec.hover(); await p.waitForTimeout(80);
  const acceso = await p.evaluate(() => ({ n: document.querySelectorAll('#board .cell.area').length,
    col: document.querySelector('#board .cell.area') && getComputedStyle(document.querySelector('#board .cell.area')).outlineStyle }));
  await p.mouse.move(5, 5); await p.waitForTimeout(80);
  const spento = await p.evaluate(() => document.querySelectorAll('#board .cell.area').length);
  chk(acceso.n === 4 && acceso.col === 'dashed', 'passando sulla speciale il campo mostra dove arriva, tratteggiato nel colore della famiglia');
  chk(spento === 0, 'uscendo dal pulsante l’area sparisce');
  await p.evaluate(() => { S.mode = 'spec'; draw(); });
  const scelta = await p.evaluate(() => ({ area: document.querySelectorAll('#board .cell.area').length,
    mirino: getComputedStyle(document.querySelector('#board .cell.tg'), '::before').backgroundImage }));
  chk(scelta.area === 4, 'scelta la speciale, l’area resta mentre si sceglie il bersaglio');
  chk(/linear-gradient/.test(scelta.mirino), 'il bersaglio ha la forma di un mirino, non solo il fondo rosso');

  // --- la pedina: anelli, rank, stati ---
  const ped = await p.evaluate(() => {
    const t = side => document.querySelector('#layer .tok.' + side + ' .shadow');
    const u = S.units.find(x => x.alive && x.side === 'e');
    u.stun = 2; u.guard = 1; u.exposed = 1; u.x = 0; u.y = 0; draw();
    const e = tokEl(u);
    const pips = [...document.querySelectorAll('#layer .tok')].every(el => {
      const v = S.units.find(x => String(x.uid) === el.dataset.uid);
      return el.querySelectorAll('.rkm i').length === Math.ceil(v.d.rank / 2);
    });
    const r = { p: getComputedStyle(t('p')).borderTopStyle, e: getComputedStyle(t('e')).borderTopStyle,
      pc: getComputedStyle(t('p')).borderTopColor, ec: getComputedStyle(t('e')).borderTopColor,
      pips, stati: [...e.querySelectorAll('.status .stb')].map(s => s.className.replace('stb ', '')),
      icone: !!e.querySelector('.status .ic-clessidra') && !!e.querySelector('.status .ic-scudo'),
      emoji: /[\u{1F300}-\u{1FAFF}]/u.test(e.querySelector('.status').textContent) };
    u.stun = 0; u.guard = 0; u.exposed = 0; draw();
    r.vuoto = e.querySelector('.status').children.length;
    return r;
  });
  chk(ped.p === 'solid' && ped.e === 'dashed', 'alleato e avversario hanno anelli di forma diversa: pieno e tratteggiato, si distinguono anche senza colore');
  chk(ped.pc === 'rgb(75, 195, 255)' && ped.ec === 'rgb(255, 107, 107)', 'e il colore resta quello di sempre, azzurro e rosso');
  chk(ped.pips, 'il rank si legge sulla pedina: un punto fino all’R2, due fino all’R4, tre oltre');
  chk(ped.stati.join(',') === 'st-stun,st-guard,st-exp' && ped.icone,
      'gli stati sono distintivi con la loro icona: clessidra, scudo, punto esclamativo');
  chk(!ped.emoji, 'niente piu’ emoji, che ogni sistema disegna a modo suo');
  chk(ped.vuoto === 0, 'finito lo stato, il distintivo sparisce');

  // --- il numero del danno ---
  const num = await p.evaluate(() => {
    const u = S.units.find(x => x.alive && x.x >= 0);
    fx(u, '18');
    const s = [...document.querySelectorAll('#layer .fx')].pop(), cs = getComputedStyle(s);
    return { top: parseFloat(s.style.top), cella: vY(u.y) * PY, alt: PY,
      size: parseFloat(cs.fontSize), h2: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fs-h2')) * 16,
      bordo: cs.webkitTextStrokeWidth };
  });
  chk(num.top - num.cella < num.alt * .2, 'il numero del danno nasce in alto sulla casella, sopra la pedina, non sul suo corpo');
  chk(Math.abs(num.size - num.h2) < .5 && num.bordo === '3px', 'piu’ grande (h2) e con un contorno scuro di 3 px');

  // --- arresto sull'impatto ---
  const lunge = await p.evaluate(() => {
    const k = [...document.styleSheets].flatMap(s => [...s.cssRules]).find(r => r.name === 'lunge');
    return k ? [...k.cssRules].map(r => r.keyText) : [];
  });
  chk(lunge.includes('48%, 62%'), 'il colpo ha l’anticipo e ora anche l’arresto: fermo fra il 48 e il 62% dell’animazione');

  // --- la caduta nel vuoto ---
  const cad = await p.evaluate(() => {
    const out = {};
    const prova = (x, y) => {
      const u = S.units.find(v => v.alive && v.side === 'e');
      u.x = x; u.y = y; draw();
      const e = tokEl(u);
      const prima = fxLayer().children.length;
      ko(u, 'ring');
      return { rx: e.style.getPropertyValue('--rx'), ry: e.style.getPropertyValue('--ry'),
        anim: e.classList.contains('ringout'), polvere: [...fxLayer().children].slice(prima).some(w => w.classList.contains('polvere')) };
    };
    S.over = true;                                 /* niente fine partita a meta' prova */
    out.sx = prova(0, 3); out.dx = prova(NX - 1, 2); out.su = prova(2, 0);
    /* In due, col turno dell'altro, la scacchiera e' girata: la colonna 0 sta
       a destra sullo schermo, e da li' si deve cadere. Prima si usciva dalla
       parte opposta. */
    S.vs = 'hvh'; S.turn = 'e';
    out.flip = flipBoard(); out.giro = prova(0, 3);
    return out;
  });
  chk(cad.sx.rx === '-100%' && cad.sx.ry === '0%', 'spinta fuori dal lato sinistro, la pedina esce di lato e non in diagonale');
  chk(cad.dx.rx === '100%' && cad.su.ry === '-100%', 'e dagli altri bordi dalla parte giusta, di una casella: li’ cade');
  chk(cad.flip && cad.giro.rx === '100%', 'a scacchiera girata la pedina cade dalla parte dello schermo dove sta, non da quella opposta');
  chk(cad.sx.anim && cad.sx.polvere, 'cadendo rimpicciolisce e si spegne, con uno sbuffo di polvere sul bordo');
  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await p.close();

  // --- movimento ridotto: il numero non sale ---
  const ctx = await b.newContext({ viewport:{ width:1280, height:900 }, reducedMotion:'reduce' });
  const r = await ctx.newPage();
  await r.goto(URL); await r.waitForTimeout(250);
  const rid = await r.evaluate(() => {
    const s = document.createElement('span'); s.className = 'fx'; document.body.appendChild(s);
    return getComputedStyle(s).animationName;
  });
  chk(rid === 'fxfermo', 'col movimento ridotto il numero del danno compare e sparisce, senza salire');
  await ctx.close();

  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
