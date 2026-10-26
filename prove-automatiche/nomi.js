const { chromium, SERVITO } = require('./comune');
const ok=[],ko=[]; const chk=(c,m)=>(c?ok:ko).push(m);
const URL = SERVITO + 'gioca.html';

/* La nomenclatura dell'originale, per intero: nessuna di queste stringhe deve
   più comparire, né nei dati né in quello che si legge a schermo. */
const VECCHI = [
 "Big Staggy","Bomb Roller","Butterflap","Carver Beetle","Dark Emperor","Drillerpillar","Dustpan",
 "Faerie","Fishface Beetle","Flipperbug","Gum Roller","Handsome Faerie","Hatchet Beetle",
 "Hercules Beetle","Itsahorse","Kaboom Beetle","Knife Beetle","Mantis","Miss Mysterious",
 "Narcissus Beetle","Orion Beetle","Planet Beetle","Saber Beetle","Shoveler","Slaying Mantis",
 "Spotted Lady","Staggy","Stinger Bill","Stun Staggy","Super Mantis","Susanoo Beetle",
 "Tornado Mantis","Turner","Western Beetle",
 "Bazoo Beetle","Cutterpillar","Flutterbug","Lady Beetle","Dung Roller",
 "Jumping Stab","Crushing Horn","Cannon Blast","Over Easy","Scissor Throw","Sickle Dance",
 "Body Blow","Wing Flap","Healing Jig","Fill Hole","Itsakick","Charm Beam","Emperor",
 "Battle Feed","Dark Onyx","Diamond","Edensia","Electric Eel","Firestone","Hard Candy",
 "Juraikan","Lapis Lazuli","Mellow Banana","Nebula Opal","Primeval Beef","Pirate","Royal Fruit",
 "Ruby","Sanchez","Seventhmoon","Smoked Rainbow Newt","Stella Crystal","Sticky Gum",
 "Ultraspicy","Yago Milk",
 "Zak","Randall","Matilda","Keller","Robert","Matty","Philly","Medis","Cordison","Fabre",
 "Retslyn","Denver","Matthew","Bolgo","Henry","Osmond","Ertessa","Kalt","Gary","Jaques",
 "Starr","Monj","Camilla","Balta","Nolli","Lucy Dyne","Jin Red",
 "Feed Formula","Murakumo","Devil Forks","Grand Calibur","Demon Medium"
];
/* Fuori dall'elenco di proposito: "Sam", "Emp" e "Bari" sono tre nomi vecchi
   troppo corti per cercarli dentro un testo italiano — "Emp" sta in "tempo",
   "Bari" e' una citta'. Che non ci siano piu' lo dice il controllo sui 118
   nomi nuovi, che non lascia posto ai vecchi. */

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

  // --- niente più nomenclatura dell'originale nei dati ---
  const resti = await p.evaluate(v => {
    const testo = JSON.stringify([UNITS, Object.keys(FAMS), Object.values(FAMS).map(f => f.spn),
                                  Object.keys(CIBI), RANKS, Object.keys(ESCA_FAM), HABITAT]);
    return v.filter(n => testo.includes(n));
  }, VECCHI);
  chk(resti.length === 0, 'nessun nome dell’originale nelle tabelle di dati' +
      (resti.length ? ': ' + resti.join(', ') : ''));

  // --- e i 118 nuovi ci sono tutti ---
  const conte = await p.evaluate(() => ({
    unita: UNITS.length, nomiUnici: new Set(UNITS.map(u => u.name)).size,
    fam: Object.keys(FAMS).length, famUniche: new Set(Object.keys(FAMS)).size,
    mosse: new Set(Object.values(FAMS).map(f => f.spn)).size,
    cibi: Object.keys(CIBI).length,
    avversari: RANKS.reduce((n,r) => n + r.names.length, 0),
    avvUnici: new Set(RANKS.flatMap(r => r.names)).size,
    premi: new Set(RANKS.map(r => r.prize)).size
  }));
  const tot = conte.nomiUnici + conte.famUniche + conte.mosse + conte.cibi + conte.avvUnici + conte.premi;
  chk(conte.unita === 34 && conte.nomiUnici === 34, '34 unità, 34 nomi diversi');
  chk(conte.fam === 13 && conte.mosse === 13, '13 famiglie e 13 mosse, una per famiglia');
  chk(conte.cibi === 22 && conte.avversari === 30 && conte.avvUnici === 30 && conte.premi === 6,
      '22 cibi, 30 avversari tutti diversi, 6 premi');
  chk(tot === 118, 'in tutto fanno 118 nomi, senza doppioni: ' + tot);

  // --- le tabelle si tengono ancora per mano ---
  const coerenza = await p.evaluate(() => ({
    fam: UNITS.every(u => FAMS[u.fam]),
    esche: Object.keys(ESCA_FAM).every(c => CIBI[c]) &&
           Object.values(ESCA_FAM).every(l => l.every(f => FAMS[f])),
    habitat: HABITAT.every(h => FAMS[h.spr] && h.esche.every(e => CIBI[e]) && h.fam.every(f => FAMS[f])),
    premi: CIBI_PREMIO.every(c => CIBI[c]),
    vecchi: Object.values(CIBI_VECCHI).every(n => CIBI[n]),
    quanti: Object.keys(CIBI_VECCHI).length
  }));
  chk(coerenza.fam, 'ogni unità appartiene a una famiglia che esiste');
  chk(coerenza.esche && coerenza.habitat, 'esche e habitat nominano cibi e famiglie che esistono');
  chk(coerenza.premi, 'i premi del torneo sono cibi veri');
  chk(coerenza.vecchi && coerenza.quanti === 22,
      'la tabella di conversione copre tutti e 22 i cibi e punta a nomi nuovi');
  const impronte = await p.evaluate(() => ({
    numeriche: Object.keys(CIBI_VECCHI).every(k => /^\d+$/.test(k)),
    distinte: new Set(Object.keys(CIBI_VECCHI)).size === 22,
    nonCollidono: Object.keys(CIBI).every(n => !CIBI_VECCHI[semeNum(n)]),
    riconosce: CIBI_VECCHI[semeNum('Smoked Rainbow Newt')]
  }));
  chk(impronte.numeriche && impronte.distinte,
      'i nomi vecchi non sono scritti nemmeno lì: ci sono 22 impronte distinte');
  chk(impronte.nonCollidono, 'e nessuna impronta vecchia coincide con un nome nuovo');
  chk(impronte.riconosce === 'Tritone affumicato', 'ma il nome vecchio si riconosce lo stesso');

  // --- quel che si legge a schermo ---
  const schermo = await p.evaluate(() => {
    S.champion = true; S.rankIdx = 5; drawRoster();
    pickLook('knife_beetle');
    return { roster: document.querySelector('#roster').innerText,
             scheda: document.querySelector('#uni-corpo').innerText };
  });
  chk(/Sfregio/.test(schermo.roster) && /Trinciaferro/.test(schermo.roster),
      'il roster mostra i nomi nuovi');
  chk(/Lamidi/.test(schermo.scheda) && /Stoccata alta/.test(schermo.scheda),
      'la scheda mostra famiglia e mossa con i nomi nuovi');
  const sporco = await p.evaluate(v => {
    const t = document.body.innerText;
    return v.filter(n => t.includes(n));
  }, VECCHI);
  chk(sporco.length === 0, 'e nella pagina non resta niente di vecchio' +
      (sporco.length ? ': ' + sporco.join(', ') : ''));

  // --- un salvataggio vecchio non perde la dispensa ---
  const vecchio = await p.evaluate(() => {
    const d = { sv:5, r:2, n:1, t:["knife_beetle","mantis"], k:"knife_beetle", c:0, a:0, ap:0, v:1,
      z:[{u:"a1", id:"mantis", b:{hp:3,str:1,def:1}, res:{ct:2}, speso:4, s:"f"}],
      p:{ "Sanchez Fruit":3, "Electric Eel":2, "Frutto del Vesuvio":1, "Cibo Inventato":9 },
      m:{ seme:"ABCDEF", trappole:{1:2}, poste:[{n:1,h:"frutteto",t:1,esca:"Sanchez Fruit",quando:0}],
          seq:1, presi:0 },
      g:1, gi:3, f:null, vs:{ mantis:1 }, tr:{} };
    const r = migra(d);
    return { sv: r.sv, disp: r.p, esca: r.m.poste[0].esca, zoo: r.z.length, squadra: r.t.length,
             visti: Object.keys(r.vs).length };
  });
  chk(vecchio.sv === 6, 'il salvataggio vecchio sale allo schema 6');
  chk(vecchio.disp['Frutto del Vesuvio'] === 4,
      'il cibo col nome vecchio si somma a quello col nome nuovo (3 + 1 = ' +
      vecchio.disp['Frutto del Vesuvio'] + ')');
  chk(vecchio.disp['Anguilla elettrica'] === 2, 'e ogni altro cibo si converte');
  chk(vecchio.disp['Cibo Inventato'] === undefined && vecchio.disp['Sanchez Fruit'] === undefined,
      'i nomi che non esistono più spariscono, i vecchi non restano');
  chk(vecchio.esca === 'Frutto del Vesuvio', 'anche l’esca di una trappola già piazzata si converte');
  chk(vecchio.zoo === 1 && vecchio.squadra === 2 && vecchio.visti === 1,
      'squadra, gabbie e collezione passano intatte: gli id non sono stati toccati');

  // --- e il giro completo di esportazione regge ---
  const giro = await p.evaluate(() => {
    S.dispensa = { 'Frutto del Vesuvio': 2 }; S.rankIdx = 3; save();
    const codice = esporta();
    S.dispensa = {}; S.rankIdx = 0;
    const e = importa(codice);
    if (e.ok) applica(e.dati);
    return { ok: e.ok, cibo: S.dispensa['Frutto del Vesuvio'], rank: S.rankIdx };
  });
  chk(giro.ok && giro.cibo === 2 && giro.rank === 3,
      'esportare e reimportare con i nomi nuovi funziona');

  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
