const { chromium, GIOCA } = require('./comune');
const ok = [], ko = [];
const chk = (c, m) => (c ? ok : ko).push(m);

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1280,height:950} });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  await p.goto(GIOCA);

  chk(await p.isVisible('#s-mode'), 'entrando nel gioco si sceglie subito chi gioca');
  await p.click('[data-mode="hvh"]'); await p.waitForTimeout(100);
  chk(await p.isVisible('#n1') && await p.isVisible('#n2'), 'in Human vs Human si danno i nomi');
  chk(!(await p.$('#lv-e')), 'in Human vs Human non si sceglie la difficolta');
  await p.fill('#n1', 'Ada'); await p.fill('#n2', 'Bruno');
  await p.click('#btn-modego'); await p.waitForTimeout(150);
  chk(await p.isVisible('#s-team'), 'poi si compone la prima squadra');
  chk((await p.innerText('#team-who')).includes('Human'), 'il banner del roster dice chi gioca');

  // squadra del torneo, per verificare che non venga persa
  await p.click('#btn-auto'); await p.waitForTimeout(80);
  const careerTeam = await p.evaluate(() => S.team.slice());
  await p.click('#btn-start'); await p.waitForTimeout(80);
  await p.click('#btn-toarena'); await p.waitForTimeout(150);
  chk(await p.isVisible('#pass'), 'confermata la prima squadra si passa il dispositivo');
  chk((await p.innerText('#pass-who')).trim() === 'Bruno', 'la consegna nomina il secondo giocatore');
  await p.click('#btn-pass'); await p.waitForTimeout(120);
  chk((await p.innerText('#team-who')).includes('Bruno'), 'il secondo giocatore sceglie la sua squadra');

  const roster = async () => {
    await p.click('#btn-auto'); await p.waitForTimeout(60);
    await p.click('#btn-start'); await p.waitForTimeout(60);
    await p.click('#btn-toarena'); await p.waitForTimeout(120);
  };
  await roster();

  // ---- schieramento ----
  chk(await p.isVisible('#pass'), 'passaggio prima dello schieramento');
  await p.click('#btn-pass'); await p.waitForTimeout(120);
  chk(await p.isVisible('#s-battle'), 'si entra in arena');
  let tok = await p.evaluate(() => document.querySelectorAll('#layer [data-uid]').length);
  chk(tok === 0, 'a inizio schieramento il campo e vuoto (' + tok + ')');
  await p.click('#btn-rand'); await p.waitForTimeout(120);
  tok = await p.evaluate(() => document.querySelectorAll('#layer [data-uid]').length);
  const rows = await p.evaluate(() => S.units.filter(u=>u.side==='p').map(u=>u.y));
  chk(tok === 5, 'si vedono solo le 5 pedine di chi schiera (' + tok + ')');
  chk(rows.every(y => y >= 5), 'il primo giocatore schiera nelle due file in basso');
  await p.click('#btn-fight'); await p.waitForTimeout(80);
  chk(await p.isVisible('#pass'), 'passaggio fra i due schieramenti');
  await p.click('#btn-pass'); await p.waitForTimeout(120);
  tok = await p.evaluate(() => document.querySelectorAll('#layer [data-uid]').length);
  chk(tok === 0, 'il secondo non vede lo schieramento del primo (' + tok + ' pedine a schermo)');
  await p.click('#btn-rand'); await p.waitForTimeout(120);
  const rows2 = await p.evaluate(() => S.units.filter(u=>u.side==='e').map(u=>u.y));
  chk(rows2.every(y => y <= 1), 'il secondo giocatore schiera nelle due file in alto');
  await p.click('#btn-fight'); await p.waitForTimeout(80);
  chk(await p.isVisible('#pass'), 'passaggio prima del primo turno');
  await p.click('#btn-pass'); await p.waitForTimeout(150);
  tok = await p.evaluate(() => document.querySelectorAll('#layer [data-uid]').length);
  chk(tok === 10, 'a battaglia iniziata si vedono tutte e dieci le pedine (' + tok + ')');

  // ---- rotazione della scacchiera ----
  const mapTurno = async () => p.evaluate(() => ({
    turno: S.turn,
    alto: document.querySelector('[data-vxy="0,0"]').dataset.xy,
    basso: document.querySelector('[data-vxy="0,6"]').dataset.xy,
    reBasso: (() => { const k = S.units.find(u => u.isKing && u.side === S.turn);
      const el = document.querySelector('[data-uid="' + k.uid + '"]');
      return el ? parseFloat(el.style.top) : -1; })()
  }));
  const m1 = await mapTurno();
  chk(m1.turno === 'p' && m1.alto === '0,0' && m1.basso === '0,6',
      'col primo giocatore la scacchiera non e girata');
  chk(m1.reBasso >= 50, 'il Re di chi gioca sta nella meta bassa dello schermo');

  // ---- non si muovono le pedine altrui ----
  const foe = await p.evaluate(() => { const u = S.units.find(x=>x.side==='e'); return u.x+','+u.y; });
  await p.click('[data-xy="'+foe+'"]'); await p.waitForTimeout(60);
  chk(await p.evaluate(() => S.sel === null), 'non si puo selezionare una pedina avversaria');

  // ---- partita completa, alternando i due giocatori ----
  let turni = 0, mosseFatte = 0, fineTurnoOk = false, ruotato = false;
  while (turni < 120 && !(await p.$('#s-result.on'))){
    const lato = await p.evaluate(() => S.turn);
    if (!fineTurnoOk){ fineTurnoOk = true;
      chk(await p.evaluate(() => !$("#btn-end").disabled), 'il pulsante fine turno e attivo per tutti e due'); }
    const celle = await p.evaluate(() =>
      S.units.filter(u => u.alive && u.side === S.turn && !u.acted).map(u => u.x+','+u.y));
    for (const xy of celle){
      if (await p.$('#s-result.on')) break;
      const c = await p.$('[data-xy="'+xy+'"]'); if (!c) continue;
      await c.click(); await p.waitForTimeout(40);
      const etichette = () => p.evaluate(() =>
        [...document.querySelectorAll('#acts button')].map(b => ({t:b.textContent.trim(), d:b.disabled})));
      let lab = await etichette();
      if (!lab.length) continue;
      let agito = false;
      for (let i = 0; i < lab.length; i++){
        const t = lab[i].t;
        if (lab[i].d || t === 'Muovi' || t === 'Passa' || t.startsWith('Gi\u00e0')) continue;
        await p.click('#acts button:nth-of-type(' + (i+1) + ')'); await p.waitForTimeout(40);
        const tg = await p.$('.cell.tg');
        if (tg){ await tg.click(); await p.waitForTimeout(60); agito = true; mosseFatte++; }
        break;
      }
      if (!agito){
        lab = await etichette();
        const i = lab.findIndex(l => l.t === 'Muovi' && !l.d);
        if (i >= 0){
          await p.click('#acts button:nth-of-type(' + (i+1) + ')'); await p.waitForTimeout(40);
          const target = await p.evaluate(() => {
            const u = S.sel; if (!u) return null;
            const foe = S.units.filter(f => f.alive && f.side !== u.side)
              .sort((a,b) => (Math.abs(a.x-u.x)+Math.abs(a.y-u.y)) - (Math.abs(b.x-u.x)+Math.abs(b.y-u.y)))[0];
            if (!foe) return null;
            return moves(u).sort((a,b) =>
              (Math.abs(a.x-foe.x)+Math.abs(a.y-foe.y)) - (Math.abs(b.x-foe.x)+Math.abs(b.y-foe.y)))[0] || null;
          });
          if (target){ await p.click('[data-xy="'+target.x+','+target.y+'"]'); await p.waitForTimeout(50); mosseFatte++; }
        }
      }
      await p.waitForTimeout(30);
    }
    if (await p.$('#s-result.on')) break;
    await p.click('#btn-end'); await p.waitForTimeout(120);
    if (await p.isVisible('#pass')){
      const chi = (await p.innerText('#pass-who')).trim();
      if (!ruotato && lato === 'p'){
        ruotato = true;
        await p.click('#btn-pass'); await p.waitForTimeout(120);
        const m2 = await mapTurno();
        chk(m2.turno === 'e' && m2.alto === '4,6' && m2.basso === '4,0',
            'col secondo giocatore la scacchiera e girata di mezzo giro');
        chk(m2.reBasso >= 50, 'anche al secondo giocatore il proprio Re appare in basso');
        turni++;
        continue;
      }
      const atteso = lato === 'p' ? 'Bruno' : 'Ada';
      if (chi !== atteso) ko.push('il passaggio nomina ' + chi + ' invece di ' + atteso);
      await p.click('#btn-pass'); await p.waitForTimeout(80);
    } else if (!(await p.evaluate(() => S.over))) {
      ko.push('turno passato senza schermata di consegna');
    } else {
      await p.waitForTimeout(800);               /* partita finita: arriva la schermata esito */
    }
    turni++;
  }
  chk(await p.$('#s-result.on') !== null, 'la partita arriva a una conclusione in ' + turni + ' turni');
  const titolo = await p.innerText('#r-title');
  chk(/Vince (Ada|Bruno)/.test(titolo), 'il risultato dichiara il vincitore: "' + titolo + '"');
  chk(mosseFatte > 5, 'entrambi hanno potuto agire (' + mosseFatte + ' azioni)');

  // ---- rivincita ----
  await p.click('#btn-next'); await p.waitForTimeout(150);
  chk(await p.isVisible('#pass'), 'la rivincita riparte dallo schieramento');
  await p.click('#btn-pass'); await p.waitForTimeout(100);
  chk(await p.evaluate(() => S.phase === 'deploy' && S.units.length === 10), 'rivincita con le stesse due squadre');

  // ---- ritorno al torneo ----
  await p.evaluate(() => { S.over = true; finishDuo(true); });
  await p.waitForTimeout(150);
  await p.click('#btn-newteams'); await p.waitForTimeout(150);
  const back = await p.evaluate(() => S.team.slice());
  chk(JSON.stringify(back) === JSON.stringify(careerTeam), 'tornando al roster la squadra del torneo e intatta');
  chk(await p.isVisible('#b-rank'), 'fuori dalla partita in due rank e round ricompaiono');
  const salvata = await p.evaluate(() => JSON.parse(localStorage.getItem('insectron')).t);
  chk(JSON.stringify(salvata) === JSON.stringify(careerTeam), 'il salvataggio contiene ancora la squadra del torneo');

  console.log(ok.map(m => '  OK  ' + m).join('\n'));
  if (ko.length) console.log(ko.map(m => '  KO  ' + m).join('\n'));
  console.log('\nerrori console: ' + (errs.length ? errs.join(' | ') : 'nessuno'));
  console.log(ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
