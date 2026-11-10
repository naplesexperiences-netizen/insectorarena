const { chromium, GIOCA } = require('./comune');
/* Il turno si legge sul campo: il colpo scritto sul bersaglio prima di darlo,
   la mossa che si ritira, le caselle sotto tiro, la scia e il riepilogo del
   turno avversario, «Fine turno» che dice chi puo' ancora agire, la barra
   bassa sul telefono che non rimpicciolisce il campo, e il round dopo che
   riparte con la stessa squadra e lo stesso schieramento. */
(async () => {
  const b = await chromium.launch();
  const ok=[], ko=[]; const chk=(c,n)=>{ (c?ok:ko).push(n); };
  const errs=[];
  const apri = async (vp, tel) => {
    const p = await b.newPage({ viewport: vp, hasTouch: !!tel });
    p.on('pageerror', e=>errs.push(e.message));
    p.on('console', m=>{ if(m.type()==='error') errs.push(m.text()); });
    await p.addInitScript(() => { try { localStorage.setItem('insectron-spiega',
      JSON.stringify({ squadra:true, campo:true, zoo:true, mondo:true })); } catch(e){} });
    await p.goto(GIOCA); await p.waitForTimeout(300);
    if (await p.$('#s-mode.on')) await p.click('#btn-modego');
    await p.click('#btn-auto'); await p.click('#btn-start'); await p.click('#btn-toarena');
    await p.click('#btn-rand'); await p.click('#btn-fight'); await p.waitForTimeout(300);
    await p.evaluate(() => { const g = document.querySelector('.guida button'); if (g) g.click(); });
    return p;
  };
  /* Una mia pedina in mezzo al campo con due avversari accanto, il resto lontano. */
  const scena = p => p.evaluate(() => {
    const miei = S.units.filter(u => u.side === 'p' && u.alive);
    const loro = S.units.filter(u => u.side === 'e' && u.alive);
    miei.forEach((u,i) => { u.x = i; u.y = 6; u.acted = false; u.moved = false; u.cd = 0; });
    loro.forEach((u,i) => { u.x = i; u.y = 0; u.guard = 0; u.stun = 0; u.exposed = false; u.hp = u.maxHp; });
    const m = miei.find(u => !u.isKing); m.x = 2; m.y = 4;
    const f = loro.filter(u => !u.isKing);
    f[0].x = 2; f[0].y = 3; f[1].x = 3; f[1].y = 3;
    S.sel = null; S.mode = 'idle'; draw();
    window.M = m; window.F = f;
  });

  // ================= A. schermo largo
  let p = await apri({ width:1280, height:950 });
  await scena(p);
  chk(await p.$$eval('.tok .prev', e => e.every(x => !x.textContent)), 'senza pedina scelta nessun bersaglio porta un numero');
  await p.click('.cell[data-xy="2,4"]'); await p.waitForTimeout(150);
  const prev = await p.evaluate(() => F.slice(0,2).map(f => {
    const e = tokEl(f);
    return { t: e.querySelector('.prev').textContent, att: estDmg(M, f, 1),
             w: parseFloat(e.querySelector('.hpbar b').style.width), mira: e.classList.contains('mira'),
             vis: getComputedStyle(e.querySelector('.prev')).display !== 'none' };
  }));
  chk(prev.every(q => q.t === '−' + q.att && q.vis), 'scelta una pedina, sui bersagli sta scritto il colpo stimato (' + prev.map(q => q.t).join(', ') + ')');
  chk(prev.every(q => q.mira && q.w > 0 && q.w <= 100), 'e il tratto di vita che se ne andra’ e’ segnato sulla barra');
  chk(await p.evaluate(() => S.units.filter(u => !F.slice(0,2).includes(u)).every(u => !tokEl(u) || !tokEl(u).querySelector('.prev').textContent)),
      'solo sui bersagli a portata');
  chk(/colpo stimato \d+/.test(await p.getAttribute('.cell[data-xy="2,3"]', 'aria-label')), 'la stima sta anche nel nome parlato della casella');

  /* «KO» e' una promessa: si scrive solo se il bersaglio cade col tiro piu' basso. */
  const onesto = await p.evaluate(() => {
    const f = F[0], d = estDmg(M, f, 1);
    f.hp = Math.floor(d * .9); draw();
    const scritto = tokEl(f).querySelector('.prev').textContent;
    f.hp = Math.floor(d * .9) + 1; draw();
    const sopra = tokEl(f).querySelector('.prev').textContent;
    let caduti = 0;
    for (let i = 0; i < 40; i++){
      f.alive = true; f.hp = Math.floor(d * .9); M.acted = false;
      strike(M, f, 1, 'attacca'); if (!f.alive) caduti++;
    }
    f.alive = true; f.hp = f.maxHp; ANNULLA = null; draw();
    return { scritto, sopra, caduti };
  });
  chk(onesto.scritto === 'KO' && onesto.sopra !== 'KO', 'KO compare solo quando il colpo abbatte anche tirando basso');
  chk(onesto.caduti === 40, 'e dove c’e’ scritto KO il bersaglio cade davvero, 40 colpi su 40');
  await p.waitForTimeout(900);
  await scena(p);

  // ---------- annulla mossa
  await p.click('.cell[data-xy="2,4"]'); await p.waitForTimeout(120);
  chk(!(await p.$('#btn-annulla')), 'prima di muovere non c’e’ niente da annullare');
  await p.click('.cell[data-xy="1,4"]'); await p.waitForTimeout(200);
  chk(await p.evaluate(() => M.x === 1 && M.y === 4 && M.moved), 'la casella blu sposta subito');
  const acts = await p.$$eval('#acts button', q => q.map(x => x.textContent));
  chk(acts[0] === 'Annulla mossa' && acts.length === 4, 'e al posto di «Già mossa» c’e’ «Annulla mossa»');
  await p.click('#btn-annulla'); await p.waitForTimeout(200);
  chk(await p.evaluate(() => M.x === 2 && M.y === 4 && !M.moved && !M.acted && S.sel === M), 'che riporta la pedina dov’era, ancora scelta e con la mossa da spendere');
  chk((await p.$$('.cell.mv')).length > 0, 'e il campo torna a mostrare dove puo’ andare');
  /* dopo un colpo non si ritira piu' niente */
  await p.click('.cell[data-xy="1,4"]'); await p.waitForTimeout(150);
  await p.evaluate(() => { const a = S.units.find(u => u.side === 'p' && u.alive && u !== M && !u.isKing); a.x = 3; a.y = 4; draw(); window.A = a; });
  await p.click('.cell[data-xy="3,4"]'); await p.waitForTimeout(120);
  await p.click('.cell[data-xy="3,3"]'); await p.waitForTimeout(250);
  await p.click('.cell[data-xy="1,4"]'); await p.waitForTimeout(150);
  chk(!(await p.$('#btn-annulla')), 'dato un colpo, la mossa di prima non si ritira piu’');
  chk(await p.$$eval('#acts button', q => q[0].textContent.startsWith('Gi') && q[0].disabled), 'e torna «Già mossa»');
  await p.waitForTimeout(700);
  /* la casella di partenza occupata: niente annulla */
  await scena(p);
  await p.click('.cell[data-xy="2,4"]'); await p.click('.cell[data-xy="1,4"]'); await p.waitForTimeout(150);
  await p.evaluate(() => { const a = S.units.find(u => u.side === 'p' && u.alive && u !== M && !u.isKing); a.x = 2; a.y = 4; draw(); });
  chk(!(await p.$('#btn-annulla')), 'se la casella di partenza e’ occupata non si offre');

  // ---------- fine turno
  await scena(p);
  const fine = await p.$eval('#btn-end', e => ({ r: e.dataset.resto, l: e.getAttribute('aria-label'), p: e.classList.contains('pronto'), t: e.textContent }));
  chk(fine.r === '5' && /5 pedine possono ancora agire/.test(fine.l) && !fine.p && fine.t === 'Fine turno',
      '«Fine turno» dice quante pedine possono ancora agire (' + fine.r + ')');
  chk(/Possono ancora agire: 5/.test(await p.innerText('#ucard')) && new RegExp(await p.evaluate(() => M.d.name)).test(await p.innerText('#ucard')),
      'e sotto si legge chi ha un bersaglio a tiro');
  await p.evaluate(() => { S.units.filter(u => u.side === 'p' && u.alive).forEach(u => u.acted = true); draw(); });
  const fine2 = await p.$eval('#btn-end', e => ({ r: e.dataset.resto, l: e.getAttribute('aria-label'), p: e.classList.contains('pronto') }));
  chk(fine2.r === undefined && fine2.l === null && fine2.p, 'quando hanno agito tutte il numero sparisce e il pulsante si fa notare');
  chk(await p.$$eval('button.primary', q => q.filter(x => x.offsetParent).length) === 1, 'resta un solo primario a video');

  // ---------- caselle sotto tiro
  await scena(p);
  chk((await p.$$('.cell.risk')).length === 0 && await p.getAttribute('#btn-pericolo', 'aria-pressed') === 'false', 'le caselle sotto tiro partono spente');
  await p.click('#btn-pericolo'); await p.waitForTimeout(120);
  chk(await p.getAttribute('#btn-pericolo', 'aria-pressed') === 'true' && (await p.$$('.cell.risk')).length > 0, 'il mirino le accende');
  /* Coerenza con le regole: 40 campi a caso, e ogni casella che un avversario
     puo' colpire con l'attacco normale dopo una mossa sta dentro al tratteggio. */
  const coer = await p.evaluate(() => {
    let buchi = 0, fuori = 0, stord = 0;
    for (let g = 0; g < 40; g++){
      const libere = [];
      for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) libere.push([x,y]);
      S.units.filter(u => u.alive).forEach(u => {
        const i = Math.floor(Math.random() * libere.length);
        u.x = libere[i][0]; u.y = libere[i][1]; libere.splice(i,1);
        u.stun = 0; u.cd = Math.floor(Math.random() * 3);
      });
      const set = sottoTiro();
      S.units.filter(e => e.alive && e.side === 'e').forEach(e => {
        [{x:e.x,y:e.y}].concat(moves(e)).forEach(q => {
          for (let dx=-1; dx<=1; dx++) for (let dy=-1; dy<=1; dy++){
            if (!dx && !dy) continue;
            if (inB(q.x+dx, q.y+dy) && !set.has((q.x+dx) + ',' + (q.y+dy))) buchi++;
          }
        });
      });
      set.forEach(k => { const [x,y] = k.split(',').map(Number); if (!inB(x,y)) fuori++; });
      /* chi e' immobilizzato salta il turno: da solo non mette sotto tiro niente */
      S.units.filter(e => e.alive && e.side === 'e').forEach(e => e.stun = 2);
      stord += sottoTiro().size;
    }
    return { buchi, fuori, stord };
  });
  chk(coer.buchi === 0 && coer.fuori === 0, 'su 40 campi a caso ogni casella colpibile dopo una mossa sta nel tratteggio');
  chk(coer.stord === 0, 'e chi e’ immobilizzato non mette sotto tiro niente');
  await scena(p);
  chk(/sotto tiro/.test(await p.getAttribute('.cell.risk', 'aria-label')), 'lo dice anche il nome parlato della casella');
  chk(await p.evaluate(() => localStorage.getItem('insectron-pericolo')) === '1', 'la scelta si ricorda');
  await p.click('#btn-pericolo'); await p.waitForTimeout(120);
  chk((await p.$$('.cell.risk')).length === 0, 'e ritoccandolo si spengono');

  // ---------- turno avversario: scia e riepilogo
  await scena(p);
  const foto = await p.evaluate(() => ({
    hp: S.units.filter(u => u.side === 'p' && u.alive).reduce((s,u) => s + u.hp, 0),
    pos: S.units.filter(u => u.side === 'e' && u.alive).map(u => u.uid + ':' + u.x + ',' + u.y)
  }));
  await p.click('#btn-end');
  await p.waitForFunction(() => (S.turn === 'p' && !S.busy) || S.over, null, { timeout: 30000 });
  await p.waitForTimeout(200);
  const dopo = await p.evaluate(() => ({
    hp: S.units.filter(u => u.side === 'p').reduce((s,u) => s + Math.max(0, u.alive ? u.hp : 0), 0),
    pos: S.units.filter(u => u.side === 'e' && u.alive).map(u => u.uid + ':' + u.x + ',' + u.y),
    scie: document.querySelectorAll('#scie circle').length, n: SCIA.length,
    riep: (document.querySelector('#ucard .riep') || {}).textContent || '',
    over: S.over
  }));
  const mosse = dopo.pos.filter(q => !foto.pos.includes(q)).length;
  chk(dopo.n === mosse && dopo.scie === mosse && mosse > 0, 'ogni pedina avversaria che si e’ mossa lascia la sua scia (' + mosse + ')');
  chk(/Turno avversario/.test(dopo.riep), 'e il turno avversario e’ riassunto in una riga');
  const tolti = (dopo.riep.match(/−(\d+)/g) || []).reduce((s,q) => s + Number(q.slice(1)), 0);
  chk(dopo.over || /KO|ammaliata/.test(dopo.riep) || tolti === foto.hp - dopo.hp, 'coi danni veri: ' + tolti + ' scritti, ' + (foto.hp - dopo.hp) + ' presi');
  chk(dopo.riep.indexOf(mosse === 1 ? '1 pedina mossa' : mosse + ' pedine mosse') >= 0, 'e il numero delle pedine mosse');
  if (!dopo.over){
    await p.evaluate(() => { const u = S.units.find(q => q.side === 'p' && q.alive && !q.acted && moves(q).length); window.U = u; S.sel = u; draw(); });
    const dest = await p.$eval('.cell.mv', c => c.dataset.xy);
    await p.click('.cell[data-xy="' + dest + '"]'); await p.waitForTimeout(150);
    chk((await p.$$('#scie')).length === 0, 'alla prima mossa le scie spariscono');
  } else chk(true, 'alla prima mossa le scie spariscono (partita finita prima)');

  // ---------- prossimo round
  const sch = await p.evaluate(() => JSON.stringify(SCHIERA.pos));
  await p.evaluate(() => { S.over = false; S.units.filter(u => u.side === 'e').forEach(u => u.alive = false); checkEnd(); });
  await p.waitForSelector('#s-result.on'); await p.waitForTimeout(200);
  const ris = await p.evaluate(() => ({
    sub: !document.querySelector('#btn-subito').hidden, t: document.querySelector('#btn-subito').textContent,
    nx: document.querySelector('#btn-next').textContent,
    prim: [...document.querySelectorAll('#s-result .result > .acts button.primary')].filter(x => x.offsetParent).length,
    round: S.round
  }));
  chk(ris.sub && ris.t === 'Prossimo round' && ris.nx === 'Cambia squadra', 'vinto un round, il risultato offre «Prossimo round» accanto a «Cambia squadra»');
  chk(ris.prim === 1, 'con un solo primario fra i due');
  await p.click('#btn-subito'); await p.waitForTimeout(400);
  const r2 = await p.evaluate(() => ({ on: document.querySelector('.screen.on').id, fase: S.phase, round: S.round,
    pos: JSON.stringify(S.units.filter(u => u.side === 'p').map(u => [u.x, u.y])),
    re: S.units.filter(u => u.side === 'p' && u.isKing).length, nem: S.units.filter(u => u.side === 'e' && u.alive).length,
    turno: S.turn, log: document.querySelector('#log').textContent }));
  chk(r2.on === 's-battle' && r2.fase === 'battle' && r2.turno === 'p', 'e porta dritto in battaglia, saltando roster, riepilogo e schieramento');
  chk(r2.pos === sch && r2.re === 1 && r2.nem === 5, 'con lo stesso schieramento, lo stesso Re e cinque avversari nuovi');
  chk(r2.round === ris.round && /Round 2\/5/.test(r2.log), 'contro l’avversario del round dopo');
  /* sconfitta: si riprova */
  await p.evaluate(() => { S.units.filter(u => u.side === 'p').forEach(u => u.alive = false); checkEnd(); });
  await p.waitForSelector('#s-result.on'); await p.waitForTimeout(200);
  chk(await p.$eval('#btn-subito', e => !e.hidden && e.textContent === 'Riprova subito'), 'dopo una sconfitta il pulsante diventa «Riprova subito»');
  /* «Cambia squadra» fa quello che faceva «Continua» */
  await p.click('#btn-next'); await p.waitForTimeout(250);
  chk(await p.evaluate(() => document.querySelector('.screen.on').id === 's-team'), '«Cambia squadra» riporta al roster');
  /* squadra cambiata dopo il risultato: si schiera a mano */
  await p.click('#btn-start'); await p.click('#btn-toarena'); await p.click('#btn-rand'); await p.click('#btn-fight'); await p.waitForTimeout(250);
  await p.evaluate(() => { S.units.filter(u => u.side === 'e').forEach(u => u.alive = false); checkEnd(); });
  await p.waitForSelector('#s-result.on'); await p.waitForTimeout(150);
  await p.evaluate(() => { S.kingId = S.team.find(id => id !== S.kingId); });
  await p.click('#btn-subito'); await p.waitForTimeout(300);
  chk(await p.evaluate(() => S.phase === 'deploy' && toPlace().length === 5), 'se nel frattempo la squadra e’ cambiata, si torna a schierare a mano');
  /* rank conquistato: ci sono premi e reclute da vedere, niente scorciatoia */
  await p.click('#btn-rand'); await p.click('#btn-fight'); await p.waitForTimeout(250);
  await p.evaluate(() => { S.round = 4; S.units.filter(u => u.side === 'e').forEach(u => u.alive = false); checkEnd(); });
  await p.waitForSelector('#s-result.on'); await p.waitForTimeout(150);
  chk(await p.evaluate(() => document.querySelector('#btn-subito').hidden && document.querySelector('#btn-next').classList.contains('primary')
        && document.querySelector('#btn-next').textContent === 'Continua'), 'a rank conquistato resta solo «Continua»');
  await p.close();

  // ================= B. telefono: la barra bassa
  for (const vp of [{ width:390, height:780 }, { width:360, height:640 }, { width:320, height:700 }]){
    p = await apri(vp, true);
    const nome = vp.width + '×' + vp.height;
    await p.evaluate(() => window.scrollTo(0, document.querySelector('#boardwrap').getBoundingClientRect().top + scrollY - 8));
    await p.waitForTimeout(200);
    const w0 = await p.evaluate(() => document.querySelector('#board').getBoundingClientRect().width);
    const mia = await p.evaluate(() => { const u = S.units.find(q => q.side === 'p' && q.alive && moves(q).length); return u.x + ',' + u.y; });
    await p.click('.cell[data-xy="' + mia + '"]'); await p.waitForTimeout(900);
    const g = await p.evaluate(() => {
      const c = document.querySelector('#ucard'), cr = c.getBoundingClientRect(), br = document.querySelector('#board').getBoundingClientRect();
      const vis = s => { const e = c.querySelector(s); return !!e && getComputedStyle(e).display !== 'none'; };
      return { w: br.width, giu: br.bottom, su: cr.top, h: cr.height, anc: c.classList.contains('ancorata'),
        stats: vis('.stats'), moves: vis('.moves'), mini: vis('.mini'), sw: document.documentElement.scrollWidth, iw: innerWidth,
        bott: [...c.querySelectorAll('#acts button')].every(x => x.getBoundingClientRect().height >= 44),
        tb: document.querySelector('#turnbar').getBoundingClientRect().height };
    });
    if (vp.height >= 780)
      chk(Math.abs(g.w - w0) < 1, nome + ': scelta una pedina il campo non cambia misura (' + Math.round(w0) + ' → ' + Math.round(g.w) + ' px)');
    else
      chk(g.w / 5 >= 44, nome + ': su uno schermo basso le caselle restano almeno da 44 px (' + Math.round(g.w / 5) + ')');
    chk(g.anc && g.giu <= g.su + 1, nome + ': la barra non copre l’ultima fila del campo (campo ' + Math.round(g.giu) + ', barra ' + Math.round(g.su) + ')');
    chk(g.h <= 190 && !g.stats && !g.moves && g.mini, nome + ': la barra porta nome, tre numeri e azioni, in ' + Math.round(g.h) + ' px');
    chk(g.bott, nome + ': con pulsanti da almeno 44 px');
    chk(g.sw <= g.iw, nome + ': niente scorrimento orizzontale');
    chk(await p.isVisible('#btn-pericolo') && await p.isVisible('#btn-end'), nome + ': mirino e «Fine turno» restano a vista');
    await p.close();
  }

  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
