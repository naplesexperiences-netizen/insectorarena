const { chromium, GIOCA } = require('./comune');
/* Se la suite si ferma a meta' lo dice come un controllo fallito: senza,
   la batteria leggerebbe zero controlli e zero errori, cioe' un silenzio. */
process.on('unhandledRejection', e => {
  console.log('  KO  la suite si e\' fermata: ' + String(e && e.message || e).split('\n').slice(0, 3).join(' / '));
  process.exit(1);
});
/* Il primo minuto e le rifiniture da telefono: il benvenuto con la partita
   gia' pronta, un aiuto alla volta, i ruoli nello schieramento, la testata
   che in battaglia sta su una riga, la vibrazione e i margini per la tacca. */
(async () => {
  const b = await chromium.launch();
  const ok=[], ko=[]; const chk=(c,n)=>{ (c?ok:ko).push(n); };
  const errs=[];
  const pagina = async (opt) => {
    const p = await b.newPage(opt);
    p.on('pageerror', e=>errs.push(e.message));
    p.on('console', m=>{ if(m.type()==='error') errs.push(m.text()); });
    return p;
  };
  const TEL = { viewport:{ width:390, height:780 }, hasTouch:true, isMobile:true };
  const LARGO = { viewport:{ width:1280, height:900 } };

  // ================= A. la prima visita
  for (const [nome, opt] of [['telefono', TEL], ['schermo largo', LARGO]]){
    const p = await pagina(Object.assign({ benvenuto:true }, opt));
    await p.goto(GIOCA); await p.waitForTimeout(350);
    const a = await p.evaluate(() => {
      const vis = s => { const e = document.querySelector(s); return !!e && !!e.offsetParent; };
      return { cl: document.querySelector('#s-mode').classList.contains('benvenuto'),
        modi: vis('#modes'), opz: vis('#modeopts'), titolo: vis('#s-mode h2.solomodi'), benv: vis('#s-mode .benv'),
        subito: vis('#btn-gioca-subito'), go: vis('#btn-modego'), goT: document.querySelector('#btn-modego').textContent,
        prim: [...document.querySelectorAll('button.primary')].filter(x => x.offsetParent).map(x => x.id),
        sw: document.documentElement.scrollWidth, iw: innerWidth, alto: document.documentElement.scrollHeight <= innerHeight + 1 };
    });
    chk(a.cl && a.benv && !a.modi && !a.opz && !a.titolo, nome + ': alla prima visita la schermata d’apertura non chiede modalita’ ne’ difficolta’');
    chk(a.subito && a.prim.length === 1 && a.prim[0] === 'btn-gioca-subito', nome + ': l’unico primario e’ «Gioca subito»');
    chk(a.go && a.goT === 'Scelgo io la squadra', nome + ': accanto resta la strada di sempre, «Scelgo io la squadra»');
    chk(a.sw <= a.iw && a.alto, nome + ': sta in una schermata, senza scorrere');
    await p.click('#btn-gioca-subito'); await p.waitForTimeout(500);
    const g = await p.evaluate(() => ({
      on: document.querySelector('.screen.on').id, fase: S.phase, turno: S.turn, squadra: S.team.length,
      re: S.units.filter(u => u.side === 'p' && u.isKing).length,
      casa: S.units.filter(u => u.side === 'p').every(u => u.y >= NY - 2 && u.x >= 0),
      doppie: new Set(S.units.filter(u => u.alive).map(u => u.x + ',' + u.y)).size === 10,
      visto: localStorage.getItem('insectron-avvio'), salvato: (JSON.parse(localStorage.getItem('insectron') || '{}').t || []).length,
      guida: !document.querySelector('#guida').hidden, n: document.querySelector('#guida-n').textContent,
      testo: document.querySelector('#guida-testo').textContent, nuvola: !document.querySelector('#nuvola').hidden,
      qui: (() => { const e = document.querySelector('#ucard .guidaqui'); if (!e) return null; const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; })()
    }));
    chk(g.on === 's-battle' && g.fase === 'battle' && g.turno === 'p', nome + ': «Gioca subito» porta dritto in battaglia, al tuo turno');
    chk(g.squadra === 5 && g.re === 1 && g.casa && g.doppie, nome + ': con cinque pedine, un Re, tutte schierate nelle due file di casa');
    chk(g.visto === 'visto' && g.salvato === 5, nome + ': la squadra e’ salvata e il benvenuto non tornera’');
    chk(g.guida && g.n === 'Come si gioca' && /in basso/.test(g.testo) && /una volta/.test(g.testo), nome + ': la guida non conta passi saltati e dice quali sono le tue pedine');
    chk(!g.nuvola, nome + ': e la nuvoletta non si apre sopra alla guida');
    if (nome === 'telefono') chk(g.qui === true, 'telefono: la riga della guida sta anche sotto al campo, dentro lo schermo');
    else chk(g.qui === null, 'schermo largo: sotto al campo la guida non si ripete');
    await p.reload(); await p.waitForTimeout(350);
    const r = await p.evaluate(() => ({ cl: document.querySelector('#s-mode').classList.contains('benvenuto'),
      modi: !!document.querySelector('#modes').offsetParent, t: document.querySelector('#btn-modego').textContent,
      prim: document.querySelector('#btn-modego').classList.contains('primary') }));
    chk(!r.cl && r.modi && r.t === 'Scegli la squadra' && r.prim, nome + ': dalla seconda visita la scelta della partita e’ quella di sempre');
    await p.close();
  }

  // ---------- chi ha gia' un torneo in corso non e' alla prima visita
  let p = await pagina(Object.assign({ benvenuto:true }, LARGO));
  await p.addInitScript(() => { if (!localStorage.getItem('insectron'))
    localStorage.setItem('insectron', JSON.stringify({ sv:6, r:1, n:2, t:[], k:null })); });
  await p.goto(GIOCA); await p.waitForTimeout(300);
  chk(await p.evaluate(() => !document.querySelector('#s-mode').classList.contains('benvenuto') && S.rankIdx === 1),
      'chi torna con un torneo in corso non vede il benvenuto');
  await p.close();

  // ================= B. un aiuto alla volta
  p = await pagina(Object.assign({ benvenuto:true }, TEL));
  await p.goto(GIOCA); await p.waitForTimeout(300);
  await p.click('#btn-modego'); await p.waitForTimeout(500);
  let h = await p.evaluate(() => ({ on: document.querySelector('.screen.on').id, guida: !document.querySelector('#guida').hidden,
    n: document.querySelector('#guida-n').textContent, nuvola: !document.querySelector('#nuvola').hidden,
    visto: localStorage.getItem('insectron-avvio') }));
  chk(h.on === 's-team' && h.visto === 'visto', '«Scelgo io la squadra» porta al roster, come prima');
  chk(h.guida && h.n === '1 di 4' && !h.nuvola, 'nel roster, la prima volta, c’e’ la guida e non anche la nuvoletta');
  await p.click('#btn-aiuto-squadra'); await p.waitForTimeout(250);
  chk(await p.evaluate(() => !document.querySelector('#nuvola').hidden), 'dal punto interrogativo la nuvoletta si apre comunque');
  await p.evaluate(() => chiudiSpiega());
  chk(await p.evaluate(() => { spiegaFatte.squadra = false; return true; }), '(si rimette la nuvoletta fra quelle da vedere)');
  await p.click('#btn-chmode'); await p.waitForTimeout(250);
  chk(await p.evaluate(() => !!document.querySelector('#modes').offsetParent && !document.querySelector('#s-mode').classList.contains('benvenuto')),
      '«Cambia» apre la scelta completa, non il benvenuto');
  await p.click('#btn-modego'); await p.waitForTimeout(400);
  await p.click('#btn-guida-basta'); await p.waitForTimeout(150);
  await p.click('#btn-auto'); await p.click('#btn-start'); await p.waitForTimeout(200);
  await p.click('#btn-back'); await p.waitForTimeout(500);
  chk(await p.evaluate(() => document.querySelector('#guida').hidden && !document.querySelector('#nuvola').hidden),
      'spenta la guida, al ritorno nel roster la nuvoletta si apre da sola');
  await p.evaluate(() => chiudiSpiega());

  // ================= C. schieramento: ruoli, non la stessa frase
  await p.click('#btn-start'); await p.click('#btn-toarena'); await p.waitForTimeout(400);
  const dep = await p.evaluate(() => {
    const righe = [...document.querySelectorAll('#deplist .dep')];
    return { n: righe.length, ruoli: righe.map(r => (r.querySelector('.ruolo') || {}).textContent || ''),
      attesi: S.units.filter(u => u.side === 'p').map(u => u.isKing ? 'Re' : String(u.d.desc).split('.')[0]),
      lunga: righe.some(r => /in tutte le direzioni|scavalcando/.test(r.textContent)),
      mossa: righe.every(r => /casella|vola|diagonale|linea/.test(r.textContent)),
      alte: Math.max(...righe.map(r => r.getBoundingClientRect().height)) };
  });
  chk(dep.n === 5 && dep.ruoli.join('|') === dep.attesi.join('|'), 'nello schieramento ogni pedina dice il suo ruolo (' + dep.ruoli.join(', ') + ')');
  chk(new Set(dep.ruoli).size >= 3 && dep.ruoli.includes('Re'), 'e i ruoli distinguono le pedine, Re compreso');
  chk(!dep.lunga && dep.mossa, 'il movimento resta, in due parole invece di una frase');
  chk(dep.alte <= 60, 'e le righe restano su due linee (' + Math.round(dep.alte) + ' px)');

  // ================= D. testata compatta in battaglia
  const test1 = await p.evaluate(() => ({ h1: !!document.querySelector('header.top h1').offsetParent,
    h: document.querySelector('header.top').getBoundingClientRect().height, round: !!document.querySelector('#b-round').offsetParent,
    menu: !!document.querySelector('#btn-menu').offsetParent }));
  chk(!test1.h1 && test1.h <= 66 && test1.round && test1.menu, 'sul telefono, in campo, la testata sta su una riga: rank, round e Menu (' + Math.round(test1.h) + ' px)');
  await p.evaluate(() => { leaveMatch(); show('s-team'); }); await p.waitForTimeout(150);
  const test2 = await p.evaluate(() => ({ h1: !!document.querySelector('header.top h1').offsetParent, c: document.body.classList.contains('inCampo') }));
  chk(test2.h1 && !test2.c, 'fuori dal campo il titolo torna');
  await p.close();
  p = await pagina(LARGO);
  await p.goto(GIOCA); await p.waitForTimeout(250);
  await p.click('#btn-modego'); await p.click('#btn-auto'); await p.click('#btn-start'); await p.click('#btn-toarena'); await p.waitForTimeout(250);
  chk(await p.evaluate(() => !!document.querySelector('header.top h1').offsetParent), 'su schermo largo il titolo resta anche in campo');
  await p.close();

  // ================= E. vibrazione
  const conVibra = async (opt) => {
    const q = await pagina(opt);
    await q.addInitScript(() => { window.__v = []; navigator.vibrate = x => { window.__v.push(x); return true; }; });
    await q.goto(GIOCA); await q.waitForTimeout(250);
    await q.click('#btn-modego'); await q.click('#btn-auto'); await q.click('#btn-start'); await q.click('#btn-toarena');
    await q.click('#btn-rand'); await q.click('#btn-fight'); await q.waitForTimeout(250);
    return q;
  };
  p = await conVibra(TEL);
  const fine = await p.evaluate(() => matchMedia('(pointer:coarse)').matches);
  chk(await p.evaluate(() => document.querySelector('#btn-vibra').hidden) === !fine, 'la voce «Vibrazione» nel menu c’e’ dove il puntatore e’ un dito');
  const v = await p.evaluate(() => {
    const m = S.units.find(u => u.side === 'p' && u.alive && !u.isKing), f = S.units.find(u => u.side === 'e' && u.alive && !u.isKing);
    f.guard = 0; window.__v.length = 0;
    strike(m, f, 1, 'attacca'); const colpo = JSON.stringify(window.__v);
    window.__v.length = 0; f.hp = 1; strike(m, f, 1, 'attacca'); const ko = JSON.stringify(window.__v);
    window.__v.length = 0; suona('passo'); suona('clic'); const zitti = window.__v.length;
    return { colpo, ko, zitti };
  });
  chk(v.colpo === '[12]', 'un colpo fa vibrare, breve (' + v.colpo + ')');
  chk(v.ko === '[12,[26,36,26]]', 'un KO vibra due volte in piu’ (' + v.ko + ')');
  chk(v.zitti === 0, 'passi e clic no');
  await p.waitForTimeout(700);
  await p.evaluate(() => { vibraImposta(false); });
  const spento = await p.evaluate(() => {
    const m = S.units.find(u => u.side === 'p' && u.alive && !u.isKing), f = S.units.find(u => u.side === 'e' && u.alive && !u.isKing);
    window.__v.length = 0; strike(m, f, 1, 'attacca');
    return { n: window.__v.length, salvato: localStorage.getItem('insectron-vibra'),
      st: document.querySelector('#st-vibra').textContent, aria: document.querySelector('#btn-vibra').getAttribute('aria-checked') };
  });
  chk(spento.n === 0 && spento.salvato === '0' && spento.st === 'spenta' && spento.aria === 'false', 'spenta dal menu non vibra piu’, e la scelta si ricorda');
  await p.waitForTimeout(500);
  const pc = await p.evaluate(() => {
    vibraImposta(true); S.vs = 'pvp';
    const m = S.units.find(u => u.side === 'p' && u.alive && !u.isKing), f = S.units.find(u => u.side === 'e' && u.alive && !u.isKing);
    window.__v.length = 0; strike(m, f, 1, 'attacca'); S.vs = 'hvp';
    return window.__v.length;
  });
  chk(pc === 0, 'in una partita fra computer il telefono non vibra');
  await p.close();
  p = await pagina(LARGO);
  await p.goto(GIOCA); await p.waitForTimeout(250);
  chk(await p.evaluate(() => document.querySelector('#btn-vibra').hidden), 'col mouse la voce non compare');

  // ================= F. tacca e barra dei gesti
  const sa = await p.evaluate(() => {
    const css = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
    const blocco = sel => { const i = css.indexOf(sel); return i < 0 ? '' : css.slice(i, css.indexOf('}', i)); };
    return { meta: document.querySelector('meta[name="viewport"]').content,
      wrap: /\.wrap\{\s*padding:max\(16px, env\(safe-area-inset-top\)\)[^}]*env\(safe-area-inset-bottom\)[^}]*env\(safe-area-inset-left\)/.test(css),
      barra: /env\(safe-area-inset-bottom\)/.test(blocco('.unitcard.ancorata{')),
      pad: getComputedStyle(document.querySelector('.wrap')).paddingLeft };
  });
  chk(/viewport-fit=cover/.test(sa.meta), 'la pagina arriva ai bordi dello schermo (viewport-fit=cover)');
  chk(sa.wrap && sa.barra, 'e margini e barra delle azioni tengono conto di tacca e barra dei gesti');
  chk(sa.pad === '16px', 'dove non ci sono, il margine resta quello di prima (' + sa.pad + ')');
  await p.close();

  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
