const { chromium, SERVITO } = require('./comune');
const ok=[],ko=[]; const chk=(c,m)=>(c?ok:ko).push(m);
const URL = SERVITO + 'gioca.html';

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
  const p = await b.newPage({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  await p.goto(URL); await p.waitForTimeout(200);
  await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForTimeout(250);
  await p.click('#btn-modego'); await p.waitForTimeout(200);
  await p.evaluate(() => { guidaSpegni();
    S.team = UNITS.filter(unlocked).slice(0,5).map(u => u.id); S.kingId = S.team[0]; drawSlots(); });
  await p.click('#btn-start'); await p.waitForTimeout(200);
  await p.click('#btn-toarena'); await p.waitForTimeout(900);

  // --- schieramento ---
  chk(await p.evaluate(() => $('#ucard').classList.contains('ancorata')),
      'schierando, la panchina è ancorata in basso');
  const sch = await p.evaluate(() => {
    const bar = $('#ucard').getBoundingClientRect();
    const bw = $('#boardwrap').getBoundingClientRect();
    const drop = [...document.querySelectorAll('.cell.drop')].map(c => c.getBoundingClientRect());
    return { coperte: drop.filter(r => r.bottom > bar.top + 1).length, drop: drop.length,
             boardTop: Math.round(bw.top), boardBottom: Math.round(bw.bottom),
             barTop: Math.round(bar.top), h: window.innerHeight,
             oriz: document.documentElement.scrollWidth <= window.innerWidth + 1 };
  });
  chk(sch.coperte === 0 && sch.drop === 10,
      'nessuna delle dieci caselle dove si piazza finisce sotto la barra');
  chk(sch.boardTop >= 0 && sch.boardBottom <= sch.barTop,
      'e la scacchiera sta tutta sopra (campo ' + sch.boardTop + '–' + sch.boardBottom +
      ', barra da ' + sch.barTop + ')');
  chk(sch.oriz, 'nessuno scorrimento orizzontale');

  // --- battaglia: niente selezione, niente barra ---
  await p.click('#btn-rand'); await p.waitForTimeout(200);
  await p.click('#btn-fight'); await p.waitForTimeout(700);
  chk(!(await p.evaluate(() => $('#ucard').classList.contains('ancorata'))),
      'senza niente selezionato la barra non ruba spazio');

  // --- selezione: le azioni sono li', senza scorrere ---
  await p.evaluate(() => { const u = S.units.filter(x => x.side === 'p' && x.alive)[0]; click(u.x, u.y); });
  await p.waitForTimeout(900);
  const sel = await p.evaluate(() => {
    const a = $('#acts').getBoundingClientRect();
    const bw = $('#boardwrap').getBoundingClientRect();
    const bar = $('#ucard').getBoundingClientRect();
    const bottoni = [...document.querySelectorAll('#acts button')].map(x => Math.round(x.getBoundingClientRect().height));
    return { dentro: a.top >= 0 && a.bottom <= window.innerHeight + 1,
             daScorrere: Math.max(0, Math.round(a.bottom - window.innerHeight)),
             campoIntero: bw.top >= 0 && bw.bottom <= bar.top + 1,
             bottoni, ancorata: $('#ucard').classList.contains('ancorata') };
  });
  chk(sel.ancorata, 'selezionando una pedina la scheda si ancora in basso');
  chk(sel.dentro && sel.daScorrere === 0,
      'le azioni stanno dentro allo schermo: zero pixel da scorrere');
  chk(sel.campoIntero, 'e la scacchiera resta tutta visibile sopra la barra');
  chk(sel.bottoni.length >= 3 && sel.bottoni.every(h => h >= 44),
      'i pulsanti sono grandi abbastanza per un pollice (' + sel.bottoni.join(', ') + ' px)');

  // --- si gioca davvero toccando ---
  const mosse = await p.evaluate(() => {
    const u = S.sel, prima = { x:u.x, y:u.y };
    [...document.querySelectorAll('#acts button')].find(b => /Muovi/.test(b.textContent)).click();
    return { prima, celle: document.querySelectorAll('.cell.mv').length };
  });
  chk(mosse.celle > 0, 'toccando Muovi si illuminano le caselle raggiungibili');
  await p.waitForTimeout(200);
  const spostata = await p.evaluate(() => {
    const c = document.querySelector('.cell.mv');
    const [x,y] = c.dataset.xy.split(',').map(Number);
    const u = S.sel; const prima = { x:u.x, y:u.y };
    c.click();
    return { mossa: u.x !== prima.x || u.y !== prima.y, ancora: $('#ucard').classList.contains('ancorata') };
  });
  chk(spostata.mossa, 'e toccandone una la pedina si sposta');
  chk(spostata.ancora, 'la barra resta lì per l’azione successiva');

  // --- finita l'azione, la barra se ne va ---
  await p.evaluate(() => { const u = S.sel; if (u) { u.acted = true; S.sel = null; S.mode = 'idle'; draw(); } });
  await p.waitForTimeout(250);
  chk(!(await p.evaluate(() => $('#ucard').classList.contains('ancorata'))),
      'esaurita la pedina la barra si sgancia');

  // --- su schermo grande non cambia niente ---
  await p.setViewportSize({ width:1280, height:900 }); await p.waitForTimeout(250);
  await p.evaluate(() => { const u = S.units.filter(x => x.side === 'p' && x.alive && !x.acted)[0];
                           if (u) click(u.x, u.y); });
  await p.waitForTimeout(250);
  chk(!(await p.evaluate(() => $('#ucard').classList.contains('ancorata'))),
      'su schermo grande la scheda resta dov’era, a fianco del campo');

  // --- niente bersagli sotto i 44px ---
  /* i controlli qui sopra finiscono su schermo largo: si torna al telefono */
  await p.setViewportSize({ width:390, height:844 }); await p.waitForTimeout(200);
  await p.evaluate(() => { leaveMatch(); drawRoster(); drawSlots(); show('s-team'); });
  await p.waitForTimeout(250);
  const piccoli = await p.evaluate(() => [...document.querySelectorAll('button:not(.cell)')]
    .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 44; })
    .map(e => (e.id || e.className) + ' ' + Math.round(e.getBoundingClientRect().height) + 'px'));
  chk(piccoli.length === 0, 'nessun pulsante sotto i 44px di altezza' +
      (piccoli.length ? ': ' + piccoli.join(', ') : ''));

  // --- la testata non si mangia la prima schermata ---
  const testata = await p.evaluate(() => ({
    alta: Math.round(document.querySelector('header.top').getBoundingClientRect().height),
    salva: document.querySelector('#btn-save').getBoundingClientRect().height > 0,
    azzera: document.querySelector('#btn-reset').getBoundingClientRect().height > 0,
    nelMenu: !document.querySelector('#btn-msave').hidden
  }));
  chk(testata.alta < 170, 'la testata sta in due righe (' + testata.alta + 'px)');
  chk(!testata.salva && !testata.azzera,
      'Salvataggio e Azzera torneo non stanno più accanto al pollice mentre si gioca');
  chk(testata.nelMenu, 'ma si trovano nel menu');
  await p.click('#btn-menu'); await p.waitForTimeout(200);
  const vociMenu = await p.evaluate(() =>
    [...document.querySelectorAll('#menu-box button')].filter(e => e.getBoundingClientRect().height > 0).length);
  chk(vociMenu === 7, 'il menu del telefono ha sette voci, non cinque (' + vociMenu + ')');
  await p.click('#btn-msave'); await p.waitForTimeout(250);
  chk(await p.evaluate(() => !document.querySelector('#save-box').hidden),
      'e la voce Salvataggio apre davvero la finestra del salvataggio');
  await p.click('#btn-savecls'); await p.waitForTimeout(150);

  // --- gli slot vuoti non si prendono mezza schermata ---
  const slot = await p.evaluate(() => {
    S.team = []; S.kingId = null; drawSlots();
    const el = document.querySelector('#slots');
    return { righe: el.children.length, testo: el.textContent.trim(),
             alto: Math.round(el.getBoundingClientRect().height) };
  });
  chk(slot.righe === 1 && /Nessuna pedina/.test(slot.testo),
      'a squadra vuota una riga sola, non cinque «Slot libero»');
  chk(slot.alto < 70, 'e sono ' + slot.alto + 'px invece di trecento');
  const slot2 = await p.evaluate(() => {
    S.team = UNITS.filter(unlocked).slice(0,3).map(u => u.id); S.kingId = S.team[0]; drawSlots();
    return document.querySelector('#slots').textContent.trim();
  });
  chk(/Ne mancano 2/.test(slot2), 'a squadra a metà dice quante ne mancano');

  // --- la scheda arriva addosso, invece di stare sotto ---
  await p.evaluate(() => { S.team = []; S.kingId = null; drawRoster(); drawSlots(); show('s-team'); });
  await p.waitForTimeout(200);
  const senzaScroll = await p.evaluate(() =>
    document.documentElement.scrollHeight <= innerHeight + 1);
  chk(senzaScroll, 'la schermata della squadra sta in una finestra, senza scorrere la pagina');
  await premiLungo(p, '#roster .mon');
  const pop = await p.evaluate(() => {
    const b = document.querySelector('#uni-box'), r = document.querySelector('.modalbox.scheda')
      .getBoundingClientRect();
    return { aperto: !b.hidden, dentro: r.top >= 0 && r.bottom <= innerHeight + 1,
             azione: !!document.querySelector('#btn-metto, #btn-tolgo') };
  });
  chk(pop.aperto, 'toccata una carta, la scheda si apre in pop-up');
  chk(pop.dentro, 'e il pop-up sta tutto nella finestra, senza scorrerlo');
  chk(pop.azione, 'con dentro il pulsante per metterlo in squadra');
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  chk(await p.evaluate(() => document.querySelector('#uni-box').hidden), 'Esc la chiude');

  // --- un elemento nascosto è nascosto davvero ---
  const banner = await p.evaluate(() => {
    const b = document.querySelector('#brief-who');
    b.hidden = true;
    return b.getBoundingClientRect().height;
  });
  chk(banner === 0, 'l’attributo hidden nasconde anche quello che ha una regola display');

  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
