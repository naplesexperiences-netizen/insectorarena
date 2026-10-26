const { chromium, GIOCA } = require('../comune');
const fs = require('fs');
const D = JSON.parse(fs.readFileSync(require('path').join(__dirname, 'dati.json'),'utf8'));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:900,height:600} });
  await p.goto(GIOCA); await p.waitForTimeout(400);
  const out = await p.evaluate(async (fam) => {
    const png = async (svg, px) => {
      const s = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="'+px+'" height="'+px+'" ');
      const img = new Image();
      await new Promise(ok => { img.onload = ok; img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(s))); });
      const c = document.createElement('canvas'); c.width = c.height = px;
      const x = c.getContext('2d',{willReadFrequently:true});
      x.fillStyle = '#232d40'; x.fillRect(0,0,px,px); x.drawImage(img,0,0,px,px);
      return x.getImageData(0,0,px,px).data;
    };
    const diff = (a,c) => { let s=0; for (let i=0;i<a.length;i+=4)
      s += Math.abs(a[i]-c[i])+Math.abs(a[i+1]-c[i+1])+Math.abs(a[i+2]-c[i+2]);
      return +(s/(a.length/4*3*255)*100).toFixed(1); };
    const r = [];
    for (const f of fam){
      if (f.membri.length < 2) continue;
      const d = [];
      for (const m of f.membri) d.push({ ...m, px: await png(art(f.nome,false,m.rank),46) });
      for (let i=0;i<d.length-1;i++)  /* solo le coppie consecutive: sono quelle che si confondono */
        r.push({ fam:f.nome, a:d[i].name, b:d[i+1].name, v:diff(d[i].px,d[i+1].px) });
    }
    return r.sort((x,y)=>x.v-y.v);
  }, D.famiglie);
  console.log('COPPIE CONSECUTIVE, dalla piu debole\n');
  out.forEach(x => console.log(x.fam.padEnd(12) + (x.a + ' → ' + x.b).padEnd(28) + (x.v + '%').padStart(7)));
  await b.close();
})();
