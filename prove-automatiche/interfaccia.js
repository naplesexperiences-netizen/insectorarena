/* Fase 1 del piano grafico: le fondamenta dell'interfaccia.
   Sette gradini di testo e nessuna scritta sotto il pavimento, un solo
   primario per schermata, le dodici icone disegnate da codice, le
   statistiche a barre nel roster, la pressione e la dissolvenza che si
   spengono col movimento ridotto. Si gira ogni schermata, su schermo largo
   e su telefono. */
const fs = require('fs');
const { chromium, SERVITO, DEMO } = require('./comune');
const ok=[],ko=[]; const chk=(c,m)=>(c?ok:ko).push(m);
const URL = SERVITO + 'gioca.html';
const PAVIMENTO = 0.68 * 16;                       /* --fs-micro, in px */

/* La scritta piu' piccola che si vede, e il numero di primari a video. Conta
   solo quello che occupa spazio e non e' nascosto: gli elementi `.sr` sono
   per lo screen reader, e lo `<svg>` degli sprite non ha testo. */
const misura = () => {
  const vede = e => {
    for (let x = e; x; x = x.parentElement){
      if (x.hidden || x.classList.contains('sr')) return false;
      const c = getComputedStyle(x);
      if (c.display === 'none' || c.visibility === 'hidden') return false;
    }
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  let min = 99, dove = '';
  document.querySelectorAll('body *').forEach(e => {
    const testo = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (!testo || !vede(e)) return;
    const f = parseFloat(getComputedStyle(e).fontSize);
    if (f < min){ min = f; dove = (e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + e.className); }
  });
  const primari = [...document.querySelectorAll('button.primary')].filter(vede).map(b => b.id || b.textContent.trim());
  return { min, dove, primari };
};

(async () => {
  // --- dal sorgente: nessuna dimensione scritta a mano ---
  const src = fs.readFileSync(require('path').join(DEMO, 'gioca.html'), 'utf8');
  const sciolte = src.match(/font-size:\s*\d*\.?\d+(rem|px|em)\b/g) || [];
  chk(sciolte.length === 0, 'nel gioco nessuna font-size e’ scritta a mano: passano tutte dai sette gradini' +
      (sciolte.length ? ' (' + sciolte.slice(0, 4).join(', ') + ')' : ''));
  const usati = new Set((src.match(/var\(--fs-([a-z0-9]+)\)/g) || []).map(v => v.slice(9, -1)));
  chk([...usati].every(k => ['display','h1','h2','body','small','caption','micro'].includes(k)),
      'e i gradini usati sono solo quelli dichiarati: ' + [...usati].join(', '));

  const b = await chromium.launch();
  for (const [w, h, nome] of [[1280, 900, 'schermo largo'], [390, 844, 'telefono']]){
    const p = await b.newPage({ viewport:{ width:w, height:h } });
    const errs=[]; p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.addInitScript(() => { try { localStorage.setItem('insectron-spiega',
      JSON.stringify({ squadra:true, campo:true, zoo:true, mondo:true })); } catch(e){} });
    await p.goto(URL); await p.waitForTimeout(300);

    if (nome === 'schermo largo'){
      // --- i sette gradini, dal piu' grande al piu' piccolo ---
      const scala = await p.evaluate(() => ['display','h1','h2','body','small','caption','micro']
        .map(k => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fs-' + k))));
      chk(scala.every(v => v > 0), 'i sette gradini di testo sono dichiarati in :root');
      chk(scala.every((v, i) => i === 0 || v < scala[i - 1]), 'e scendono in ordine, da display a micro: ' + scala.join(' > '));
      chk(Math.abs(scala[6] * 16 - PAVIMENTO) < .01, 'il pavimento e’ micro, 0.68rem');

      // --- le icone ---
      const ic = await p.evaluate(() => {
        const nomi = Object.keys(ICONE);
        const box = document.createElement('div'); box.style.cssText = 'position:fixed;left:0;top:0;font-size:32px';
        box.innerHTML = nomi.map(ico).join('');
        document.body.appendChild(box);
        const dentro = [...box.querySelectorAll('svg')].map(s => {
          const g = s.querySelector('path').getBBox();
          return g.width > 4 && g.height > 4 && g.x >= 0 && g.y >= 0 && g.x + g.width <= 16.01 && g.y + g.height <= 16.01;
        });
        const nascoste = [...box.querySelectorAll('svg')].every(s => s.getAttribute('aria-hidden') === 'true');
        const colore = [...box.querySelectorAll('path')].every(p => p.getAttribute('fill') === 'currentColor');
        box.remove();
        return { n: nomi.length, nomi, dentro, nascoste, colore };
      });
      chk(ic.n === 12, 'le icone sono dodici: ' + ic.nomi.join(', '));
      chk(ic.dentro.every(Boolean), 'ognuna ha un disegno vero e sta dentro la sua casella da 16');
      chk(ic.nascoste, 'sono decorative: aria-hidden, accanto c’e’ sempre il testo');
      chk(ic.colore, 'e prendono il colore da chi le contiene (currentColor)');
      chk(await p.evaluate(() => !!document.querySelector('#b-rank .ic-rank')), 'il rank in testata ha la sua icona');
    }

    const giro = [];
    const passo = async (cosa, fai) => {
      if (fai) await fai(); await p.waitForTimeout(260);
      const m = await p.evaluate(misura);
      giro.push(Object.assign({ cosa }, m));
    };
    await passo('scelta della partita');
    await passo('roster', async () => { await p.click('#btn-modego'); await p.waitForTimeout(150); await p.click('#btn-auto'); });

    // --- le statistiche a barre ---
    const ro = await p.evaluate(() => {
      const carte = [...document.querySelectorAll('#roster .mon')];
      const tre = carte.every(c => c.querySelectorAll('.st3 .sb').length === 3);
      const sr = carte.every(c => /vita \d+, forza \d+, difesa \d+/.test(c.querySelector('.sr').textContent));
      const rank = carte.every(c => /^R\d$/.test(c.querySelector('.rk').textContent));
      const larghe = carte.every(c => [...c.querySelectorAll('.sb u i')].every(i => {
        const v = parseFloat(i.style.width); return v > 0 && v <= 100; }));
      /* Bastione (150 di vita) e' il piu' robusto degli R1 in roster: barra
         piena. Folgore non fa da metro anche se e' R1. */
      const bast = carte.find(c => c.dataset.id === 'hercules_beetle');
      const piena = bast && bast.querySelector('.sb-vita u i').style.width === '100%';
      const testo = carte.every(c => !/\dhp|\dstr|\ddef/.test(c.textContent));
      const fuori = carte.some(c => c.scrollHeight > c.clientHeight + 2 || c.scrollWidth > c.clientWidth + 2);
      const barre = getComputedStyle(carte[0].querySelector('.sb u')).display !== 'none';
      return { n: carte.length, tre, sr, rank, larghe, piena, testo, fuori, barre };
    });
    chk(ro.n > 0 && ro.tre, nome + ': ogni scheda del roster ha vita, forza e difesa separate (' + ro.n + ' schede)');
    chk(ro.rank, nome + ': il rank e’ un chip a parte, non dentro la riga dei numeri');
    chk(ro.testo, nome + ': non c’e’ piu’ «150hp · 15str · 8def» da leggere');
    chk(ro.sr, nome + ': per lo screen reader i numeri restano, con le parole intere');
    chk(!ro.fuori, nome + ': niente esce dalla sua scheda');
    if (nome === 'schermo largo'){
      chk(ro.barre && ro.larghe, 'su schermo largo le barre si vedono e stanno fra 0 e 100%');
      chk(ro.piena, 'Bastione, il piu’ robusto degli R1, ha la barra della vita piena: Folgore non fa da metro');
      const sel = await p.evaluate(() => {
        const s = document.querySelector('#roster .mon.sel'), n = document.querySelector('#roster .mon:not(.sel)');
        const cs = getComputedStyle(s), cn = getComputedStyle(n);
        return { sale: cs.backgroundColor !== cn.backgroundColor, ombra: /rgba\(0, 0, 0/.test(cs.boxShadow) };
      });
      chk(sel.sale && sel.ombra, 'la scheda scelta sale di un piano: fondo piu’ chiaro e ombra, non solo il bordo');
    } else {
      chk(!ro.barre, 'sul telefono, dove le schede sono righe da 44 px, restano icone e numeri senza barre');
    }

    await passo('riepilogo', () => p.click('#btn-start'));
    await passo('schieramento', () => p.click('#btn-toarena'));
    await passo('battaglia', async () => { await p.click('#btn-rand'); await p.waitForTimeout(200); await p.click('#btn-fight'); });
    await passo('battaglia, pedina scelta', () => p.evaluate(() => {
      S.sel = S.units.find(u => u.side === meSide() && u.alive); draw(); }));
    const spec = await p.evaluate(() => {
      const s = document.querySelector('#acts button.accento');
      return { c: !!s, primario: !!document.querySelector('#acts button.primary') };
    });
    chk(spec.c && !spec.primario, nome + ': in campo la speciale e’ gialla di contorno, non un secondo primario accanto a Fine turno');
    await passo('mondo', () => p.evaluate(() => {
      S.rankIdx = 4; S.giocate = 12; S.mondo.trappole = { 1:2, 2:1, 3:1 };
      S.mondo.poste = [{ n:1, h:'cava', t:2, esca:'Rubino', quando:14 }, { n:2, h:'pantano', t:1, esca:'Rubino', quando:11 }];
      S.dispensa = { 'Frutto del Vesuvio':3, 'Rubino':1 }; apriMondo(); }));
    const mo = await p.evaluate(() => ({
      trap: [...document.querySelectorAll('#sc-trap button')].every(b => b.querySelector('.ic-trappola')),
      esca: [...document.querySelectorAll('#sc-esca button')].every(b => b.querySelector('.ic-esca')),
      attesa: !!document.querySelector('.posta:not(.pronta) .ic-clessidra'),
      testo: [...document.querySelectorAll('#sc-trap button')].map(b => b.textContent)[0],
      fantasma: $('#btn-mondo-back').className
    }));
    chk(mo.trap && mo.esca && mo.attesa, nome + ': nel Mondo trappole, esche e attesa hanno la loro icona');
    chk(/^Trappola I ×\d$/.test(mo.testo), nome + ': e il testo dei pulsanti resta quello di prima: «' + mo.testo + '»');
    chk(mo.fantasma === 'ghost', nome + ': «Torna al roster» e’ un fantasma, non un secondo giallo');
    await passo('gabbie', () => p.evaluate(() => apriGabbie()));
    await passo('collezione', () => p.evaluate(() => apriCollezione()));

    for (const g of giro){
      chk(g.min >= PAVIMENTO - .01, nome + ', ' + g.cosa + ': nessuna scritta sotto il pavimento (la piu’ piccola: ' +
          g.min.toFixed(2) + ' px, ' + g.dove + ')');
      chk(g.primari.length <= 1, nome + ', ' + g.cosa + ': al massimo un primario a video' +
          (g.primari.length ? ' (' + g.primari.join(', ') + ')' : ''));
    }
    chk(errs.length === 0, nome + ': nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));
    await p.close();
  }

  // --- pressione e dissolvenza: ci sono, e col movimento ridotto no ---
  for (const ridotto of [false, true]){
    const ctx = await b.newContext({ viewport:{ width:1280, height:900 }, reducedMotion: ridotto ? 'reduce' : 'no-preference' });
    const p = await ctx.newPage();
    await p.goto(URL); await p.waitForTimeout(250);
    const r = await p.evaluate(() => {
      const s = document.querySelector('.screen.on');
      const b = document.querySelector('#btn-modego');
      const st = [...document.styleSheets].flatMap(x => [...x.cssRules]);
      const premuto = st.some(r => r.selectorText && /button:not\(\.cell\):active/.test(r.selectorText) &&
        /scale/.test(r.style.transform));
      return { anim: getComputedStyle(s).animationName, premuto, b: !!b };
    });
    if (!ridotto){
      chk(r.anim === 'entra', 'cambiare schermata e’ una dissolvenza breve');
      chk(r.premuto, 'premere un pulsante lo schiaccia appena (scale .97)');
    } else {
      chk(r.anim === 'none', 'col movimento ridotto la dissolvenza non c’e’');
      await p.hover('#btn-modego'); await p.mouse.down();
      const t = await p.evaluate(() => getComputedStyle(document.querySelector('#btn-modego')).transform);
      await p.mouse.up();
      chk(t === 'none', 'e premere un pulsante non lo muove');
    }
    await ctx.close();
  }

  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
