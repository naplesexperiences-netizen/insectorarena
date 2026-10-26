const { chromium, GIOCA } = require('./comune');

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
  const p = await b.newPage({ viewport:{width:1280,height:950}, deviceScaleFactor:2 });
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  p.on('console', m=>{ if(m.type()==='error') errs.push(m.text()); });
  let ok=0,ko=0; const ck=(n,c,x)=>{ if(c){ok++;console.log("  OK  "+n);} else {ko++;console.log("  KO  "+n+(x?" -> "+x:""));} };
  await p.goto(GIOCA); await p.waitForTimeout(120); if (await p.$('#s-mode.on')) await p.click('#btn-modego');
  await p.waitForTimeout(350);

  console.log("A. Scheda dell'Insector nel pop-up del roster");
  ck('il pop-up e chiuso finche non si tocca niente', !(await p.isVisible('#uni-box')));
  const primo = await p.getAttribute('.mon','data-id');
  await premiLungo(p, '#roster .mon');
  ck('toccare la pedina apre il pop-up', await p.isVisible('#uni-box'));
  const t = await p.innerText('#uni-corpo');
  ck('mostra le caratteristiche', /VITA/.test(t) && /FORZA/.test(t) && /DIFESA/.test(t), t.slice(0,60));
  ck('mostra il movimento', /Movimento/.test(t));
  ck('mostra la mossa speciale', /Danno speciale/.test(t));
  ck('mostra il danno d attacco', /Attacco/.test(t) && /di danno/.test(t));
  ck('nessuno e in squadra prima della conferma', await p.evaluate(()=>S.team.length===0));
  ck('c e il pulsante di conferma', !!(await p.$('#btn-metto')));
  await p.screenshot({ path:'c1-scheda.png', clip:{x:340,y:60,width:600,height:830} });
  await p.click('#btn-metto'); await p.waitForTimeout(200);
  ck('la conferma lo mette in squadra', await p.evaluate(()=>S.team.length===1));
  ck('e il pop-up si chiude da solo', !(await p.isVisible('#uni-box')));
  ck('il contatore si aggiorna', (await p.innerText('#team-count')).trim()==='1/5');
  await p.evaluate(id=>apriUnita(id), primo); await p.waitForTimeout(150);
  ck('riaprendolo il pulsante e diventato "togli"', !!(await p.$('#btn-tolgo')));
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  ck('Esc richiude il pop-up', !(await p.isVisible('#uni-box')));

  console.log("\nB. Riepilogo squadra e scelta del Re");
  ck('non si prosegue con meno di 5', await p.isDisabled('#btn-start'));
  await p.click('#btn-auto'); await p.waitForTimeout(200);
  ck('con 5 si prosegue', !(await p.isDisabled('#btn-start')));
  await p.evaluate(()=>{ S.kingId=null; });     // per provare la scelta del Re
  await p.click('#btn-start'); await p.waitForTimeout(250);
  ck('si apre il riepilogo', await p.isVisible('#s-brief'));
  const cards = await p.$$('.bcard');
  ck('una card per pedina', cards.length===5, 'card='+cards.length);
  const bt = await p.innerText('.bcard');
  ck('la card riporta statistiche e speciale', /VITA/.test(bt) && /Attacco/.test(bt) && /Movimento/.test(bt), bt.slice(0,80));
  ck('senza Re non si entra in arena', await p.isDisabled('#btn-toarena'));
  await cards[2].click(); await p.waitForTimeout(150);
  ck('nominare il Re sblocca l ingresso', !(await p.isDisabled('#btn-toarena')));
  ck('il Re e quello scelto', await p.evaluate(()=>S.kingId===S.team[2]));
  ck('la card del Re e evidenziata', (await p.getAttribute('.bcard.re .scegli','aria-pressed'))==='true');
  ck('la card non porta descrizioni a parole', !/Lanciatore|Difensore|Incursore|Attaccante|Artiglieria|Sabotatore|Disturbatore|Muro|Ariete|Fuoriclasse/.test(await p.innerText('.bcard')));
  ck('il tondo info c e su ogni card', (await p.$$('.bcard .info')).length===5);
  await p.click('.bcard .info'); await p.waitForTimeout(200);
  ck('il tondo info apre la scheda completa', await p.isVisible('#uni-box'));
  ck('e la scheda completa porta la descrizione', (await p.innerText('#uni-corpo')).length > 200);
  await p.click('#btn-uni-x'); await p.waitForTimeout(150);
  ck('la x richiude la scheda', !(await p.isVisible('#uni-box')));
  await p.screenshot({ path:'c2-riepilogo.png', clip:{x:0,y:100,width:1280,height:620} });

  console.log("\nC. Card in battaglia");
  await p.click('#btn-toarena'); await p.waitForTimeout(300);
  await p.click('#btn-rand'); await p.click('#btn-fight'); await p.waitForTimeout(350);
  const pos = await p.evaluate(()=>{ const u=S.units.find(x=>x.side==='p'&&x.alive); return u.x+','+u.y; });
  await p.click('[data-xy="'+pos+'"]'); await p.waitForTimeout(200);
  const c = await p.innerText('#ucard');
  ck('mostra il danno d attacco', /Attacco/.test(c), c.replace(/\n/g,' | ').slice(0,110));
  ck('mostra il danno della speciale', /indicativo|su |cura|converte|difesa|atterra/.test(c));
  ck('mostra il movimento residuo', /Movimento/.test(c));
  await p.screenshot({ path:'c3-battaglia.png', clip:{x:900,y:130,width:380,height:560} });

  console.log('\nerrori console:', errs.length?errs:'nessuno');
  console.log(ko? ('FALLITI: '+ko) : ('tutti i '+ok+' controlli superati'));
  await b.close();
})();
