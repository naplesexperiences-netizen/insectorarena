const { chromium, GIOCA } = require('../comune');
/* Il confronto che conta: la differenza di sagoma fra DUE FAMIGLIE diverse.
   Se il passo fra fratelli le arriva vicino, i gradi si leggono come
   i generi. Si prende il membro di grado piu' alto di ogni famiglia. */
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:900,height:600} });
  await p.goto(GIOCA); await p.waitForTimeout(400);
  const out = await p.evaluate(async () => {
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
    const capi = Object.keys(fam).map(k => {
      const m = fam[k].slice().sort((a,b)=>b.rank-a.rank)[0]; return { f:k, u:m }; });
    const mm = [];
    for (const c of capi) mm.push({ ...c, m: await mask(art(c.f,false,c.u.rank),46) });
    const r = [];
    for (let i=0;i<mm.length;i++) for (let j=i+1;j<mm.length;j++)
      r.push({ a:mm[i].f, b:mm[j].f, v:dif(mm[i].m, mm[j].m) });
    return r.sort((x,y)=>x.v-y.v);
  });
  console.log('Le cinque coppie di famiglie piu\' somiglianti:\n');
  out.slice(0,5).forEach(x => console.log('  ' + (x.a+' / '+x.b).padEnd(28) + (x.v+'%').padStart(7)));
  const v = out.map(x=>x.v);
  console.log('\n' + out.length + ' coppie   minimo ' + Math.min(...v) + '%   media ' +
    (v.reduce((a,b)=>a+b,0)/v.length).toFixed(1) + '%');
  await b.close();
})();
