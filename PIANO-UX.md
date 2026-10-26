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
| 2. Arena e insetti | bordo-precipizio, metà campo tinte, terreno per rank, mirino e anteprima della speciale, contorno degli sprite, anelli di squadra con due forme, numeri di danno leggibili, badge di stato | 3–4 | da fare |
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
attesa); scudo, fulmine, uovo e moneta aspettano i badge di stato della Fase 2 e
l'allevamento.

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

## Fase 2 — Arena e insetti

| Lavoro | Dove |
|---|---|
| Cornice-precipizio intorno al campo, caduta nel vuoto | `.board`, `@keyframes ringout` |
| Metà campo tinte (`ally-deep` #1a2a3e, `foe-deep` #2f1c25: più sature si confondevano con le caselle di movimento) | `.cell.home`, `.cell.away` |
| Terreno SVG a contrasto bassissimo, diverso per rank | sfondo di `.board` |
| Mirino a quattro angoli sulle caselle d'attacco, anteprima della portata della speciale | `.cell.tg`, gestione della speciale |
| Contorno scuro e riflesso negli sprite | `art()` |
| Anello di squadra: pieno per l'alleato, tratteggiato per il nemico | `.tok` |
| Segni di rank sull'anello, badge di stato con le icone | `.tok` |
| Numeri di danno sopra la pedina, contornati | lo strato `layer`, `@keyframes pop` |
| Anticipo e arresto sull'impatto | `@keyframes lunge`, `hurt` |

**Collaudo:** contrasto casella / movimento / attacco con tinte e terreno almeno quello di
oggi; alleato e nemico distinguibili in scala di grigi; le misure di `misure/` sulle
sagome passano ancora.

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
