const { chromium, GIOCA } = require('./comune');
const ok=[],ko=[]; const chk=(c,m)=>(c?ok:ko).push(m);
(async () => {
  const b = await chromium.launch();
  for (const vp of [{width:1280,height:950,tag:'desk'},{width:390,height:844,tag:'mob'}]){
    const p = await b.newPage({ viewport:{width:vp.width,height:vp.height} });
    const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
    await p.goto(GIOCA);
    const over = () => p.evaluate(()=>document.documentElement.scrollWidth > window.innerWidth + 1);
    chk(!(await over()), vp.tag + ': la schermata "chi gioca" non sborda');
    if (vp.tag==='mob') await p.screenshot({path:'mode-mob.png'});
    await p.click('[data-mode="hvh"]'); await p.waitForTimeout(80);
    await p.fill('#n1','Ada'); await p.fill('#n2','Bruno');
    await p.click('#btn-modego'); await p.waitForTimeout(120);
    await p.click('#btn-auto'); await p.click('#btn-start'); await p.waitForTimeout(80);
    await p.click('#btn-toarena'); await p.waitForTimeout(150); await p.click('#btn-pass'); await p.waitForTimeout(150);
    await p.click('#btn-auto'); await p.click('#btn-start'); await p.waitForTimeout(80);
    await p.click('#btn-toarena'); await p.waitForTimeout(150); await p.click('#btn-pass'); await p.waitForTimeout(150);
    await p.click('#btn-rand'); await p.waitForTimeout(120);
    // il secondo giocatore schiera: la sua zona deve stare in basso sullo schermo
    await p.click('#btn-fight'); await p.waitForTimeout(120); await p.click('#btn-pass'); await p.waitForTimeout(150);
    const zona = await p.evaluate(() => [...document.querySelectorAll('.cell.drop')]
      .map(c => c.dataset.vxy.split(',')[1]|0));
    chk(zona.length > 0 && zona.every(y => y >= 5), vp.tag + ': il secondo schiera nelle due file in basso sullo schermo');
    await p.click('#btn-rand'); await p.waitForTimeout(120);
    if (vp.tag==='mob') await p.screenshot({path:'rot-mob-deploy.png'});
    await p.click('#btn-fight'); await p.waitForTimeout(120); await p.click('#btn-pass'); await p.waitForTimeout(200);
    // turno di Ada: niente rotazione
    const a = await p.evaluate(()=>({map:document.querySelector('[data-vxy="0,6"]').dataset.xy,
      lab:document.querySelector('[data-vxy="0,6"]').getAttribute('aria-label')}));
    chk(a.map==='0,6', vp.tag + ': col primo giocatore la mappa e diretta');
    chk(/riga 7/.test(a.lab), vp.tag + ': la riga annunciata e quella vista (' + a.lab.slice(0,28) + ')');
    if (vp.tag==='desk') await p.screenshot({path:'rot-ada.png'});
    await p.click('#btn-end'); await p.waitForTimeout(150); await p.click('#btn-pass'); await p.waitForTimeout(250);
    const c2 = await p.evaluate(()=>({map:document.querySelector('[data-vxy="0,6"]').dataset.xy,
      lab:document.querySelector('[data-vxy="0,6"]').getAttribute('aria-label'),
      mie:S.units.filter(u=>u.alive&&u.side==='e').map(u=>parseFloat(
        document.querySelector('[data-uid="'+u.uid+'"]').style.top))}));
    chk(c2.map==='4,0', vp.tag + ': col secondo la scacchiera e girata (' + c2.map + ')');
    chk(/riga 7/.test(c2.lab), vp.tag + ': anche da girata le righe annunciate seguono lo schermo');
    chk(c2.mie.every(t => t >= 50), vp.tag + ': le pedine di chi gioca stanno in basso');
    if (vp.tag==='desk') await p.screenshot({path:'rot-bruno.png'});
    // tastiera: "giu'" resta giu' anche a scacchiera girata
    await p.click('[data-vxy="2,3"]'); await p.waitForTimeout(80);
    const pre = await p.evaluate(()=>({cur:S.cur, v:[vX(S.cur.x),vY(S.cur.y)]}));
    await p.keyboard.press('ArrowDown'); await p.waitForTimeout(80);
    const post = await p.evaluate(()=>({cur:S.cur, v:[vX(S.cur.x),vY(S.cur.y)]}));
    chk(post.v[1] === pre.v[1] + 1, vp.tag + ': freccia giu muove verso il basso dello schermo');
    chk(!(await over()), vp.tag + ': nessuno scroll orizzontale in partita');
    console.log(vp.tag + ' errori: ' + (errs.length?errs.join(' | '):'nessuno'));
    await p.close();
  }
  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log(ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
