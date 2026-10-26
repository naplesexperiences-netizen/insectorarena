const { chromium, GIOCA } = require('./comune');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1280,height:900}, deviceScaleFactor:2 });
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  p.on('console', m=>{ if(m.type()==='error') errs.push(m.text()); });
  let ok=0,ko=0; const ck=(n,c,x)=>{ if(c){ok++;console.log("  OK  "+n);} else {ko++;console.log("  KO  "+n+(x?" -> "+x:""));} };
  await p.goto(GIOCA);

  /* il selettore vive nella schermata di apertura, prima del roster */

  ck('il selettore della difficolta esiste ed e etichettato', await p.evaluate(()=>{
    const s=document.getElementById('lv-e');
    const l=document.querySelector('label[for="lv-e"]');
    return !!s && !!l && s.options.length===5;
  }));
  ck('di default e automatico', await p.evaluate(()=>S.lvl.e===0 && document.getElementById('lv-e').value==='0'));
  ck('al Rank E gli avversari sono Principianti', await p.evaluate(()=>levelOf('e')===1));

  await p.selectOption('#lv-e', '4'); await p.waitForTimeout(100);
  ck('forzando "Campione" il livello diventa 4', await p.evaluate(()=>levelOf('e')===4 && S.lvl.e===4));
  ck('la scelta viene salvata', await p.evaluate(()=>{
    try { return (JSON.parse(localStorage.getItem('insectron')||'{}').a|0)===4; } catch(e){ return false; }
  }));
  await p.reload(); await p.waitForTimeout(250);
  ck('e sopravvive al ricaricamento', await p.evaluate(()=>S.lvl.e===4 && document.getElementById('lv-e').value==='4'));

  await p.selectOption('#lv-e', '0'); await p.waitForTimeout(80);
  const perRank = await p.evaluate(()=>{
    const out={};
    for(let r=0;r<6;r++){ S.rankIdx=r; out[RANKS[r].id]=AI_PROFILES[levelOf('e')].nome; }
    S.rankIdx=0; return out;
  });
  console.log('  livello per rank:', JSON.stringify(perRank));
  ck('la scala sale col rank', perRank.E==='Principiante' && perRank.S==='Campione');
  ck('il lato del giocatore resta il metro fisso "Normale"',
     await p.evaluate(()=>AI_PROFILES[levelOf('p')].nome==='Normale'));

  // in battaglia il badge dice chi hai di fronte
  await p.click('#btn-modego'); await p.waitForTimeout(120);
  await p.click('#btn-auto'); await p.waitForTimeout(60);
  await p.click('#btn-start'); await p.waitForTimeout(60);
  await p.click('#btn-toarena'); await p.waitForTimeout(300);
  const badge = await p.evaluate(()=>document.getElementById('b-opp').innerText);
  ck('il badge mostra il profilo avversario', /Principiante/.test(badge), badge);
  await p.click('#btn-rand'); await p.click('#btn-fight'); await p.waitForTimeout(300);
  await p.click('#btn-end'); await p.waitForTimeout(3200);
  ck('il turno avversario gira senza errori', errs.length===0, errs.join(' | '));

  await p.screenshot({ path:'ai1-sel.png' });
  console.log(ko? ('FALLITI: '+ko) : ('tutti i '+ok+' controlli superati'));
  await b.close();
})();
