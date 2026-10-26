const { chromium, SERVITO } = require('./comune');
const ok=[],ko=[]; const chk=(c,m)=>(c?ok:ko).push(m);
const BASE = SERVITO;
(async () => {
  const b = await chromium.launch();
  /* Qui il service worker serve: e' quello che si sta provando. */
  const ctx = await b.newContext({ viewport:{width:1220,height:900},
                                   serviceWorkers:'allow' });
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });

  // --- landing ---
  await p.goto(BASE); await p.waitForTimeout(400);
  const head = await p.evaluate(() => ({
    manifest: document.querySelector('link[rel=manifest]')?.href || '',
    icona: document.querySelector('link[rel=icon]')?.href || '',
    apple: document.querySelector('link[rel=apple-touch-icon]')?.href || '',
    canonical: document.querySelector('link[rel=canonical]')?.href || '',
    og: document.querySelector('meta[property="og:url"]')?.content || '',
    tema: document.querySelector('meta[name=theme-color]')?.content || ''
  }));
  chk(head.manifest.endsWith('manifest.webmanifest'), 'la landing dichiara il manifest');
  chk(head.icona.endsWith('icon.svg') && head.apple.endsWith('apple-touch-icon.png'), 'icone dichiarate');
  chk(head.canonical.includes('insectorarena') && !head.canonical.includes('experiences-demos'),
      'canonical al nuovo indirizzo: ' + head.canonical);
  chk(head.og.includes('/insectorarena/') && !head.og.includes('demos/'), 'og:url aggiornato');
  chk(head.tema === '#0d1117', 'theme-color presente');

  /* Queste prove vogliono la radice del sito pubblicato: manifest, service
     worker e icone stanno li', non nella cartella della demo. Se si sta
     servendo la demo, lo si dice e si esce senza fingere un fallimento. */
  if (!head.manifest){
    console.log('\nSALTATA: qui non c\'e\' il manifest. Queste prove vogliono la radice\n' +
      'del sito pubblicato (manifest.webmanifest, sw.js, icon*.png). Indicala con:\n' +
      '  INSECTRON_SITO=/percorso/al/sito sh batteria.sh\n');
    await b.close();
    return;
  }

  // il manifest si scarica ed e' coerente
  const man = await p.evaluate(async h => { const r = await fetch(h); return { ok:r.ok, j: await r.json() }; }, head.manifest);
  chk(man.ok && man.j.name === 'Insectron Arena', 'il manifest si scarica ed e valido');
  chk(man.j.start_url === './gioca.html' && man.j.display === 'standalone',
      'installato, parte dal gioco a schermo intero');
  chk(man.j.icons.some(i => i.purpose === 'maskable'), 'c e l icona maskable per Android');
  for (const i of man.j.icons){
    const r = await p.evaluate(async s => (await fetch(s)).status, i.src);
    if (r !== 200) ko.push('icona mancante: ' + i.src + ' (' + r + ')');
  }
  chk(!ko.some(m=>m.startsWith('icona mancante')), 'tutte le icone del manifest esistono');

  // --- service worker ---
  await p.goto(BASE + 'gioca.html'); await p.waitForTimeout(300);
  const reg = await p.evaluate(async () => {
    const r = await navigator.serviceWorker.ready;
    return { attivo: !!r.active, scope: r.scope };
  });
  chk(reg.attivo, 'il service worker si registra e diventa attivo');
  chk(reg.scope.endsWith('/'), 'con scope su tutto il sito: ' + reg.scope);
  const cache = await p.evaluate(async () => {
    const k = await caches.keys();
    const c = await caches.open(k[0]);
    const req = await c.keys();
    return { chiavi: k, file: req.map(r => new URL(r.url).pathname) };
  });
  chk(cache.chiavi.length === 1, 'una sola cache (' + cache.chiavi.join() + ')');
  chk(cache.file.some(f => f.endsWith('gioca.html')) && cache.file.some(f => f.endsWith('icon-192.png')),
      'in cache ci sono gioco e icone (' + cache.file.length + ' file)');

  // --- offline vero: si stacca la rete e si ricarica ---
  await ctx.setOffline(true);
  await p.goto(BASE + 'gioca.html', { waitUntil:'load' }).catch(e => ko.push('offline: ' + e.message));
  await p.waitForTimeout(400);
  const vivo = await p.evaluate(() => ({
    titolo: document.title,
    stato: typeof S !== 'undefined' && Array.isArray(UNITS) ? UNITS.length : 0,
    schermata: document.querySelector('#s-mode.on') ? 'chi gioca' : 'altra'
  }));
  chk(vivo.stato === 34 && vivo.schermata === 'chi gioca', 'senza rete il gioco si apre lo stesso');
  // e si gioca davvero
  await p.click('#btn-modego'); await p.waitForTimeout(100);
  await p.click('#btn-auto'); await p.click('#btn-start'); await p.waitForTimeout(100);
  await p.click('#btn-toarena'); await p.waitForTimeout(250);
  await p.click('#btn-rand'); await p.waitForTimeout(150);
  await p.click('#btn-fight'); await p.waitForTimeout(250);
  chk(await p.evaluate(() => S.phase === 'battle' && S.units.length === 10), 'e si arriva in campo senza rete');
  const imgOff = await p.evaluate(async () => (await fetch('./icon-192.png')).status);
  chk(imgOff === 200, 'anche le icone arrivano dalla cache offline');
  await ctx.setOffline(false);

  // --- robots e sitemap ---
  const rb = await p.evaluate(async b => { const r = await fetch(b + 'robots.txt'); return { s:r.status, t: await r.text() }; }, BASE);
  chk(rb.s === 200 && /Sitemap:.*sitemap\.xml/.test(rb.t), 'robots.txt pubblicato e con la sitemap');
  const sm = await p.evaluate(async b => { const r = await fetch(b + 'sitemap.xml'); return { s:r.status, t: await r.text() }; }, BASE);
  chk(sm.s === 200 && sm.t.includes('<loc>') && !sm.t.includes('experiences-demos'),
      'sitemap.xml pubblicata e con gli indirizzi nuovi');

  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
