const { chromium, GIOCA, DEMO } = require('../comune');
const fs = require('fs');
const D = JSON.parse(fs.readFileSync(require('path').join(__dirname, 'dati.json'), 'utf8'));
/* Tre immagini, tre scopi diversi:
   1) il foglio da dare al modello: solo sprite, griglia regolare, nessun testo
      (il testo dentro a un'immagine data a un generatore torna storpiato);
   2) la legenda per noi, stessa griglia con i nomi, per ritagliare al ritorno;
   3) una famiglia sola, per provare la strada su quattro invece che su 34. */
const CELLA = 300, COL = 6, BG = '#232d40', FONDO = '#0d1117';

function griglia(lista, colonne, cella, conTesto){
  const righe = Math.ceil(lista.length / colonne);
  const W = colonne * cella, H = righe * cella;
  const celle = lista.map((u, i) => {
    const x = (i % colonne) * cella, y = Math.floor(i / colonne) * cella;
    return `<div class="cella" style="left:${x}px;top:${y}px;width:${cella}px;height:${cella}px;--fam:${u.col}">
      <div class="sprite">${u.svg}</div>
      ${conTesto ? `<div class="eti"><b>${u.name}</b><span>${u.fam} · rank ${u.rank}</span><i>${u.col}</i></div>` : ''}
    </div>`;
  }).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:${FONDO};width:${W}px;height:${H}px;position:relative;
         font-family:'Trebuchet MS',Verdana,sans-serif}
    .cella{position:absolute;background:${BG};border:3px solid var(--fam);
           display:flex;flex-direction:column;align-items:center;justify-content:center}
    .sprite{width:${conTesto ? cella - 90 : cella - 40}px;height:${conTesto ? cella - 90 : cella - 40}px}
    .sprite svg{width:100%;height:100%;display:block}
    .eti{text-align:center;color:#e8edf5;line-height:1.3;margin-top:4px}
    .eti b{display:block;font-size:17px}
    .eti span{display:block;font-size:12px;color:#93a1b8}
    .eti i{display:block;font-size:11px;color:var(--fam);font-style:normal;
           font-family:ui-monospace,monospace;margin-top:2px}
  </style></head><body>${celle}</body></html>`;
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:900,height:600} });
  await p.goto(GIOCA); await p.waitForTimeout(400);

  /* Gli sprite in ordine di famiglia: le famiglie restano blocchi contigui,
     cosi' il modello vede da solo che cosa deve restare coerente. */
  const lista = [];
  for (const f of D.famiglie)
    for (const m of f.membri){
      const svg = await p.evaluate(({fam, rank}) => art(fam, false, rank), { fam: f.nome, rank: m.rank });
      lista.push({ ...m, fam: f.nome, col: f.col, svg });
    }
  console.log('sprite resi:', lista.length);

  const rendi = async (html, w, h, file) => {
    const q = await b.newPage({ viewport:{width:w, height:h}, deviceScaleFactor:1 });
    await q.setContent(html); await q.waitForTimeout(400);
    await q.screenshot({ path:file });
    await q.close();
    console.log(file, w + '×' + h, fs.statSync(file).size, 'byte');
  };

  const righe = Math.ceil(lista.length / COL);
  await rendi(griglia(lista, COL, CELLA, false), COL*CELLA, righe*CELLA, require('path').join(DEMO, 'sprite-da-migliorare', 'insetti-per-il-modello.png'));
  await rendi(griglia(lista, COL, CELLA, true),  COL*CELLA, righe*CELLA, require('path').join(DEMO, 'sprite-da-migliorare', 'insetti-legenda.png'));

  const falcidi = lista.filter(u => u.fam === 'Falcidi');
  await rendi(griglia(falcidi, 4, 360, false), 4*360, 360, require('path').join(DEMO, 'sprite-da-migliorare', 'prova-una-famiglia.png'));
  await b.close();
})();
