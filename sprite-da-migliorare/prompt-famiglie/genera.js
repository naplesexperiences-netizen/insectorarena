/* Genera un prompt per famiglia partendo dal gioco: nomi, ranghi, grado, colore
   e la descrizione che il gioco gia' dà di ogni Insector. La scaletta dei gradi
   non si inventa a mano dodici volte: e' quella che art() disegna davvero. */
const fs = require('fs'), path = require('path');
const SRC = process.argv[2] || path.join(__dirname, '..', '..', 'gioca.html');
const OUT = process.argv[3] || __dirname;
const h = fs.readFileSync(SRC, 'utf8');

const UNITS = [...h.matchAll(/\{"id":"([^"]+)","name":"([^"]+)","fam":"([^"]+)","rank":(\d+),"hp":(\d+),"str":(\d+),"def":(\d+),"mv":"([^"]+)","desc":"([^"]*)"/g)]
  .map(m => ({ id:m[1], name:m[2], fam:m[3], rank:+m[4], desc:m[9].replace(/\\u00([0-9a-f]{2})/g, (_,c)=>String.fromCharCode(parseInt(c,16))) }));
const COL = {}; for (const m of h.matchAll(/"([A-Za-z]+idi)":\s*\{[^}]*col:\s*"(#[0-9a-fA-F]{6})"/g)) COL[m[1]] = m[2];

/* La firma della famiglia e quello che ogni grado aggiunge: e' la stessa
   scaletta che art() disegna, scritta in inglese per il generatore. */
const FIRMA = {
  Lamidi:     { idea:'a straight blade horn pointing forward, narrow armoured body',
                gradi:['plain blade','barbs on the blade edge','two axe blades on the shoulders','a crossguard at the base of the blade'] },
  Bastidi:    { idea:'thick forked charging horn, heavy domed body',
                gradi:['plain horn','mandibles beside the head','barbs on the horn','armour plates at the tail'] },
  Bombardidi: { idea:'a cannon barrel mounted on the back, stubby body carrying it',
                gradi:['plain barrel','a breech block at the base of the barrel','side vents on the barrel','carriage wheels on the flanks'] },
  Voltidi:    { idea:'a wide flat flipper blade in front, built to flip others over',
                gradi:['plain blade','skids at the blade tips','struts holding the blade','the blade forks into prongs'] },
  Falcidi:    { idea:'raised sickle forelegs like a mantis, slim upright thorax',
                gradi:['plain sickles','serrations on the sickle edge','spines on the thorax','an inner hook closing the sickle'] },
  Tenaglidi:  { idea:'big open pincer jaws at the front, low stocky body',
                gradi:['plain jaws','teeth inside the jaws','dark spots on the shell'] },
  Silfidi:    { idea:'two pairs of delicate veined fairy wings, slender body, faint halo',
                gradi:['plain wings','a ring above the head','sparks beside the body'] },
  Trivellidi: { idea:'a drill-shaped head and a segmented caterpillar body',
                gradi:['smooth segments','ridges on the segments','spines along the segments'] },
  Sferidi:    { idea:'rolling a big rough ball resting on its back, flat wide body',
                gradi:['smaller ball','bigger ball and a seam across the back','cheek marks'] },
  Ventalidi:  { idea:'four broad wings with eyespots', gradi:['—'] },
  Coccinidi:  { idea:'a round spotted ladybird dome', gradi:['—'] },
  Corsidi:    { idea:'long legs and a mane, built to kick', gradi:['—'] },
  Tonantidi:  { idea:'crowned and imposing: this one is the boss', gradi:['—'] }
};

/* Il mestiere della famiglia, in inglese: la descrizione che il gioco da'
   e' in italiano, e una riga italiana in mezzo a un prompt inglese e' rumore.
   Serve al modello per l'atteggiamento, non solo per la forma. */
const RUOLO = {
  Lamidi:'A front-line attacker: one sharp blow on a single target.',
  Bastidi:'A wall that shoves: plenty of hit points, and a horn that moves whoever stands in front.',
  Bombardidi:'Artillery: hits from far off, but must be kept under cover — its defence is low.',
  Voltidi:'A disruptor: puts an opponent out of play for two turns and leaves it on its back.',
  Falcidi:'Area damage: alone among three enemies it is worth more than any other unit.',
  Tenaglidi:'A thrower: the grip does no damage — the wall it slams you into does.',
  Silfidi:'A saboteur: steals an opponent away from the enemy team.',
  Trivellidi:'A battering ram: charges straight and bowls things over, then stands exposed.',
  Sferidi:'A defender: curls up behind its ball and stops two hits.',
  Ventalidi:'A raider: flies three squares and sweeps away whatever stands around it.',
  Coccinidi:'Support: it does not attack well, but it keeps its neighbours standing.',
  Corsidi:'Mobility: two squares in a straight line in any direction, and it kicks.',
  Tonantidi:'The champion: knocks down with its plain attack and strikes at range.'
};

const fam = {};
UNITS.forEach(u => (fam[u.fam] = fam[u.fam] || []).push(u));
Object.keys(fam).forEach(k => fam[k].sort((a,b) => a.rank - b.rank));

fs.mkdirSync(OUT, { recursive: true });
let righe = 0;
for (const nome of Object.keys(fam)){
  const m = fam[nome], f = FIRMA[nome];

  const testo =
`PROMPT — famiglia ${nome} (${m.length} Insector)
colore della famiglia: ${COL[nome] || '?'}
${'='.repeat(60)}

Draw ${m.length} side-view character${m.length>1?'s':''} of the same insect family for a
turn-based tactics game, in ONE image, left to right, evenly spaced, on a flat
#2a3147 background, no text anywhere.

STYLE — match the reference exactly: cartoon mascot, bold dark outline, flat
fill with one soft highlight, three-quarter side view facing right, standing on
its legs, friendly but not childish. Family colour ${COL[nome] || '?'} on the body: use it,
do not introduce new hues.

FAMILY SIGNATURE — all of them must read as relatives:
${f.idea}.

THE ${m.length} MEMBER${m.length>1?'S':''}, weakest to strongest. ${m.length>1 ? 'Each one must be clearly different\nfrom the one before — same body plan, more weapon:' : ''}
${m.map((u,i) => `  ${i+1}. ${u.name} (rank ${u.rank})${f.gradi[i] && f.gradi[i] !== '—' ? ' — ' + f.gradi[i] : ''}`).join('\n')}

WHAT THEY DO, for the attitude: ${RUOLO[nome]}

The progression is carried by real shape — longer weapon, heavier body, extra
parts — not by size alone. Whoever is stronger must look it at a glance.

Return the ${m.length} character${m.length>1?'s':''} in one image, nothing else.
`;
  fs.writeFileSync(path.join(OUT, nome.toLowerCase() + '.txt'), testo);
  righe += testo.split('\n').length;
  console.log(nome.padEnd(12) + m.length + ' membri  ->  ' + nome.toLowerCase() + '.txt');
}
console.log('\n13 prompt scritti in ' + OUT + ' (' + righe + ' righe in tutto)');
