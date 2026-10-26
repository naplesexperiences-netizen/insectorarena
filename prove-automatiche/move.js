const { chromium, GIOCA } = require('./comune');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1280,height:900} });
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  let ok=0,ko=0; const ck=(n,c,x)=>{ if(c){ok++;console.log("  OK  "+n);} else {ko++;console.log("  KO  "+n+(x?" -> "+x:""));} };
  await p.goto(GIOCA); await p.waitForTimeout(120); if (await p.$('#s-mode.on')) await p.click('#btn-modego');
  await p.click('#btn-auto'); await p.click('#btn-start'); await p.waitForTimeout(120); await p.click('#btn-toarena'); await p.waitForTimeout(300);
  await p.click('#btn-rand'); await p.click('#btn-fight'); await p.waitForTimeout(300);

  const uid = await p.evaluate(()=>S.units.find(x=>x.side==='p'&&x.alive).uid);
  const sel = async () => { const pos = await p.evaluate(u=>{const x=S.units.find(v=>v.uid===u);return x.x+','+x.y;}, uid);
                            await p.click('[data-xy="'+pos+'"]'); await p.waitForTimeout(90); };
  const btn = async (txt) => { for (const b of await p.$$('#acts button')){ if ((await b.innerText())===txt) return b; } return null; };

  await sel();
  const m1 = await btn('Muovi');
  ck('"Muovi" disponibile a inizio turno', !!m1 && !(await m1.isDisabled()));
  await m1.click(); await p.waitForTimeout(80);
  const celle = await p.$$('.cell.mv');
  ck('le caselle raggiungibili sono evidenziate', celle.length>0, 'celle='+celle.length);
  await celle[0].click(); await p.waitForTimeout(120);
  ck('la pedina risulta spostata', await p.evaluate(u=>S.units.find(v=>v.uid===u).moved, uid));

  await sel();
  const m2 = await btn('Muovi');
  const gia = await btn('Già mossa');
  ck('il pulsante diventa "Già mossa" e disattivato', !m2 && !!gia && await gia.isDisabled());

  // forzo comunque la modalita movimento: non deve restare alcuna casella cliccabile
  await p.evaluate(u => { S.sel = S.units.find(v=>v.uid===u); S.mode='move'; draw(); }, uid);
  ck('nessuna casella raggiungibile in evidenza', (await p.$$('.cell.mv')).length===0);
  const prima = await p.evaluate(u=>{const x=S.units.find(v=>v.uid===u);return x.x+','+x.y;}, uid);
  await p.click('[data-xy="2,3"]'); await p.waitForTimeout(100);
  const dopo = await p.evaluate(u=>{const x=S.units.find(v=>v.uid===u);return x.x+','+x.y;}, uid);
  ck('un secondo spostamento viene rifiutato', prima===dopo, prima+' -> '+dopo);

  // dopo essersi mossa puo ancora attaccare o usare la speciale
  await sel();
  const nomi = [];
  for (const b of await p.$$('#acts button')) nomi.push((await b.innerText()) + (await b.isDisabled() ? '(off)' : ''));
  ck('restano disponibili azione e passo', nomi.some(n=>n.startsWith('Passa')), nomi.join(' | '));

  // a inizio turno successivo puo muoversi di nuovo
  await p.click('#btn-end'); await p.waitForTimeout(3200);
  ck('nuovo turno: la pedina puo muoversi di nuovo',
     await p.evaluate(u=>{const x=S.units.find(v=>v.uid===u); return x && x.alive ? !x.moved : true;}, uid));

  console.log('\nerrori console:', errs.length?errs:'nessuno');
  console.log(ko? ('FALLITI: '+ko) : ('tutti i '+ok+' controlli superati'));
  await b.close();
})();
