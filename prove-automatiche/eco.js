const { chromium, SERVITO } = require('./comune');
const ok=[],ko=[]; const chk=(c,m)=>(c?ok:ko).push(m);
const URL = SERVITO + 'gioca.html';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1280,height:980} });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  p.on('dialog', d => d.accept());
  /* ogni richiesta che non sia la pagina stessa va segnata: il gioco non deve
     parlare con nessuno */
  const rete = [];
  p.on('request', r => { if (!r.url().startsWith(URL) && !r.url().startsWith('data:')) rete.push(r.url()); });
  await p.context().grantPermissions(['clipboard-read','clipboard-write']);
  await p.goto(URL); await p.waitForTimeout(300);

  // --- le tappe ---
  const apre = await p.evaluate(() => ({ t:Object.keys(ECO.t), giorni:ECO.giorni, primo:ECO.primo }));
  chk(apre.t.length === 1 && apre.t[0] === 'apre', 'appena aperto, l’unica tappa segnata è "apre"');
  chk(apre.giorni === 1 && /^\d{4}-\d{2}-\d{2}$/.test(apre.primo), 'e il primo giorno è segnato');

  await p.click('#btn-modego'); await p.waitForTimeout(150);
  await p.evaluate(() => { S.team = UNITS.filter(unlocked).slice(0,5).map(u => u.id);
                           S.kingId = S.team[0]; drawSlots(); });
  await p.click('#btn-start'); await p.waitForTimeout(150);
  chk(await p.evaluate(() => !!ECO.t.squadra), 'comporre la squadra segna la tappa');
  chk(await p.evaluate(() => ECO.n.hvp === 1), 'e conta la modalità scelta');

  const dopo = await p.evaluate(() => { finish(true); return { t:!!ECO.t.prima, n:ECO.n.partite, v:ECO.n.vinte }; });
  chk(dopo.t, 'la prima vittoria segna la tappa');
  chk(dopo.n === 1 && dopo.v === 1, 'e le partite si contano');
  const persa = await p.evaluate(() => { finish(false); return { n:ECO.n.partite, p:ECO.n.perse }; });
  chk(persa.n === 2 && persa.p === 1, 'anche le sconfitte si contano');

  const rankD = await p.evaluate(() => { S.rankIdx = 0; S.round = 4; finish(true); return !!ECO.t.rankD; });
  chk(rankD, 'arrivare al Rank D segna la tappa');

  // --- l'invito compare una volta sola ---
  await p.evaluate(() => { ECO.n.invito = 0; ecoSalva(); S.rankIdx = 1; S.round = 1; finish(true); });
  await p.waitForTimeout(150);
  chk(await p.isVisible('#eco-invito'), 'dopo una vittoria compare l’invito');
  await p.click('#btn-invito-no'); await p.waitForTimeout(120);
  chk(!(await p.isVisible('#eco-invito')), '«Non adesso» lo chiude');
  await p.evaluate(() => { S.round = 2; finish(true); });
  await p.waitForTimeout(150);
  chk(!(await p.isVisible('#eco-invito')), 'e non torna alla vittoria dopo');

  // --- il pannello mostra quello che manda ---
  await p.evaluate(() => apriEco()); await p.waitForTimeout(200);
  chk(await p.isVisible('#eco-box'), 'il pannello si apre');
  const testoPannello = await p.innerText('#eco-numeri');
  chk(/partite giocate/.test(testoPannello) && /rank raggiunto/.test(testoPannello),
      'e mostra i numeri in chiaro');
  chk(await p.evaluate(() => $('#btn-eco-mail').hidden),
      'senza un indirizzo configurato, il pulsante email resta nascosto');

  const rapporto = await p.evaluate(() => { $('#eco-nota').value = 'bel gioco, ma il roster è lungo';
    return ecoTesto($('#eco-nota').value); });
  chk(rapporto.indexOf('INSECTRON-ECO ') === 0, 'il rapporto ha la sua marca');
  const dati = JSON.parse(rapporto.slice('INSECTRON-ECO '.length));
  chk(dati.nota === 'bel gioco, ma il roster è lungo', 'e porta dentro il commento scritto');
  chk(dati.partite >= 2 && dati.rank && dati.tappe.length >= 3, 'con le tappe e i conteggi');
  chk(!/nome|email|id|uuid/i.test(Object.keys(dati).join(" ")),
      'e nessun campo che dica chi sei: ' + Object.keys(dati).join(", "));

  const lungo = await p.evaluate(() => ecoRapporto('x'.repeat(2000)).nota.length);
  chk(lungo === 800, 'un commento lunghissimo viene tagliato a 800 caratteri');

  // --- copia negli appunti ---
  await p.click('#btn-eco-copia'); await p.waitForTimeout(250);
  const appunti = await p.evaluate(() => navigator.clipboard.readText());
  chk(appunti.indexOf('INSECTRON-ECO ') === 0, 'il pulsante copia mette il rapporto negli appunti');
  chk((await p.innerText('#eco-msg')).length > 0, 'e il gioco conferma a schermo');

  // --- Esc chiude, e il fuoco torna dov'era ---
  await p.keyboard.press('Escape'); await p.waitForTimeout(150);
  chk(await p.evaluate(() => $('#eco-box').hidden), 'Esc chiude il pannello');

  // --- niente parte da solo ---
  chk(await p.evaluate(() => TELEMETRIA_URL === '' && ecoInvia('prova') === false),
      'senza indirizzo configurato, l’invio non parte nemmeno chiamandolo');
  chk(rete.length === 0, 'in tutta la sessione il gioco non ha fatto una sola richiesta di rete' +
      (rete.length ? ': ' + rete.join(' | ') : ''));

  // --- i numeri sopravvivono al ricaricamento, il salvataggio resta separato ---
  await p.reload(); await p.waitForTimeout(300);
  const dopoReload = await p.evaluate(() => ({ partite:ECO.n.partite, tappe:Object.keys(ECO.t).length,
    separato: localStorage.getItem('insectron') !== localStorage.getItem('insectron-eco') }));
  chk(dopoReload.partite >= 2 && dopoReload.tappe >= 3, 'i numeri restano dopo un ricaricamento');
  chk(dopoReload.separato, 'e stanno in una chiave separata dal salvataggio della partita');

  // ====== con la raccolta accesa ======
  /* `sendBeacon` viene sostituito da uno finto: interessa **cosa** parte, non
     che arrivi. Cosi' la prova non tocca la rete e non sporca nessun endpoint. */
  await p.evaluate(() => {
    window.MANDATI = [];
    navigator.sendBeacon = (url, corpo) => { MANDATI.push({ url, corpo }); return true; };
  });

  const spento = await p.evaluate(() => {
    TELEMETRIA_URL = ''; ecoMandato = false; ecoAuto();
    return MANDATI.length;
  });
  chk(spento === 0, 'con l’indirizzo vuoto il rapporto automatico non parte');

  const acceso = await p.evaluate(() => {
    TELEMETRIA_URL = 'https://eco.esempio.test/'; ECO_INVIO = true;
    MANDATI.length = 0; ecoMandato = false;
    ecoAuto(); ecoAuto(); ecoAuto();               /* tre occasioni, un rapporto solo */
    const c = MANDATI[0] || {};
    return { quanti: MANDATI.length, url: c.url, corpo: c.corpo || '' };
  });
  chk(acceso.quanti === 1, 'acceso, ne parte **uno per visita** anche chiamandolo tre volte');
  chk(acceso.url === 'https://eco.esempio.test/', 'e va all’indirizzo configurato');
  chk(acceso.corpo.startsWith('INSECTRON-ECO {'), 'col formato che il Worker si aspetta');

  const corpo = JSON.parse(acceso.corpo.replace('INSECTRON-ECO ', ''));
  chk(corpo.auto === 1, 'segnato come automatico, così il Worker lo distingue da quelli a mano');
  chk(corpo.nota === undefined, 'senza il commento libero: quello resta un gesto');
  const atteso = await p.evaluate(() => { const r = ecoRapporto(); r.auto = 1; return r; });
  chk(JSON.stringify(corpo) === JSON.stringify(atteso),
      'e identico, campo per campo, a quello che il pannello mostra');

  const nessunNome = !/@|password|nome|cognome|localStorage|insectron-(?!eco)/i.test(acceso.corpo);
  chk(nessunNome && !('id' in corpo) && !('sessione' in corpo),
      'nel rapporto non c’è nessun identificatore e niente che dica chi sei');

  // --- l'interruttore ---
  const spegne = await p.evaluate(() => {
    invioImposta(false);
    MANDATI.length = 0; ecoMandato = false; ecoAuto();
    const dopo = { mandati: MANDATI.length, salvato: localStorage.getItem('insectron-eco-invio'),
                   voce: document.querySelector('#btn-stat').getAttribute('aria-checked') };
    invioImposta(true);
    return dopo;
  });
  chk(spegne.mandati === 0, 'spento l’interruttore, non parte più niente');
  chk(spegne.salvato === 'no', 'e la scelta resta scritta nel browser');
  chk(spegne.voce === 'false', 'con la voce di menu che lo dice');

  const dopoRicarico = await p.evaluate(() => {
    localStorage.setItem('insectron-eco-invio', 'no');
    invioCarica();
    return ECO_INVIO;
  });
  chk(dopoRicarico === false, 'e la ritrova al ricaricamento');

  // --- quello che il pannello dichiara segue la configurazione ---
  const testi = await p.evaluate(() => {
    localStorage.removeItem('insectron-eco-invio'); invioCarica();
    TELEMETRIA_URL = ''; const off = ecoPrivacy();
    TELEMETRIA_URL = 'https://eco.esempio.test/'; invioImposta(true);
    apriEco();
    const on = { testo: document.querySelector('#eco-privacy').textContent,
                 riga: !document.querySelector('#eco-invio-riga').hidden,
                 spunta: document.querySelector('#eco-invio').checked };
    invioImposta(false);
    const spentoTxt = ecoPrivacy();
    chiudiEco(); TELEMETRIA_URL = ''; invioImposta(true);
    return { off, on, spentoTxt };
  });
  chk(/non ci manda niente da solo/.test(testi.off),
      'a raccolta spenta il pannello dice che non parte niente');
  chk(/partono una volta/.test(testi.on.testo) && /Come trattiamo i dati/.test(testi.on.testo),
      'ad accesa dice che parte un rapporto alla chiusura, e rimanda all’informativa');
  chk(testi.on.riga && testi.on.spunta, 'e compare la spunta per spegnerlo, accesa');
  chk(/è <b>spento<\/b>|è spento/.test(testi.spentoTxt),
      'e se lo spegni il pannello lo dichiara invece di restare com’era');

  chk(rete.length === 0, 'e in tutta la prova non è partita una sola richiesta vera');

  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
