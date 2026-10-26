const { chromium, SERVITO } = require('./comune');
const ok=[],ko=[]; const chk=(c,m)=>(c?ok:ko).push(m);
const URL = SERVITO + 'gioca.html';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1280,height:1000} });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  p.on('dialog', d => d.accept());
  await p.goto(URL); await p.waitForTimeout(200);
  await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForTimeout(300);
  await p.click('#btn-modego'); await p.waitForTimeout(150);
  await p.evaluate(() => guidaSpegni());

  // --- si parte da zero ---
  await p.click('#btn-menu'); await p.waitForTimeout(150);
  await p.click('#btn-coll'); await p.waitForTimeout(250);
  chk(await p.isVisible('#s-coll'), 'dal menu si apre la collezione');
  chk((await p.innerText('#coll-n')) === '0/34', 'che parte vuota: 0 su 34');
  const ignoti = await p.evaluate(() => ({
    carte: document.querySelectorAll('#coll-griglia .colcard').length,
    ignote: document.querySelectorAll('#coll-griglia .colcard.ignoto').length,
    nomi: [...document.querySelectorAll('#coll-griglia .colcard b')].every(x => x.textContent === '???')
  }));
  chk(ignoti.carte === 34 && ignoti.ignote === 34, 'ci sono tutte e 34 le caselle, tutte ancora ignote');
  chk(ignoti.nomi, 'e i nomi non si vedono finché non li incontri');

  // --- una battaglia li fa conoscere ---
  await p.evaluate(() => {
    S.rankIdx = 0; S.team = UNITS.filter(unlocked).slice(0,5).map(u => u.id);
    S.kingId = S.team[0]; startBattle();
  });
  await p.waitForTimeout(200);
  const dopo = await p.evaluate(() => ({
    visti: Object.keys(S.visti).length,
    inCampo: new Set(S.units.map(u => u.d.id)).size,
    tuttiInCampo: S.units.every(u => !!S.visti[u.d.id])
  }));
  chk(dopo.visti === dopo.inCampo && dopo.visti > 0,
      'una battaglia fa conoscere chi c’era in campo (' + dopo.visti + ' unità)');
  chk(dopo.tuttiInCampo, 'sia i tuoi sia gli avversari');

  await p.evaluate(() => apriCollezione()); await p.waitForTimeout(200);
  const viste = await p.evaluate(() => ({
    testo: $('#coll-n').textContent,
    scoperte: document.querySelectorAll('#coll-griglia .colcard:not(.ignoto)').length,
    barra: $('#coll-barra').style.width
  }));
  chk(viste.scoperte === dopo.visti, 'la griglia le mostra scoperte');
  chk(viste.testo === dopo.visti + '/34' && viste.barra !== '0%',
      'il contatore e la barra si muovono (' + viste.testo + ', barra ' + viste.barra + ')');

  // --- i traguardi ---
  const trofei = await p.evaluate(() => ({
    quanti: TROFEI.length,
    presi: Object.keys(S.trofei).length,
    carte: document.querySelectorAll('#coll-trofei .trofeo').length,
    accesi: document.querySelectorAll('#coll-trofei .trofeo.preso').length
  }));
  chk(trofei.quanti === 8 && trofei.carte === 8, 'i traguardi sono otto e si vedono tutti');
  chk(trofei.presi === 0 && trofei.accesi === 0, 'spenti finché non si prendono');

  const presi = await p.evaluate(() => {
    const out = {};
    S.units = S.units.filter(u => u.side === 'p');       /* nessun nemico vivo */
    S.rankIdx = 0; S.round = 1; finish(true);
    out.prima = !!S.trofei.prima; out.invitto = !!S.trofei.invitto;
    const e = nuovoEsemplare('mantis'); S.zoo = [e]; S.nutri = e.u;
    S.dispensa = { 'Frutto del Vesuvio': 4 };
    for (let i = 0; i < 2; i++) nutriCon('Frutto del Vesuvio');
    out.adulto = !!S.trofei.adulto;
    S.rankIdx = 5; S.round = 4; S.units = S.units.filter(u => u.side === 'p'); finish(true);
    out.campione = !!S.trofei.campione;
    return out;
  });
  chk(presi.prima, 'la prima vittoria accende il suo traguardo');
  chk(presi.invitto, 'vincere senza perdere pedine ne accende un altro');
  chk(presi.adulto, 'portare un esemplare all’età adulta anche');
  chk(presi.campione, 'e vincere il Rank S accende Campione');

  const tutti = await p.evaluate(() => {
    UNITS.forEach(u => vedi(u.id));
    return { visti: Object.keys(S.visti).length, trofeo: !!S.trofei.tutti };
  });
  chk(tutti.visti === 34 && tutti.trofeo, 'incontrandoli tutti scatta Collezionista');

  await p.evaluate(() => apriCollezione()); await p.waitForTimeout(200);
  chk((await p.innerText('#coll-n')) === '34/34', 'e la collezione si dichiara completa');
  chk(await p.evaluate(() => !document.querySelector('#coll-griglia .colcard.ignoto')),
      'nessuna casella resta grigia');

  // --- salvataggio ---
  const salva = await p.evaluate(() => {
    const d = datiSalvataggio(), r = migra(JSON.parse(JSON.stringify(d)));
    const storto = migra({ sv:5, r:0, n:0, t:[], k:null, c:0, z:[], p:{},
                           vs:{ inventato:1, mantis:1 }, tr:{ falso:'x', prima:'2026-01-01' } });
    return { visti: Object.keys(r.vs).length, trofei: Object.keys(r.tr).length,
             sVisti: Object.keys(storto.vs), sTrofei: Object.keys(storto.tr) };
  });
  chk(salva.visti === 34 && salva.trofei >= 4, 'collezione e traguardi passano nel salvataggio');
  chk(salva.sVisti.join() === 'mantis' && salva.sTrofei.join() === 'prima',
      'e un salvataggio scritto a mano con nomi inventati viene ripulito');

  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
