const { chromium, GIOCA } = require('./comune');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1280,height:900}, deviceScaleFactor:2 });
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  p.on('console', m=>{ if(m.type()==='error') errs.push(m.text()); });
  await p.goto(GIOCA); await p.waitForTimeout(120); if (await p.$('#s-mode.on')) await p.click('#btn-modego');
  await p.click('#btn-auto'); await p.click('#btn-start'); await p.waitForTimeout(120); await p.click('#btn-toarena'); await p.waitForTimeout(350);

  let ok=0, ko=0;
  const check=(n,c,x)=>{ if(c){ok++;console.log("  OK  "+n);} else {ko++;console.log("  KO  "+n+(x?" -> "+x:""));} };

  check('la fase parte in schieramento', await p.evaluate(()=>S.phase==='deploy'));
  check('barra di schieramento visibile', await p.isVisible('#deploybar'));
  check('barra del turno nascosta', !(await p.isVisible('#turnbar')));
  check('"Inizia battaglia" disattivato', await p.isDisabled('#btn-fight'));
  const info = await p.evaluate(()=>({
    inCampo: S.units.filter(u=>u.side==='p'&&u.x>=0).length,
    nemici: S.units.filter(u=>u.side==='e'&&u.x>=0).length,
    drop: document.querySelectorAll('.cell.drop').length,
    tok: document.querySelectorAll('.layer .tok').length
  }));
  check('nessuna pedina del giocatore in campo', info.inCampo===0, 'in campo '+info.inCampo);
  check('i 5 avversari sono gia schierati', info.nemici===5);
  check('10 caselle disponibili (due file da 5)', info.drop===10, 'drop='+info.drop);
  check('sul campo si vedono solo i 5 nemici', info.tok===5, 'token='+info.tok);

  // fuori zona: un click sulla terza fila non deve piazzare nulla
  await p.click('[data-xy="2,3"]'); await p.waitForTimeout(80);
  check('click fuori dalle due file: nessun piazzamento',
    await p.evaluate(()=>S.units.filter(u=>u.side==='p'&&u.x>=0).length===0));

  // piazzo le 5 pedine a mano
  const celle=['0,6','2,6','4,6','1,5','3,5'];
  for (const c of celle){ await p.click('[data-xy="'+c+'"]'); await p.waitForTimeout(90); }
  const dopo = await p.evaluate(()=>({
    n:S.units.filter(u=>u.side==='p'&&u.x>=0).length,
    pos:S.units.filter(u=>u.side==='p').map(u=>u.x+','+u.y).sort(),
    tok:document.querySelectorAll('.layer .tok').length
  }));
  check('tutte e 5 piazzate', dopo.n===5, JSON.stringify(dopo.pos));
  check('sono finite dove ho cliccato', JSON.stringify(dopo.pos)===JSON.stringify(celle.slice().sort()), JSON.stringify(dopo.pos));
  check('10 pedine sul campo', dopo.tok===10, 'token='+dopo.tok);
  check('"Inizia battaglia" ora attivo', !(await p.isDisabled('#btn-fight')));
  await p.screenshot({ path:'d1-deploy.png', clip:{x:100,y:140,width:1180,height:700} });

  // rimetto una pedina in panchina
  await p.click('[data-xy="0,6"]'); await p.waitForTimeout(90);
  check('pedina rimessa in panchina', await p.evaluate(()=>S.units.filter(u=>u.side==='p'&&u.x>=0).length===4));
  check('"Inizia battaglia" torna disattivato', await p.isDisabled('#btn-fight'));
  // e la rimetto altrove
  await p.click('[data-xy="4,5"]'); await p.waitForTimeout(90);
  check('ripiazzata in un\'altra casella', await p.evaluate(()=>!!S.units.find(u=>u.side==='p'&&u.x===4&&u.y===5)));

  await p.click('#btn-rand'); await p.waitForTimeout(90);
  check('"Schiera a caso" non sposta chi e gia in campo', await p.evaluate(()=>S.units.filter(u=>u.side==='p'&&u.x>=0).length===5));

  await p.click('#btn-fight'); await p.waitForTimeout(200);
  check('la battaglia e iniziata', await p.evaluate(()=>S.phase==='battle'));
  check('barra del turno tornata visibile', await p.isVisible('#turnbar'));
  const zone = await p.evaluate(()=>S.units.filter(u=>u.side==='p').every(u=>u.y>=5));
  check('tutte le pedine partono nelle due file di casa', zone);

  console.log('\nerrori console:', errs.length?errs:'nessuno');
  console.log(ko? ('FALLITI: '+ko) : ('tutti i '+ok+' controlli superati'));
  await b.close();
})();
