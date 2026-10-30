# Prompt per Google AI Studio (playground): completare la grafica

*30 ottobre 2026.* Questo file serve a passare il lavoro a Gemini nel playground di
Google AI Studio, dove Higgsfield e Canva si sono fermati (piano gratuito e quota
esaurita, vedi in fondo). Contiene **le istruzioni per te** e **il prompt da
incollare**.

## Come si usa

Il lavoro ha due metà, e nel playground conviene farle in due chat diverse:

1. **Le immagini** — in una chat con un modello che **genera immagini** (in AI Studio
   è la famiglia «Nano Banana»; `sprite-da-migliorare/gemini/` è stato preparato per
   `gemini-nano-banana-2.1`). Incolla tutto il prompt qui sotto e allega i file della
   colonna «immagini».
2. **L'integrazione nel gioco** — in una chat con un modello di testo con contesto
   lungo (Gemini Pro), solo **dopo** che le immagini ti convincono. Incolla di nuovo
   tutto il prompt, scrivi in cima «Fai la PARTE B», e allega i file della colonna
   «integrazione» più le immagini scelte.

| file da allegare | immagini | integrazione |
|---|:---:|:---:|
| `sprite-da-migliorare/playground/campo.png` — il campo di oggi | ✓ | ✓ |
| `sprite-da-migliorare/playground/mondo.png` — il Mondo di oggi | ✓ | ✓ |
| `sprite-da-migliorare/playground/roster.png` — il roster di oggi | ✓ | |
| `sprite-da-migliorare/playground/falcetta-dallalto.png` — riferimento di stile, vista dall'alto | ✓ | |
| `sprite-da-migliorare/insetti-per-il-modello.png` — i 34 Insector, griglia 6×6 senza testo | ✓ | |
| `sprite-da-migliorare/insetti-legenda.png` — la stessa griglia con nomi e famiglie | ✓ | |
| `gioca.html` — il gioco intero, 344 KB, un file solo | | ✓ |
| `sw.js` — il service worker | | ✓ |
| `PIANO-GRAFICA.md`, `PIANO-UX.md` — i piani | | ✓ |

**Una richiesta alla volta.** Fai generare un pezzo, guardalo, poi passa al
successivo: se il primo viene male, il prompt si corregge prima di spendere sugli
altri.

---

## IL PROMPT — da qui in giù, tutto

Sei l'art director e lo sviluppatore che completa la grafica di **Insectron Arena**,
un gioco tattico a turni 5 contro 5 che gira nel browser. Ti do lo stato del
progetto, le regole che non si toccano, il lavoro da fare in ordine, e come
consegnare. Leggi tutto prima di cominciare.

### 1. Il gioco, in breve

- Tattica a turni su una griglia di **5 colonne × 7 righe**. Ogni giocatore ha cinque
  pedine (gli **Insector**) e un **Re**: se cade, la partita è persa. Spingere un
  avversario **oltre il bordo** lo elimina all'istante, Re compreso.
- **34 Insector** divisi in **13 famiglie**. Ogni famiglia ha un colore e un'arma
  che la distingue; dentro la famiglia i membri salgono di **grado** (da 1 a 4) e ogni
  grado aggiunge un pezzo alla figura.
- Torneo a sei rank (E, D, C, B, A, S). Fuori dalle battaglie c'è il **Mondo**: cinque
  luoghi (Frutteto, Cava, Fornace, Pantano, Radura reale) dove si posano trappole con
  un'esca per catturare nuovi Insector.
- È **un file solo** (`gioca.html`), senza dipendenze, pubblicato su GitHub Pages,
  installabile e **funziona offline** grazie al service worker (`sw.js`).
- Oggi **nel gioco non c'è un solo file immagine**: sprite, icone, mappa e animazioni
  sono disegnati da codice. La funzione `art(fam, flip, rank)` disegna i 34 Insector
  in SVG, **visti dall'alto**, in un `viewBox` da 64, col colore della famiglia come
  parametro.

### 2. Dove siamo arrivati con la grafica

Il piano grafico ha quattro fasi. **Le prime tre sono fatte e pubblicate**, tutte in
codice (le schermate allegate `campo.png`, `mondo.png` e `roster.png` mostrano il
gioco di oggi):

- **Fase 1, interfaccia** — sette dimensioni di testo, un solo pulsante giallo pieno
  per schermata, statistiche del roster a barre, 12 icone disegnate da codice.
- **Fase 2, arena e insetti** — il bordo del campo è una cornice scura (precipizio);
  le due file di casa sono tinte (blu scuro `#172536` per chi gioca in basso, bordeaux
  scuro `#2a1a22` per chi gioca in alto); un motivo di terreno quasi invisibile che
  cambia col rank (terra E–D, corteccia C–B, pietra A, pietra con pagliuzze d'oro S);
  anelli sotto le pedine, pieni per l'alleato e tratteggiati per l'avversario; l'area
  della mossa speciale tratteggiata nel colore della famiglia.
- **Fase 3, Mondo** — una mappa con un sentiero e i cinque luoghi, ognuno con una
  piccola scena disegnata da codice e una tinta: Frutteto `#7fb069`, Cava `#a8a29e`,
  Fornace `#f97316`, Pantano `#5f8f7a`, Radura reale `#9b87f5`.

**Manca la Fase 4: le illustrazioni generate.** È il tuo lavoro. Tre pezzi:

| | che cos'è | quanti | dove va | budget di peso |
|---|---|---:|---|---:|
| **C. Arena** | fondale del campo + illustrazione dei 5 luoghi | 1 (+3) + 5 | sotto la griglia; nella testata della scheda di ogni luogo | 250 KB in tutto |
| **A. Ritratti** | un ritratto per Insector, di profilo | 34 | scheda dell'Insector, collezione, fine partita | 350 KB in tutto |
| **B. Animazioni** | attacco, colpito, vittoria, sconfitta | 136 strisce | solo nella schermata di risultato, caricate quando servono | da decidere |

Ordine: **prima un test di sei pezzi, poi C, poi A. B solo se il test dimostra che lo
stile regge** (vedi §5).

### 3. Le regole che non si toccano

1. **`art()` non si cancella.** Gli sprite sul campo restano disegnati da codice, e
   `art()` è il ripiego per ogni immagine che non carica. Il giorno che una scelta
   grafica va storta, si torna indietro togliendo file.
2. **Offline resta offline.** Ogni immagine nuova entra nell'elenco `GUSCIO` di
   `sw.js`, e `VERSIONE` sale di uno (oggi è `insectron-v23`).
3. **La leggibilità del campo viene prima della bellezza.** Sopra il fondale ci sono 35
   caselle e fino a dieci pedine. Le caselle di movimento (`#16405c`, bordo azzurro) e
   quelle d'attacco (`#5c1f22`, bordo rosso) devono distinguersi almeno quanto oggi.
4. **Il budget di peso si dichiara prima** e si rispetta: 250 KB l'arena, 350 KB i
   ritratti. Oltre, WebP e risoluzione più bassa.
5. **Niente testo dentro le immagini**: né nomi, né numeri, né firme. Il testo dentro
   un'immagine generata torna storpiato.
6. **Solo colori del gioco.** Fondo `#0d1117`, pannelli `#1b2332` e `#232d40`,
   giallo `#ffc24b`, azzurro `#4bc3ff`, rosso `#ff6b6b`, verde `#5ddb8f`; i colori
   delle famiglie sono nella tabella qui sotto.
7. **Lo stile è uno solo per tutto il set**: mascotte cartoon, contorno scuro spesso
   (`#0a0e15`), campiture piatte con una sola luce morbida, amichevole ma non infantile.
   Riferimento: `falcetta-dallalto.png`.

**Le 13 famiglie** (colore, arma che le distingue, membri dal più debole al più forte):

| famiglia | colore | firma (dai prompt di famiglia) | membri, dal più debole (rank) |
|---|---|---|---|
| Lamidi | `#7dd3fc` | a straight blade horn pointing forward, narrow armoured body | Sfregio (1), Rasoio (3), Bipenne (4), Trinciaferro (5) |
| Bastidi | `#fbbf24` | thick forked charging horn, heavy domed body | Bastione (1), Barbacane (3), Rivellino (4), Mastio (5) |
| Bombardidi | `#a78bfa` | a cannon barrel mounted on the back, stubby body carrying it | Mortaio (3), Colubrina (4), Bombarda (5), Basilisco (6) |
| Voltidi | `#34d399` | a wide flat flipper blade in front, built to flip others over | Ribalta (1), Girandola (3), Capovolta (4), Rovescio (5) |
| Tenaglidi | `#fb923c` | big open pincer jaws at the front, low stocky body | Tenaglia (1), Morsa (2), Ganascia (3) |
| Falcidi | `#4ade80` | raised sickle forelegs like a mantis, slim upright thorax | Falcetta (1), Falcione (2), Roncola (3), Turbine (4) |
| Trivellidi | `#f472b6` | a drill-shaped head and a segmented caterpillar body | Trivella (4), Punteruolo (6) |
| Ventalidi | `#22d3ee` | four broad wings with eyespots | Bufera (4) |
| Coccinidi | `#f87171` | a round spotted ladybird dome | Balsamina (3) |
| Sferidi | `#c4b5a0` | rolling a big rough ball resting on its back, flat wide body | Ruzzola (2), Macigno (3) |
| Corsidi | `#fcd34d` | long legs and a mane, built to kick | Galoppo (1) |
| Silfidi | `#e879f9` | two pairs of delicate veined fairy wings, slender body, faint halo | Lusinga (1), Malia (2), Incanto (3) |
| Tonantidi | `#818cf8` | crowned and imposing: this one is the boss | Folgore (1, ma è il premio del Rank S) |

Nomi, ranghi e scaletta dei gradi esatti sono in `insetti-legenda.png`: **se questa
tabella e la legenda non coincidono, vale la legenda**, che esce dal codice. Per le
famiglie i prompt dettagliati, con la scaletta dei gradi, sono in
`sprite-da-migliorare/prompt-famiglie/*.txt`.

### 4. PARTE A — le immagini

#### 4.1 Il test: sei pezzi, in quest'ordine

Per ognuno, consegna l'immagine e **quattro righe di misura** (§4.4).

**Test 1 — famiglia Bombardidi, striscia di profilo** (16:9)
```
Four insect characters of the same family for a turn-based tactics game, in one row
from left to right, evenly spaced, each seen from the side facing right, standing on
their legs. Flat vector cartoon mascot style, bold dark outline (#0a0e15), flat colour
fills with one soft highlight, friendly but not childish. Every body is lavender
purple #a78bfa, with shading #7c5fd6 and highlight #c5b2fc, no other hues. Family
signature: a cannon barrel mounted on the back of a stubby beetle body. From left to
right, weakest to strongest, same body plan with more weapon at each step: first a
plain short barrel; second adds a heavy breech block at the base of the barrel; third
adds side vents along the barrel; fourth adds carriage wheels on the flanks and the
longest barrel. The strongest must look strongest at a glance by its shape, not only
by its size. Plain flat background colour #2a3147, no ground, no floor shadows, no
text, no numbers, no labels.
```

**Test 2 — famiglia Tenaglidi, striscia di profilo** (16:9). Stesso stile del test 1:
è il pezzo che dice se lo stile regge fra due famiglie lontane.
```
Three insect characters of the same family for a turn-based tactics game, in one row
from left to right, evenly spaced, each seen from the side facing right, standing on
their legs. Flat vector cartoon mascot style, bold dark outline (#0a0e15), flat colour
fills with one soft highlight, friendly but not childish. Every body is orange
#fb923c, with shading #d9741f and highlight #fcb77e, no other hues. Family signature:
big open pincer jaws at the front of a low stocky beetle body. From left to right,
weakest to strongest, same body plan with more weapon at each step: first plain smooth
jaws; second adds rows of teeth inside the jaws; third adds dark spots on the shell
and the biggest jaws. The strongest must look strongest at a glance by its shape, not
only by its size. Plain flat background colour #2a3147, no ground, no floor shadows,
no text, no numbers, no labels.
```

**Test 3 — fondale del campo, terreno «terra»** (5:7, o 3:4 se 5:7 non c'è). Guarda
`campo.png`: il fondale va **sotto** quelle caselle.
```
Seamless top-down texture of a flat game board surface, seen straight from above:
packed dark earth with a few tiny pebbles and faint dry leaf litter, evenly lit, very
low contrast, dark navy-blue tones between #10151f and #2a3147, slightly darker towards
the edges and a touch lighter in the centre. No objects, no characters, no strong
lines, no grid, no perspective, no horizon, no text. A quiet surface meant to sit
under a translucent grid of game tiles.
```

**Test 4 — il Frutteto** (16:9). Va nella testata della scheda del luogo, sopra un
pannello scuro: guarda `mondo.png`, il riquadro verde in alto a destra.
```
A small orchard clearing at dusk, illustration for a game location card: a few low
round fruit trees in leaf green #7fb069, fallen yellow #ffc24b and orange #f97316
fruit on the grass, soft glowing fireflies, deep dark navy evening sky #0d1117, clean
flat shapes with gentle gradients in a flat vector game-art style, calm and inviting,
no characters, no animals, no text. Wide composition with an open space in the centre.
```

**Test 5 — Falcetta che attacca, vista DALL'ALTO** (21:9), con `falcetta-dallalto.png`
allegato come riferimento. È la prova che può cambiare il piano: se un'animazione vista
dall'alto viene pulita, le animazioni possono andare **anche sul campo**, non solo
nella schermata di risultato.
```
The attached image is the reference for this character: a green mantis seen from
directly above, flat colours, thick dark green outline. Keep it EXACTLY: same top-down
view, same proportions, same green #4ade80 body with #16a34a outline, same flat
shading. Draw ONE strip of 6 animation frames of its attack, left to right, evenly
spaced, each frame the same square size, character centred in each frame and the same
size in every frame, on a flat #232d40 background. Frames: 1 ready stance, scythe arms
raised; 2 wind-up, body pulled back a little, scythes drawn back; 3 lunge forward,
scythes swinging down, small motion streaks; 4 impact, scythes fully forward with a
small white flash in front; 5 recovery, scythes coming back; 6 back to the ready
stance. The character must not change between frames: same colours, same number of
legs, only the pose changes. No text, no numbers, no frame borders.
```

**Test 6 — Falcetta che attacca, di profilo** (21:9). Stesso attacco, ma nella vista
dei ritratti (tre quarti, rivolta a destra), per confrontare le due strade. Usa come
testa del prompt la «TESTA COMUNE» di `sprite-da-migliorare/gemini/animazioni.txt` e
come corpo la sezione «1. ATTACCO»: in quel file `{NOME}` = Falcetta, `{FAMIGLIA}` =
Falcidi, `{COLORE}` = `#4ade80`, `{FIRMA}` = raised sickle forelegs like a mantis, slim upright thorax, `{ARMA}` = the sickle forelegs,
`{N}` = 6.

#### 4.2 Quando il test è passato: il lavoro C

- **Fondale del campo**: quello del test 3, più — se il budget lo permette — una
  variante per ogni terreno: corteccia (rank C–B), pietra (A), pietra con pagliuzze
  d'oro `#ffc24b` molto rade (S). Stesso prompt, cambia solo il materiale.
- **I cinque luoghi**, tutti 16:9, stesso stile del Frutteto, ognuno dominato dalla sua
  tinta:
  - Cava `#a8a29e` — «pietra spaccata e polvere, le pietre preziose attirano chi scava»
  - Fornace `#f97316` — «aria che brucia, ci resiste solo chi è fatto per starci»
  - Pantano `#5f8f7a` — «acqua ferma e fango, canne, chi ci vive si muove meglio di
    quanto sembri»
  - Radura reale `#9b87f5` — «silenzio e poche tracce, un cerchio di luce viola, qui
    non capita niente per caso»

#### 4.3 Poi il lavoro A: i 34 ritratti

**Una striscia per famiglia, non un ritratto alla volta**: 13 generazioni, non 34. Per
ogni famiglia usa il suo file in `sprite-da-migliorare/prompt-famiglie/` (allegalo o
incollalo) e allega sempre lo stesso riferimento di stile, che sarà **il migliore fra
i test 1 e 2**. Le strisce si ritagliano poi in un ritratto per Insector, quadrato,
128 px.

#### 4.4 Come misuri ogni pezzo (quattro righe, sempre)

1. **Brief rispettato?** Vista, numero di personaggi, colori, niente testo: sì/no, e
   cosa no.
2. **Leggibile a 46 px?** Rimpicciolisci mentalmente al formato delle pedine: la
   figura si riconosce, o i dettagli diventano fango?
3. **Coerenza**: il pezzo sembra dello stesso gioco dei precedenti? Dai un voto da 1 a
   5 e di' cosa stona.
4. **Da rifare?** Sì/no, e con quale modifica al prompt.

### 5. Il criterio di arresto

**Se fra il test 1 e il test 2 lo stile non regge** — contorno, luci, proporzioni,
«famiglia di mascotte» diverse — **le 136 animazioni (B) non si fanno**: 136 strisce
generate da uno stile che deriva sono 136 strisce da buttare. In quel caso si fanno
solo C e, se reggono, i ritratti. Dimmelo chiaramente invece di proseguire.

### 6. PARTE B — l'integrazione nel gioco

Da fare **solo con le immagini già scelte** e con `gioca.html` e `sw.js` allegati.

- **Dove vanno i file**: una cartella nuova `img/gioco/`, nomi in minuscolo senza
  spazi: `campo-terra.webp`, `campo-corteccia.webp`, …, `luogo-frutteto.webp`, …,
  `ritratti/falcetta.webp`, ….
- **Fondale del campo.** Oggi il campo è `.board` e il terreno è scelto da
  `board.dataset.terreno` (`terra`, `corteccia`, `pietra`, `oro`), con un motivo SVG in
  CSS per ogni valore (`.board[data-terreno="terra"]{background-image:…}`).
  Aggiungi l'immagine **come primo strato** di quelle regole, lasciando sotto il motivo
  SVG e il gradiente: se l'immagine non carica, il campo resta com'è oggi. Le file di
  casa (`.cell.home`, `.cell.away`) sono tinte opache: il fondale si vedrà soprattutto
  nelle tre righe centrali, ed è giusto così.
- **Luoghi del Mondo.** La testata della scheda del luogo è
  `.testata-luogo.b-<id>` (costruita in `drawSpedizione()`). Metti l'illustrazione
  come sfondo di quella testata, con un velo scuro sopra perché il titolo e la
  descrizione restino leggibili (contrasto ≥ 4,5:1). Le scene SVG della mappa
  (`SCENE`) restano.
- **Ritratti.** Nelle schede dell'Insector (`corpoScheda()`, classe `.sheet`), nella
  collezione e nella schermata di risultato, usa il ritratto con `art()` come ripiego:
  `<img src="img/gioco/ritratti/<id>.webp" onerror="…">` che, se fallisce, lascia lo
  sprite. **Sul campo restano gli sprite di `art()`.**
- **Service worker**: aggiungi ogni file nuovo a `GUSCIO` in `sw.js` e porta
  `VERSIONE` a `insectron-v24`.
- **Peso**: elenca ogni file con i suoi KB e il totale per gruppo, contro i budget
  (250 KB arena, 350 KB ritratti).
- **Prove**: il gioco ha una batteria di 965 controlli automatici
  (`sh prove-automatiche/batteria.sh`, Playwright). Non puoi eseguirla tu: scrivi le
  modifiche in modo che non cambino niente di ciò che c'era (stessi id, stesse classi,
  stessi testi), ed elenca cosa andrebbe aggiunto a una suite nuova `grafica`: ogni
  immagine dichiarata esiste e sta nel budget; col fondale attivo il contrasto fra
  casella normale, di movimento e d'attacco non scende; senza immagini il gioco resta
  identico a oggi; il service worker le mette in cache.

### 7. Come consegni

- **Parte A**: un pezzo alla volta, ognuno con le sue quattro righe di misura (§4.4).
  Alla fine del test, un verdetto: si va avanti con C e A? con B?
- **Parte B**: le modifiche come **diff** (o blocchi «prima/dopo» con abbastanza
  contesto da trovarli nel file), più la tabella dei pesi, più l'elenco dei controlli
  da aggiungere. Non riscrivere `gioca.html` da capo: è lungo e ogni riga ha un motivo.

---

## Perché il lavoro è arrivato qui

*Per chi legge questo file nel repository, non va incollato.*

Il 26 ottobre il test da sei pezzi è stato provato su **Higgsfield**: tutti i modelli
d'immagine (Recraft e GPT Image) hanno rifiutato con «Requires basic plan or higher» —
i 10 crediti presenti erano crediti di benvenuto su un piano gratuito. AutoSprite è
partito ed è fallito senza un motivo dichiarato; i crediti sono stati restituiti. Poi
**Canva**: «You have exceeded your credit quota». Nessuna immagine prodotta, nessun
costo. I prompt qui sopra sono gli stessi preparati per quei due tentativi.
