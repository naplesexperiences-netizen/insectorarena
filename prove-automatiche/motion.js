const { chromium, GIOCA } = require('./comune');
const ok=[],ko=[]; const chk=(c,m)=>(c?ok:ko).push(m);
const URL=GIOCA;

async function apri(b, motion){
  const p = await b.newPage({ viewport:{width:1220,height:900}, reducedMotion: motion });
  p.on('pageerror', e => ko.push('eccezione: ' + e.message));
  p.on('console', m => { if (m.type()==='error') ko.push('console: ' + m.text()); });
  await p.goto(URL); await p.waitForTimeout(150);
  await p.click('#btn-modego'); await p.waitForTimeout(80);
  await p.click('#btn-auto'); await p.click('#btn-start'); await p.waitForTimeout(80);
  await p.click('#btn-toarena'); await p.waitForTimeout(200);
  await p.click('#btn-rand'); await p.waitForTimeout(150);
  await p.click('#btn-fight'); await p.waitForTimeout(250);
  return p;
}
const animOf = (p, sel) => p.evaluate(s => {
  const e = document.querySelector(s); if (!e) return 'assente';
  return getComputedStyle(e).animationName;
}, sel);

(async () => {
  const b = await chromium.launch();
  const p = await apri(b, 'no-preference');

  // --- respiro di base ---
  chk(await animOf(p, '.tok .inner') === 'idle', 'da ferme le pedine respirano');

  // --- selezione: alone ---
  const mia = await p.evaluate(() => { const u = S.units.find(x=>x.alive&&x.side==='p'); return u.x+','+u.y; });
  await p.click('[data-xy="'+mia+'"]'); await p.waitForTimeout(120);
  chk(await p.evaluate(() => !!document.querySelector('.tok.sel')), 'la pedina scelta si distingue dalle altre');
  const halo = await p.evaluate(() => getComputedStyle(document.querySelector('.tok.sel .inner'), '::after').animationName);
  chk(halo === 'halo', 'attorno alla pedina scelta pulsa un alone (' + halo + ')');

  // --- passo ---
  const mosso = await p.evaluate(() => {
    const u = S.sel || S.units.find(x=>x.alive&&x.side==='p');
    S.sel = u; S.mode = 'move';
    const dove = moves(u)[0]; if (!dove) return null;
    click(dove.x, dove.y);
    const e = document.querySelector('[data-uid="'+u.uid+'"]');
    return { cls: e.className, anim: getComputedStyle(e.querySelector('.inner')).animationName,
             ombra: getComputedStyle(e.querySelector('.shadow')).animationName };
  });
  chk(mosso && mosso.cls.includes('step'), 'chi si sposta fa un passo, non scivola');
  chk(mosso && mosso.anim === 'step', 'il passo e una animazione vera (' + (mosso&&mosso.anim) + ')');
  chk(mosso && mosso.ombra === 'shadowstep', 'l ombra si stringe mentre la pedina e in aria');
  await p.waitForTimeout(500);

  // --- attacco: anticipo e impatto ---
  const colpo = await p.evaluate(() => {
    const a = S.units.find(u=>u.alive&&u.side==='p');
    const t = S.units.find(u=>u.alive&&u.side==='e');
    a.x = t.x; a.y = t.y + 1; draw();
    basicAttack(a, t);
    const ea = document.querySelector('[data-uid="'+a.uid+'"]');
    const et = document.querySelector('[data-uid="'+t.uid+'"]');
    return { att: getComputedStyle(ea.querySelector('.inner')).animationName,
             sub: getComputedStyle(et.querySelector('.inner')).animationName,
             art: getComputedStyle(et.querySelector('.art')).animationName };
  });
  chk(colpo.att === 'lunge', 'chi attacca si carica e affonda (' + colpo.att + ')');
  chk(colpo.sub === 'hurt', 'chi incassa viene scosso (' + colpo.sub + ')');
  chk(colpo.art.includes('squash'), 'e la sagoma si schiaccia sotto il colpo (' + colpo.art + ')');
  await p.waitForTimeout(600);

  // --- ali ---
  const ali = await p.evaluate(() => {
    const d = document.createElement('div'); d.id='prova';
    d.innerHTML = art('Silfidi',false,3) + art('Ventalidi',false,3) + art('Falcidi',false,3);
    document.body.appendChild(d);
    const w = d.querySelectorAll('.wing');
    const nome = w.length ? getComputedStyle(w[0]).animationName : 'assente';
    const senza = d.querySelectorAll('svg')[2].querySelectorAll('.wing').length;
    d.remove();
    return { n: w.length, nome, senza };
  });
  chk(ali.n >= 6 && ali.nome === 'flap', 'le famiglie alate battono le ali (' + ali.n + ' ali, ' + ali.nome + ')');
  chk(ali.senza === 0, 'chi non ha ali non le sbatte');

  // --- K.O. ---
  const morte = await p.evaluate(() => {
    const t = S.units.find(u=>u.alive&&u.side==='e'&&!u.isKing);
    ko(t, 'colpo');
    const e = document.querySelector('[data-uid="'+t.uid+'"]');
    return e ? getComputedStyle(e).animationName : 'assente';
  });
  chk(morte === 'dead', 'il K.O. ha la sua animazione (' + morte + ')');
  await p.close();

  // --- chi chiede meno movimento non lo subisce ---
  const q = await apri(b, 'reduce');
  const fermo = await q.evaluate(() => {
    const e = document.querySelector('.tok');
    const d = document.createElement('div'); d.innerHTML = art('Silfidi',false,3); document.body.appendChild(d);
    const w = getComputedStyle(d.querySelector('.wing')).animationName;
    d.remove();
    return { inner: getComputedStyle(e.querySelector('.inner')).animationName, wing: w };
  });
  chk(fermo.inner === 'none' && fermo.wing === 'none',
      'con "riduci animazioni" tutto si ferma (' + fermo.inner + '/' + fermo.wing + ')');
  await q.close();

  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
