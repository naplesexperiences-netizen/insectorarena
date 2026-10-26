const { chromium, GIOCA } = require('../comune');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{width:900,height:600} });
  await p.goto(GIOCA); await p.waitForTimeout(400);
  const d = await p.evaluate(() => {
    const fam = {};
    UNITS.forEach(u => { (fam[u.fam] = fam[u.fam] || []).push({ id:u.id, name:u.name, rank:u.rank }); });
    Object.keys(fam).forEach(f => fam[f].sort((a,b) => a.rank - b.rank));
    return { unita: UNITS.length, famiglie: Object.keys(FAMS).map(f => ({
      nome: f, col: FAMS[f].col, mossa: FAMS[f].spn, membri: fam[f] || [] })) };
  });
  fs.writeFileSync(require('path').join(__dirname, 'dati.json'), JSON.stringify(d, null, 1));
  console.log('unita totali:', d.unita);
  d.famiglie.forEach(f => console.log(
    (f.nome + ' (' + f.col + ')').padEnd(26), f.membri.length, '—',
    f.membri.map(m => 'R' + m.rank + ' ' + m.name).join(', ')));
  await b.close();
})();
