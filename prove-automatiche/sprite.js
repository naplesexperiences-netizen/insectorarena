const { chromium, GIOCA } = require('./comune');
/* Il grado dentro la famiglia. Prima tre taglie coprivano sei ranghi e nove
   coppie uscivano identiche al pixel; qui si verifica che non torni a succedere
   e che nessuno sprite sbordi dalla sua casella. */
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:1000,height:800} });
  const errs=[]; p.on('pageerror', e=>errs.push(e.message));
  p.on('console', m=>{ if(m.type()==='error') errs.push(m.text()); });
  const ok=[], ko=[]; const chk=(c,n)=>{ (c?ok:ko).push(n); };
  await p.goto(GIOCA);
  await p.waitForTimeout(400);

  const r = await p.evaluate(async () => {
    const mask = async (svg, px) => {
      const s = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="'+px+'" height="'+px+'" ');
      const img = new Image();
      await new Promise(ok => { img.onload = ok; img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(s))); });
      const c = document.createElement('canvas'); c.width = c.height = px;
      const x = c.getContext('2d',{willReadFrequently:true});
      x.clearRect(0,0,px,px); x.drawImage(img,0,0,px,px);
      const d = x.getImageData(0,0,px,px).data, m = new Uint8Array(px*px);
      for (let i=0,j=0;i<d.length;i+=4,j++) m[j] = d[i+3] > 96 ? 1 : 0;
      return m;
    };
    const dif = (a,c) => { let n=0; for (let i=0;i<a.length;i++) if (a[i]!==c[i]) n++;
      return +(n/a.length*100).toFixed(1); };

    const fam = {};
    UNITS.forEach(u => { (fam[u.fam] = fam[u.fam] || []).push(u); });
    Object.keys(fam).forEach(k => fam[k].sort((a,b) => a.rank - b.rank));

    const svgUguali = [], passi = [], fuori = [];
    for (const k of Object.keys(fam)){
      const membri = fam[k];
      const sv = membri.map(u => art(k, false, u.rank).replace(/gr\d+/g, 'G'));
      for (let i=0;i<sv.length;i++) for (let j=i+1;j<sv.length;j++)
        if (sv[i] === sv[j]) svgUguali.push(k + ': ' + membri[i].name + ' = ' + membri[j].name);
      const mm = [];
      for (const u of membri) mm.push(await mask(art(k, false, u.rank), 46));
      for (let i=0;i<mm.length-1;i++)
        passi.push({ fam:k, a:membri[i].name, b:membri[i+1].name, v:dif(mm[i], mm[i+1]) });
    }
    /* Nessuno sprite deve uscire dalla casella: si guarda il riquadro
       dell'inchiostro dentro al viewBox da 64. */
    for (const k of Object.keys(fam)) for (const u of fam[k]){
      const m = await mask(art(k, false, u.rank), 64);
      let minx=64, maxx=-1, miny=64, maxy=-1;
      for (let y=0;y<64;y++) for (let x=0;x<64;x++) if (m[y*64+x]){
        if(x<minx)minx=x; if(x>maxx)maxx=x; if(y<miny)miny=y; if(y>maxy)maxy=y; }
      if (minx < 1 || miny < 1 || maxx > 62 || maxy > 62)
        fuori.push(k + ' ' + u.name + ' [' + minx + ',' + miny + ' ' + maxx + ',' + maxy + ']');
    }
    /* Il metro di paragone: quanto distano due FAMIGLIE diverse, prese al loro
       grado piu' alto. Se il passo fra fratelli ci arriva sopra, i gradi non si
       leggono piu' come gradi ma come generi. */
    const capi = Object.keys(fam).map(k => fam[k].slice().sort((a,b)=>b.rank-a.rank)[0]);
    const cm = [];
    for (const u of capi) cm.push(await mask(art(u.fam, false, u.rank), 46));
    const tra = [];
    for (let i=0;i<cm.length;i++) for (let j=i+1;j<cm.length;j++) tra.push(dif(cm[i], cm[j]));
    /* famiglie di uno, e un rango che in quella famiglia non esiste */
    const soli = Object.keys(fam).filter(k => fam[k].length === 1);
    return { svgUguali, passi, fuori, soli, traMin: Math.min(...tra),
             gradoSolo: gradoDi(soli[0], fam[soli[0]][0].rank),
             gradoFuori: gradoDi('Corsidi', 3),
             unita: UNITS.length };
  });

  chk(r.unita === 34, 'ci sono tutti e 34 gli Insector');
  chk(r.svgUguali.length === 0,
      'nessuna coppia della stessa famiglia produce lo stesso disegno' +
      (r.svgUguali.length ? ': ' + r.svgUguali.join(' | ') : ''));
  const v = r.passi.map(x => x.v);
  const minimo = Math.min(...v), media = +(v.reduce((a,b)=>a+b,0)/v.length).toFixed(1);
  const deboli = r.passi.filter(x => x.v < 4);
  chk(deboli.length === 0,
      'fra un grado e il successivo cambia almeno il 4% di sagoma (minimo ' + minimo + '%)' +
      (deboli.length ? ': ' + deboli.map(d=>d.fam+' '+d.a+'/'+d.b+' '+d.v+'%').join(', ') : ''));
  chk(media >= 6, 'e in media il ' + media + '%');
  chk(media < r.traMin,
      'il passo medio fra fratelli (' + media + '%) resta sotto la distanza fra le due ' +
      'famiglie piu\' somiglianti (' + r.traMin + '%): i gradi si leggono come gradi');
  chk(r.fuori.length === 0, 'nessuno sprite sborda dalla sua casella' +
      (r.fuori.length ? ': ' + r.fuori.join(', ') : ''));
  chk(r.soli.length === 4, 'quattro famiglie hanno un membro solo (' + r.soli.join(', ') + ')');
  chk(r.gradoSolo.n === 1, 'e per loro il grado non si applica');
  chk(r.gradoFuori.g === -1,
      'un rango che nella famiglia non esiste ricade sulla vecchia taglia, non va in errore');
  chk(errs.length === 0, 'nessun errore in console' + (errs.length ? ': ' + errs.join(' | ') : ''));

  console.log(ok.map(m=>'  OK  '+m).join('\n'));
  if (ko.length) console.log(ko.map(m=>'  KO  '+m).join('\n'));
  console.log('\n' + ok.length + ' controlli superati, ' + ko.length + ' falliti');
  await b.close();
})();
