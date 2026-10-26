# Falcetta, quattro strade per lo stesso insetto

*3 ottobre 2026.* Prova richiesta per capire se ha senso far disegnare gli Insector
a uno strumento esterno invece che al codice. **Nessuna modifica al gioco**: è una
misurazione, non una proposta.

Apri `confronto.html` (o guarda `confronto.png`): c'è il brief, i quattro risultati
alle misure in cui lo sprite compare davvero — 512 px ingrandito, 64, 46 e 28 — e i
numeri, presi tutti con lo stesso script.

## Come è stata fatta

Stesso brief parola per parola per i tre strumenti, con i colori veri del gioco
(verde Falcidi `#4ade80`, pannello `#232d40`), sulla mantide: le falci della
famiglia sono il dettaglio che o regge a 28 px o sparisce.

| sorgente | formato | tinte | simmetria | dettaglio a 28 px |
|---|---|---:|---:|---:|
| gioco (`art()`) | vettore da codice | 286 | 97,4% | 125 |
| Figma | vettore SVG | 81 | 99,8% | 128 |
| Higgsfield (`z_image`) | PNG 2048² | 353 | 71,5% | 71 |
| Canva (Magic Media) | JPEG | 606 | 95% | 137 |

*Tinte*: colori distinti — il brief chiedeva piatto, quindi pochi è meglio.
*Simmetria*: quanto la metà destra coincide con la sinistra ribaltata.
*Dettaglio a 28 px*: quanti passaggi di contrasto sopravvivono alla riduzione.

## Cosa è venuto fuori

- **Canva** è il più vicino al brief fra i due generatori, e l'unico output IA che
  regge a 28 px. Torna però come immagine, non come vettore.
- **Higgsfield** ha fatto l'illustrazione più bella e il brief peggiore: tre quarti
  invece che dall'alto, decentrato, zampe sottili che a 28 px si sciolgono.
  Recraft — il modello vettoriale, quello giusto — richiede un piano a pagamento.
- **Figma non genera: disegna.** `falcetta-figma.svg` è il risultato, costruito a
  mano path per path: esatto, modificabile, ricolorabile, 1,1 KB. Il costo non è in
  crediti ma in tempo, per ogni singolo insetto.

**La conclusione che riguarda il gioco.** Oggi non c'è un solo file immagine: una
funzione produce 34 Insector da 13 famiglie e 6 rank, col colore della famiglia come
parametro, 2,7 KB in tutto. Un generatore dà *una* figura; per sostituire il sistema
servirebbero 34 immagini coerenti fra loro, più le varianti per rank, più il
ribaltamento — e la coerenza fra generazioni è proprio quello che questi modelli non
garantiscono. Quindi: generatori per un pezzo singolo (una card social, un'icona,
un'illustrazione per la landing), Figma per vettori da rifinire a mano, il codice per
gli sprite di gioco.

**La prova successiva è stata fatta:** Canva su tre famiglie diverse, in
[`canva-tre-famiglie/`](canva-tre-famiglie/). In breve: lo stile tiene bene fra una
generazione e l'altra, ma lo sfondo esce diverso ogni volta e due famiglie su tre si
distinguono fra loro meno della metà delle altre. Per un pezzo singolo va benissimo;
per un roster servirebbe misurare e rigenerare a una a una.

File Figma della prova: <https://www.figma.com/design/3bGEHU1iqL88J4Et4qvL9G>
