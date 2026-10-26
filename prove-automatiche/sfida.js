const { chromium, SERVITO } = require('./comune');
const ok=[],ko=[]; const chk=(c,m)=>(c?ok:ko).push(m);
const URL = SERVITO + 'gioca.html';
/* Gioca la sfida fino alla fine con l'IA che muove anche il giocatore: quello
   che conta e' che due partite identiche diano lo stesso risultato. */
const GIOCA = `(() => {
  S.phase = 'battle'; S.turn = 'p'; S.over = false; S.busy = false;
  let n = 0, sd = 'p'; newTurn('p');
  const log = [];
  while (!S.over && n < 60){
    let g = 0;
    while (g++ < 40){ const u = nextAiUnit(sd); if (!u) break; aiAct(u); u.acted = true; if (S.over) break; }
    log.push(sd + ':' + S.units.map(u => u.alive ? u.hp : 'x').join(','));
    if (S.over) break;
    sd = sd === 'p' ? 'e' : 'p'; newTurn(sd); n++;
  }
  return log.join('|');
})()`;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1280,height:980} });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  p.on('dialog', d => d.accept());
  await p.context().grantPermissions(['clipboard-read','clipboard-write']);
  await p.goto(URL); await p.waitForTimeout(200);
  await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForTimeout(300);

  // --- il riquadro c'e' subito, prima di entrare ---
  chk(await p.isVisible('#sfidabox'), 'la sfida del giorno si vede dalla prima schermata');
  chk(/una volta sola/.test(await p.innerText('#sfidabox')),
      'e dice che si gioca una volta sola');
  chk(await p.isVisible('#btn-sfida-go'), 'con il pulsante per giocarla');

  // --- stessa squadra per tutti, dal seme del giorno ---
  const squadre = await p.evaluate(() => {
    const g = giornoOggi();
    const a = squadraSfida(rngDa(semeNum('SFIDA-' + g)));
    const b = squadraSfida(rngDa(semeNum('SFIDA-' + g)));
    const c = squadraSfida(rngDa(semeNum('SFIDA-2020-01-01')));
    return { a, b, c, distinte: new Set(a).size };
  });
  chk(squadre.a.join() === squadre.b.join(), 'la squadra del giorno è sempre la stessa: ' + squadre.a.join(', '));
  chk(squadre.a.join() !== squadre.c.join(), 'un altro giorno ne dà un’altra');
  chk(squadre.distinte === 5, 'sono cinque unità diverse');
  const ranghi = await p.evaluate(s => s.every(id => byId[id].rank <= 4 && id !== 'dark_emperor'), squadre.a);
  chk(ranghi, 'pescate fino al rango 4, così non dipende da quanto hai giocato');

  // --- avvio ---
  await p.evaluate(() => { S.rankIdx = 2; S.round = 3;
    S.team = ['mantis','faerie']; S.kingId = 'mantis'; save(); });
  await p.click('#btn-sfida-go'); await p.waitForTimeout(500);
  const dentro = await p.evaluate(() => ({
    schermo: $('#s-battle').classList.contains('on'),
    modo: S.matchMode, fase: S.phase, squadra: S.team.slice(),
    nemici: S.units.filter(u => u.side === 'e').length,
    ai: levelOf('e'), caso: CASO !== null,
    rankNascosto: $('#b-rank').hidden
  }));
  chk(dentro.schermo && dentro.fase === 'deploy', 'la sfida porta dritti allo schieramento');
  chk(dentro.modo === 'sfida' && dentro.caso, 'in modalità sfida, col caso pilotato');
  chk(dentro.squadra.join() === squadre.a.join(), 'e con la squadra del giorno, non la tua');
  chk(dentro.nemici === 5 && dentro.ai === 3,
      'cinque avversari, sempre allo stesso livello (esperto) per tutti');
  chk(dentro.rankNascosto, 'i badge del torneo spariscono: la sfida non è il torneo');

  // --- la partita e' identica a parita' di scelte ---
  const uno = await p.evaluate(g => { randomDeploy(); return eval(g); }, GIOCA);
  const due = await p.evaluate(g => {
    CASO = rngDa(semeNum('SFIDA-' + giornoOggi()));
    S.team = squadraSfida(CASO);
    S.kingId = S.team.slice().sort((a,b) => byId[b].hp - byId[a].hp)[0];
    S.turni = 0; startBattle(true); randomDeploy();
    return eval(g);
  }, GIOCA);
  chk(uno.length > 0 && uno === due,
      'due partite con lo stesso seme e le stesse scelte finiscono identiche, colpo per colpo');
  const diversa = await p.evaluate(g => {
    CASO = rngDa(semeNum('SFIDA-2020-01-01'));
    S.turni = 0; startBattle(true); randomDeploy();
    return eval(g);
  }, GIOCA);
  chk(diversa !== uno, 'con un altro seme la partita cambia');

  // --- senza sfida il caso torna libero ---
  const libero = await p.evaluate(() => {
    CASO = null;
    const a = [], b2 = [];
    for (let i = 0; i < 40; i++) a.push(caso());
    for (let i = 0; i < 40; i++) b2.push(caso());
    return a.join() !== b2.join();
  });
  chk(libero, 'fuori dalla sfida il caso è di nuovo caso');

  // --- l'esito si registra, e si gioca una volta sola ---
  const esito = await p.evaluate(() => {
    S.matchMode = 'sfida'; S.sfidaGiorno = giornoOggi(); S.turni = 7;
    S.units = S.units || []; finishSfida(true);
    return { f: S.sfida, modo: S.matchMode, caso: CASO === null,
             testo: $('#r-text').textContent, titolo: $('#r-title').textContent };
  });
  chk(esito.f && esito.f.esito === 'v' && esito.f.turni === 7, 'l’esito viene registrato');
  chk(esito.caso, 'e il caso pilotato viene rimesso a posto');
  chk(/Sfida superata/.test(esito.titolo) && /torna/.test(esito.testo),
      'la schermata dice com’è andata e che torna domani');
  const bis = await p.evaluate(() => avviaSfida());
  chk(bis === false, 'e la sfida di oggi non si rigioca');

  // --- il torneo non si e' mosso ---
  const torneo = await p.evaluate(() => ({ rank:S.rankIdx, round:S.round,
    squadra:S.team.slice(), re:S.kingId, held:S.careerHeld }));
  chk(torneo.rank === 2 && torneo.round === 3, 'rank e round del torneo sono rimasti dov’erano');
  chk(torneo.squadra.join() === 'mantis,faerie' && torneo.re === 'mantis' && !torneo.held,
      'e la squadra del torneo è tornata al suo posto');

  // --- il risultato da condividere ---
  /* La partita appena giocata lascia dietro di se' dei timer, e ogni tanto uno
     di quelli cambia schermata un attimo dopo che l'abbiamo aperta: il
     pulsante c'e' ma non si vede, e il clic aspetta trenta secondi per
     niente. Quindi non si aspetta un quarto di secondo sperando bene -- si
     aspetta che il pulsante sia DAVVERO li', e se la schermata e' scappata la
     si riapre. */
  const riquadro = p.locator('#btn-sfida-cond');
  for (let giro = 0; giro < 6; giro++){
    await p.evaluate(() => openModes(false));
    try { await riquadro.waitFor({ state:'visible', timeout: 1500 }); break; }
    catch(e){ if (giro === 5) throw e; }
  }
  chk(/Superata in/.test(await p.innerText('#sfidabox')), 'il riquadro mostra il risultato di oggi');
  await riquadro.click(); await p.waitForTimeout(250);
  const copiato = await p.evaluate(() => navigator.clipboard.readText());
  chk(/Insectron Arena/.test(copiato) && /vinta in 7 turni/.test(copiato),
      'e il risultato si copia in una riga: "' + copiato.slice(0, 70) + '..."');

  // --- salvataggio ---
  const salva = await p.evaluate(() => {
    const d = datiSalvataggio(), r = migra(JSON.parse(JSON.stringify(d)));
    const storto = migra({ sv:5, r:0, n:0, t:[], k:null, c:0, z:[], p:{},
                           f:{ g:'ieri', esito:'x', turni:-5, vive:99 } });
    return { sv:d.sv, atteso:SCHEMA, f:r.f, storto:storto.f };
  });
  chk(salva.sv === salva.atteso, 'il salvataggio porta il numero di schema corrente (' + salva.sv + ')');
  chk(salva.f && salva.f.turni === 7, 'e si porta dietro l’esito della sfida');
  chk(salva.storto === null, 'un esito scritto a mano con una data finta viene scartato');

  // --- nella demo non c'e' ---
  const dem = await p.evaluate(() => { EDIZIONE = 'demo'; drawSfida();
    const v = $('#sfidabox').hidden; const a = avviaSfida();
    EDIZIONE = 'completa'; drawSfida(); return { v, a }; });
  chk(dem.v && dem.a === false, 'nella demo la sfida non compare e non parte');

  // --- la sfida e' sempre tu contro il computer, qualunque cosa giochi nel torneo ---
  for (const modo of ['hvp','hvh','pvp']){
    const r = await p.evaluate(m => {
      localStorage.clear();
      S.sfida = null; S.careerHeld = false; S.matchMode = 'hvp';
      S.vs = m; S.champion = true; S.rankIdx = 3;
      S.team = ['mantis','staggy','faerie','flipperbug','knife_beetle']; S.kingId = 'mantis';
      avviaSfida();
      randomDeploy(); beginFight();
      const b = s => { const e = document.querySelector(s);
        return !!e && !e.hidden && e.getBoundingClientRect().width > 0; };
      const dentro = { vs: S.vs, fineTurno: b('#btn-end'), attivo: !document.querySelector('#btn-end').disabled,
                       squadra: S.team.join(','), salvato: datiSalvataggio().v,
                       squadraSalvata: datiSalvataggio().t.join(',') };
      finishSfida(true);
      return { dentro, dopo: { vs: S.vs, squadra: S.team.join(','),
               continua: document.querySelector('#btn-next').textContent,
               cambia: !document.querySelector('#btn-newteams').hidden } };
    }, modo);
    chk(r.dentro.vs === 'hvp' && r.dentro.fineTurno && r.dentro.attivo,
        'partendo da ' + modo + ', la sfida si gioca contro il computer e «Fine turno» c’è');
    chk(r.dentro.salvato === modo && r.dentro.squadraSalvata === 'mantis,staggy,faerie,flipperbug,knife_beetle',
        'e il salvataggio continua a portare la modalità e la squadra del torneo (' + r.dentro.salvato + ')');
    chk(r.dopo.vs === modo && r.dopo.squadra === 'mantis,staggy,faerie,flipperbug,knife_beetle',
        'finita la sfida, modalità e squadra del torneo tornano al loro posto');
    chk(r.dopo.continua === 'Torna al roster' && !r.dopo.cambia,
        'e l’esito non offre rivincite: la sfida è una al giorno');
  }

  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
