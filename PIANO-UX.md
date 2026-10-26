# Migliorare la grafica e la UX — piano di lavoro

Quattro fronti: **interfaccia, insetti, arena, Mondo**. Il piano completo, con i token,
le anteprime "oggi / proposta" e i motivi di ogni scelta, sta nel design system del
gioco (artifact *Insectron Arena* su claude.ai). Qui c'è la versione che serve a chi
lavora sul codice: che cosa fa ogni fase, dove tocca, come si collauda.

Valgono le tre regole di `PIANO-GRAFICA.md`: **`art()` non si cancella**, **offline resta
offline** (ogni risorsa nuova entra nella cache e `VERSIONE` in `sw.js` sale), e **la
leggibilità del campo viene prima della bellezza**.

| Fase | Che cosa | Giorni | Stato |
|---|---|---:|---|
| 1. Fondamenta | scala tipografica, superfici, un primario per schermata, icone, statistiche a barre, pressione e dissolvenza | 2–3 | **fatta** (26 ottobre) |
| 2. Arena e insetti | bordo-precipizio, metà campo tinte, terreno per rank, mirino e anteprima della speciale, contorno degli sprite, anelli di squadra con due forme, numeri di danno leggibili, badge di stato | 3–4 | **fatta** (26 ottobre) |
| 3. Mondo | mappa SVG dei cinque luoghi con nebbia e trappole posate, scheda del luogo con sagome e arco della probabilità, rivelazione della cattura | 3–4 | da fare |
| 4. Illustrazioni generate | fondale, luoghi, ritratti: è `PIANO-GRAFICA.md` | dopo il pilota | da fare |

---

## Fase 1 — com'è stata fatta

**Sette gradini di testo.** In `:root`: `--fs-display` 1.75rem, `--fs-h1` 1.3, `--fs-h2`
1.1, `--fs-body` .9, `--fs-small` .78, `--fs-caption` .72, `--fs-micro` .68. Tutte le 132
`font-size` del gioco (33 valori diversi, da .56 a 1.8rem) passano da lì, ognuna sul
gradino più vicino. I valori grandi sono stati assegnati a mano: il risultato di fine
partita e la probabilità di cattura sono `display`, le finestre `h1`/`h2`, i titoli dei
riquadri `h2`. **`micro` è il pavimento**: le sei scritte che stavano sotto (fino a
.56rem, la ricarica sulle pedine) salgono lì, e la targhetta della ricarica passa da 15
a 16 px per contenerle.

**Superfici.** `--surface-raised` e `--shadow-raised`: la scheda scelta nel roster e il Re
nel riepilogo salgono di un piano invece di cambiare solo il bordo.

**Un primario per schermata.** I quattro «Torna» (gabbie, collezione, accoppiamento,
Mondo) diventano `button.ghost`. Due casi li ha trovati la prova nuova, non l'occhio: in
campo la mossa speciale era gialla e piena accanto a «Fine turno», e nella scelta della
partita «Gioca la sfida» accanto a «Entra in arena». Tutte e due passano a
`button.accento`: contorno e testo gialli, fondo neutro.

**Statistiche a barre.** Nel roster `R1 · 150hp · 15str · 8def` diventa un chip del rank
più tre barre (vita, forza, difesa) col numero accanto. Il metro è il migliore del rank,
**Folgore escluso**: è R1 sulla carta ma ha il doppio di tutti, e con lui come metro ogni
R1 sembrava a mezza barra. Per lo screen reader i numeri restano, in un `.sr`. Sul
telefono le schede sono righe da 44 px due per fila: lì le barre spariscono e restano
icone e numeri su una riga.

**Dodici icone** in `ICONE` / `ico()`, accanto ad `art()`: vita, forza, difesa, scudo,
trappola, esca, moneta, rank, uovo, larva, clessidra, fulmine. 16×16, `currentColor`,
`aria-hidden`. Classe `.ic`, perché `.ico` era già delle icone della scelta della
partita. Oggi sono usate nel roster, nella testata (rank) e nel Mondo (trappole, esche,
attesa); dalla Fase 2 clessidra e scudo fanno anche da distintivi di stato sulle pedine.
Fulmine, uovo e moneta aspettano l'allevamento e il Mondo.

**Pressione e dissolvenza.** `scale(.97)` sotto il dito, caselle del campo escluse; le
schermate entrano con una dissolvenza di 160 ms. **Solo opacità**, non lo scorrimento di
8 px del piano: un `transform` sulla schermata, anche per un attimo, sposta finestre e
nuvolette ancorate dentro e fa misurare male chi le posiziona. Tutto spento da
`prefers-reduced-motion`.

**Collaudo:** suite `interfaccia`, 74 controlli. Gira ogni schermata (scelta della
partita, roster, riepilogo, schieramento, battaglia con e senza pedina scelta, Mondo,
gabbie, collezione) su schermo largo e su telefono, e verifica: nessuna `font-size`
scritta a mano nel sorgente, nessuna scritta visibile sotto il pavimento, al massimo un
primario a video, dodici icone dentro la loro casella, barre fra 0 e 100%, niente che esca
dalle schede, testo dei pulsanti del Mondo invariato, e che pressione e dissolvenza ci
siano e col movimento ridotto no. Le 816 prove di prima passano tutte.

---

## Fase 2 — com'è stata fatta

**Il bordo è un precipizio.** Intorno a `.board` una cornice scura incassata (`--void`
#05070b, 9 px, più un filo chiaro e un'ombra sotto): il campo sembra un tavolo sospeso.
Spinta fuori, la pedina **scivola di una casella oltre il bordo e lì cade**: rimpicciolisce
e si spegne, con uno sbuffo di polvere (un'onda tratteggiata grigia). Prima volava via di
quasi due caselle girando come una trottola.

Due difetti trovati strada facendo, e corretti: la direzione di uscita si calcolava sulla
casella di gioco e non su quella a schermo, quindi **a scacchiera girata** (due giocatori)
la pedina usciva dalla parte opposta; e spinta fuori da un lato usciva **in diagonale**,
perché la direzione verticale di riserva si applicava sempre.

**Metà campo tinte.** Le due file di casa prendono `--ally-deep` #172536 e `--foe-deep`
#2a1a22; le linee salgono dal 32 al 45%. Le tinte del design system (#1a2a3e, #2f1c25)
erano al limite: con queste, movimento e attacco contrastano con la tinta **più** che con
la casella neutra di prima (movimento 1,42 e 1,51 contro 1,34; attacco 1,24 e 1,32 contro
1,16). La prova lo ricalcola.

**Terreno per rank.** Quattro motivi SVG scritti nel CSS come `data:`, sopra il gradiente
di sempre: terra (E, D), corteccia (C, B), pietra (A), pietra con pagliuzze d'oro (S).
Fuori dal torneo è terra. Senza motivo resta il gradiente.

**Mirino e area della speciale.** Le caselle d'attacco hanno quattro angoli a mirino
(`.cell.tg::before`). La novità vera è l'**area**: `specArea()` dà le caselle che la
speciale tocca, vuote comprese (linea, croce, anello di 8, quadrato da 5 per l'Ira del
Tonante), e `mostraArea()` le accende tratteggiate nel colore della famiglia passando sul
pulsante, col mouse o col Tab, senza ridisegnare. Resta accesa mentre la speciale è scelta.
È solo disegno: chi viene colpito lo decide ancora `specTargets()`, e la prova verifica su
60 schieramenti a caso che ogni bersaglio vero stia dentro l'area mostrata.

**La pedina.** L'ombra diventa la base: **anello pieno azzurro** per la tua squadra,
**tratteggiato rosso** per l'avversario. Il rank in punti in alto a sinistra (1 fino
all'R2, 2 fino all'R4, 3 oltre). Gli stati sono distintivi con icona — clessidra
(immobile), scudo (protetto), «!» (scoperto) — invece delle emoji. Il contorno scuro
attorno alla sagoma è un `drop-shadow` sul campo, **non in `art()`**: così sprite delle
schede e misure sulle sagome restano quelli di prima.

**Numeri di danno** nati in alto sulla casella, sopra la pedina, in `h2` con un contorno
scuro di 3 px. Col movimento ridotto compaiono e spariscono senza salire.

**Il colpo** aveva già l'anticipo (al 22% di `lunge` la pedina arretra): il piano lo dava
per mancante. Si è aggiunto solo l'**arresto sull'impatto**, fermo fra il 48 e il 62%.

**Un difetto vecchio in `art()`.** Rasoio, Bipenne e Trinciaferro avevano la barba destra
disegnata a x=322 in un disegno largo 64: `bx` esce da `toFixed()` ed è testo, e
`32 + bx` lo incollava («32» + «2.7»). Non si era mai visto perché fuori casella; col
contorno nuovo, sulle pedine avversarie, compariva una scheggia lontana dalla pedina. La
prova degli sprite non poteva accorgersene: rasterizza su 64 px, e quel che cade fuori non
c'è. Adesso la suite `arena` controlla le coordinate di tutti i 34 sprite, anche capovolti.

**Rimasto fuori**, di proposito: il riflesso chiaro sul dorso (andava in `art()`, e avrebbe
cambiato gli sprite delle schede), il filo di luce sugli R5–R6 (i punti di rank dicono già
il grado), i badge per la Malia (non lascia uno stato sulla pedina: la converte).

**Collaudo:** suite `arena`, 31 controlli. Le prove di prima passano tutte.

## Fase 3 — Mondo

| Lavoro | Dove |
|---|---|
| Mappa SVG con i cinque luoghi su un sentiero, nebbia sui luoghi chiusi | schermata Mondo, `HABITAT` |
| Trappole posate visibili sulla mappa, con le tacche delle partite | la stessa |
| Scheda del luogo: intestazione nella tinta del luogo, sagome di chi si può prendere, trappola ed esca come carte, arco della probabilità | `drawSpedizione` |
| Rivelazione della cattura, saltabile | `raccogli` |

**Collaudo:** la mappa sta a 360×640 senza scorrere di lato; il numero mostrato è quello
che decide l'esito; peso aggiunto sotto i 12 KB; la rivelazione si salta e col movimento
ridotto non c'è.
