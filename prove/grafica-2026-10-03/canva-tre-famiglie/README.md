# Canva su tre famiglie: un roster regge?

*3 ottobre 2026.* Seguito diretto della prova qui sopra. Lì la domanda era «chi
disegna meglio un insetto»; qui è quella che conta davvero: **dodici volte di fila,
coerenti fra loro e distinguibili l'una dall'altra.**

Apri `confronto.html` (o `confronto.png`).

## Come è stata fatta

Tre generazioni separate su Canva, **prompt identico**, cambiano solo tre cose:
la specie, il colore e il segno della famiglia.

| famiglia | colore | segno |
|---|---|---|
| Lamidi | `#7dd3fc` azzurro | corno a lama |
| Bastidi | `#fbbf24` giallo | corna a tenaglia |
| Tenaglidi | `#fb923c` arancio | mandibole aperte |

Metro di paragone: gli stessi tre Insector come li disegna `art()` adesso, che per
costruzione sono coerenti.

## 1. Coerenza — i tre si somigliano come stile?

Qui serve che i numeri siano **vicini**. Scarto fra il più alto e il più basso dei tre:

| | Canva | gioco |
|---|---:|---:|
| sfondo | **tre diversi** | uno solo |
| inchiostro | 3,7 | 7,2 |
| simmetria | 1,4 | 0,6 |
| larghezza del soggetto | 10,6 | 9,4 |
| centratura (x, y) | 0,2 · 1,5 | 0,0 · 5,3 |

**Lo stile tiene, e tiene bene.** Su simmetria, inchiostro e centratura Canva sta
dentro margini stretti — su due di queste tre misure meglio del gioco. Il timore che
ogni generazione esca con un'aria diversa, qui, non si è verificato.

**Lo sfondo no.** `#020a31`, `#021444`, `#021442`: tre blu diversi, e nessuno dei tre
è il `#232d40` chiesto. Per uno sprite che va su un pannello significa tre ritagli a
mano, uno per immagine — o uno scontorno, che su zampe sottili lascia bordi sporchi.

## 2. Distinguibilità — si riconoscono fra loro a 28 px?

Qui serve il contrario: numeri **alti** e soprattutto **tutti simili fra loro**.

| coppia | Canva | Canva in grigio | gioco | gioco in grigio |
|---|---:|---:|---:|---:|
| Lamidi / Bastidi | 16,5% | 9,1% | 8,5% | 4,8% |
| Lamidi / Tenaglidi | 16,8% | 9,0% | 8,7% | 4,9% |
| **Bastidi / Tenaglidi** | **7,4%** | 7,8% | 6,0% | 6,2% |
| coppia più debole, sulla più forte | **44%** | | **69%** | |

**Qui sta il problema, ed è serio.** Bastidi e Tenaglidi — due scarabei cornuti — si
distinguono fra loro il 44% di quanto si distinguono le altre coppie. Nel gioco quel
rapporto è il 69%: tutte le coppie si riconoscono più o meno uguale.

Con tredici famiglie le coppie da controllare diventano **78**, e non c'è modo di
accorgersi di una coppia debole se non misurandola a una a una, dopo averla generata.

## Conclusione

Per un **pezzo singolo** — una card social, un'icona, un'illustrazione per la landing
— Canva è pronto all'uso, e il risultato è buono.

Per il **roster** servirebbe: generare, misurare, scartare e rigenerare ogni famiglia
che esce troppo vicina a una già fatta; più lo scontorno di dodici immagini; e poi lo
stesso problema si ripresenta uguale per i cinque rank di ciascuna. La funzione che
c'è adesso fa tutto questo in 2,7 KB e per costruzione non può sbagliare lo sfondo.
