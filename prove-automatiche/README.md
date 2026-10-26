# Le prove automatiche

816 controlli sul gioco, più 59 su contorno e infrastruttura. Girano in Chromium
vero tramite Playwright, sul file `gioca.html` che sta qui accanto: non c'è un
ambiente di test separato da tenere allineato, quello che passa è il gioco che
viene pubblicato.

```sh
npm i -D playwright && npx playwright install chromium
sh batteria.sh                 # tutto
sh batteria.sh ux sprite       # solo quelle nominate
node sprite.js                 # una sola, con l'elenco dei controlli
```

Se Playwright sta altrove: `PLAYWRIGHT_PATH=/percorso/a/playwright sh batteria.sh`.
Serve anche `python3`, per il server statico e per i due script in `strumenti/`.

## Le 31 suite

| | controlli | che cosa verifica |
|---|---:|---|
| `mech` | 30 | le meccaniche pure, **senza browser**: targeting, danno, ring-out, vittoria |
| `deploy` | 20 | schieramento, caselle valide, Re obbligatorio |
| `a11y` | 14 | griglia ARIA, uso da tastiera, lettura con screen reader |
| `move` `move2` | 13 | la regola del movimento, passo e salto |
| `diff` | 10 | i tre livelli di difficoltà dell'avversario |
| `cards` | 30 | le schede degli Insector |
| `hover` | 14 | quello che compare al passaggio del mouse |
| `duo` | 32 | partita in due sullo stesso schermo |
| `modes` | 44 | scelta della modalità, PC vs PC |
| `rot` | 18 | rotazione della scacchiera fra un turno e l'altro |
| `motion` | 13 | le animazioni, e che si spengano con `prefers-reduced-motion` |
| `salva` | 25 | salvataggi, esportazione, importazione |
| `alleva` | 28 | gabbie e allevamento |
| `mondo` | 44 | mondo, trappole, cattura, semi condivisibili |
| `demo` | 14 | l'edizione demo, generata davvero da `crea-demo.sh` |
| `eco` | 44 | raccolta del feedback e telemetria (spenta) |
| `suono` | 23 | il suono sintetizzato |
| `guida` | 19 | la guida del primo minuto |
| `musica` | 31 | le melodie |
| `menu` | 17 | il menu, che non deve uscire dallo schermo |
| `mobile` | 30 | uso da telefono, nessuno scorrimento orizzontale |
| `ripro` | 32 | riproduzione ed ereditarietà |
| `sfida` | 40 | la sfida del giorno: due partite identiche, stesso risultato |
| `coll` | 20 | la collezione |
| `resist` | 39 | le resistenze, 400 battaglie per scenario |
| `nomi` | 23 | la nomenclatura: 118 nomi, nessuna collisione |
| `ux` | 52 | tutto il percorso prima della partita in una schermata sola |
| `spiega` | 48 | le nuvolette dei suggerimenti in contesto |
| `tocco` | 39 | il gesto unico (tocco breve / pressione lunga) e il campo illuminato |
| `sprite` | 10 | che nessun Insector abbia il disegno di un altro, e che nessuno sbordi |

Fuori batteria, in coda: `land` (21, landing e informativa), `pwa` (19, sito
installabile e prova offline) e `../telemetria/prova.mjs` (19, l'endpoint in un
contesto vuoto con un D1 finto e senza rete).

## Come sono fatte

Ogni suite è un file `node` autonomo che stampa `  OK  ` o `  KO  ` per ogni
controllo; `batteria.sh` le lancia tutte e conta le righe. Nessun framework, nessuna
configurazione: si legge il file e si capisce che cosa prova.

- **`comune.js`** tiene i percorsi. Trova Playwright, calcola dov'è `gioca.html`
  a partire da dove sta questo file, e dà l'indirizzo del server locale.
- **`harness.js`** è lo stub di DOM che fa girare la logica di gioco in node
  nudo: è quello che permette a `mech` di provare le meccaniche in millisecondi,
  senza aprire un browser.
- **`mech.js` e `game.js` non stanno nel repository**: sono derivati. `batteria.sh`
  li rigenera a ogni giro con `strumenti/rigenera-mech.py`, che ritaglia il corpo
  dello `<script>` di `gioca.html` e ci incolla sopra l'harness. Così le prove sulle
  meccaniche non possono testare una copia vecchia del gioco.

### Il server locale

Alcune prove vogliono un'origine vera — `localStorage` e il service worker non
funzionano da `file://`. `batteria.sh` alza un `python3 -m http.server` e lo
spegne alla fine.

La radice servita è quella del **sito pubblicato** (il repository `insectorarena`,
cercato accanto a questo), perché oltre al gioco ha manifest, service worker e
icone. Se non c'è, si serve questa cartella: gira tutto lo stesso, tranne `pwa.js`
che quei file li cerca davvero e lo dice invece di fallire.

```sh
INSECTRON_SITO=/percorso/al/sito sh batteria.sh    # indicare la radice a mano
INSECTRON_PORTA=9000 sh batteria.sh                # se la 8232 è occupata
```

## `misure/` — gli strumenti di misura

Non sono prove: non passano e non falliscono, stampano numeri. Servono a decidere
con i dati invece che a occhio, e sono quelli che hanno prodotto le cifre citate
in `DOCUMENTAZIONE.md`.

| | che cosa misura |
|---|---|
| `dati.js` | estrae famiglie e unità dal gioco in `dati.json` (lo usano gli altri) |
| `sagome.js` | quanta silhouette cambia fra un grado e il successivo |
| `tra.js` | quanto distano due **famiglie** diverse: il metro di paragone |
| `gemelli.js` | le coppie indistinguibili, se ne restano |
| `coppie.js` | il confronto grado per grado dentro ogni famiglia |
| `bordi.js` | il riquadro dell'inchiostro di ogni sprite, per vedere chi sborda |
| `misura.js` | differenza di colore dentro e fra le famiglie |
| `foglio.js` | i tre fogli di `../sprite-da-migliorare/` |
| `invariati.js` | confronta con una copia di prima: `node misure/invariati.js vecchio.html` |

Il confronto è su **maschera alfa** — inchiostro contro sfondo — e non sui colori:
fra fratelli il colore è lo stesso per costruzione, quindi un confronto di colore
direbbe che si somigliano anche quando hanno forme diverse.

## `schermate/` — le immagini della vetrina

Rifanno gli `img/*.png` della landing. Le nuvolette dei suggerimenti vengono
disattivate prima dello scatto, altrimenti coprono proprio quello che l'immagine
deve mostrare.

```sh
node schermate/shots.js      # roster, schieramento, battaglia
node schermate/ogmake.js     # la card social, da og-card.html
```

Se cambi la dimensione di uno scatto, aggiorna `width`/`height` nell'`index.html`:
sono dichiarati a mano per non far saltare il layout durante il caricamento.

## `strumenti/`

| | |
|---|---|
| `rigenera-mech.py` | genera `mech.js` e `game.js` da `gioca.html` |

*(Qui c'era anche `specchia.py`, che teneva allineata la copia del gioco
dentro all'hub delle demo. Dal 26 ottobre 2026 l'hub non ha più una copia: ha
tre pagine che rimandano qui, e non c'è più niente da allineare.)*

## Due cose imparate, che valgono più dei controlli

**Le transizioni CSS falsano le misure.** `getComputedStyle` e
`getBoundingClientRect` letti subito dopo un ridisegno tornano valori a metà
strada, perché la transizione (0,13–0,18 s) è ancora in corso. È successo due
volte, e tutte e due le volte il primo sospetto era un bug del prodotto: era la
misura. Prima di credere a un numero storto, aspetta che la transizione finisca.

**Una prova che non passa non si aggira.** Se una suite fallisce dopo una
modifica, o la modifica è sbagliata o la prova descriveva un comportamento che
non vogliamo più — e allora si riscrive la prova, dicendo perché. Non si
cancella il controllo.
