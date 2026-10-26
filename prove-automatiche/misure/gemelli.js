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
      const x = c.getContext('2d', { willReadFrequently:true });
      x.fillStyle = '#232d40'; x.fillRect(0,0,px,px); x.drawImage(img, 0, 0, px, px);
      return x.getImageData(0,0,px,px).data;
    };
    const diff = (a,c) => { let s=0; for (let i=0;i<a.length;i+=4)
      s += Math.abs(a[i]-c[i])+Math.abs(a[i+1]-c[i+1])+Math.abs(a[i+2]-c[i+2]);
      return s/(a.length/4*3*255)*100; };
    const gemelli = [];
    for (const f of fam){
      const d = [];
      for (const m of f.membri) d.push({ ...m, p46: await png(art(f.nome,false,m.rank),46),
                                               p256: await png(art(f.nome,false,m.rank),256) });
      for (let i=0;i<d.length;i++) for (let j=i+1;j<d.length;j++){
        const a = +diff(d[i].p46,d[j].p46).toFixed(2), g = +diff(d[i].p256,d[j].p256).toFixed(2);
        if (a < 0.5) gemelli.push({ fam:f.nome, a:d[i].name, ra:d[i].rank, b:d[j].name, rb:d[j].rank, d46:a, d256:g });
      }
    }
    return gemelli;
  }, D.famiglie);
  console.log('COPPIE INDISTINGUIBILI (differenza sotto lo 0,5% a 46 px)\n');
  console.log('famiglia'.padEnd(13) + 'i due Insector'.padEnd(34) + 'a 46 px'.padStart(9) + 'a 256 px'.padStart(10));
  out.forEach(g => console.log(g.fam.padEnd(13) +
    (`R${g.ra} ${g.a} = R${g.rb} ${g.b}`).padEnd(34) + (g.d46+'%').padStart(9) + (g.d256+'%').padStart(10)));
  console.log('\ntotale coppie identiche:', out.length);
  fs.writeFileSync(require('path').join(require('os').tmpdir(), 'gemelli.json'), JSON.stringify(out,null,1));
  await b.close();
})();
