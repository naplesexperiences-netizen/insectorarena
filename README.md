# Insectron Arena

Battaglia tattica a turni 5v5 su griglia: cinque pedine, un Re da proteggere, tredici
mosse speciali. Gira nel browser, senza installare nulla e senza account.

**Si gioca qui:** <https://naplesexperiences-netizen.github.io/insectorarena/>

Demo prodotta da **Experiences Srl**.

---

## Come si gioca

- Componi una squadra di **cinque Insector** e nomina il **Re**: se cade, la partita finisce.
- Schiera le pedine nelle due file dalla tua parte del campo (5 colonne × 7 file).
- Ogni pedina, a turno, si sposta **una volta** e poi può attaccare o usare la speciale.
- Spingere un avversario **oltre il bordo** lo elimina all'istante, Re compreso.
- Quasi tutte le speciali colpiscono solo in orizzontale e verticale: **stare in diagonale
  è una difesa vera**.

Tre modalità, scelte all'ingresso: **Human vs PC** (il torneo, sei rank da E a S),
**Human vs Human** sullo stesso dispositivo (la scacchiera ruota a ogni consegna, così chi
gioca ha sempre le proprie pedine davanti) e **PC vs PC**, per guardare il computer
giocare contro se stesso.

Si gioca anche **solo da tastiera**: la scacchiera è una griglia ARIA, con le frecce per
muoversi e Invio per selezionare.

## File

| File | Cosa contiene |
|---|---|
| `gioca.html` | il gioco: un file unico, nessuna dipendenza, nessun build step |
| `index.html` | la pagina di presentazione con il pulsante per giocare |
| `img/` | le schermate e l'anteprima per la condivisione |
| `manifest.webmanifest`, `sw.js`, `icon*` | quello che rende il sito installabile e utilizzabile offline |
| `robots.txt`, `sitemap.xml` | per i motori di ricerca |

Dentro al gioco **non c'è un solo file immagine**: sprite, icone e animazioni sono
generati da codice.

## Come è pubblicato

**Hosting.** GitHub Pages, gratuito, con HTTPS automatico. Il workflow
`.github/workflows/pages.yml` pubblica la radice del repository a ogni push su `main`.
Non c'è build step: quello che sta qui è quello che viene servito.

**Installabile e offline.** `manifest.webmanifest` dichiara nome, icone e colori;
`sw.js` è il service worker che tiene in cache le due pagine, il manifest e le icone.
Dopo la prima visita il gioco funziona anche senza rete e si può aggiungere alla
schermata home come un'app.

> **Quando pubblichi una modifica, alza `VERSIONE` in `sw.js`** (`insectron-v4` →
> `insectron-v5`). È quello che fa buttare via la cache vecchia: senza, chi ha già
> aperto il sito continua a vedere la versione precedente.

**Collegare un dominio proprio.**

1. crea un file `CNAME` con dentro il dominio e nient'altro (es. `insectorarena.it`);
2. nel pannello DNS del registrar, per il dominio nudo, quattro record `A` verso
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   (indirizzi di GitHub Pages: vanno riverificati sulla documentazione GitHub al
   momento della configurazione);
3. per `www`, un record `CNAME` verso `naplesexperiences-netizen.github.io`;
4. in *Settings → Pages* inserisci il dominio, attendi il certificato e spunta
   **Enforce HTTPS**;
5. sostituisci il vecchio indirizzo in `index.html` e `gioca.html` (`canonical`,
   `og:url`, `og:image`, `twitter:image`), in `robots.txt` e in `sitemap.xml`.

**Statistiche di visita.** Non ce ne sono: il sito non traccia nessuno. In testa alle due
pagine un commento segna dove incollare lo snippet scelto. Cloudflare Web Analytics è
gratuito e senza cookie, quindi non richiede banner.

## Mondo: dove si catturano gli Insector

I primi **tre** esemplari sono in regalo: si creano dalla scheda del roster. Dal quarto in
poi si vanno a prendere, e il posto dove si prendono è il **Mondo**.

Una spedizione è fatta di tre scelte: **il luogo**, **la trappola** e **l'esca**. L'esca
esce dalla dispensa — è cibo che non darai a nessuno — e la trappola si vince conquistando
i rank, come il cibo. La trappola resta posata per **due partite di torneo**, poi si
raccoglie: o porta un esemplare, o torna vuota. In quel caso l'esca è persa ma la trappola
torna nel magazzino: perdere due cose per un tiro andato male sarebbe solo punitivo.

Prima di spendere qualsiasi cosa, la scheda dichiara **la probabilità e chi può farsi
prendere**. È lo stesso numero che decide l'esito, non una stima ottimistica.

**I cinque luoghi** — Frutteto, Cava, Fornace, Pantano, Radura reale — hanno abitanti
diversi, e l'esca giusta cambia molto le probabilità: la frutta attira chi mangia dolce,
i minerali chi scava, il Royal Fruit qualcosa che non capita spesso.

Quel che si cattura arriva come **larva selvatica**, con le statistiche della sua famiglia
più un piccolo bonus di nascita, e da lì si cresce nelle gabbie come tutti gli altri.
Non si cattura mai qualcosa oltre il rango che il torneo ha già aperto: il Mondo non è una
scorciatoia per saltare la difficoltà.

### Il seme: un mondo si passa a un'altra persona

Ogni mondo è **sei caratteri** — `K7F2QA`, per dire. Stesso seme, stesso mondo: gli stessi
luoghi con gli stessi abitanti, su qualsiasi dispositivo, senza rete e senza account. Si
copia dalla schermata Mondo e si detta a voce; chi lo scrive nel proprio gioca il tuo.

Il mondo non si salva come mappa: nel salvataggio stanno **il seme e quello che ci hai
preso**, e la mappa si ricostruisce dal seme ogni volta. È il motivo per cui un mondo
intero costa sei caratteri invece di qualche KB.

## Gabbie e allevamento

Oltre a scegliere gli Insector, si possono **allevare**. Dalla scheda di un'unità nel
roster, «Alleva un esemplare» crea una **larva** nelle gabbie (al massimo dodici): parte
con le statistiche base della sua famiglia e non può ancora combattere. I primi tre sono
in regalo; dal quarto in poi gli esemplari si **catturano** nel Mondo (sezione sopra).

Cresce mangiando. Il cibo si vince **conquistando i rank** — quattro pezzi per rank, più
un Royal Fruit dal Rank B in su — e finisce nella dispensa. Ogni pasto alza vita, forza e
difesa, e consuma parte dei **punti di vita** dell'esemplare: sono quaranta in tutto e non
si recuperano. Spesi i primi sei, la larva diventa **adulta** e può entrare in squadra;
spesi tutti e quaranta, quell'esemplare è finito com'è.

È lì che sta la scelta: concentrare la dispensa su un solo esemplare o distribuirla.
L'abbiamo misurata, 200 battaglie per scenario, al Rank S:

| | vittorie al Rank S |
|---|---|
| senza allevamento | 20% |
| tutto su un esemplare | 45% |
| diviso su due | 47% |
| sparso su cinque | 61% |

L'allevamento aiuta, non regala la vittoria: il Rank S resta una partita da giocare bene.

Ogni cibo dichiara in dispensa **cosa dà e quanto costa**, prima che tu lo usi. Alcuni
cibi danno anche **resistenze** (spinta, confusione, fuoco…): la scheda le mostra e dice
apertamente che **non contano ancora in battaglia**, perché le regole di stato non sono
implementate. Promettere un effetto che non c'è sarebbe peggio che non averlo.

## Salvataggi

I progressi (rank, round, squadra, Re, difficoltà scelta, gabbie, dispensa e mondo) stanno in `localStorage`, in
una riga di JSON da poche centinaia di byte. Sono quindi legati **a questo browser, su
questo dispositivo, e a questo indirizzo**: cambiando dominio il browser li considera di
un altro sito e non li trova più.

Per questo il pulsante **Salvataggio** in testata apre una finestra che:

- mostra un **codice** che contiene tutta la partita, da copiare o scaricare come file;
- permette di **ripristinare** da un codice incollato o da un file.

È la copia di sicurezza, il modo di passare da telefono a computer, e il ponte da
attraversare il giorno in cui il sito cambia indirizzo.

Il codice ha una marca (`INSECTRON-`) e un'impronta finale: un codice copiato a metà
viene rifiutato con un messaggio invece di essere interpretato male.

**Versione dello schema.** Ogni salvataggio porta il campo `sv`. Serve a due cose: leggere
i salvataggi vecchi quando la forma dei dati cambia, e **rifiutare** quelli scritti da una
versione futura del gioco invece di interpretarli a caso — in quel caso il gioco lo dice e
lascia il salvataggio intatto. Quando si cambia la forma dei dati si alza `SCHEMA` in
`gioca.html` e si aggiunge il gradino di migrazione dentro `migra()`.

## Feedback e numeri

Il gioco **non traccia nessuno**, e questo non è cambiato: nessun cookie, nessun
identificatore, nessuna richiesta di rete. Quello che c'è è un contatore locale di cinque
tappe — ha aperto il gioco, ha composto una squadra, ha vinto la prima battaglia, è
arrivato al Rank D, è tornato un altro giorno — più qualche conteggio di partite. Vive in
`localStorage`, nella chiave `insectron-eco`, **separata dal salvataggio della partita**.

Dopo la prima vittoria compare, una volta sola e con il suo «non adesso», l'invito a dire
com'è andata. Il pannello mostra **per intero e in chiaro** quello che verrebbe mandato,
più un campo di testo facoltativo; da lì si copia, si scarica come file o si manda per
email. **Non parte niente da solo.** I controlli automatici verificano che in un'intera
sessione di gioco il browser non faccia una sola richiesta verso l'esterno.

Due costanti in testa a `gioca.html` decidono il resto, e sono vuote di proposito:

| Costante | Se la riempi |
|---|---|
| `EMAIL_FEEDBACK` | compare il pulsante «Manda per email», che apre il client di posta già compilato |
| `TELEMETRIA_URL` | il rapporto viene spedito anche a quell'indirizzo — **sempre e solo quando è l'utente a premere**, mai da solo |

Finché restano vuote il gioco è muto verso l'esterno, e la pagina non ha bisogno di nessun
banner del consenso.

## Edizioni

`gioca.html` è l'edizione **completa**. La **demo** è lo stesso gioco senza le due sezioni
laterali — si gioca tutto il torneo, non si allevano né si catturano esemplari — e si
genera con lo script `crea-demo.sh`, che cambia una riga sola:

```sh
./crea-demo.sh                      # gioca.html → gioca-demo.html
```

Nella demo i pulsanti *Mondo* e *Gabbie* spariscono e le funzioni che aprono quelle
schermate si rifiutano, quindi non bastano gli strumenti per sviluppatori per entrarci. Il
salvataggio resta, ed è compatibile: una partita cominciata nella demo si apre nel gioco
completo.

Non c'è niente da proteggere in una demo, quindi il flag va benissimo così. Se un giorno
esisterà un'edizione **a pagamento**, quella dovrà essere un file diverso consegnato da uno
store, non un flag: le ragioni stanno nel piano di vendita, che è documentazione interna.

## Sviluppo

Nessun build step e nessuna dipendenza: si apre `gioca.html` nel browser e si lavora.
Per provare service worker e modalità offline serve un server locale
(`python3 -m http.server`), perché da `file://` il service worker non si registra.

La CI controlla HTMLHint, i collegamenti interni, e che il manifest sia valido con tutte
le icone dichiarate esistenti.

## Licenze e diritti

La grafica è **interamente originale e generata da codice**: nessuno sprite, artwork o
screenshot altrui è stato usato.

*Rogue Galaxy* è © Sony Interactive Entertainment / Level-5. Questo è un esercizio
tecnico **non affiliato, non autorizzato e non commerciale**, ispirato alle regole del
minigioco Insectron.
