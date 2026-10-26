const { chromium, GIOCA } = require('./comune');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1280,height:900}, deviceScaleFactor:2 });
  let ok=0,ko=0; const ck=(n,c,x)=>{ if(c){ok++;console.log("  OK  "+n);} else {ko++;console.log("  KO  "+n+(x?" -> "+x:""));} };
  await p.goto(GIOCA); await p.waitForTimeout(120); if (await p.$('#s-mode.on')) await p.click('#btn-modego');
  await p.click('#btn-auto'); await p.click('#btn-start'); await p.waitForTimeout(120); await p.click('#btn-toarena'); await p.waitForTimeout(300);
  await p.click('#btn-rand'); await p.click('#btn-fight'); await p.waitForTimeout(300);

  // metto una mia pedina accanto a un nemico, la muovo e poi la faccio attaccare
  const uid = await p.evaluate(() => {
    const mio = S.units.find(u=>u.side==='p'&&u.alive);
    const foe = S.units.find(u=>u.side==='e'&&u.alive);
    foe.x = 2; foe.y = 2; mio.x = 2; mio.y = 4;           // a due caselle di distanza
    S.units.filter(u=>u!==mio&&u!==foe).forEach(u=>{ u.x=-1; u.y=-1; });
    draw(); return mio.uid;
  });
  const sel = async () => { const pos = await p.evaluate(u=>{const x=S.units.find(v=>v.uid===u);return x.x+','+x.y;}, uid);
                            await p.click('[data-xy="'+pos+'"]'); await p.waitForTimeout(90); };
  const btn = async (t) => { for (const b of await p.$$('#acts button')) if ((await b.innerText())===t) return b; return null; };

  await sel();
  ck('prima di muoversi non puo attaccare (nemico lontano)', await (await btn('Attacca')).isDisabled());
  await (await btn('Muovi')).click(); await p.waitForTimeout(80);
  const vicino = await p.$('[data-xy="2,3"]');
  await vicino.click(); await p.waitForTimeout(120);

  await sel();
  const att = await btn('Attacca');
  ck('dopo lo spostamento puo ancora attaccare', !!att && !(await att.isDisabled()));
  await p.screenshot({ path:'m1-moved.png', clip:{x:900,y:150,width:380,height:420} });
  const hp0 = await p.evaluate(()=>S.units.find(u=>u.side==='e'&&u.alive).hp);
  await att.click(); await p.waitForTimeout(80);
  const tg = await p.$('.cell.tg'); await tg.click(); await p.waitForTimeout(150);
  const st = await p.evaluate(u=>{ const x=S.units.find(v=>v.uid===u); const f=S.units.find(v=>v.side==='e');
    return {acted:x.acted, hpNemico:f?f.hp:0}; }, uid);
  ck('l attacco va a segno', st.hpNemico < hp0, hp0+' -> '+st.hpNemico);
  ck('dopo l attacco la pedina e esaurita', st.acted);

  await sel();
  const dopo = await p.$$('#acts button');
  ck('pedina esaurita: nessun pulsante azione', dopo.length===0, 'pulsanti='+dopo.length);

  console.log(ko? ('FALLITI: '+ko) : ('tutti i '+ok+' controlli superati'));
  await b.close();
})();
