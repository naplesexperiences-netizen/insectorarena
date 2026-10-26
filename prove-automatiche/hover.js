const { chromium, GIOCA } = require('./comune');
/* Nasce dal bug del passaggio del mouse: la scheda inline cambiava mentre
   andavi verso il pulsante, e confermavi un Insector diverso da quello che
   avevi scelto. Ora la scheda e' un pop-up e il mouse non la puo' piu'
   cambiare: questa suite verifica che resti cosi', mouse e tastiera. */

/* Il gesto e' cambiato: il tocco breve mette in squadra, la scheda si apre
   tenendo premuto. Le suite che vogliono la scheda tengono premuto davvero. */
async function premiLungo(p, sel, ms){
  const box = await p.locator(sel).first().boundingBox();
  await p.mouse.move(box.x + box.width/2, box.y + box.height/2);
  await p.mouse.down(); await p.waitForTimeout(ms || 700); await p.mouse.up();
  await p.waitForTimeout(250);
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1400,height:950} });
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  let ok=0,ko=0; const ck=(n,c,x)=>{ if(c){ok++;console.log("  OK  "+n);} else {ko++;console.log("  KO  "+n+(x?" -> "+x:""));} };
  await p.goto(GIOCA); await p.waitForTimeout(120); if (await p.$('#s-mode.on')) await p.click('#btn-modego');
  await p.waitForTimeout(300);

  const nomi = await p.$$eval('#roster .mon .nm', e=>e.map(x=>x.textContent.trim()));
  console.log('nel roster:', nomi.join(', '));
  ck('nel roster non compaiono pedine bloccate', (await p.$$('#roster .mon.locked')).length===0);

  await premiLungo(p, '#roster .mon');
  const primo = await p.innerText('#uni-nome');

  /* Il giro del mouse per tutta la finestra: sopra le altre pedine, sul velo,
     sui bordi. Niente di tutto questo deve toccare la scheda aperta. */
  for (const [x,y] of [[200,300],[700,120],[1200,700],[80,880],[700,500]]) {
    await p.mouse.move(x,y); await p.waitForTimeout(60);
  }
  ck('il giro del mouse NON cambia la scheda', (await p.innerText('#uni-nome'))===primo, primo+' -> '+(await p.innerText('#uni-nome')));

  const btn = await p.$('#btn-metto');
  ck('il pulsante di conferma esiste ancora', !!btn);
  await btn.hover(); await p.waitForTimeout(80);
  ck('la scheda regge anche col mouse sul pulsante', (await p.innerText('#uni-nome'))===primo);
  await btn.click(); await p.waitForTimeout(200);
  const inSquadra = await p.evaluate(()=>S.team.map(i=>byId[i].name));
  ck('il click aggiunge proprio quello mostrato', inSquadra.length===1 && primo.includes(inSquadra[0]), primo+' | '+inSquadra);
  ck('e il pop-up si chiude', !(await p.isVisible('#uni-box')));

  await premiLungo(p, '#roster .mon:nth-child(4)');
  ck('tenendo premuto su un altro si apre la scheda di quell altro', (await p.innerText('#uni-nome'))!==primo);
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);

  /* Da tastiera il tocco breve e' Invio; la scheda si apre col tasto destro o
     col tasto Menu, che e' il modo standard di chiedere \u00abdimmi di piu\u00f9\u00bb. */
  await p.evaluate(()=>{ S.team = []; drawRoster(); drawSlots();
                         document.querySelector('#roster .mon').focus(); });
  await p.waitForTimeout(200);
  const partenza = await p.evaluate(()=>document.activeElement.dataset.id);
  await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  ck('da tastiera Invio mette in squadra', await p.evaluate(()=>S.team.length===1));
  ck('e non apre il pop-up', !(await p.isVisible('#uni-box')));
  ck('col fuoco rimasto sulla stessa scheda',
     (await p.evaluate(()=>document.activeElement.dataset.id))===partenza);
  await p.locator('#roster .mon').first().click({ button:'right' }); await p.waitForTimeout(250);
  ck('il tasto destro apre il pop-up', await p.isVisible('#uni-box'));
  ck('e il fuoco entra nel pop-up', await p.evaluate(()=>!!document.activeElement.closest('#uni-box')));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  const dove = await p.evaluate(()=>document.activeElement.closest('#roster') ? 'roster' : (document.activeElement.id||'altrove'));
  ck('chiudendo il fuoco torna nel roster', dove==='roster', dove);
  ck('e torna proprio sulla pedina di partenza', (await p.evaluate(()=>document.activeElement.dataset.id))===partenza);

  console.log('\nerrori console:', errs.length?errs:'nessuno');
  console.log(ko? ('FALLITI: '+ko) : ('tutti i '+ok+' controlli superati'));
  await b.close();
})();
