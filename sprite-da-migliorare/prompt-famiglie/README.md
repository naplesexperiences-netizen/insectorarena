# Un prompt per famiglia, generato dal codice

*16 ottobre 2026.* Tredici file di testo, uno per famiglia, da dare a un
generatore di immagini insieme a un riferimento di stile. **Non si scrivono a
mano:** li produce `genera.js` leggendo `gioca.html`.

```sh
node genera.js                      # rigenera tutti e 13 da ../../gioca.html
node genera.js /altro/gioca.html    # da un'altra copia
```

Ogni prompt contiene nomi, ranghi, colore della famiglia, la descrizione che il
gioco già dà di ogni Insector, e **la scaletta dei gradi** — che cosa aggiunge
il secondo grado, il terzo, il quarto. Quella scaletta non è un'opinione: è
quello che `art()` disegna davvero. Se cambia il codice, si rigenerano i
prompt e restano allineati.

## Da dove nasce

Emergent ha fatto provare a Nano Banana i quattro Falcidi e quattro animazioni
di Falcetta (attacco 6 fotogrammi, colpito 4, vittoria 6, sconfitta 6). Il
foglio di famiglia che è tornato **segue la stessa scaletta del codice**:
Falcetta liscio, Falcione con la dentellatura sulla falce, Roncola con le spine
sul torace. Sono il secondo e il terzo grado di `art()`, senza che nessuno
glieli avesse detti. Il quarto diverge: noi mettiamo l'uncino interno, il
generatore ha messo le ali.

Da lì l'idea di generare i prompt dal codice invece di riscriverli dodici volte.

## I numeri, prima di decidere

**Quanti file.** Quattro animazioni sono 22 fotogrammi per Insector.

| ambito | fotogrammi | peso a 128 px | a 96 px |
|---|---:|---:|---:|
| un ritratto per Insector | 34 | 0,3 MB | 0,2 MB |
| 4 animazioni, solo i 13 capifamiglia | 286 | 2,7 MB | 1,8 MB |
| 4 animazioni, tutti e 34 | 748 | 7,1 MB | 4,8 MB |

Misurato ritagliando una cella da un foglio di Emergent e ricomprimendola:
9,7 KB a 128 px, 6,6 KB a 96 px. Per confronto, `gioca.html` intero pesa
0,30 MB, tutto il sito pubblicato 2,0 MB, e `art()` disegna tutti e 34 in
**2,7 KB**. L'ambito completo pesa 23 volte il gioco, e il gioco smette di
essere un file solo che funziona offline.

**La vista non combacia.** Il campo di battaglia è visto **dall'alto**, pedine
simmetriche rivolte in su. Le animazioni sono **di profilo**. Non è una
questione di stile: una pedina di profilo su una scacchiera vista dall'alto non
ci si può mettere. Quella grafica va sulle schermate — scheda, collezione,
gabbie, fine partita, vetrina — non sul campo.

**Il ritocco è il costo vero.** Due invii della stessa animazione «sconfitta»,
confrontati pixel per pixel:

```
fotogramma 01-04: 0% diverso
fotogramma 05:    20,8% diverso
fotogramma 06:    18,0% diverso
```

I primi quattro sono identici al pixel: non è stata rigenerata la sequenza,
sono stati rifatti gli ultimi due. Vuol dire che qualcuno guarda ogni
fotogramma e decide. Su 748, il costo non è generare — è guardare e rifare.

**Dettaglio tecnico.** I fogli delle animazioni hanno lo sfondo trasparente, il
ritratto e il foglio di famiglia hanno il navy pieno. Per il gioco serve
l'alfa ovunque: va chiesto nel prompt e verificato al ritorno.

## Come si userebbero

Il prompt da solo non basta: va dato **insieme a un'immagine di riferimento**
dello stile (il ritratto di Falcetta a 512 px), perché è quella a tenere la
coerenza fra una famiglia e l'altra. Un generatore che accetta un `seed` va
preferito: lo stesso seed per tutta una famiglia riduce la deriva fra fratelli.

Prima di mettere qualunque cosa nel gioco, vale quello che dice il README della
cartella sopra: quello che torna è **un'immagine**, mentre oggi il gioco non ha
un solo file immagine. Se il ritorno piace, la domanda non è «li incolliamo?»
ma «questi file valgono il peso, lo scontorno e la perdita del parametro
colore?».
