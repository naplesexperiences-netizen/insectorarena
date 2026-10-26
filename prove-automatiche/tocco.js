const { chromium, GIOCA } = require('./comune');
/* Un gesto solo in tutto il gioco: tocco breve = scegli, tocco lungo = ti dico
   tutto. Piu' il campo che si illumina da solo e il countdown della speciale. */
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1280,height:950} });
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  p.on('console', m=>{ if(m.type()==='error') errs.push(m.text()); });
  const ok=[], ko=[]; const chk=(c,n)=>{ (c?ok:ko).push(n); };
  const URL = GIOCA;

  /* Tiene premuto davvero: giu', aspetta, su. */
  const premiLungo = async (sel, ms=700) => {
    const box = await p.locator(sel).first().boundingBox();
    await p.mouse.move(box.x + box.width/2, box.y + box.height/2);
    await p.mouse.down(); await p.waitForTimeout(ms); await p.mouse.up();
  };
  const tocca = async (sel) => {
    const box = await p.locator(sel).first().boundingBox();
    await p.mouse.move(box.x + box.width/2, box.y + box.height/2);
    await p.mouse.down(); await p.waitForTimeout(60); await p.mouse.up();
  };

  await p.goto(URL); await p.waitForTimeout(300);
  if (await p.$('#s-mode.on')) await p.click('#btn-modego');
  await p.waitForTimeout(400);
  await p.evaluate(() => chiudiSpiega());

  // ---------- A. roster: breve mette in squadra, lungo apre la scheda
  chk(await p.evaluate(() => S.team.length === 0), 'si parte senza squadra');
  const primo = await p.getAttribute('#roster .mon', 'data-id');
  await tocca('#roster .mon'); await p.waitForTimeout(250);
  chk(await p.evaluate(() => S.team.length === 1), 'il tocco breve mette in squadra');
  chk(!(await p.isVisible('#uni-box')), 'e non apre niente');
  await tocca('#roster .mon'); await p.waitForTimeout(250);
  chk(await p.evaluate(() => S.team.length === 0), 'toccandolo di nuovo lo toglie');

  await premiLungo('#roster .mon'); await p.waitForTimeout(300);
  chk(await p.isVisible('#uni-box'), 'il tocco lungo apre le caratteristiche');
  chk(await p.evaluate(() => S.team.length === 0), 'e non lo mette in squadra');
  const t = await p.innerText('#uni-corpo');
  chk(/VITA/.test(t) && /FORZA/.test(t) && /Movimento/.test(t), 'con vita, forza e movimento');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);

  // tasto destro: stessa cosa
  await p.locator('#roster .mon').first().click({ button:'right' }); await p.waitForTimeout(300);
  chk(await p.isVisible('#uni-box'), 'anche il tasto destro apre le caratteristiche');
  chk(await p.evaluate(() => S.team.length === 0), 'senza mettere in squadra');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);

  // tastiera: Invio = tocco breve
  await p.evaluate(() => document.querySelector('#roster .mon').focus());
  await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  chk(await p.evaluate(() => S.team.length === 1), 'da tastiera Invio vale come tocco breve');
  await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  chk(await p.evaluate(() => S.team.length === 0), 'e ritoccandolo lo toglie');

  // squadra piena: invece di non far niente, dice perche'
  await p.evaluate(() => { S.team = UNITS.filter(unlocked).slice(0,5).map(u => u.id); drawRoster(); drawSlots(); });
  await p.waitForTimeout(250);
  const sesto = await p.evaluate(() => [...document.querySelectorAll('#roster .mon')]
    .find(b => !S.team.includes(b.dataset.id)).dataset.id);
  await tocca('#roster .mon:not(.sel)'); await p.waitForTimeout(300);
  chk(await p.isVisible('#uni-box'), 'a squadra piena il tocco breve apre la scheda, che spiega');
  chk(await p.evaluate(() => S.team.length === 5), 'e la squadra resta di cinque');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);

  // ---------- B. in battaglia
  await p.evaluate(() => { S.kingId = S.team[0]; });
  await p.evaluate(() => { document.querySelector('#btn-start').click(); });
  await p.waitForTimeout(350);
  await p.evaluate(() => { document.querySelector('#btn-toarena').click(); });
  await p.waitForTimeout(350);
  await p.evaluate(() => { document.querySelector('#btn-rand').click(); });
  await p.waitForTimeout(250);
  await p.evaluate(() => { document.querySelector('#btn-fight').click(); });
  await p.waitForTimeout(600);
  await p.evaluate(() => chiudiSpiega());
  chk(await p.evaluate(() => S.phase === 'battle'), 'la battaglia e cominciata');

  // nessuna casella accesa finche non si sceglie
  chk(await p.evaluate(() => document.querySelectorAll('.cell.mv, .cell.tg').length === 0),
      'senza pedina scelta il campo e spento');

  // scelgo una mia pedina col tocco breve
  const mia = await p.evaluate(() => {
    const u = S.units.find(x => x.side === 'p' && x.alive && !x.acted);
    return { xy: u.x + ',' + u.y, uid: u.uid };
  });
  await tocca('[data-xy="' + mia.xy + '"]'); await p.waitForTimeout(300);
  chk(await p.evaluate(u => S.sel && S.sel.uid === u, mia.uid), 'il tocco breve sceglie la pedina');
  chk(await p.evaluate(() => S.mode === 'idle'), 'senza entrare in nessuna modalita');
  const acc = await p.evaluate(() => ({
    blu: document.querySelectorAll('.cell.mv').length,
    rosso: document.querySelectorAll('.cell.tg').length,
    mosse: moves(S.sel).length,
    nemici: foesAdj(S.sel).length
  }));
  chk(acc.blu === acc.mosse && acc.blu > 0,
      'e subito il campo mostra in blu dove puo andare (' + acc.blu + ' caselle)');
  chk(acc.rosso === acc.nemici, 'e in rosso chi puo colpire (' + acc.rosso + ')');

  /* Blu e rosso erano la richiesta alla lettera: il colore si legge a
     transizione finita, non un istante dopo draw(). */
  await p.evaluate(() => {
    const mia = S.sel; mia.x = 2; mia.y = 3;
    S.units.filter(u => u !== mia && u.side === 'p' && u.alive).forEach((u,i) => { u.x = i; u.y = 6; });
    const nem = S.units.filter(u => u.side === 'e' && u.alive);
    nem[0].x = 2; nem[0].y = 2;
    nem.slice(1).forEach((u,i) => { u.x = i; u.y = 0; });
    draw();
  });
  await p.waitForTimeout(420);
  const col = await p.evaluate(() => {
    const leggi = s => { const c = document.querySelector(s); const g = getComputedStyle(c);
      return { sf: g.backgroundColor, bo: g.borderTopColor }; };
    return { mv: leggi('.cell.mv'), tg: leggi('.cell.tg') };
  });
  chk(col.mv.sf === 'rgb(22, 64, 92)' && col.mv.bo === 'rgb(75, 195, 255)',
      'le caselle del movimento sono blu (' + col.mv.sf + ', bordo ' + col.mv.bo + ')');
  chk(col.tg.sf === 'rgb(92, 31, 34)' && col.tg.bo === 'rgb(255, 107, 107)',
      'quelle dell attacco sono rosse (' + col.tg.sf + ', bordo ' + col.tg.bo + ')');

  // una casella blu si tocca e la pedina ci va
  const blu = await p.evaluate(() => { const c = document.querySelector('.cell.mv'); return c.dataset.xy; });
  await tocca('[data-xy="' + blu + '"]'); await p.waitForTimeout(400);
  chk(await p.evaluate(({xy, uid}) => { const u = S.units.find(x => x.uid === uid);
        return u.x + ',' + u.y === xy && u.moved; }, { xy: blu, uid: mia.uid }),
      'toccando una casella blu la pedina ci si sposta, senza premere «Muovi»');

  // il tocco lungo su una pedina apre la sua scheda
  await p.evaluate(() => { S.sel = null; S.mode = 'idle'; draw(); }); await p.waitForTimeout(200);
  const nemico = await p.evaluate(() => { const u = S.units.find(x => x.side === 'e' && x.alive);
    return u.x + ',' + u.y; });
  await premiLungo('[data-xy="' + nemico + '"]'); await p.waitForTimeout(350);
  chk(await p.isVisible('#uni-box'), 'il tocco lungo in campo apre la scheda della pedina');
  const tc = await p.innerText('#uni-corpo');
  chk(/VITA/.test(tc) && /Attacco/.test(tc) && /Movimento/.test(tc),
      'con mosse e caratteristiche');
  chk(await p.evaluate(() => S.sel === null), 'e tenere premuto su un avversario non lo seleziona');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);

  // ---------- C. il countdown della speciale
  const cd = await p.evaluate(() => {
    const u = S.units.find(x => x.side === 'p' && x.alive);
    u.acted = false; u.cd = 2; S.sel = u; S.mode = 'idle'; draw();
    const tok = document.querySelector('[data-uid="' + u.uid + '"] .cdn');
    const bottoni = [...document.querySelectorAll('#acts button')].map(b => b.textContent);
    return { targhetta: tok ? tok.textContent : null,
             visibile: tok ? !!tok.getClientRects().length : false,
             bottoni, scheda: document.querySelector('#ucard').innerText };
  });
  chk(cd.targhetta === '2' && cd.visibile, 'sulla pedina compare il numero dei turni che mancano');
  chk(cd.bottoni.some(x => / fra 2$/.test(x)), 'e il pulsante della speciale dice fra quanti: ' + JSON.stringify(cd.bottoni));
  chk(/pronta fra 2 turni/.test(cd.scheda), 'la scheda lo scrive per esteso');
  const cd0 = await p.evaluate(() => {
    const u = S.sel; u.cd = 0; draw();
    const tok = document.querySelector('[data-uid="' + u.uid + '"] .cdn');
    return { testo: tok.textContent, visibile: !!tok.getClientRects().length,
             bottoni: [...document.querySelectorAll('#acts button')].map(b => b.textContent) };
  });
  chk(cd0.testo === '' && !cd0.visibile, 'a ricarica finita la targhetta sparisce invece di dire zero');
  chk(!cd0.bottoni.some(x => /fra/.test(x)), 'e il pulsante torna al nome della mossa');

  // ---------- D. i suggerimenti lo spiegano
  const giri = await p.evaluate(() => Object.keys(GIRI));
  chk(giri.includes('squadra') && giri.includes('campo'), 'ci sono i giri del roster e del campo');
  const testi = await p.evaluate(() =>
    GIRI.squadra.passi.concat(GIRI.campo.passi).map(x => x.testo).join(' '));
  chk(/Tieni premuto/.test(testi), 'e i suggerimenti nominano il tocco lungo');
  chk(/tasto destro/.test(testi), 'dicendo anche del tasto destro');
  chk(/blu/.test(testi) && /rosso/.test(testi), 'e spiegano il blu e il rosso');
  chk(/ricarica|fra quanti turni/.test(testi), 'e la ricarica della speciale');
  chk(await p.isVisible('#btn-aiuto-campo'), 'in battaglia c\'e il punto interrogativo');
  await p.click('#btn-aiuto-campo'); await p.waitForTimeout(500);
  chk(await p.isVisible('#nuvola'), 'che riapre la spiegazione del campo');
  const vicino = await p.evaluate(() => {
    const out = [];
    for (let i = 0; i < passiVivi('campo').length; i++){
      passoIdx = i; disegnaNuvola();
      const t = bersaglio(passiVivi('campo')[i]).getBoundingClientRect();
      const n = document.querySelector('#nuvola').getBoundingClientRect();
      const dx = Math.max(0, Math.max(t.left - n.right, n.left - t.right));
      const dy = Math.max(0, Math.max(t.top - n.bottom, n.top - t.bottom));
      out.push(Math.round(Math.hypot(dx, dy)));
    }
    return out;
  });
  chk(vicino.every(d => d <= 26), 'con ogni nuvoletta attaccata al suo pezzo (' + vicino.join(', ') + ' px)');
  await p.evaluate(() => chiudiSpiega());

  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
