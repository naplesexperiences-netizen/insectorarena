const { chromium, SERVITO } = require('./comune');
const ok=[],ko=[]; const chk=(c,m)=>(c?ok:ko).push(m);
const URL = SERVITO + 'gioca.html';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1280,height:900} });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  await p.goto(URL); await p.waitForTimeout(250);

  // --- in testata restano tre pulsanti ---
  const testata = await p.evaluate(() => [...document.querySelectorAll('header.top button')]
    .filter(b => !b.closest('.menubox')).map(b => b.id));
  chk(testata.length === 3 && testata.includes('btn-menu'),
      'in testata restano tre pulsanti: ' + testata.join(', '));
  chk(await p.evaluate(() => $('#menu-box').hidden), 'il menu parte chiuso');
  chk(await p.evaluate(() => $('#btn-menu').getAttribute('aria-expanded') === 'false'),
      'e lo dice con aria-expanded');

  // --- si apre e contiene le quattro voci ---
  await p.click('#btn-menu'); await p.waitForTimeout(200);
  /* Si contano le voci che si **vedono**: su schermo largo Salvataggio e Azzera
     restano in testata e le loro voci di menu non sono disegnate. */
  const voci = await p.evaluate(() => [...document.querySelectorAll('#menu-box button')]
    .filter(b => b.getBoundingClientRect().height > 0).map(b => b.id));
  chk(voci.join(',') === 'btn-mondo,btn-zoo,btn-coll,btn-audio,btn-musica',
      'dentro ci sono Mondo, Gabbie, Collezione, Suono e Musica');
  chk(await p.evaluate(() => $('#btn-menu').getAttribute('aria-expanded') === 'true'),
      'aperto, aria-expanded diventa true');
  chk(await p.evaluate(() => $('#menu-box').getAttribute('role') === 'menu' &&
        $('#btn-audio').getAttribute('role') === 'menuitemcheckbox'),
      'i ruoli ARIA sono quelli giusti: menu, e gli interruttori sono caselle');
  chk(await p.evaluate(() => document.activeElement.id === 'btn-mondo'),
      'e il fuoco entra sulla prima voce');
  chk((await p.innerText('#btn-audio')).includes('acceso'),
      'lo stato degli interruttori si legge anche a occhio');

  // --- Esc chiude e restituisce il fuoco ---
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  chk(await p.evaluate(() => $('#menu-box').hidden && document.activeElement.id === 'btn-menu'),
      'Esc chiude e riporta il fuoco sul pulsante');

  // --- un clic fuori chiude ---
  await p.click('#btn-menu'); await p.waitForTimeout(150);
  await p.click('h1'); await p.waitForTimeout(150);
  chk(await p.evaluate(() => $('#menu-box').hidden), 'un clic fuori lo chiude');

  // --- scegliere una destinazione chiude, un interruttore no ---
  await p.click('#btn-modego'); await p.waitForTimeout(200);
  await p.click('#btn-menu'); await p.waitForTimeout(150);
  await p.click('#btn-audio'); await p.waitForTimeout(150);
  chk(!(await p.evaluate(() => $('#menu-box').hidden)),
      'toccare un interruttore lascia il menu aperto');
  chk((await p.innerText('#btn-audio')).includes('spento'), 'e lo stato cambia sotto gli occhi');
  await p.click('#btn-zoo'); await p.waitForTimeout(250);
  chk(await p.evaluate(() => $('#menu-box').hidden) && await p.isVisible('#s-zoo'),
      'scegliere Gabbie chiude il menu e porta nelle gabbie');
  await p.click('#btn-menu'); await p.waitForTimeout(150);
  await p.click('#btn-mondo'); await p.waitForTimeout(250);
  chk(await p.evaluate(() => $('#menu-box').hidden) && await p.isVisible('#s-mondo'),
      'e scegliere Mondo porta nel mondo');

  // --- nella demo restano solo gli interruttori ---
  const dem = await p.evaluate(() => {
    EDIZIONE = 'demo'; applicaEdizione();
    /* qui il menu e' chiuso, quindi si guarda l'attributo; le voci solo-telefono
       non c'entrano con l'edizione e restano fuori dal conto */
    const visibili = [...document.querySelectorAll('#menu-box button')]
      .filter(b => !b.hidden && !b.classList.contains('solotel')).map(b => b.id);
    const sep = $('#menu-sep').hidden;
    EDIZIONE = 'completa'; applicaEdizione();
    return { visibili, sep };
  });
  chk(dem.visibili.join(',') === 'btn-coll,btn-audio,btn-musica',
      'nella demo restano Collezione e i due interruttori');
  chk(!dem.sep, 'e il separatore resta, perch\u00e9 sopra c\u2019\u00e8 comunque la Collezione');

  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
