# Telemetria passiva — il servizio

Un Worker Cloudflare con un database D1 dietro. Riceve un rapporto per visita dal gioco,
scrive una riga, e restituisce gli aggregati a chi ha la chiave. Non fa altro.

Questa cartella sta nel repository **privato**: il sito pubblico non la contiene.

| File | Cos'è |
|---|---|
| `worker.js` | l'endpoint: riceve, valida, scrive, aggrega, e cancella le righe vecchie |
| `schema.sql` | la tabella: diciassette colonne, nessuna che dica chi |
| `wrangler.toml` | la configurazione, con due punti da riempire |
| `prova.mjs` | 19 controlli che girano **senza Cloudflare**: `node prova.mjs` |

---

## Prima di accendere: la verifica che non è nostra

Passare da «i numeri partono se li mandi tu» a «partono da soli» cambia la posizione
giuridica, anche se i dati sono gli stessi. Quello che abbiamo costruito è la versione più
difendibile che conosciamo — niente cookie, niente identificatori, nessun IP conservato,
interruttore per spegnere, informativa scritta — ma **la conferma la deve dare un
consulente privacy**, non noi e non il codice. Le tre cose da fargli guardare:

1. la base giuridica scelta (legittimo interesse) e il fatto che non ci sia consenso;
2. i campi `primo` e `giorni`, che sono gli unici a parlare di *ritorno* e quindi gli unici
   che, in teoria, potrebbero contribuire a distinguere una visita da un'altra;
3. il rapporto con Cloudflare come responsabile del trattamento (serve il loro DPA, che è
   standard e si accetta dal pannello).

Finché la risposta non c'è, il gioco resta com'è: `TELEMETRIA_URL` vuota, zero richieste
di rete. Non è un rinvio, è l'ordine giusto.

---

## Pubblicare il servizio

Serve un account Cloudflare (gratuito) e `wrangler`, che si usa senza installarlo:

```sh
cd telemetria
npx wrangler login
npx wrangler d1 create insectron-eco --location=weur   # stampa un database_id: copialo
# --location=weur tiene il database in Europa occidentale: l'informativa lo dichiara,
# quindi non e' un dettaglio ma una riga di quel documento.
```

Metti quell'id in `wrangler.toml` al posto di `DA-RIEMPIRE-…`, poi:

```sh
npx wrangler d1 execute insectron-eco --remote --file=./schema.sql
npx wrangler secret put CHIAVE_LETTURA        # inventane una lunga, e tienila da parte
npx wrangler deploy
```

`deploy` stampa l'indirizzo, del tipo `https://insectron-eco.<tuo-nome>.workers.dev`.
Provalo **prima** di toccare il gioco:

```sh
curl -i -X POST https://insectron-eco.<tuo-nome>.workers.dev \
  -d 'INSECTRON-ECO {"gioco":"insectron","edizione":"completa","primo":"2026-09-30","giorni":1,"tappe":["apre"],"auto":1}'
# deve rispondere 204

curl "https://insectron-eco.<tuo-nome>.workers.dev/numeri?k=LA-TUA-CHIAVE"
# deve rispondere con "visite": 1
```

Se il primo comando non dà 204, non andare avanti: il gioco non se ne accorgerebbe
(`sendBeacon` non dice mai se è arrivato) e resteresti con la raccolta accesa e zero righe.

---

## Accendere la raccolta nel gioco: tre modifiche, tutte qui

Sono tre, e vanno fatte **insieme**. Il gioco è scritto perché i testi seguano la
configurazione, quindi le prime due bastano a far comparire l'interruttore e a far
cambiare da sole le frasi del pannello; la terza è l'unica cosa che resta a mano.

1. **`gioca.html`** — la costante, verso riga 1114:
   ```js
   const TELEMETRIA_URL = "https://insectron-eco.<tuo-nome>.workers.dev";
   ```
2. **`sw.js`** — alza `VERSIONE`, altrimenti chi ha già aperto il sito continua a usare la
   copia in cache, cioè quella con la raccolta spenta.
3. **`privacy.html`** — cambia il riquadro «Stato di oggi» (la raccolta non è più spenta) e
   **inserisci l'indirizzo email** al posto di `[indirizzo da inserire…]`. Senza un recapito
   l'informativa non è un'informativa. Aggiorna anche la data in alto.

Poi si rifanno le due copie e i controlli, come per ogni altra modifica:

```sh
sh batteria.sh      # 630 controlli; eco.js verifica anche lo stato acceso
node telemetria/prova.mjs
```

**Spegnere** è una modifica sola: `TELEMETRIA_URL = ""` e `VERSIONE` alzata. Da quel
momento il gioco non fa più una richiesta di rete, e il pannello torna a dire il vero da
solo.

---

## Leggere i numeri

```sh
curl -s "https://insectron-eco.<tuo-nome>.workers.dev/numeri?k=LA-TUA-CHIAVE" | python3 -m json.tool
```

Torna: `visite`, l'`imbuto` (quante hanno superato ognuna delle cinque tappe), le `medie`
(partite per visita, giorni, quante visite sono tornate un altro giorno), la ripartizione
per `rank`, le visite degli ultimi 30 giorni e gli ultimi 50 commenti liberi.

**La riga che conta** è `medie.tornati` diviso `visite`: è la risposta alla domanda su cui
è ordinata tutta la roadmap — la gente torna il giorno dopo? Tutto il resto serve a capire
*perché* no.

Nessuna riga singola esce dall'endpoint: solo conteggi e i commenti che qualcuno ha scelto
di scrivere.

---

## Quanto costa

Zero, al piano gratuito, ai volumi di cui parliamo: **una riga per visita**. Con mille
visite al mese sono mille richieste e mille scritture — due o tre ordini di grandezza sotto
le soglie del piano gratuito di Workers e D1. I numeri esatti cambiano nel tempo: prima di
accendere, controllali sulla pagina dei prezzi di Cloudflare invece di fidarti di questa
riga.

Quello che costa davvero non sono i soldi: è **un servizio in più da tenere in piedi**, il
primo del progetto. Se un giorno non serve più, si spegne con la riga di sopra e si
cancella il Worker.

---

## Le scelte, e perché

- **L'IP non si legge mai.** Cloudflare lo mette in `CF-Connecting-IP` su ogni richiesta;
  il Worker non lo tocca, non lo scrive, non lo passa. Per lo stesso motivo
  `[observability] enabled = false` in `wrangler.toml`: con i log accesi le richieste
  — e quindi gli IP — verrebbero conservate da Cloudflare, e l'informativa direbbe una cosa
  falsa. Se un giorno servisse per capire un errore: si accende, si guarda, si rispegne,
  sapendo che in quella finestra la promessa non vale.
- **Si scrivono solo le colonne dichiarate.** Un campo sconosciuto nel corpo viene buttato
  via, non messo da parte «che poi vediamo». Così un difetto futuro nel gioco non può far
  arrivare qui qualcosa che non abbiamo promesso di raccogliere — e il controllo che lo
  verifica prova proprio a mandare un nome, una email e un IP.
- **L'ora si arrotonda alla mezz'ora.** Un orario al secondo, su pochi giocatori, è di
  fatto un modo per riconoscere una visita.
- **Il commento libero non entra mai in un rapporto automatico.** Lo scrive una persona:
  resta un gesto, non un campo.
- **`ORIGINE` non è `*`.** Senza, chiunque potrebbe riempire il database di righe finte e
  i numeri non direbbero più niente. Non è una difesa forte — un `curl` la aggira — ma
  toglie di mezzo il caso accidentale, e alzare una difesa vera avrebbe voluto dire un
  identificatore, cioè esattamente quello che non vogliamo.
- **Dodici mesi e poi si cancellano**, da sole, ogni notte alle 4:07 UTC.
