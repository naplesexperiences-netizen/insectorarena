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
  const p = await b.newPage({ viewport:{width:1280,height:980} });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  p.on('console',m=>{ if(m.type()==='error') errs.push(m.text()); });
  p.on('dialog', d => d.accept());
  await p.goto(URL); await p.waitForTimeout(250);
  await p.click('#btn-modego'); await p.waitForTimeout(120);

  // --- si alleva dal roster ---
  const primo = await p.evaluate(() => UNITS.filter(unlocked)[0].id);
  await premiLungo(p, '#roster [data-id="' + primo + '"]');
  chk(await p.isVisible('#btn-alleva'), 'la scheda offre di allevare un esemplare');
  await p.click('#btn-alleva'); await p.waitForTimeout(200);
  chk(await p.isVisible('#s-zoo'), 'allevando si finisce nelle gabbie');
  const z = await p.evaluate(() => ({ n:S.zoo.length, speso:S.zoo[0].speso, id:S.zoo[0].id }));
  chk(z.n === 1 && z.speso === 0 && z.id === primo, 'nasce una larva con le statistiche base');
  chk((await p.innerText('#zoo-n')) === '1/12', 'il contatore delle gabbie sale');
  chk((await p.innerText('#dispensa')).includes('vuota'), 'la dispensa parte vuota');

  // --- il cibo arriva vincendo ---
  await p.evaluate(() => { S.dispensa = { 'Frutto del Vesuvio': 10, 'Anguilla elettrica': 1 }; drawGabbie(); });
  await p.waitForTimeout(120);
  const cibi = await p.evaluate(() => [...document.querySelectorAll('#dispensa .cibo')].map(c => ({
    nome: c.dataset.cibo, testo: c.textContent.replace(/\s+/g,' ').trim() })));
  chk(cibi.length === 2, 'la dispensa elenca i cibi posseduti');
  const sf = cibi.find(c => c.nome === 'Frutto del Vesuvio');
  chk(/\+3 vita/.test(sf.testo) && /\+1 forza/.test(sf.testo) && /costa 3 di vita/.test(sf.testo),
      'ogni cibo dichiara effetto e costo: "' + sf.testo + '"');

  // --- si nutre, e le statistiche salgono ---
  const prima = await p.evaluate(() => statsOf('@' + S.zoo[0].u));
  await p.click('#dispensa [data-cibo="Frutto del Vesuvio"]'); await p.waitForTimeout(150);
  const dopo = await p.evaluate(() => ({ st: statsOf('@' + S.zoo[0].u), speso: S.zoo[0].speso,
                                         rimasti: S.dispensa['Frutto del Vesuvio'] }));
  chk(dopo.st.hp === prima.hp + 3 && dopo.st.str === prima.str + 1 && dopo.st.def === prima.def + 1,
      'il pasto migliora vita, forza e difesa');
  chk(dopo.speso === 3, 'e costa i punti di vita giusti');
  chk(dopo.rimasti === 9, 'il cibo consumato sparisce dalla dispensa');

  // --- le resistenze si accumulano, e adesso contano ---
  await p.click('#dispensa [data-cibo="Anguilla elettrica"]'); await p.waitForTimeout(150);
  const res = await p.evaluate(() => ({ ex: S.zoo[0].res.ex, testo: $('#anteprima').textContent }));
  chk(res.ex === 2, 'le resistenze si accumulano');
  chk(/riducono danno, spinte e ammaliamenti/.test(res.testo),
      'e la scheda dice che cosa fanno in battaglia');

  // --- larva finché non spende 20 punti ---
  chk(await p.evaluate(() => !adulto(S.zoo[0])), 'con pochi punti spesi è ancora una larva');
  await p.click('#btn-zoo-back'); await p.waitForTimeout(150);
  await premiLungo(p, '#roster [data-id="@' + (await p.evaluate(()=>S.zoo[0].u)) + '"]');
  chk(await p.evaluate(() => $('#btn-metto').disabled), 'una larva non si può mettere in squadra');
  chk((await p.innerText('#uni-corpo')).includes('larva'), 'e la scheda spiega perché');

  // --- nutrita abbastanza, diventa adulta ed entra in squadra ---
  await p.evaluate(() => { S.dispensa = { 'Frutto del Vesuvio': 20 }; apriGabbie(S.zoo[0].u); });
  await p.waitForTimeout(150);
  for (let i = 0; i < 6; i++){ await p.click('#dispensa [data-cibo="Frutto del Vesuvio"]'); await p.waitForTimeout(90); }
  const ad = await p.evaluate(() => ({ adulto: adulto(S.zoo[0]), speso: S.zoo[0].speso,
                                       msg: $('#anteprima').textContent }));
  chk(ad.adulto && ad.speso >= 20, 'spesi venti punti, la larva diventa adulta (' + ad.speso + ')');
  chk(/adulto/.test(ad.msg), 'e il gioco lo annuncia');
  await p.click('#btn-zoo-back'); await p.waitForTimeout(150);
  const rif = await p.evaluate(() => '@' + S.zoo[0].u);
  await premiLungo(p, '#roster [data-id="' + rif + '"]');
  await p.click('#btn-metto'); await p.waitForTimeout(150);
  chk(await p.evaluate(r => S.team.includes(r), rif), 'un adulto allevato entra in squadra');

  // --- il budget non si sfora ---
  await p.evaluate(() => { S.zoo[0].speso = VITA_MAX - 1; S.dispensa = { 'Frutto del Vesuvio': 5 }; apriGabbie(S.zoo[0].u); });
  await p.waitForTimeout(150);
  chk(await p.evaluate(() => document.querySelector('#dispensa [data-cibo="Frutto del Vesuvio"]').disabled),
      'con un punto di vita non si può più mangiare un cibo che ne costa tre');
  const bloccato = await p.evaluate(() => { const prima = S.zoo[0].b.hp; nutriCon('Frutto del Vesuvio'); return S.zoo[0].b.hp === prima; });
  chk(bloccato, 'e forzando la funzione non succede niente lo stesso');

  // --- in battaglia l'esemplare porta i suoi bonus ---
  const campo = await p.evaluate(r => {
    S.zoo[0].speso = 40; S.zoo[0].b = { hp:30, str:5, def:4 };
    S.team = [r]; S.kingId = r;
    const u = mk(r, 'p', true, 1);
    const base = byId[S.zoo[0].id];
    return { hp:u.maxHp, base:base.hp, str:u.str, baseStr:base.str, allevato:u.allevato };
  }, rif);
  chk(campo.hp === campo.base + 30 && campo.str === campo.baseStr + 5,
      'in campo scende con le statistiche cresciute (' + campo.hp + ' contro ' + campo.base + ')');
  chk(campo.allevato === true, 'ed è marcato come esemplare allevato');

  // --- i premi del torneo danno cibo ---
  const bott = await p.evaluate(() => { S.dispensa = {}; const t = premiaConCibo(3, true);
    return { testo:t, quanti: Object.values(S.dispensa).reduce((a,b)=>a+b,0) }; });
  chk(bott.quanti === 3 && bott.testo.length > 0, 'il premio di rank porta tre cibi rari: ' + bott.testo);

  // --- quando arriva il cibo, e perche' non arriva prima ---
  const premi = await p.evaluate(() => {
    S.rankIdx = 0; S.round = 0; S.dispensa = {}; S.mondo.trappole = { 1:0, 2:0, 3:0 };
    S.team = UNITS.filter(unlocked).slice(0,5).map(u => u.id); S.kingId = S.team[0];
    const conta = () => Object.values(S.dispensa).reduce((a,c) => a + c, 0);
    finish(true);
    const dopoUno = { cibi: conta(), testo: $('#r-text').textContent };
    for (let i = 0; i < 4; i++) finish(true);
    return { dopoUno, cibi: conta(), attesi: PREMIO_RANK,
             trappole: Object.values(S.mondo.trappole).reduce((a,c) => a + c, 0),
             testo: $('#r-text').textContent };
  });
  chk(premi.dopoUno.cibi === 0, 'vincere un round non porta cibo: il premio e\u0300 del rank');
  chk(/conquistando il rank/.test(premi.dopoUno.testo) && /ne mancano/.test(premi.dopoUno.testo),
      'ma il gioco lo dice, e dice quanti round mancano');
  chk(premi.cibi === premi.attesi && premi.trappole === 1,
      'conquistato il rank arrivano i quattro cibi e la trappola');
  chk(/per le gabbie/.test(premi.testo), 'e il bottino e\u0300 scritto per esteso');

  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
