const { chromium, GIOCA } = require('../comune');
const fs = require('fs');
const D = JSON.parse(fs.readFileSync(require('path').join(__dirname, 'dati.json'),'utf8'));
/* Fra fratelli il colore e' lo stesso: quello che li distingue e' la sagoma.
   Si binarizza (inchiostro contro sfondo) e si contano i pixel che cambiano
   stato: e' la percentuale di silhouette diversa. */
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:900,height:600} });
  await p.goto(GIOCA); await p.waitForTimeout(400);
  const out = await p.evaluate(async (fam) => {
    const mask = async (svg, px) => {
      const s = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="'+px+'" height="'+px+'" ');
      const img = new Image();
      await new Promise(ok => { img.onload = ok; img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(s))); });
      const c = document.createElement('canvas'); c.width = c.height = px;
      const x = c.getContext('2d',{willReadFrequently:true});
      x.clearRect(0,0,px,px); x.drawImage(img,0,0,px,px);
      const d = x.getImageData(0,0,px,px).data, m = new Uint8Array(px*px);
      for (let i=0,j=0;i<d.length;i+=4,j++) m[j] = d[i+3] > 96 ? 1 : 0;   /* alfa: c'e' o non c'e' */
      return m;
    };
    const dif = (a,c) => { let n=0; for (let i=0;i<a.length;i++) if (a[i]!==c[i]) n++;
      return +(n/a.length*100).toFixed(1); };
    const r = [];
    for (const f of fam){
      if (f.membri.length < 2) continue;
      const d = [];
      for (const m of f.membri) d.push({ ...m, m46: await mask(art(f.nome,false,m.rank),46) });
      for (let i=0;i<d.length-1;i++)
        r.push({ fam:f.nome, a:d[i].name, b:d[i+1].name, v:dif(d[i].m46,d[i+1].m46) });
    }
    return r.sort((x,y)=>x.v-y.v);
  }, D.famiglie);
  console.log('SAGOMA: quanta silhouette cambia fra un grado e il successivo, a 46 px\n');
  out.forEach(x => console.log(x.fam.padEnd(12) + (x.a + ' → ' + x.b).padEnd(28) + (x.v + '%').padStart(7)));
  const v = out.map(x=>x.v);
  console.log('\nminimo ' + Math.min(...v) + '%   media ' + (v.reduce((a,b)=>a+b,0)/v.length).toFixed(1) + '%   massimo ' + Math.max(...v) + '%');
  await b.close();
})();
