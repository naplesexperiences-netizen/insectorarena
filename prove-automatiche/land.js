const { chromium, INDEX, PRIVACY } = require('./comune');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1280,height:900}, deviceScaleFactor:2 });
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  p.on('console', m=>{ if(m.type()==='error') errs.push(m.text()); });
  const req=[]; p.on('requestfailed', r => req.push(r.url()));
  let ok=0,ko=0; const ck=(n,c,x)=>{ if(c){ok++;console.log("  OK  "+n);} else {ko++;console.log("  KO  "+n+(x?" -> "+x:""));} };
  await p.goto(INDEX);
  await p.waitForTimeout(400);

  /* Le immagini in fondo sono lazy: se non si scorre non vengono nemmeno
     richieste, e "non caricata" direbbe una cosa falsa. */
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400){
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await p.waitForTimeout(500);

  ck('nessuna risorsa mancante', req.length===0, req.join(' | '));
  ck('tutte le immagini caricate e con dimensioni dichiarate', await p.evaluate(()=>
    [...document.images].every(i => i.complete && i.naturalWidth>0 && i.getAttribute('width') && i.getAttribute('height'))));
  ck('tutte le immagini hanno alt descrittivo', await p.evaluate(()=>
    [...document.images].every(i => (i.getAttribute('alt')||'').length > 20)));
  ck('un solo h1, gerarchia coerente', await p.evaluate(()=>{
    const h = [...document.querySelectorAll('h1,h2,h3')].map(e=>+e.tagName[1]);
    if (h.filter(x=>x===1).length!==1) return false;
    let prev=1; for(const x of h){ if(x>prev+1) return false; prev=x; } return true;
  }));
  ck('skip link presente e raggiungibile', await p.evaluate(()=>{
    const a=document.querySelector('a.skip'); return !!a && !!document.querySelector(a.getAttribute('href')); }));

  // il bottone porta al gioco
  const href = await p.getAttribute('.btn.play', 'href');
  ck('il pulsante punta a gioca.html', href==='gioca.html', href);
  await p.click('.btn.play'); await p.waitForTimeout(500);
  ck('il gioco si apre e funziona', await p.evaluate(()=>typeof S!=='undefined' && Array.isArray(UNITS) && UNITS.length===34));
  await p.goBack(); await p.waitForTimeout(300);

  // niente scroll orizzontale a nessuna larghezza
  for (const w of [1280, 820, 390]){
    await p.setViewportSize({width:w, height:900}); await p.waitForTimeout(200);
    const over = await p.evaluate(()=>document.documentElement.scrollWidth > window.innerWidth + 1);
    ck('nessuno scroll orizzontale a '+w+'px', !over);
  }
  await p.setViewportSize({width:1280, height:900}); await p.waitForTimeout(200);
  await p.screenshot({ path:'l1-hero.png', clip:{x:0,y:0,width:1280,height:760} });
  await p.setViewportSize({width:390, height:844}); await p.waitForTimeout(200);
  await p.screenshot({ path:'l2-mobile.png' });

  // --- l'informativa esiste, si raggiunge, e dice quello che deve dire ---
  await p.setViewportSize({width:1280, height:900}); await p.waitForTimeout(150);
  const linkPrivacy = await p.evaluate(() =>
    !!document.querySelector('footer a[href$="privacy.html"]'));
  ck('la landing rimanda all’informativa dal piè di pagina', linkPrivacy);

  await p.goto(PRIVACY);
  await p.waitForTimeout(250);
  const inf = await p.evaluate(() => ({
    titolo: document.title,
    testo: document.body.innerText,
    tornaIndietro: [...document.querySelectorAll('a')].some(a => a.getAttribute('href') === './'),
    /* Quello che conta e' se la pagina SCARICA qualcosa da fuori. Un
       <link rel="canonical"> non scarica niente: e' un'etichetta che dice
       qual e' l'indirizzo buono di questa pagina, e sul sito pubblicato c'e'
       per forza. Quindi fra i <link> si guardano solo quelli che tirano
       davvero un file. */
    esterni: [...document.querySelectorAll('link[href],script[src],img[src]')]
      .filter(e => e.tagName !== 'LINK' ||
        /stylesheet|icon|manifest|preload|prefetch|preconnect/i.test(e.getAttribute('rel') || ''))
      .map(e => e.getAttribute('href') || e.getAttribute('src'))
      .filter(u => /^https?:/.test(u))
  }));
  ck('l’informativa si apre e ha un titolo', /Insectron/.test(inf.titolo));
  ck('dice che non ci sono cookie', /Nessun cookie/i.test(inf.testo));
  ck('dice che l’IP non viene conservato', /indirizzo IP conservato/i.test(inf.testo));
  ck('dice per quanto si tengono i dati', /12 mesi|dodici mesi/i.test(inf.testo));
  ck('spiega come si spegne', /Come si spegne/i.test(inf.testo));
  ck('elenca i campi che partono', /giorni/.test(inf.testo) && /tappe/.test(inf.testo));
  ck('e non tira dentro niente da fuori', inf.esterni.length === 0,
     inf.esterni.join(', '));
  ck('riporta il recapito da riempire prima di accendere',
     /indirizzo da inserire|@/.test(inf.testo));
  ck('si torna al gioco', inf.tornaIndietro);
  ck('nessuna risorsa mancante nemmeno qui', req.length === 0, req.join(', '));

  console.log('\nerrori console:', errs.length?errs:'nessuno');
  console.log(ko? ('FALLITI: '+ko) : ('tutti i '+ok+' controlli superati'));
  await b.close();
})();
