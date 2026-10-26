const { chromium, GIOCA } = require('./comune');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1280,height:900} });
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  p.on('console', m=>{ if(m.type()==='error') errs.push(m.text()); });
  await p.goto(GIOCA); await p.waitForTimeout(120); if (await p.$('#s-mode.on')) await p.click('#btn-modego');
  let ok=0,ko=0; const ck=(n,c,x)=>{ if(c){ok++;console.log("  OK  "+n);} else {ko++;console.log("  KO  "+n+(x?" -> "+x:""));} };

  await p.click('#btn-auto'); await p.click('#btn-start'); await p.waitForTimeout(120); await p.click('#btn-toarena'); await p.waitForTimeout(350);
  await p.click('#btn-rand'); await p.click('#btn-fight'); await p.waitForTimeout(350);

  const g = await p.evaluate(() => {
    const b = document.getElementById('board');
    return { role:b.getAttribute('role'), label:b.getAttribute('aria-label'),
             righe:b.querySelectorAll('[role="row"]').length,
             celle:b.querySelectorAll('[role="gridcell"]').length,
             bottoni:b.querySelectorAll('button.cell').length,
             tabbabili:[...b.querySelectorAll('.cell')].filter(c=>c.tabIndex===0).length };
  });
  ck('la scacchiera e una griglia ARIA', g.role==='grid' && !!g.label, JSON.stringify(g));
  ck('7 righe e 35 celle', g.righe===7 && g.celle===35, JSON.stringify(g));
  ck('le celle sono <button>', g.bottoni===35);
  ck('una sola cella tabbabile (roving tabindex)', g.tabbabili===1, 'tabbabili='+g.tabbabili);

  const lbl = await p.evaluate(() => {
    const occupata = [...document.querySelectorAll('.cell')].find(c => {
      const [x,y]=c.dataset.xy.split(',').map(Number);
      return S.units.some(u=>u.alive&&u.x===x&&u.y===y);
    });
    const vuota = document.querySelector('[data-xy="0,3"]');
    return { occ: occupata && occupata.getAttribute('aria-label'), vuo: vuota.getAttribute('aria-label') };
  });
  ck('cella occupata descritta (nome, lato, HP)', /punti vita su/.test(lbl.occ||''), lbl.occ);
  ck('cella vuota descritta', /libera/.test(lbl.vuo||''), lbl.vuo);

  // navigazione a frecce
  await p.focus('.cell[tabindex="0"]');
  const start = await p.evaluate(()=>document.activeElement.dataset.xy);
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(80);
  await p.keyboard.press('ArrowUp');    await p.waitForTimeout(80);
  const dopo = await p.evaluate(()=>document.activeElement.dataset.xy);
  const [sx,sy]=start.split(',').map(Number), [dx,dy]=dopo.split(',').map(Number);
  ck('le frecce spostano il focus', dx===sx+1 && dy===sy-1, start+' -> '+dopo);

  await p.keyboard.press('End'); await p.waitForTimeout(80);
  ck('End va a fine riga', (await p.evaluate(()=>document.activeElement.dataset.xy)).startsWith('4,'));
  await p.keyboard.press('Home'); await p.waitForTimeout(80);
  ck('Home va a inizio riga', (await p.evaluate(()=>document.activeElement.dataset.xy)).startsWith('0,'));

  // il focus non esce dalla griglia
  for(let i=0;i<9;i++){ await p.keyboard.press('ArrowLeft'); }
  await p.waitForTimeout(80);
  ck('il cursore non esce dal bordo', (await p.evaluate(()=>document.activeElement.dataset.xy)).startsWith('0,'));

  // si gioca davvero da tastiera: seleziono una pedina con Invio
  await p.evaluate(() => {
    const u = S.units.find(x=>x.side==='p'&&x.alive);
    S.cur = {x:u.x, y:u.y}; draw();
    document.querySelector('[data-xy="'+u.x+','+u.y+'"]').focus();
  });
  await p.keyboard.press('Enter'); await p.waitForTimeout(150);
  ck('Invio seleziona la pedina', await p.evaluate(()=>!!S.sel));

  // focus visibile
  const ring = await p.evaluate(() => {
    const c = document.querySelector('.cell[tabindex="0"]'); c.focus();
    const s = getComputedStyle(c);
    return s.outlineStyle + ' ' + s.outlineWidth;
  });
  ck('il focus ha un contorno visibile', /solid/.test(ring) && parseFloat(ring.split(' ')[1])>=2, ring);

  const live = await p.evaluate(()=>document.getElementById('log').getAttribute('aria-live'));
  ck('il diario e una regione live', live==='polite', live);
  const cs = await p.evaluate(()=>getComputedStyle(document.documentElement).colorScheme);
  ck('color-scheme dark', cs==='dark', cs);

  console.log('\nerrori console:', errs.length?errs:'nessuno');
  console.log(ko? ('FALLITI: '+ko) : ('tutti i '+ok+' controlli superati'));
  await b.close();
})();
