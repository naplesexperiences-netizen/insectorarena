# Disegnare gli Insector e l'arena su Higgsfield — piano di lavoro

Documento di decisione. Stessa struttura dei piani per il mondo, l'allevamento
e il multiplayer, così i quattro si confrontano. Alla fine c'è la decisione da
prendere.

Stato attuale: tutta la grafica del gioco è **generata da codice**. `art()`
disegna 34 Insector in 2,7 KB col colore della famiglia come parametro; il
campo è una griglia CSS con un gradiente radiale; i luoghi del Mondo prendono
in prestito lo sprite di una famiglia. `gioca.html` pesa 308 KB, tutto il sito
pubblicato 2,0 MB, e funziona offline da `file://`.

---

## 0. Risposta breve

Tre lavori diversi, che vanno decisi separatamente perché hanno rischi e
prezzi diversi:

| | che cos'è | pezzi | dove va a finire |
|---|---|---:|---|
| **A. Ritratti** | un disegno per Insector, di profilo | 34 | scheda, collezione, fine partita |
| **B. Animazioni** | attacco, colpito, vittoria, sconfitta | 136 fogli | schermata di risultato |
| **C. Arena** | fondale del campo + i 5 luoghi del Mondo | 6 | campo di battaglia, schermata Mondo |

**Il vincolo che decide tutto:** le pedine sul campo si vedono **dall'alto**,
i disegni che sappiamo produrre sono **di profilo**. Quindi A e B non
sostituiscono gli sprite del campo — vanno sulle schermate. Il campo resta
disegnato da `art()`, e C gli mette sotto un fondale.

**Quello che propongo: C prima, poi A, e B solo se C e A hanno convinto.**
L'arena è sei immagini, non ha il problema della vista, si vede in ogni
partita, e se viene male si torna indietro cancellando un file.

---

## 1. Che cosa Higgsfield ha, che Gemini non ha

Tre strumenti cambiano il lavoro rispetto al piano fatto per l'API di Gemini
(`sprite-da-migliorare/gemini/`):

**`autosprite` — AutoSprite Animation.** Prende *un'immagine di personaggio* e
restituisce *un foglio sprite pronto per il gioco*, con lo sfondo già tolto.
Parametri che contano: `kind` (`idle`, `walk`, `run`, `attack`, `jump`, o
`custom` con un prompt), `frame_count` 2–64, `frame_size` 32–512 px,
`remove_bg` (`default` / `ultra`), `is_humanoid` — che per noi va messo
**false**, e `video_tier` (`turbo` / `pro` / `max`).

Risolve da solo due problemi che sull'API di Gemini restavano a carico nostro:
il ritaglio dei fotogrammi e il canale alfa.

**`recraft_v4_1` con `model_type: "vector"`.** Disegno vettoriale, con due
parametri che il nostro gioco aspettava: `colors`, una tavolozza di massimo 10
colori esadecimali, e `background_color`, uno sfondo piatto dichiarato. Per un
gioco fatto di colore piatto e forme nette è un accoppiamento migliore di un
modello fotorealistico.

**`recraft_v4_styles` con `style_match: "precise"`.** Si salva uno stile una
volta e poi *ogni* generazione lo usa. È la risposta vera alla domanda sulla
coerenza — meglio dell'immagine di riferimento e molto meglio del `seed`, che
nella chat di Gemini non esiste e sull'API non è garantito.

Per i fondali c'è anche **`soul_location`**, che fa ambienti e sa stare in
21:9.

---

## 2. Il lavoro C: l'arena

Sei immagini, le uniche che entrano nel gioco vero e proprio.

| pezzo | formato | a che serve |
|---|---|---|
| fondale del campo | 5:7, ~920×1288 | sotto la griglia, al posto del gradiente radiale |
| Frutteto | 16:9 | schermata Mondo |
| Cava | 16:9 | " |
| Fornace | 16:9 | " |
| Pantano | 16:9 | " |
| Radura reale | 16:9 | " |

**Il fondale ha un vincolo severo**: sopra ci stanno 35 caselle e fino a dieci
pedine, e la leggibilità del campo viene prima di qualunque bellezza. Quindi:
niente soggetti riconoscibili, niente linee forti, niente contrasto alto —
una superficie, non una scena. Buio ai bordi e un filo più chiaro al centro,
come fa oggi il gradiente. Se dopo averlo messo si fatica a vedere dove può
muoversi una pedina, il fondale ha fallito, per bello che sia.

I cinque luoghi non hanno quel vincolo: sono illustrazioni che si guardano, e
oggi al loro posto c'è lo sprite di una famiglia preso in prestito. È il punto
in cui la grafica generata si vede di più che manca.

**Peso ammesso: 250 KB in tutto**, da verificare con la batteria. Oltre, il
fondale va in WebP e i luoghi scendono di risoluzione.

---

## 3. Il lavoro A: i 34 ritratti

Un disegno per Insector, di profilo, sulla falsariga del ritratto di Falcetta
che è già stato prodotto. Vanno nella scheda, nella collezione e nella
schermata di fine partita, dove oggi c'è lo sprite da 64 px.

I prompt **ci sono già**: 13 file in `sprite-da-migliorare/prompt-famiglie/`,
generati da `art()`, con la scaletta dei gradi che il codice disegna davvero.
Si chiede una famiglia per volta, in una striscia sola — 13 generazioni, non
34 — e si ritaglia.

Peso: 34 ritratti a 128 px stanno in ~330 KB.

---

## 4. Il lavoro B: le 136 animazioni

Quattro stati per Insector: attacco (6 fotogrammi), colpito (4), vittoria (6),
sconfitta (6). I prompt stanno in `sprite-da-migliorare/gemini/animazioni.txt`.

Due strade, e vanno confrontate sul campo prima di sceglierne una:

| | come | cosa torna |
|---|---|---|
| **AutoSprite** | il ritratto + `kind` | foglio sprite, alfa già fatta, fotogrammi regolari |
| **prompt a mano** | una striscia per stato | un'immagine da ritagliare, sfondo da togliere |

AutoSprite è nato per questo e toglie due passaggi manuali. Il prompt a mano
dà più controllo sulla recitazione — l'anticipo prima del colpo, il peso nel
recupero — che è quello che separa un'animazione viva da sei pose messe in
fila. **Il pilota deve provarle tutte e due sullo stesso Insector**, perché su
136 fogli la differenza si moltiplica.

Peso: 136 fogli a 2K stanno fra i 3 e i 7 MB. **È il lavoro che può far
smettere al gioco di essere un file solo che funziona offline**, ed è il
motivo per cui va per ultimo e con un budget dichiarato prima.

---

## 5. Quanto costa: quello che si sa e quello che non si sa

**Quello che si sa.** Il piano Plus costa €49 al mese per 1.000 crediti.
Higgsfield dichiara «~4800 immagini» oppure «600 generazioni Nano Banana Pro»
con quei 1.000 crediti: fra 0,2 e 1,7 crediti a immagine secondo il modello,
cioè fra **1 e 8 centesimi** a generazione.

**Quello che non si sa, ed è il punto.** Il connettore **non pubblica un
prezzo per modello**, e AutoSprite sotto il cofano è una generazione video,
quindi quasi certamente costa più di un'immagine. Nessuno dei numeri qui
sopra vale per AutoSprite finché non se ne lancia uno e si guarda il saldo
prima e dopo.

**Saldo di oggi: 1,25 crediti, piano gratuito.** Non bastano per il pilota.

Stima con la forchetta nota, da correggere dopo il pilota:

| lavoro | generazioni | a 0,2 cr. | a 1,7 cr. |
|---|---:|---:|---:|
| C. arena | 6 (+ rifacimenti) | ~12 cr. | ~100 cr. |
| A. ritratti | 13 strisce | ~3 cr. | ~22 cr. |
| B. animazioni | 136 | ~27 cr. | ~230 cr. |

Anche nell'ipotesi cara, A e C insieme stanno dentro un mese di Plus. B da
solo può valerne un quarto o quasi un terzo.

---

## 6. Il pilota, che misura le cose che si rompono

Sei generazioni, in quest'ordine. Serve un saldo di crediti e il ritratto di
Falcetta caricato come riferimento.

1. **Lo stile, salvato.** Si carica il ritratto di Falcetta e si crea uno
   stile Recraft. Da qui in poi ogni generazione lo usa con
   `style_match: "precise"`. *Si misura: il costo in crediti della prima
   generazione, saldo prima e dopo.*
2. **Una famiglia lontana.** I Bombardidi — un cannone sulla schiena è quanto
   di più distante dalla mantide. *Si misura: i quattro membri si leggono come
   parenti, e la scaletta dei gradi si vede senza leggere i nomi.*
3. **Una seconda famiglia lontana.** I Tenaglidi. *Si misura: lo stile tiene
   fra due generazioni separate, con gli strumenti in
   `prove-automatiche/misure/`, gli stessi che hanno misurato le nove coppie
   identiche.*
4. **Il fondale del campo.** *Si misura: con il fondale sotto, le caselle blu
   del movimento e quelle rosse dell'attacco restano distinguibili. Questa è
   una misura, non un'opinione: si confronta il contrasto fra casella e
   fondale prima e dopo.*
5. **Un luogo del Mondo**, il Frutteto. *Si misura: peso in KB e resa a
   larghezza di telefono.*
6. **Un'animazione con tutte e due le strade**, attacco di Falcetta via
   AutoSprite e via prompt. *Si misura: quanti fotogrammi sono buoni al primo
   colpo, e quanto costa ciascuna strada.*

**Criterio di arresto:** se al punto 3 lo stile non tiene fra due famiglie
distanti, B non si fa. Centotrentasei fogli generati da uno stile che deriva
sono centotrentasei fogli da buttare.

---

## 7. Che cosa cambia nel gioco

Niente, finché non si decide. Le immagini arrivano in
`sprite-da-migliorare/ritorni/`, che non è nel repository, e il gioco continua
a disegnarsi da solo.

Quando si decide, l'ordine è questo:

1. **L'arena**: il fondale diventa un `background-image` su `.board`, i cinque
   luoghi entrano nella schermata Mondo. Il gradiente radiale resta come
   riserva, perché se l'immagine non carica il campo deve restare giocabile.
2. **I ritratti**: entrano nella scheda, nella collezione e in fine partita.
   Lo sprite da codice resta sul campo e come ripiego.
3. **Le animazioni**: solo nella schermata di risultato, caricate quando
   servono e non all'avvio.

**Tre regole da non violare:**

- **`art()` non si cancella.** Resta il ripiego per ogni immagine che non
  carica, e resta quello che disegna il campo. Il giorno che una decisione
  sulla grafica va storta, si torna indietro togliendo file.
- **Il budget di peso si dichiara prima**, e la batteria lo verifica: 250 KB
  per l'arena, 350 per i ritratti. Le animazioni, se si fanno, non entrano nel
  file del gioco.
- **Offline resta offline.** Qualunque immagine entri, entra anche nella cache
  del service worker, e `VERSIONE` in `sw.js` sale.

---

## 8. Collaudo

Alla batteria (816 controlli) si aggiunge una suite `grafica`:

- ogni immagine dichiarata esiste e sta sotto il suo budget di KB;
- con il fondale attivo, il contrasto fra casella normale, casella di
  movimento e casella d'attacco resta sopra la soglia di oggi;
- se il fondale non carica, il campo resta giocabile e il gradiente torna;
- i cinque luoghi hanno tutti lo stesso formato, e nessuno sborda su telefono;
- il service worker mette in cache tutte le immagini nuove, e la prova offline
  passa ancora.

Vale la regola che c'è già: una prova che fallisce non si aggira. Se fallisce
dopo una modifica, o la modifica è sbagliata o la prova descriveva un
comportamento che non vogliamo più — e allora si riscrive la prova dicendo
perché.

---

## 9. La decisione da prendere

**Non è «quale modello».** È questa: *il gioco smette di essere una cosa che
si disegna da sola?*

Oggi quella proprietà vale qualcosa di concreto: 2,7 KB per 34 Insector,
nessun file da scontornare, il colore della famiglia come parametro, e per
costruzione nessuno sfondo sbagliato. Il prezzo è che i disegni sono quelli
che sa fare il codice.

**L'arena (C) non tocca quella proprietà**: è un fondale sotto una griglia che
resta disegnata da codice, e cinque illustrazioni dove oggi non c'è niente di
proprio. È la parte del lavoro con il rapporto migliore fra quello che si vede
e quello che si rischia.

**I ritratti (A) la incrinano appena**: 34 file che stanno accanto al codice,
non al posto suo.

**Le animazioni (B) la rompono.** Centotrentasei fogli, qualche megabyte, e
una cartella di immagini da tenere allineata a un gioco che cambia. Possono
valerne la pena — ma è una decisione da prendere guardando il pilota, non
questo documento.

Il pilota costa sei generazioni e risponde a tutte e tre le domande.
