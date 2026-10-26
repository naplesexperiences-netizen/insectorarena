# I 34 sprite, da far migliorare

*5 ottobre 2026.* Materiale pronto da dare a un generatore di immagini
(Nano Banana o altro) per rifare gli sprite tenendo la griglia, così il
risultato si ritaglia e si rimette dentro al gioco.

| file | a cosa serve |
|---|---|
| `insetti-per-il-modello.png` | **Questo si dà al modello.** 1800×1800, griglia 6×6, celle da 300 px, nessun testo: il testo dentro a un'immagine data a un generatore torna storpiato o copiato male. Il bordo colorato di ogni cella è il colore della famiglia, e dice al modello che cosa deve restare coerente. |
| `insetti-legenda.png` | **Questa è per noi.** Stessa identica griglia, con nome, famiglia, rank e colore: serve a ritagliare il ritorno e a sapere chi è chi. |
| `prova-una-famiglia.png` | I quattro Falcidi soli. Per provare la strada su quattro invece che su 34 prima di spendere. |
| `prompt.txt` | Il testo da incollare insieme all'immagine. |
| [`prompt-famiglie/`](prompt-famiglie/) | Un prompt per ciascuna delle 13 famiglie, **generato da `art()`** invece che scritto a mano, con i numeri della prova fatta sui Falcidi. |
| [`gemini/`](gemini/) | Le richieste pronte per **Nano Banana 2.1** via API: i quattro prompt di animazione, l'impaginatore che li mette nel formato giusto e lo script che le manda. |

Le tre immagini mostrano gli sprite **di oggi**, cioè dopo il rifacimento di
`art()` descritto qui sotto: a un generatore si chiede di migliorarli, non di
rifare un lavoro già fatto.

## Che cosa è cambiato, e perché

Nella prima versione di questa cartella gli sprite erano disegnati con **tre
taglie per sei rank** (`rank >= 5 ? 3 : rank >= 3 ? 2 : 1`). Conseguenza
misurata: R1 e R2 davano la stessa figura, R3 e R4 pure, R5 e R6 pure, e alla
dimensione in cui le pedine si vedono davvero — 46 px, la scheda del riepilogo —
**nove coppie erano identiche allo 0%**: Rasoio/Bipenne, Barbacane/Rivellino,
Mortaio/Colubrina, Bombarda/Basilisco, Girandola/Capovolta, Tenaglia/Morsa,
Falcetta/Falcione, Roncola/Turbine, Lusinga/Malia. Nove casi in cui due pedine
diverse, in campo, erano lo stesso disegno.

`art()` è stata rifatta a mano. Adesso la taglia non conta più il rank in
assoluto ma il **grado dentro la famiglia** (`gradoDi` → quanti gradini ha
quella famiglia e a quale sei), così una famiglia da quattro membri ha quattro
figure e non due. Ogni gradino cambia le misure del pezzo che dà il nome alla
famiglia e aggiunge un elemento nuovo, in una zona sua, perché i segni non si
coprano fra loro:

| famiglia | 2° grado | 3° grado | 4° grado |
|---|---|---|---|
| Lamidi | barbe sul filo | due lame sulle spalle | l'elsa |
| Bastidi | mandibole | barbe sul corno | piastre di coda |
| Bombardidi | la culatta | gli sfiati | le ruote dell'affusto |
| Voltidi | pattini | puntoni | le punte del forcone |
| Falcidi | dentellatura | spine del torace | l'uncino interno |

### Com'è adesso, misurato

- **0 coppie identiche** (erano 9).
- Fra un grado e il successivo cambia dal **5%** al 14,1% della sagoma, in media
  l'**8,0%** (prima: nove passi a 0, il migliore al 4,5%).
- Le due **famiglie** più somiglianti distano l'**11%**. Il passo medio fra
  fratelli resta sotto quella soglia: i gradi si leggono come gradi, non come
  generi diversi.
- Nessuno dei 34 sprite esce dalla sua casella: il margine più stretto dentro
  al `viewBox` da 64 è di 2 px. Prima cinque sprite erano tagliati dal bordo.
- Chi è solo nella sua famiglia (Bufera, Balsamina, Galoppo, Folgore) e gli
  sprite dei luoghi del Mondo che chiedono un rank inesistente sono rimasti
  **identici al byte**: nessun disegno è cambiato senza motivo.

Il tutto è sorvegliato da una batteria dedicata (`sprite`, 10 controlli) che
rifà queste misure a ogni modifica.

## Dove va ogni cella

Lettura da sinistra a destra, dall'alto in basso. Le famiglie sono blocchi
contigui, e dentro ogni famiglia i rank salgono.

| cella | Insector | famiglia | rank | colore |
|---|---|---|---:|---|
| r1c1 | Sfregio | Lamidi | 1 | `#7dd3fc` |
| r1c2 | Rasoio | Lamidi | 3 | `#7dd3fc` |
| r1c3 | Bipenne | Lamidi | 4 | `#7dd3fc` |
| r1c4 | Trinciaferro | Lamidi | 5 | `#7dd3fc` |
| r1c5 | Bastione | Bastidi | 1 | `#fbbf24` |
| r1c6 | Barbacane | Bastidi | 3 | `#fbbf24` |
| r2c1 | Rivellino | Bastidi | 4 | `#fbbf24` |
| r2c2 | Mastio | Bastidi | 5 | `#fbbf24` |
| r2c3 | Mortaio | Bombardidi | 3 | `#a78bfa` |
| r2c4 | Colubrina | Bombardidi | 4 | `#a78bfa` |
| r2c5 | Bombarda | Bombardidi | 5 | `#a78bfa` |
| r2c6 | Basilisco | Bombardidi | 6 | `#a78bfa` |
| r3c1 | Ribalta | Voltidi | 1 | `#34d399` |
| r3c2 | Girandola | Voltidi | 3 | `#34d399` |
| r3c3 | Capovolta | Voltidi | 4 | `#34d399` |
| r3c4 | Rovescio | Voltidi | 5 | `#34d399` |
| r3c5 | Tenaglia | Tenaglidi | 1 | `#fb923c` |
| r3c6 | Morsa | Tenaglidi | 2 | `#fb923c` |
| r4c1 | Ganascia | Tenaglidi | 3 | `#fb923c` |
| r4c2 | Falcetta | Falcidi | 1 | `#4ade80` |
| r4c3 | Falcione | Falcidi | 2 | `#4ade80` |
| r4c4 | Roncola | Falcidi | 3 | `#4ade80` |
| r4c5 | Turbine | Falcidi | 4 | `#4ade80` |
| r4c6 | Trivella | Trivellidi | 4 | `#f472b6` |
| r5c1 | Punteruolo | Trivellidi | 6 | `#f472b6` |
| r5c2 | Bufera | Ventalidi | 4 | `#22d3ee` |
| r5c3 | Balsamina | Coccinidi | 3 | `#f87171` |
| r5c4 | Ruzzola | Sferidi | 2 | `#c4b5a0` |
| r5c5 | Macigno | Sferidi | 3 | `#c4b5a0` |
| r5c6 | Galoppo | Corsidi | 1 | `#fcd34d` |
| r6c1 | Lusinga | Silfidi | 1 | `#e879f9` |
| r6c2 | Malia | Silfidi | 2 | `#e879f9` |
| r6c3 | Incanto | Silfidi | 3 | `#e879f9` |
| r6c4 | Folgore | Tonantidi | 1 | `#818cf8` |
| r6c5, r6c6 | *(vuote)* | | | |

## Prima di metterli nel gioco

Vale quello che è venuto fuori dalla prova su Canva del 3 ottobre
(`prove/grafica-2026-10-03/canva-tre-famiglie/`): quello che torna da un
generatore è **un'immagine**, mentre il gioco non ha un solo file immagine —
una funzione produce tutti e 34 gli sprite in 2,7 KB, col colore della famiglia
come parametro, e per costruzione non può sbagliare lo sfondo.

Quindi, se il ritorno piace, la domanda da farsi non è «li incolliamo?» ma
«questi 34 PNG valgono il peso, lo scontorno e la perdita del parametro
colore?». La risposta può benissimo essere sì — ma è una decisione, non un
passaggio automatico. La terza strada — usare il ritorno come **riferimento**
per rifare `art()` a mano, tenendo il sistema — è quella che abbiamo già
percorso una volta, ed è quella che ha separato le nove coppie.
