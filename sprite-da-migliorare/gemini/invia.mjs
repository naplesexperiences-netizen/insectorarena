/* Manda le richieste a Gemini e salva quello che torna.
   NON E' MAI STATO ESEGUITO: in questa sessione non c'e' una chiave API.
   Leggilo prima di lanciarlo.

     export GEMINI_API_KEY=...
     node invia.mjs famiglie          # le 13 famiglie, sincrone, subito
     node invia.mjs famiglie bastidi  # una sola, per provare

   Le animazioni passano dal Batch (meta' prezzo, fino a 24 ore) e si
   mandano con l'SDK ufficiale: vedi README.md.                            */
import fs from 'node:fs';
import path from 'node:path';

const CHIAVE = process.env.GEMINI_API_KEY;
if (!CHIAVE){ console.error('manca GEMINI_API_KEY'); process.exit(1); }

const QUI = path.dirname(new URL(import.meta.url).pathname);
const quali = process.argv[3];
const richieste = JSON.parse(fs.readFileSync(path.join(QUI, 'richieste', 'famiglie.json'), 'utf8'))
  .filter(r => !quali || r.chiave.includes(quali));
if (!richieste.length){ console.error('nessuna richiesta corrisponde a ' + quali); process.exit(1); }

const USCITA = path.join(QUI, 'ritorni');
fs.mkdirSync(USCITA, { recursive: true });

for (const r of richieste){
  const { chiave, ...corpo } = r;
  process.stdout.write(chiave.padEnd(24));
  const t0 = Date.now();
  try {
    const risp = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: { 'x-goog-api-key': CHIAVE, 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo)
    });
    if (!risp.ok){ console.log('HTTP ' + risp.status + ' ' + (await risp.text()).slice(0, 200)); continue; }
    const d = await risp.json();
    /* l'immagine finale sta in output_image; se manca, si cerca fra gli step */
    let b64 = d.output_image?.data;
    if (!b64) for (const s of d.steps || [])
      for (const c of s.content || []) if (c.type === 'image' && c.data) b64 = c.data;
    if (!b64){ console.log('nessuna immagine nella risposta'); continue; }
    const file = path.join(USCITA, chiave + '.png');
    fs.writeFileSync(file, Buffer.from(b64, 'base64'));
    console.log((fs.statSync(file).size / 1024).toFixed(0) + ' KB  ' +
                ((Date.now() - t0) / 1000).toFixed(1) + ' s');
  } catch (e){ console.log('errore: ' + e.message); }
}
console.log('\nritorni in ' + USCITA);
