const { chromium, GIOCA } = require('../comune');
/* Senza argomento guarda il gioco di adesso; con un argomento guarda
   un'altra copia, per confrontare prima e dopo un ritocco agli sprite. */
const a = process.argv[2];
const FILE = !a ? GIOCA : (a.startsWith('file://') ? a : 'file://' + require('path').resolve(a));
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:900,height:700} });
  await p.goto(FILE); await p.waitForTimeout(400);
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
    const out = [];
    for (const u of UNITS){
      const m = await mask(art(u.fam, false, u.rank), 64);
      let minx=64,maxx=-1,miny=64,maxy=-1;
      for (let y=0;y<64;y++) for (let x=0;x<64;x++) if (m[y*64+x]){
        if(x<minx)minx=x; if(x>maxx)maxx=x; if(y<miny)miny=y; if(y>maxy)maxy=y; }
      out.push({ n:u.name, minx, miny, maxx, maxy,
                 tocca: minx<=0||miny<=0||maxx>=63||maxy>=63 });
    }
    return out;
  });
  console.log(JSON.stringify(r));
  await b.close();
})();
