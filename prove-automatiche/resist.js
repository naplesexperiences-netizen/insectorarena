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
  await p.reload(); await p.waitForTimeout(250);
  await p.click('#btn-modego'); await p.waitForTimeout(150);
  await p.evaluate(() => guidaSpegni());

  // un campo pulito con due pedine, per misurare una cosa alla volta
  await p.evaluate(() => {
    window.campo = (fam1, fam2, res, x2, y2) => {
      const a = mk(UNITS.find(u => u.fam === fam1).id, 'p', false, 1);
      const t = mk(UNITS.find(u => u.fam === fam2).id, 'e', false, 1);
      RES.forEach(k => t.res[k] = (res && res[k]) | 0);
      a.x = 2; a.y = 3; t.x = x2 === undefined ? 2 : x2; t.y = y2 === undefined ? 2 : y2;
      S.units = [a, t]; S.over = false;
      return [a, t];
    };
  });

  // --- i tipi di danno ---
  const tipi = await p.evaluate(() => ({
    mappa: Object.keys(MOSSA_TIPO).length,
    lame: tipoDi({ d:{ fam:'Lamidi' } }),
    mantide: tipoDi({ d:{ fam:'Falcidi' } }),
    cannone: tipoDi({ d:{ fam:'Bombardidi' } }),
    corno: tipoDi({ d:{ fam:'Bastidi' } }),
    veleno: Object.values(MOSSA_TIPO).includes('po')
  }));
  chk(tipi.mappa === 4, 'quattro mosse su tredici hanno un tipo di danno');
  chk(tipi.lame === 'ct' && tipi.mantide === 'ct', 'le lame tagliano, anche con l’attacco normale');
  chk(tipi.cannone === 'ex', 'il cannone esplode');
  chk(tipi.corno === '', 'la cornata non ha tipo: lì conta il Knockback, non la corazza');
  chk(!tipi.veleno, 'nessuna mossa infligge Veleno, e il gioco non finge il contrario');

  // --- la scala della corazza ---
  const scala = await p.evaluate(() => {
    const t = r => ({ res:{ ct:r } });
    return {
      zero: fattoreRes(t(0), 'ct'),
      cinque: +fattoreRes(t(5), 'ct').toFixed(2),
      dieci: +fattoreRes(t(10), 'ct').toFixed(2),
      venti: +fattoreRes(t(20), 'ct').toFixed(2),
      negativa: +fattoreRes(t(-10), 'ct').toFixed(2),
      altroTipo: fattoreRes(t(10), 'ex'),
      senzaTipo: fattoreRes(t(10), '')
    };
  });
  chk(scala.zero === 1 && scala.senzaTipo === 1, 'senza resistenza, o senza tipo, il colpo arriva intero');
  chk(scala.cinque === 0.85 && scala.dieci === 0.7, 'ogni punto vale il 3%: 5 punti -15%, 10 punti -30%');
  chk(scala.venti === 0.7, 'oltre i 10 punti il tetto regge: niente immunità');
  chk(scala.negativa === 1.3, 'e i cibi che tolgono resistenza fanno incassare il 30% in più');
  chk(scala.altroTipo === 1, 'la corazza da Taglio non protegge dall’Esplosione');

  // --- dal cibo al campo ---
  const passaggio = await p.evaluate(() => {
    S.zoo = []; ZOO_SEQ = 0;
    const e = nuovoEsemplare('mantis'); e.speso = 10; e.res.ct = 6; S.zoo.push(e);
    const mio = mk('@' + e.u, 'p', false, 1);
    const nemico = mk('mantis', 'e', false, 1);
    return { mio: mio.res.ct, nemico: nemico.res.ct, tutte: RES.every(k => k in nemico.res) };
  });
  chk(passaggio.mio === 6, 'quello che l’esemplare ha mangiato arriva in campo');
  chk(passaggio.nemico === 0 && passaggio.tutte,
      'gli avversari sono esemplari del roster: resistenza zero, sempre');

  // --- il danno cambia davvero ---
  const danno = await p.evaluate(() => {
    CASO = () => 0.5;                          /* niente sorteggio: misura pulita */
    const fuori = (res) => {
      const [a, t] = campo('Lamidi', 'Falcidi', res);
      const prima = t.hp; strike(a, t, 1, 'attacca'); return prima - t.hp;
    };
    const nudo = fuori(null), corazzato = fuori({ ct:10 }), altro = fuori({ ex:10 });
    const [a, t] = campo('Lamidi', 'Falcidi', { ct:10 });
    const stima = estDmg(a, t, 1);
    CASO = null;
    return { nudo, corazzato, altro, stima };
  });
  chk(danno.corazzato < danno.nudo, 'con la corazza il colpo fa meno male: ' + danno.nudo + ' -> ' + danno.corazzato);
  chk(Math.abs(danno.corazzato / danno.nudo - 0.7) < 0.03, 'e il taglio è proprio del 30%');
  chk(danno.altro === danno.nudo, 'la resistenza sbagliata non serve a niente');
  chk(danno.stima === danno.corazzato, 'la scheda promette il danno che poi arriva davvero');

  // --- le spinte ---
  const spinte = await p.evaluate(() => ({
    zero: passiSpinta({ res:{ kb:0 } }, 2),
    quattro: passiSpinta({ res:{ kb:4 } }, 2),
    otto: passiSpinta({ res:{ kb:8 } }, 2),
    tanta: passiSpinta({ res:{ kb:10 } }, 1),
    fragile: passiSpinta({ res:{ kb:-4 } }, 1),
    piccola: passiSpinta({ res:{ kb:3 } }, 2)
  }));
  chk(spinte.zero === 2 && spinte.quattro === 1 && spinte.otto === 0,
      'una casella in meno ogni 4 punti di Knockback');
  chk(spinte.piccola === 2, 'sotto i 4 punti non cambia niente: niente scalini nascosti');
  chk(spinte.tanta === 0, 'con 10 punti la spinta si ferma prima di partire');
  chk(spinte.fragile === 2, 'e chi ha mangiato male viene spinto di una casella in più');

  // --- restare aggrappati al bordo ---
  const bordo = await p.evaluate(() => {
    const prova = (res, dado) => {
      CASO = () => dado;
      const [a, t] = campo('Ventalidi', 'Falcidi', res, 2, 0);
      const esito = shove(t, 0, -1, 1, a);
      CASO = null;
      return { esito, vivo: t.alive, y: t.y };
    };
    let tirati = 0;
    CASO = () => { tirati++; return 0.99; };
    const [a2, t2] = campo('Ventalidi', 'Falcidi', null, 2, 0);
    shove(t2, 0, -1, 1, a2);
    CASO = null;
    /* 3 punti: non bastano a fermare la spinta, ma danno una presa sul bordo */
    return { tiene: prova({ kb:3 }, 0.1), esce: prova({ kb:3 }, 0.9),
             nudo: prova(null, 0.0), tirati };
  });
  chk(bordo.tiene.esito === 'ok' && bordo.tiene.vivo,
      'con il Knockback alto si resta aggrappati al bordo invece di uscire');
  chk(bordo.esce.esito === 'out' && !bordo.esce.vivo, 'ma non è un salvacondotto: il dado può andare male');
  chk(!bordo.nudo.vivo, 'senza resistenza si esce dal campo come sempre');
  chk(bordo.tirati === 0, 'e per chi ha zero non si tira nemmeno il dado: le partite di prima restano identiche');

  // --- il lancio ---
  const lancio = await p.evaluate(() => {
    const prova = (res, dado) => {
      CASO = () => dado;
      const [a, t] = campo('Tenaglidi', 'Falcidi', res, 2, 0);
      const esito = hurl(t, 0, -1, a);
      CASO = null;
      return { esito, vivo: t.alive };
    };
    return { tiene: prova({ th:10 }, 0.1), esce: prova({ th:10 }, 0.9), nudo: prova(null, 0.0) };
  });
  chk(lancio.tiene.esito === 'ok' && lancio.tiene.vivo, 'il Lancio salva dal volo fuori campo');
  chk(lancio.esce.esito === 'out' && !lancio.nudo.vivo, 'quando il dado dice di no, si vola fuori lo stesso');

  // --- confusione ---
  const conf = await p.evaluate(() => {
    const ribalta = (res, dado) => {
      CASO = () => dado;
      const [a, t] = campo('Voltidi', 'Falcidi', res);
      doSpecial(a, t);
      CASO = null;
      return t.stun;
    };
    const ammalia = (res, dado) => {
      CASO = () => dado;
      const [a, t] = campo('Silfidi', 'Falcidi', res);
      const vita = a.hp;
      doSpecial(a, t);
      CASO = null;
      return { lato: t.side, pagato: a.hp < vita };
    };
    return { resiste: ribalta({ cf:10 }, 0.1), cede: ribalta({ cf:10 }, 0.9), nudo: ribalta(null, 0.0),
             charm: ammalia({ cf:10 }, 0.1), charmNudo: ammalia(null, 0.0) };
  });
  chk(conf.resiste === 0 && conf.nudo === 2, 'la Confusione fa fallire il ribaltamento del Voltidi');
  chk(conf.cede === 2, 'anche qui è una probabilità, non uno scudo');
  chk(conf.charm.lato === 'e' && conf.charmNudo.lato === 'p',
      'e fa fallire l’ammaliamento della Silfidi');
  chk(conf.charm.pagato, 'la Silfidi paga metà stamina anche quando l’incantesimo non prende: è il costo del tentativo');

  // --- quello che il gioco dice ---
  const testi = await p.evaluate(() => {
    S.zoo = []; ZOO_SEQ = 0;
    const e = nuovoEsemplare('mantis'); e.speso = 10; e.res.ct = 6; S.zoo.push(e);
    S.nutri = e.u; S.dispensa = { 'Tritone affumicato': 1 };
    apriGabbie(); drawDispensa();
    const t1 = document.body.innerText;
    const e2 = S.zoo[0]; e2.res.po = 4; drawDispensa();
    const t2 = document.body.innerText;
    return { vecchio: /non contano ancora/.test(t1), nuovo: /riducono danno/.test(t1),
             veleno: /Veleno resta fermo/.test(t2) };
  });
  chk(!testi.vecchio, 'la dispensa non dice più che le resistenze non contano');
  chk(testi.nuovo, 'dice invece che cosa fanno');
  chk(testi.veleno, 'e sul Veleno resta onesta: nessuna mossa lo infligge');

  const scheda = await p.evaluate(() => {
    S.zoo = []; ZOO_SEQ = 0;
    const e = nuovoEsemplare('mantis'); e.speso = 10; e.res.kb = 4; S.zoo.push(e);
    S.units = [mk('@' + e.u, 'p', false, 1), mk('mantis', 'e', false, 1)];
    S.units[0].x = 2; S.units[0].y = 5; S.units[1].x = 2; S.units[1].y = 1;
    S.sel = S.units[0]; S.turn = 'p'; S.matchMode = 'hvp'; show('s-battle'); draw();
    const mio = document.querySelector('#ucard').innerText;
    S.sel = S.units[1]; draw();
    return { mio: /Knockback \+4/.test(mio), altrui: /Resistenze/.test(document.querySelector('#ucard').innerText) };
  });
  chk(scheda.mio, 'in battaglia la scheda dell’allevato mostra le sue resistenze');
  chk(!scheda.altrui, 'e non mette una riga vuota a chi non ne ha');

  // --- i cibi delle resistenze diventano ottenibili ---
  const premi = await p.evaluate(() => ({
    corazze: ['Tritone affumicato','Anguilla elettrica','Gomma appiccicosa','Caramella dura','Chicchi di caffè']
      .every(n => CIBI_PREMIO.includes(n)),
    pepe: CIBI_PREMIO.includes('Peperoncino infernale'),
    feed: CIBI_PREMIO.includes('Mangime'),
    tutti: CIBI_PREMIO.every(n => CIBI[n])
  }));
  chk(premi.corazze, 'i cibi che danno resistenza adesso si vincono nel torneo');
  chk(!premi.pepe, 'l’Peperoncino infernale resta fuori: dà solo Veleno, che ancora non morde');
  chk(!premi.feed && premi.tutti, 'nel premio non finiscono oggetti inerti o inventati');

  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
