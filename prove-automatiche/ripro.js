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

  // --- i dati delle fonti ---
  const dati = await p.evaluate(() => ({
    coppie: COPPIE.length,
    tutteValide: COPPIE.every(c => byId[c[0]] && byId[c[1]] && byId[c[2]]),
    nessunEmperor: COPPIE.every(c => c[2] !== 'dark_emperor'),
    eredita: EREDITA
  }));
  chk(dati.coppie === 18 && dati.tutteValide,
      'le ' + dati.coppie + ' coppie speciali nominano solo unità che esistono');
  chk(dati.nessunEmperor, 'nessuna coppia produce il Folgore, che resta premio del Rank S');
  chk(dati.eredita === 0.9, 'il figlio eredita il 90% del meglio');

  // --- la linea di famiglia salta i buchi ---
  const linea = await p.evaluate(() => ({
    flipper: successore('flipperbug').id,        /* la scala va 1, 3, 4, 5 */
    mantis: successore('mantis').id,
    cima: successore('carver_beetle'),
    solo: successore('itsahorse')
  }));
  chk(linea.flipper === 'turner', 'il successore salta i ranghi mancanti (flipperbug -> turner)');
  chk(linea.mantis === 'slaying_mantis', 'e segue la famiglia (mantis -> slaying mantis)');
  chk(linea.cima === null && linea.solo === null,
      'in cima alla scala, o in una famiglia senza gradini, non c’è successore');

  // --- il sesso si alterna ---
  const sessi = await p.evaluate(() => {
    S.zoo = []; ZOO_SEQ = 0;
    const l = [];
    for (let i = 0; i < 6; i++) l.push(nuovoEsemplare('mantis').s);
    return l;
  });
  chk(sessi.join('') === 'mfmfmf', 'il sesso si alterna invece di essere tirato a caso: ' + sessi.join(''));

  // --- le regole del "non si puo'" ---
  const regole = await p.evaluate(() => {
    S.rankIdx = 5; S.zoo = []; ZOO_SEQ = 0;
    const larva = nuovoEsemplare('mantis');                   /* m */
    const adultaF = nuovoEsemplare('mantis'); adultaF.speso = 10;   /* f */
    const adultoM = nuovoEsemplare('staggy'); adultoM.speso = 10;   /* m */
    const adultaF2 = nuovoEsemplare('staggy'); adultaF2.speso = 10; /* f */
    S.zoo = [larva, adultaF, adultoM, adultaF2];
    return {
      larva: possonoAccoppiarsi(larva, adultaF),
      stesso: possonoAccoppiarsi(adultaF, adultaF2),
      seStesso: possonoAccoppiarsi(adultaF, adultaF),
      ok: possonoAccoppiarsi(adultoM, adultaF)
    };
  });
  chk(/adulti/.test(regole.larva), 'una larva non si riproduce, e il gioco dice perché');
  chk(/maschio e una femmina/.test(regole.stesso), 'due femmine nemmeno');
  chk(/due esemplari diversi/.test(regole.seStesso), 'e nemmeno un esemplare con se stesso');
  chk(regole.ok === '', 'un maschio e una femmina adulti invece possono');

  // --- il tetto del torneo ---
  const tetto = await p.evaluate(() => {
    S.zoo = []; ZOO_SEQ = 0;
    const m = nuovoEsemplare('stun_staggy'); m.speso = 10;      /* rango 3, maschio */
    const f = nuovoEsemplare('stun_staggy'); f.speso = 10;      /* rango 3, femmina */
    S.zoo = [m, f];
    S.rankIdx = 0;  const basso = possonoAccoppiarsi(m, f);     /* tetto 1+1 = 2 */
    S.rankIdx = 5;  const alto = possonoAccoppiarsi(m, f);
    return { basso, alto, tettoBasso: (S.rankIdx = 0, tettoNascita()), tettoAlto: (S.rankIdx = 5, tettoNascita()) };
  });
  chk(/rango/.test(tetto.basso) && tetto.alto === '',
      'al Rank E un figlio troppo forte è rimandato al torneo; al Rank S passa');
  chk(tetto.tettoBasso === 2 && tetto.tettoAlto === 6,
      'il tetto è sempre un gradino oltre quello che il torneo ha aperto (' +
      tetto.tettoBasso + ' e ' + tetto.tettoAlto + ')');

  // --- coppia speciale ---
  const sp = await p.evaluate(() => {
    S.rankIdx = 5; S.zoo = []; ZOO_SEQ = 0;
    const m = nuovoEsemplare('hercules_beetle'); m.speso = 10; m.b = { hp:30, str:9, def:6 };
    const f = nuovoEsemplare('hercules_beetle'); f.speso = 10; f.b = { hp:12, str:4, def:11 };
    S.zoo = [m, f]; S.team = ['@' + m.u]; S.kingId = '@' + m.u;
    const previsto = figlioDi(m, f);
    const r = accoppia(m.u, f.u);
    const fig = S.zoo[0];
    return { previsto, speciale: r.speciale, id: fig.id, b: fig.b, speso: fig.speso,
             nato: fig.nato, zoo: S.zoo.length, team: S.team.length, re: S.kingId };
  });
  chk(sp.previsto.id === 'stun_staggy' && sp.previsto.speciale,
      'Bastione + Bastione danno la Ganascia, come dicono le fonti');
  chk(sp.zoo === 1 && sp.id === 'stun_staggy', 'i due genitori spariscono e resta il figlio');
  chk(sp.b.hp === 27 && sp.b.str === 8 && sp.b.def === 10,
      'che eredita il 90% del meglio di ognuno (+' + sp.b.hp + ' vita, +' + sp.b.str +
      ' forza, +' + sp.b.def + ' difesa)');
  chk(sp.speso === 0 && sp.nato === true, 'nasce larva, con il suo budget di vita intero');
  chk(sp.team === 0 && sp.re === null,
      'e un genitore che era in squadra ne esce, Re compreso: niente riferimenti a un esemplare sparito');

  // --- linea di famiglia quando non c'e' coppia speciale ---
  const gen = await p.evaluate(() => {
    S.zoo = []; ZOO_SEQ = 0;
    const m = nuovoEsemplare('mantis'); m.speso = 10;
    const f = nuovoEsemplare('faerie'); f.speso = 10;
    S.zoo = [m, f];
    const previsto = figlioDi(m, f);
    accoppia(m.u, f.u);
    return { previsto, nato: S.zoo[0].id };
  });
  chk(!gen.previsto.speciale && gen.nato === 'slaying_mantis',
      'senza coppia documentata si sale nella linea del genitore più alto (' + gen.nato + ')');

  // --- la schermata ---
  await p.evaluate(() => {
    S.rankIdx = 5; S.zoo = []; ZOO_SEQ = 0; S.cop = [];
    const m = nuovoEsemplare('faerie'); m.speso = 10;
    const f = nuovoEsemplare('faerie'); f.speso = 10;
    const l = nuovoEsemplare('mantis');
    S.zoo = [m, f, l];
    apriGabbie();
  });
  await p.waitForTimeout(200);
  await p.click('#btn-vai-cop'); await p.waitForTimeout(250);
  chk(await p.isVisible('#s-cop'), 'dalle gabbie si arriva all’accoppiamento');
  chk((await p.evaluate(() => document.querySelectorAll('#cop-lista .gab').length)) === 2,
      'nell’elenco ci sono solo gli adulti, non le larve');
  const righe = await p.innerText('#cop-lista');
  chk(/maschio/.test(righe) && /femmina/.test(righe), 'e ognuno dice se è maschio o femmina');
  await p.click('#cop-lista .gab'); await p.waitForTimeout(150);
  await p.click('#cop-lista .gab:nth-child(2)'); await p.waitForTimeout(200);
  const anteprima = await p.innerText('#cop-esito');
  chk(/Bufera/i.test(anteprima), 'scelti due adulti, si vede in anticipo chi nascerà');
  chk(/genitori spariscono/.test(anteprima), 'e che i genitori si consumano');
  chk(/coppia speciale/.test(anteprima), 'le coppie documentate sono segnalate come tali');
  await p.click('#btn-cop-fai'); await p.waitForTimeout(300);
  chk(/nato/i.test(await p.innerText('#cop-esito')), 'confermando, il gioco annuncia chi è nato');
  chk(await p.evaluate(() => S.zoo.length === 2 && S.zoo.some(e => e.id === 'butterflap')),
      'e nelle gabbie restano la larva di prima e il nuovo nato');

  // --- salvataggio ---
  const salva = await p.evaluate(() => {
    const d = datiSalvataggio();
    const r = migra(JSON.parse(JSON.stringify(d)));
    const vecchio = migra({ sv:3, r:1, n:0, t:[], k:null, c:0,
      z:[{u:'s1',id:'mantis',b:{hp:0,str:0,def:0},res:{},speso:9},
         {u:'s2',id:'mantis',b:{hp:0,str:0,def:0},res:{},speso:9}], p:{} });
    return { sv: d.sv, atteso: SCHEMA, sesso: r.z[0].s, nato: r.z.some(e => e.nato),
             vecchi: vecchio.z.map(e => e.s) };
  });
  chk(salva.sv === salva.atteso, 'il salvataggio porta il numero di schema corrente (' + salva.sv + ')');
  chk(salva.sesso === 'm' || salva.sesso === 'f', 'il sesso ci passa dentro');
  chk(salva.vecchi.join('') === 'fm' || salva.vecchi.join('') === 'mf',
      'e a chi aveva già esemplari il sesso viene assegnato alternandolo (' + salva.vecchi.join('') + ')');

  // --- nella demo non esiste ---
  const dem = await p.evaluate(() => { show('s-team'); EDIZIONE = 'demo'; apriCoppia();
    const v = document.querySelector('#s-cop').classList.contains('on');
    EDIZIONE = 'completa'; return v; });
  chk(!dem, 'nella demo la schermata non si apre nemmeno forzando la funzione');

  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
