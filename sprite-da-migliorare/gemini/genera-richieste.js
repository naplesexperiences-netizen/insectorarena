/* Costruisce le richieste pronte da mandare a Gemini, partendo dal gioco.
   Due uscite, perche' le due API hanno forma diversa:

     famiglie.json      13 richieste, formato Interactions (sincrono)
     animazioni.jsonl   136 richieste, formato Batch (meta' prezzo, fino a 24h)

   Uso:  node genera-richieste.js [gioca.html] [cartella-uscita]
         SEED=12345 node genera-richieste.js      (vedi sotto)

   SUL SEED. Nella chat di Gemini non esiste. Sull'API delle immagini Google
   non lo documenta, compare in generationConfig in SDK di terze parti, e c'e'
   chi riporta che non viene comunque rispettato alla lettera. Higgsfield
   invece lo dichiara per nano_banana_2_1. Qui lo si mette solo se SEED e'
   valorizzato: tentativo in piu', non garanzia. Quello che tiene davvero lo
   stile e' l'immagine di riferimento allegata a ogni richiesta.            */
const fs = require('fs'), path = require('path');

const QUI    = __dirname;
const SPRITE = path.dirname(QUI);                       /* sprite-da-migliorare */
const DEMO   = path.dirname(SPRITE);
const SRC    = process.argv[2] || path.join(DEMO, 'gioca.html');
const OUT    = process.argv[3] || path.join(QUI, 'richieste');

const MODELLO    = 'gemini-nano-banana-2.1';
const SEED       = process.env.SEED ? Number(process.env.SEED) : null;
const RIFERIMENTO = path.join(QUI, 'riferimento.png');  /* il ritratto di stile */

const h = fs.readFileSync(SRC, 'utf8');
const UNITS = [...h.matchAll(/\{"id":"([^"]+)","name":"([^"]+)","fam":"([^"]+)","rank":(\d+)/g)]
  .map(m => ({ id:m[1], name:m[2], fam:m[3], rank:+m[4] }));
const COL = {};
for (const m of h.matchAll(/"([A-Za-z]+idi)":\s*\{[^}]*col:\s*"(#[0-9a-fA-F]{6})"/g)) COL[m[1]] = m[2];

/* La firma della famiglia: la stessa che sta nei prompt di famiglia. */
const FIRMA = {
  Lamidi:'a straight blade horn pointing forward, narrow armoured body',
  Bastidi:'a thick forked charging horn, heavy domed body',
  Bombardidi:'a cannon barrel mounted on the back, stubby body carrying it',
  Voltidi:'a wide flat flipper blade in front, built to flip others over',
  Falcidi:'raised sickle forelegs like a mantis, slim upright thorax',
  Tenaglidi:'big open pincer jaws at the front, low stocky body',
  Silfidi:'two pairs of delicate veined fairy wings, slender body, faint halo',
  Trivellidi:'a drill-shaped head and a segmented caterpillar body',
  Sferidi:'rolling a big rough ball resting on its back, flat wide body',
  Ventalidi:'four broad wings with eyespots',
  Coccinidi:'a round spotted ladybird dome',
  Corsidi:'long legs and a mane, built to kick',
  Tonantidi:'crowned and imposing: this one is the boss'
};

/* Con che cosa colpisce ciascuna famiglia. Senza questo il prompt d'attacco
   direbbe "weapon" anche a chi un'arma non ce l'ha: Macigno spinge una palla,
   Balsamina ha solo il guscio. */
const ARMA = {
  Lamidi:'the blade horn', Bastidi:'the horn', Bombardidi:'the cannon barrel',
  Voltidi:'the flipper blade', Falcidi:'the sickle forelegs',
  Tenaglidi:'the pincer jaws', Trivellidi:'the drill head',
  Silfidi:'the wings', Ventalidi:'the wings', Coccinidi:'the domed shell',
  Sferidi:'the ball it rolls', Corsidi:'the hind legs', Tonantidi:'a crackling charge'
};

/* ---- i quattro stati, come in animazioni.txt --------------------------- */
const STATI = {
  attacco: { n:6, passi:[
    'ready stance, weight on the back legs, {A} ready',
    'wind-up: the whole body leans back, {A} drawn back',
    'lunge forward, {A} leading, with motion streaks behind it',
    'impact: {A} driven into an unseen target at the right edge, a bright yellow-white burst at the point of contact',
    'follow-through: body low and forward past the strike, a small dust puff at the feet, a white arc tracing the path of {A}',
    'back to the ready stance of frame 1'],
    coda:'The force comes from the anticipation in frame 2 and the recovery in frame 5. Frame 4 is the only one with the burst.' },
  colpito: { n:4, passi:[
    'recoil: head back, body compressed, pained expression',
    'the whole character washed out to near-white, as if lit from inside by the impact — keep the silhouette identical to frame 1',
    'staggering, off balance, small coloured stars circling the head',
    'upright again, shaken, eyes narrowed'],
    coda:'Frame 2 is a flash: same shape, different colour, nothing else.' },
  vittoria: { n:6, passi:[
    'both forelimbs raised, chest out, delighted',
    'a small jump, feet off the ground, limbs up',
    'at the top of the jump, surrounded by small coloured confetti',
    'a courteous bow, one limb folded across the body',
    'upright again with warm sparkles around the head',
    'a final raised fist, pleased with itself'],
    coda:'Happy, not manic. This is a creature that has just won a duel, not a cartoon on a sugar rush.' },
  sconfitta: { n:6, passi:[
    'hunched, exhausted, limbs hanging',
    'a dizzy spiral over one eye, swaying',
    'knees buckling, body sagging forward',
    'flat on the ground, side view, limbs splayed',
    'on the ground with coloured stars circling above the head',
    'on the ground, eyes closed, a slow spiral of stars settling'],
    coda:'Defeated and tired, never gruesome: no blood, no injury, no distress. The character keeps its dignity.' }
};

const testa = (u, n) =>
`The attached image is the reference for this character. Keep it EXACTLY: same body plan, same proportions, same ${COL[u.fam]} body colour, same dark outline weight, same flat shading with one soft highlight, same cartoon mascot style, three-quarter side view facing right.

This is ${u.name}, of the ${u.fam} family: ${FIRMA[u.fam]}.

Draw ONE strip of ${n} animation frames, left to right, evenly spaced, each frame the same square size, on a flat #2a3147 background. No text, no numbers, no frame borders, no captions anywhere in the image.

THE CHARACTER MUST NOT CHANGE BETWEEN FRAMES. Same size, same colours, same markings, same number of limbs. Only the pose and the effects change. Keep the feet on the same ground line in every frame, and keep the character at the same distance from the camera: these frames are played one after the other, and anything that drifts reads as a glitch.`;

const prompt = (u, nome, s) =>
  testa(u, s.n) + '\n\nTHE ' + s.n + ' FRAMES:\n' +
  s.passi.map((p, i) => '  ' + (i+1) + '. ' +
    p.replace(/\{A\}/g, ARMA[u.fam] || 'its weapon')).join('\n') +
  '\n\n' + s.coda + '\n\nReturn the strip of ' + s.n + ' frames, nothing else.';

/* ---- scrittura --------------------------------------------------------- */
fs.mkdirSync(OUT, { recursive: true });
const rif = fs.existsSync(RIFERIMENTO)
  ? fs.readFileSync(RIFERIMENTO).toString('base64') : null;
if (!rif) console.warn('ATTENZIONE: manca ' + RIFERIMENTO +
  ' — le richieste escono senza immagine di riferimento, ed e\' quella a tenere lo stile.');

/* 1) le famiglie: formato Interactions, poche richieste, si guardano subito */
const fam = {};
UNITS.forEach(u => (fam[u.fam] = fam[u.fam] || []).push(u));
const famiglie = Object.keys(fam).map(k => {
  const testo = fs.readFileSync(path.join(SPRITE, 'prompt-famiglie', k.toLowerCase() + '.txt'), 'utf8')
    .split('\n').slice(3).join('\n').trim();     /* via l'intestazione italiana */
  const input = [{ type:'text', text: testo }];
  if (rif) input.push({ type:'image', mime_type:'image/png', data: rif });
  const r = { chiave:'famiglia-' + k.toLowerCase(), model: MODELLO, input,
           response_format:{ type:'image', mime_type:'image/png',
             aspect_ratio: fam[k].length >= 4 ? '4:1' : (fam[k].length === 3 ? '3:1' : '1:1'),
             image_size:'2K' } };
  if (SEED !== null) r.generation_config = { seed: SEED };
  return r;
});
fs.writeFileSync(path.join(OUT, 'famiglie.json'), JSON.stringify(famiglie, null, 1));

/* 2) le animazioni: formato Batch, una riga per richiesta */
const righe = [];
for (const u of UNITS)
  for (const nome of Object.keys(STATI)){
    const s = STATI[nome];
    const parts = [{ text: prompt(u, nome, s) }];
    if (rif) parts.push({ inline_data:{ mime_type:'image/png', data: rif } });
    righe.push(JSON.stringify({
      key: u.id + '-' + nome,
      request: { contents:[{ parts }],
        generation_config: Object.assign({ response_modalities:['TEXT','IMAGE'],
          image_config:{ aspect_ratio: s.n === 4 ? '4:1' : '3:1', image_size:'2K' } },
          SEED !== null ? { seed: SEED } : {}) }
    }));
  }
fs.writeFileSync(path.join(OUT, 'animazioni.jsonl'), righe.join('\n') + '\n');

const peso = f => (fs.statSync(path.join(OUT, f)).size / 1048576).toFixed(1) + ' MB';
if (SEED !== null) console.log('seed ' + SEED + ' messo in tutte le richieste (tentativo, non garanzia)');
console.log('famiglie.json     ' + famiglie.length + ' richieste  ' + peso('famiglie.json'));
console.log('animazioni.jsonl  ' + righe.length + ' richieste  ' + peso('animazioni.jsonl') +
            '  (' + UNITS.length + ' Insector x 4 stati = ' +
            (UNITS.length * 22) + ' fotogrammi)');
