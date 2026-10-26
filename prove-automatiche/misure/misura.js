const { chromium, GIOCA } = require('../comune');
const fs = require('fs');
const D = JSON.parse(fs.readFileSync(require('path').join(__dirname, 'dati.json'),'utf8'));
/* Due domande: dentro a una famiglia i ranghi si distinguono? e fra famiglie
   diverse si distinguono? Stessa misura, alla misura in cui lo sprite compare
   davvero nel gioco (46 px, la scheda del riepilogo). */
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:900,height:600} });
  await p.goto(GIOCA); await p.waitForTimeout(400);
  const res = await p.evaluate(async (fam) => {
    const png = async (svg, px) => {
      const s = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="'+px+'" height="'+px+'" ');
      const img = new Image();
      await new Promise(ok => { img.onload = ok; img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(s))); });
      const c = document.createElement('canvas'); c.width = c.height = px;
      const x = c.getContext('2d', { willReadFrequently:true });
      x.fillStyle = '#232d40'; x.fillRect(0,0,px,px);
      x.drawImage(img, 0, 0, px, px);
      return x.getImageData(0,0,px,px).data;
    };
    const diff = (a, c) => { let s = 0;
      for (let i = 0; i < a.length; i += 4)
        s += Math.abs(a[i]-c[i]) + Math.abs(a[i+1]-c[i+1]) + Math.abs(a[i+2]-c[i+2]);
      return s / (a.length/4 * 3 * 255) * 100; };
    const PX = 46;
    const dentro = [], tutti = [];
    for (const f of fam){
      const d = [];
      for (const m of f.membri) d.push({ ...m, px: await png(art(f.nome, false, m.rank), PX) });
      tutti.push(...d.map(x => ({ ...x, fam: f.nome })));
      if (d.length < 2) continue;
      const coppie = [];
      for (let i = 0; i < d.length; i++) for (let j = i+1; j < d.length; j++)
        coppie.push(+diff(d[i].px, d[j].px).toFixed(1));
      dentro.push({ fam: f.nome, n: d.length, min: Math.min(...coppie),
                    media: +(coppie.reduce((a,b)=>a+b,0)/coppie.length).toFixed(1) });
    }
    /* fra famiglie: il minimo fra due capofamiglia di famiglie diverse */
    const capi = fam.map(f => tutti.find(t => t.fam === f.nome));
    let fraMin = 100, fraCoppia = "";
    for (let i = 0; i < capi.length; i++) for (let j = i+1; j < capi.length; j++){
      const v = diff(capi[i].px, capi[j].px);
      if (v < fraMin){ fraMin = v; fraCoppia = capi[i].fam + "/" + capi[j].fam; }
    }
    return { dentro, fraMin: +fraMin.toFixed(1), fraCoppia };
  }, D.famiglie);

  console.log('DENTRO A UNA FAMIGLIA — quanto si distinguono i ranghi, a 46 px\n');
  console.log('famiglia'.padEnd(14) + 'ranghi'.padStart(7) + 'coppia piu simile'.padStart(20) + 'media'.padStart(8));
  res.dentro.sort((a,b)=>a.min-b.min).forEach(r =>
    console.log(r.fam.padEnd(14) + String(r.n).padStart(7) + (r.min + '%').padStart(20) + (r.media + '%').padStart(8)));
  console.log('\nFRA FAMIGLIE DIVERSE — la coppia di capofamiglia piu simile:');
  console.log('  ' + res.fraCoppia + '  ' + res.fraMin + '%');
  fs.writeFileSync(require('path').join(require('os').tmpdir(), 'misure.json'), JSON.stringify(res, null, 1));
  await b.close();
})();
