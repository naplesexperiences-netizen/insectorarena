const { chromium, GIOCA, CREA_DEMO } = require('./comune');
const { execFileSync } = require('child_process');
const ok=[],ko=[]; const chk=(c,m)=>(c?ok:ko).push(m);
const path = require('path'), os = require('os');
/* La build della demo si genera in una cartella temporanea: e' un file
   derivato, non va nel repository. */
const SORGENTE = GIOCA.replace('file://', '');
const DEMO = path.join(os.tmpdir(), 'gioca-demo.html');

/* Il gesto e' cambiato: il tocco breve mette in squadra, la scheda si apre
   tenendo premuto. Le suite che vogliono la scheda tengono premuto davvero. */
async function premiLungo(p, sel, ms){
  const box = await p.locator(sel).first().boundingBox();
  await p.mouse.move(box.x + box.width/2, box.y + box.height/2);
  await p.mouse.down(); await p.waitForTimeout(ms || 700); await p.mouse.up();
  await p.waitForTimeout(250);
}

(async () => {
  // la build della demo si genera davvero, con lo script vero
  const uscita = execFileSync(CREA_DEMO,
                              [SORGENTE, DEMO], { encoding:'utf8' });
  chk(/demo generata/.test(uscita), 'lo script genera la build della demo');

  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1280,height:980} });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  p.on('dialog', d => d.accept());
  await p.goto('file://' + DEMO); await p.waitForTimeout(300);

  chk(await p.evaluate(() => EDIZIONE === 'demo'), 'la build si dichiara demo');
  chk(await p.evaluate(() => $('#btn-mondo').hidden && $('#btn-zoo').hidden),
      'Mondo e Gabbie spariscono dalla testata');
  chk(await p.evaluate(() => !$('#btn-save').hidden), 'il salvataggio invece resta');

  await p.click('#btn-modego'); await p.waitForTimeout(150);
  chk(await p.isVisible('#s-team'), 'si entra nel gioco e si sceglie la squadra');

  // forzare le funzioni non apre niente
  const forzato = await p.evaluate(() => {
    apriGabbie(); const a = document.querySelector('#s-zoo').classList.contains('on');
    apriMondo();  const b = document.querySelector('#s-mondo').classList.contains('on');
    return { a, b, zoo:S.zoo.length };
  });
  chk(!forzato.a && !forzato.b, 'chiamando le funzioni a mano le due schermate non si aprono');
  chk(forzato.zoo === 0, 'e non nasce nessun esemplare');

  // la scheda del roster spiega invece di offrire
  const primo = await p.evaluate(() => UNITS.filter(unlocked)[0].id);
  await premiLungo(p, '#roster [data-id="' + primo + '"]');
  chk(await p.evaluate(() => !document.querySelector('#btn-alleva')),
      'dalla scheda non si alleva');
  chk((await p.innerText('#uni-corpo')).includes('demo'),
      'e la scheda dice che questa è la demo');

  // il torneo funziona per intero
  const rank = await p.evaluate(() => {
    S.rankIdx = 0; S.round = 4; S.team = UNITS.filter(unlocked).slice(0,5).map(u => u.id);
    S.kingId = S.team[0];
    finish(true);
    return { rank: S.rankIdx, testo: document.querySelector('#r-text').textContent };
  });
  chk(rank.rank === 1, 'vincendo cinque round si conquista il rank');
  chk(!/gabbie|mondo|trappola/i.test(rank.testo),
      'e il premio non parla di gabbie o mondo, che qui non esistono');

  // il salvataggio della demo resta leggibile dal gioco completo
  const codice = await p.evaluate(() => esporta());
  await p.goto('file://' + SORGENTE); await p.waitForTimeout(250);
  const riletto = await p.evaluate(c => { const r = importa(c); return { ok:r.ok, rank:r.ok && r.dati.r }; }, codice);
  chk(riletto.ok && riletto.rank === 1, 'un salvataggio fatto nella demo si apre nel gioco completo');
  chk(await p.evaluate(() => EDIZIONE === 'completa' && !$('#btn-mondo').hidden),
      'e il gioco completo ha ancora tutto');

  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
