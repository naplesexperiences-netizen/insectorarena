# Insectron Arena — documentazione tecnica

Prototipo giocabile di battaglia a turni 5v5 su griglia, costruito a partire dalla
documentazione del minigioco **Insectron** di *Rogue Galaxy* (PS2, Level-5 / Sony).

> Questo è il documento di lavoro: com'è fatto il gioco, da dove vengono i dati,
> che cosa è stato misurato e perché ogni scelta è quella che è. Il `README.md`
> accanto è invece la presentazione pubblica, molto più corta.
>
> *Dal 26 ottobre 2026 tutto il materiale di lavoro sta qui, nel repository del
> gioco. Prima era sparso anche nell'hub delle demo; l'hub adesso tiene solo la
> copia giocabile e un rimando.*

**I file**

| | |
|---|---|
| `gioca.html` | il gioco: autonomo, nessuna dipendenza, nessun build step |
| `index.html`, `privacy.html` | la vetrina e l'informativa |
| `sw.js`, `manifest.webmanifest`, `icon*` | quello che lo rende installabile e offline |
| `img/` | le schermate della vetrina (le uniche immagini del progetto: dentro al gioco non c'è un solo file immagine) |
| `insectors.json` | dataset grezzo estratto dal wiki |
| `ROADMAP.md`, `PIANO-*.md` | dove siamo, e i piani per quello che manca |
| `prove-automatiche/` | le 31 suite, 816 controlli |
| `sprite-da-migliorare/` | il materiale per far ridisegnare gli Insector |
| `telemetria/` | worker, schema e prova. Spenta |
| `prove/` | i confronti fra strumenti grafici |

**Online**: a ogni push su `main`, GitHub Pages pubblica
`https://naplesexperiences-netizen.github.io/insectorarena/`.

---

## Dove vive questo gioco

Il gioco ha un **sito proprio**, in un repository pubblico dedicato:

- sito: <https://naplesexperiences-netizen.github.io/insectorarena/>
- codice: <https://github.com/naplesexperiences-netizen/insectorarena>

Quel repository è pubblico, quindi contiene **solo quello che serve a chi gioca e a chi
mantiene il sito**: il gioco, la landing, le immagini, il necessario per l'installazione
offline, e un README breve (come si gioca, come si pubblica, come si collega un dominio,
licenze). Tutto il resto — ricostruzione delle regole dalle fonti, discrepanze fra le
fonti, misure sull'IA, curva di difficoltà, elenco delle verifiche, e il dataset grezzo
`insectors.json` — **resta qui**, in questo repository privato: è il documento che stai
leggendo.

Esistono quindi due copie del gioco: questa, dentro l'hub delle demo, e quella del sito.
Quando si modifica il gioco vanno riallineate, oppure questa va fatta puntare al sito.
Le due copie differiscono **solo** nella testa della pagina: il sito ha `canonical`,
icone, manifest e registrazione del service worker; questa ha i meta `demo:tags` e
`demo:category` che servono al generatore dell'hub. Il gioco è identico.

I **salvataggi** (codice di esportazione, ripristino, versione dello schema) sono
descritti nel README del repository pubblico, che è la guida di chi mantiene il sito.

**Piani di lavoro** (documenti di decisione, non implementazione):

| Documento | Cosa propone | Stato |
|---|---|---|
| `PIANO-MULTIPLAYER.md` | partita online fra due dispositivi, con relay | da decidere |
| `PIANO-ALLEVAMENTO.md` | cibo, crescita e riproduzione | **fatto per intero** |
| `PIANO-MONDO.md` | mondo esportabile, cattura con trappole ed esche | **forma C fatta**; la mappa a caselle no |
| `PIANO-VENDITE.md` | edizioni, pubblicità, store interno | da decidere |
| `PIANO-GRAFICA.md` | disegnare Insector e arena su Higgsfield, invece che da codice | da decidere |
| `ROADMAP.md` | i prossimi passi in ordine di priorità | riordinata sulla rigiocabilità; la demo è fatta ma in attesa |

## Fonti

1. **Rogue Galaxy Wiki** (Fandom, CC BY-SA): pagina `Insector` + 35 schede unità →
   statistiche, famiglie, rank, torneo, avversari.
2. **In-Depth FAQ/Walkthrough di Paul Michael "VHAYSTE"** (GameFAQs) → i **diagrammi
   ASCII di ogni mossa speciale e di ogni range di movimento**, che il wiki non ha.
   È da qui che arrivano le regole di targeting precise.

Da qui vengono **i dati**, non i nomi: la nomenclatura dell'originale è stata sostituita
per intero (vedi «I 118 nomi»). In questo documento si usano i nomi nostri; quelli vecchi
restano solo in `insectors.json`, che è il dataset grezzo, e nella tabella di conversione.

## Cosa c'è di autentico (dal wiki)

Estratto dalla pagina `Insector` della Rogue Galaxy Wiki e dalle 35 schede unità collegate:

| Elemento | Dettaglio |
|---|---|
| **34 Insector** | nome, famiglia, rank (1-6), HP/Str/Def minimi, descrizione |
| **13 famiglie** | ognuna con la propria mossa speciale e il testo descrittivo originale |
| **Range di movimento** | `3×3` (1 casella), `7×7` (volo, 3 caselle), `3 diagonali`, `2 dritto avanti` |
| **Regola del Re** | squadra da 5, uno è il Re; se cade hai perso; il Re si muove di 1 casella anche se la famiglia ne concede di più |
| **Torneo** | 6 rank (E→S), 5 round ciascuno, quote d'iscrizione (400z → 6000z), nomi dei 30 avversari, premi |
| **Ring-out** | Proiezione, Colpo d’ali, Doppio calcio e Cornata d’urto possono buttare un Insector fuori dal campo |

Le mosse speciali sono implementate seguendo la descrizione del wiki, non solo citate:

- **Stoccata alta** — danno singolo maggiorato
- **Cornata d’urto** — spinta di 1 casella + reazione a catena su chi sta dietro
- **Cannonata** — attacco in linea retta fino a 3 caselle
- **Ribaltone** — ribaltamento, bersaglio immobilizzato 2 turni
- **Proiezione** — lancio alle spalle del lanciatore, danno extra se la casella è occupata, ring-out se è fuori campo
- **Danza delle falci** — colpisce tutte le 8 caselle adiacenti
- **Carica a trivella** — carica in linea retta, l'attaccante resta scoperto (+30% danni subiti)
- **Danza balsamica** — cura gli alleati adiacenti e rimuove l'immobilizzo
- **Sfera scudo** — blocca completamente i 2 attacchi successivi
- **Doppio calcio** — colpisce davanti e dietro con spinta
- **Raggio di malia** — converte un avversario, al costo di metà stamina
- **Colpo d’ali** — spinge via di 2 caselle tutti gli adiacenti
- **Ira del Tonante** — colpisce tutti i nemici entro 2 caselle + stordimento

## Regole di targeting (dai diagrammi della FAQ)

Il wiki descriveva le mosse a parole; la FAQ le disegna casella per casella. La
differenza è sostanziale: **quasi tutte le speciali colpiscono solo le 4 caselle
ortogonali**, non le 8 attorno. Posizionarsi in diagonale è quindi una difesa reale.

| Mossa | Area effettiva |
|---|---|
| Stoccata alta, Cornata d’urto, Ribaltone, Proiezione, Raggio di malia, Danza balsamica | 4 caselle ortogonali |
| Danza delle falci | tutte e 8 le caselle attorno (unica eccezione) |
| Cannonata, Colpo d’ali | croce ortogonale fino a 2 caselle; qualsiasi Insector in mezzo, **amico o nemico**, blocca |
| Carica a trivella | solo dritto in avanti, fino a 2 caselle, l'attaccante si sposta in posizione |
| Doppio calcio | solo la casella davanti e quella dietro |
| Ira del Tonante | bersaglio singolo entro 2 caselle in ogni direzione |
| Attacco normale | tutte e 8 le caselle attorno |

Altre correzioni che la FAQ ha imposto:

- **Proiezione non fa danno diretto.** Il danno viene solo da dove atterra il
  bersaglio: se finisce addosso a qualcuno, **rimbalza a catena** ferendo entrambi,
  e continua finché non trova una casella libera o esce dal campo.
- **Ribaltone** non immobilizza soltanto: chi è ribaltato è anche **vulnerabile**
  (+30% danni subiti) per i 2 turni.
- **La Danza balsamica non cura la Coccinide che la esegue.**
- **Movimento dei Corsidi**: 1 casella in qualsiasi direzione, oppure 2 in linea
  retta in una delle 8 direzioni. Il wiki diceva solo "2 caselle dritto in avanti".
- **Folgore**: la furia fulminea è a bersaglio singolo con **cariche infinite**
  (nessuna ricarica), e il suo **attacco normale** atterra l'avversario e lo sbalza di
  una casella, con rimbalzo a catena ed eventuale uscita dal campo. È questo che lo
  rende il Re migliore, come dice il wiki.

## Il percorso prima della partita

Quattro passaggi, ognuno con le informazioni che servono a decidere:

1. **Chi gioca.** È la prima schermata: si sceglie fra Human vs PC, Human vs Human e
   PC vs PC, e con un computer in campo il suo livello (vedi «Chi gioca: le tre
   modalita'»). Dal roster si torna a cambiarla quando si vuole.
2. **Roster.** Elenca **solo gli Insector che hai**, non quelli ancora chiusi: una riga
   sotto dice quanti ne restano e che si aprono vincendo i rank. Toccandone uno si apre
   un **pop-up** con ruolo in campo, vita/forza/difesa, danno d'attacco, movimento,
   mossa speciale e relativo danno, e lì dentro stanno i pulsanti per metterlo in
   squadra o toglierlo: un tocco non impegna a nulla, e appena hai deciso il pop-up si
   chiude e torni alla lista. In alto una fascia ricorda chi gioca, con il pulsante per
   cambiare.
3. **Riepilogo squadra.** Le cinque pedine affiancate in schede **di soli numeri** —
   vita, forza, difesa, danno d'attacco, danno della speciale, movimento — perché qui si
   confronta, non si legge; la descrizione per esteso sta dietro al tondo «i» in alto a
   destra di ogni scheda, che riapre lo stesso pop-up del roster. È qui che si
   **nomina il Re**: finché non lo scegli non si entra in arena.
4. **Schieramento.** Le pedine si posizionano sulle due file di casa — tranne in
   PC vs PC, dove le mette in fila il gioco.

In Human vs Human i passaggi 2 e 3 li rifa' anche il secondo giocatore, con una
schermata di consegna in mezzo.

In battaglia, selezionando una pedina il pannello mostra **danno d'attacco, danno della
speciale e movimento residuo**. Quando c'è un bersaglio a tiro i due danni sono quelli
reali contro quel bersaglio (difesa inclusa); altrimenti sono valori indicativi contro un
avversario senza difesa, utili per confrontare le unità fra loro.

## Tutto in una schermata

Le due schermate che precedono la partita si leggevano scorrendo. Misurato, in pixel di
scorrimento necessari per vedere tutto quello che c'è:

| schermo | schermata | prima | dopo |
|---|---|---:|---:|
| 1280×900 | squadra, scheda aperta | 417 | **0** |
| 1280×900 | squadra piena | 302 | **0** |
| 1366×768 | squadra, scheda aperta | 549 | **0** |
| 768×1024 | squadra piena | 678 | **0** |
| 412×915 | squadra piena | 869 | **0** |
| 412×915 | riepilogo | 842 | **0** |
| 360×740 | squadra, scheda aperta | 1007 | **0** |
| 360×740 | riepilogo | 1069 | **0** |

Quattro cose, nessuna delle quali aggiunge pagina:

1. **La pagina non scorre più: scorrono gli elenchi.** `.wrap` prende `height:100dvh`
   sulle due schermate, e dentro sono il roster e la lista della squadra ad avere il
   proprio scorrimento. Quel che si cercava scorrendo adesso sta dove ci si aspetta.
2. **Il roster mostra solo gli Insector che hai.** Prima elencava tutti e 34 con 27
   caselle grigie e un lucchetto: ventisette righe per dire «no». Adesso ci sono i sette
   disponibili, e una riga dice quanti restano e come si aprono.
3. **La scheda è un pop-up**, non più una colonna a fianco. È `role="dialog"` con
   `aria-modal`, il fuoco ci entra e torna sulla pedina da cui sei partito, si chiude con
   Esc, con la ×, con un clic fuori, cambiando schermata e appena hai scelto. Dentro ci
   stanno anche i pulsanti per mettere in squadra o togliere: si decide dove si legge.
4. **Il riepilogo è fatto di numeri.** Cinque descrizioni per esteso non stanno in una
   schermata, e lì si confronta, non si legge: restano vita, forza, difesa, danno
   d'attacco, danno della speciale e movimento. La prosa sta dietro al tondo «i» in alto
   a destra di ogni scheda, che riapre lo stesso pop-up del roster.

Sul telefono si è aggiunto un quinto pezzo: la squadra scelta era una **colonna di
cinque righe alta 288 px**, su uno schermo da 740 — metà della schermata per dire cinque
nomi. Adesso è una **striscia orizzontale alta 65 px** che si scorre col pollice, con la
crocetta nell'angolo di ogni pedina al posto del pulsante «Togli» (resta un bersaglio da
44 px, e `aria-label` dice «Togli Falcetta dalla squadra»). I 223 px risparmiati sono
andati al roster, che su un 360×740 passa da **una pedina visibile a tre e mezza**.

**La scelta della partita**, che il primo giro aveva lasciato fuori. Era la schermata
d'apertura e chiedeva di scorrere fin sotto alla sfida del giorno per trovare «Scegli la
squadra». Adesso sta nella finestra come le altre due: a scorrere, quando serve, è
l'elenco delle modalità, mentre la riga dei pulsanti resta dove è. Quando sotto c'è
ancora qualcosa l'ultima riga **sfuma**, perché il taglio netto faceva credere che
l'elenco finisse lì e la sfida del giorno non la vedeva nessuno; la sfumatura sparisce
arrivati in fondo. Su un 412×915 non serve nemmeno scorrere l'elenco: le tre modalità,
la difficoltà e la sfida ci stanno tutte.

**Il pannello del menu** usciva dallo schermo. La testata va a capo secondo la larghezza
e il pulsante «Menu» finisce ora a destra ora a sinistra: ancorato sempre al proprio
bordo destro, su un telefono dove il pulsante sta a sinistra il pannello sbordava fuori
dalla finestra. Adesso parte dalla posizione naturale e, se sborda, viene riportato
dentro — misurando la larghezza vera del pannello, che dipende dalle voci che contiene
(nella demo sono meno). Verificato a undici larghezze fra 320 e 1280 px.

**Dove la promessa non vale, e lo diciamo.** Sotto i 640 px di altezza — telefono di
traverso, schermi vecchi da 568 — la testata, la striscia della squadra e i suoi
pulsanti non ci stanno nemmeno a schermata vuota. Lì il blocco dell'altezza si disattiva
e la pagina torna a scorrere: peggio, ma onesto. L'alternativa sarebbe nascondere
qualcosa e far finta che ci stia. Nella scelta della partita, però, la riga dei pulsanti
resta appoggiata al bordo basso anche lì, così il passo avanti non si va a cercare in
fondo. Nella squadra no: quel riquadro è più corto della finestra e `position:sticky`
non avrebbe spazio in cui stare.

## Schieramento delle pedine

Prima di ogni battaglia si posizionano le 5 pedine, una alla volta, **entro le due file
più vicine** (10 caselle). Il pannello laterale elenca la squadra con il range di
movimento di ciascuna, così la scelta si fa con i dati sott'occhio: le unità lente
convengono avanti, il Re coperto dietro.

- clic su una casella illuminata → piazza la pedina evidenziata
- clic su una pedina già in campo → torna in panchina, pronta per un'altra casella
- **Schiera a caso** riempie solo le caselle rimaste vuote, senza spostare ciò che hai
  già posizionato
- **Inizia battaglia** si attiva solo a schieramento completo

Nel torneo gli avversari sono schierati dalla CPU nelle loro due file, con il Re
nell'ultima; in Human vs Human le schiera l'altra persona, nelle due file dalla sua
parte (che la rotazione le mostra in basso); in PC vs PC non si schiera affatto.

## Chi gioca: le tre modalita'

La scelta e' la **prima schermata del gioco**, prima ancora di comporre la squadra: si
apre `gioca.html` e compare «Chi gioca questa partita?». Da li' si passa al roster, e
la fascia in cima al roster ricorda la modalita' scelta con un pulsante **Cambia** per
tornare indietro. La scelta viene ricordata nel salvataggio locale, quindi riaprendo il
gioco la carta giusta e' gia' selezionata.

| Modalita' | Chi muove | A cosa serve |
|---|---|---|
| **Human vs PC** | tu contro il computer | il torneo di sempre: cinque round per rank |
| **Human vs Human** | due persone sullo stesso dispositivo | una partita fra amici, a turno |
| **PC vs PC** | il computer su tutti e due i lati | guardare la demo all'opera, per provarla |

Ogni carta ha le sue icone — una sagoma umana accanto a «Human», un monitor accanto a
«PC» — disegnate in SVG dentro la pagina come il resto della grafica.

Sotto le carte compare solo quello che serve a quella modalita':

- **Human vs PC** → il livello dell'avversario (era il selettore in testata, che non c'e' piu')
- **Human vs Human** → i nomi dei due giocatori
- **PC vs PC** → il livello di tutti e due i computer, scelti separatamente

In ogni caso la descrizione del profilo scelto compare sotto il selettore, cosi' si sa
cosa si sta per affrontare prima di entrare in campo.

### Human vs Human

1. **Squadre in privato.** Compone prima chi gioca in basso; quando conferma il suo
   quintetto una schermata di consegna copre tutto e tocca all'altro.
2. **Schieramento al coperto.** Ognuno schiera nelle due file dalla sua parte; finche'
   si schiera, **le pedine dell'altro non sono disegnate**. Le due zone non si
   sovrappongono, quindi nessuno puo' dedurne la posizione provando a occupare una
   casella. A schieramento chiuso il campo si scopre per entrambi.
3. **Turni alternati.** A ogni «Fine turno» compare la consegna: il campo resta coperto
   finche' chi subentra non conferma.
4. **Esito.** Vince chi abbatte il Re avversario, con **rivincita** a squadre invariate
   o ritorno al roster.

**La scacchiera ruota di mezzo giro a ogni consegna**: chi ha il turno si ritrova le
proprie pedine in basso, come se fosse seduto da quella parte del tavolo. Ruota la
**vista**, non lo stato: le coordinate delle unita' restano quelle logiche e passano da
`vX()`/`vY()` solo per essere disegnate o cliccate. Di conseguenza ruotano anche

- la mappatura delle caselle (ogni casella a schermo riscrive il suo `data-xy`),
- il verso degli sprite (guardano sempre verso il campo avversario),
- le frecce della tastiera (giu' resta giu' *sullo schermo*),
- le coordinate annunciate agli screen reader (riga 7 e' l'ultima riga in basso per chi
  sta guardando).

Non ruotano invece i colori: le pedine di chi sta in basso nella partita restano azzurre
e quelle dell'altro rosse, e la tinta delle due zone segue il proprietario. Cosi' a
scacchiera girata si riconosce comunque di chi e' cosa.

Altre scelte:

- **Stesso roster per tutti e due.** Si gioca su un dispositivo solo, quindi entrambi
  pescano dagli Insector sbloccati su quel salvataggio: nessuno parte avvantaggiato.
- **La squadra del torneo non si perde.** Mentre sceglie il secondo giocatore viene
  messa da parte e torna intatta al ritorno nel roster; il salvataggio locale continua
  a registrare solo la carriera.
- **Niente rete.** Tutto resta in una pagina statica: nessun server, nessun account,
  funziona anche offline.

### PC vs PC

Serve a provare la demo, non a giocarla: i due lati li muove l'IA con i livelli scelti,
il lato in basso con la squadra composta dall'utente e quello in alto con un quintetto
pescato dagli avversari del rank corrente. Non c'e' schieramento (le pedine partono
nelle due file di casa), il pulsante «Fine turno» sparisce e **il torneo non avanza**:
l'esito dice solo quale dei due profili ha vinto e con quante pedine in piedi.

Il livello del lato in basso e' guidato dall'utente solo qui: in tutte le altre
modalita' resta fisso su Normale, il metro con cui sono state misurate le difficolta'.

## Difficolta degli avversari

Il torneo contro il computer usa quattro profili di IA. La difficolta' non sta solo nelle statistiche: sale il livello di
gioco dell'avversario.

| # | Profilo | Come ragiona |
|---|---|---|
| 1 | Principiante | Avanza e mena. Non punta il Re, sceglie i bersagli a caso, usa le speciali di rado. |
| 2 | Normale | Punta il Re e il bersaglio piu debole, ma non valuta dove conviene spostarsi. |
| 3 | Esperto | Valuta **ogni casella raggiungibile** incrociata con ogni azione possibile: cerca il colpo letale, sfrutta il ring-out, evita di esporsi, si ritira se ferito. |
| 4 | Campione | Come l'Esperto, e sceglie **l'ordine** con cui muovere la squadra: agisce per prima l'unita che ha il colpo migliore. |

Il livello segue il rank del torneo (E→1, D e C→2, B e A→3, S→4) e si puo' forzare dal
selettore nella schermata «Chi gioca», per provare un profilo qualsiasi a qualunque rank.

**Quanto pesa davvero.** Misurato a specchio: stessa squadra e stesse statistiche sui due
lati, il lato "giocatore" sempre sul profilo Normale, alternando chi muove per primo.
Cosi' l'unica variabile e' il cervello.

| livello | vince l'avversario |
|---|---|
| Principiante | 41% |
| Normale | 50% (≈50%, la verifica di simmetria torna) |
| Esperto | 53% |
| Campione | 57% |

**Il passaggio al campo 5×7 ha ristretto questa scala.** Sul vecchio 6×6 il Campione
arrivava al 98%: su un campo stretto le squadre si toccavano subito e chi sceglie
l'ordine di azione chiudeva la partita in pochi turni. Con sette file di profondità ci
sono più turni di avvicinamento, la partita si decide meno sul colpo di apertura e il
vantaggio si assottiglia. Misurato, non ipotizzato: una sweep sui pesi del pianificatore
sul nuovo campo si ferma intorno al 60%.

Il vantaggio del Campione va letto bene: il metro di paragone è un'IA che muove le pedine
**in ordine fisso**. Una persona sceglie gia' da se' quale unita' far agire per prima,
quindi contro un umano il divario e' molto piu' stretto. Dare l'ordinamento all'IA non e'
un trucco: e' toglierle una zavorra che il giocatore non ha mai avuto.

Sulla curva del torneo — 500 partite per rank, squadra scelta bene, statistiche e IA che
salgono insieme (margine ±4.4 punti):

| Rank | IA avversaria | vittorie del giocatore |
|---|---|---|
| E | Principiante | 99% |
| D | Normale | 97% |
| C | Normale | 84% |
| B | Esperto | 69% |
| A | Esperto | 61% |
| S | Campione | 23% |

## Progressione del roster

Si comincia con le sole **forme base**: i 7 Insector di rank 1 (Lusinga, Ribalta,
Bastione, Galoppo, Sfregio, Falcetta, Tenaglia). Tutto il resto è visibile nel
roster ma bloccato, con indicata la condizione di sblocco.

| Rank in corso | Insector disponibili |
|---|---|
| E (debutto) | 7 — solo forme base |
| D | 20 |
| C | 27 |
| B | 31 |
| A e S | 33 |
| dopo aver vinto il Rank S | 34, Folgore compreso |

**Folgore** resta fuori fino alla vittoria del Rank S: sul wiki si cattura solo
dopo aver finito il gioco almeno una volta, ed è il Re più forte disponibile.

Questo sostituisce il sistema di cattura e riproduzione, che non è implementato: al suo
posto è il torneo a "far crescere" il roster. La soglia di sblocco segue il tetto della
fascia da cui pescano gli avversari del rank corrente — altrimenti si combatterebbe
sempre con una generazione di svantaggio (misurato: dal Rank D in poi le vittorie
crollavano dal 61% al 29%).

## Allevamento (versione ridotta)

Del sistema del gioco originale è implementata **solo la crescita per alimentazione**:
niente cattura, niente riproduzione, niente ereditarietà. Il piano completo e le ragioni
del taglio stanno in `PIANO-ALLEVAMENTO.md`.

**Modello.** Dalla scheda del roster si crea un **esemplare** (`nuovoEsemplare()`), che
vive in `S.zoo` — al massimo `MAX_GABBIE = 12`. Gli esemplari sono referenziati come
`"@" + uid` e convivono con gli id di catalogo nella squadra: `defOf()` e `statsOf()`
risolvono le due forme, e `mk()` accetta entrambe. Un esemplare porta in campo le
statistiche della famiglia **più** i bonus accumulati (`e.b`), ed è marcato `allevato`.

**Economia.** Ogni esemplare ha `VITA_MAX = 40` punti di vita da spendere, e non si
recuperano; a `VITA_ADULTO = 6` punti spesi smette di essere larva e può entrare in
squadra. I 22 cibi della tabella del wiki sono in `CIBI` con i loro effetti reali; i
premi pescano da `CIBI_PREMIO` (19 cibi: quelli che toccano le statistiche e, da quando
le resistenze contano, anche i sei che danno solo quelle). Il cibo si vince
**solo conquistando un rank**: `PREMIO_RANK = 4` pezzi, più un Frutto regale dal Rank B in
su. Le vittorie di round non danno niente.

I numeri del wiki (160 punti di vita, 20 per l'età adulta) sono **scalati, non copiati**:
nell'originale l'allevamento è un ciclo di gioco lungo decine di ore, qui la partita
intera dura un pomeriggio. Con i valori originali il cibo di un torneo completo non
avrebbe mosso niente; con questi, muove il giusto — misurato sotto.

**Resistenze.** I cibi le accumulano in `e.res`, `mk()` le porta in campo sull'unità di
battaglia, e da lì agiscono (`fattoreRes`, `passiSpinta`, `reggeIlBordo`,
`reggeConfusione`, vicino a `strike`):

| | dove agisce | quanto |
|---|---|---|
| `ct`, `ex` | danno delle mosse di quel tipo, via `MOSSA_TIPO` | −3% a punto, tetto −30%, simmetrico sui valori negativi |
| `kb` | `shove()`, la spinta della cornata e quella di Folgore | una casella in meno ogni 4 punti (`Math.trunc`, così −3…3 non fa scalini) |
| `kb`, `th` | ring-out da spinta e da lancio | 8% a punto di restare aggrappati, tetto 60% |
| `cf` | ammaliamento dei Silfidi, ribaltamento dei Voltidi, stretta di Folgore | 6% a punto, tetto 50% |
| `po` | niente | nessuna delle 13 famiglie giocabili avvelena, e la dispensa lo dice |

Il tipo di danno vale anche per l'attacco normale: chi porta le lame taglia comunque.
`resDi()` taglia i valori a ±10, e con resistenza ≤ 0 **non si tira il dado**: una squadra
non allevata gioca esattamente la partita di prima, seme per seme — la sfida del giorno
resta deterministica. Gli avversari sono esemplari del roster, quindi hanno sempre zero:
per questo i tetti sono bassi.

**Equilibrio delle corazze** (400 battaglie per scenario, `sim-res.js`). Stesso budget di
40 punti vita, speso in modi diversi sullo stesso esemplare; un pasto costa 1 punto e vale
+2 su una resistenza.

| Rank | roster | 40 stat | 30 stat + 10 corazza | 20 + 20 | solo corazza | cinque 8 stat | cinque 4+4 |
|---|---|---|---|---|---|---|---|
| E | 98% | 100% | 100% | 100% | 99% | 100% | 100% |
| B | 75% | 92% | 85% | 89% | 83% | 81% | 82% |
| S | 25% | 46% | 48% | 35% | 25% | 53% | 44% |

La corazza è un'alternativa, non un potenziamento: una quota piccola pareggia le
statistiche pure (48% contro 46% al Rank S), una quota grossa peggiora (35%), e la corazza
da sola non porta da nessuna parte (25%, come giocare senza allevare). È la forma che
serviva: una scelta con un costo, non un bottone che vince.

**Equilibrio misurato** (200 battaglie per scenario, `sim-alleva.js`): la dispensa di un
torneo intero, spesa in modi diversi.

| Rank | senza allevamento | tutto su uno | diviso su due | sparso sui cinque |
|---|---|---|---|---|
| E | 100% | 100% | 100% | 99% |
| B | 70% | 92% | 90% | 83% |
| S | 20% | 45% | 47% | 61% |

Due cose da leggere in questa tabella. La prima: allevare aiuta davvero (il Rank S passa
da 20% a 45-61%) ma non regala la vittoria, che era il rischio — la prima taratura, con
i punti a 160, portava il Rank S al 69% e rendeva il torneo una formalità. La seconda:
**spargere il cibo batte concentrarlo**, perché in 5v5 cinque pedine discrete valgono più
di un campione e quattro comparse. È la decisione interessante, ed è quella giusta.

## Sfida del giorno e collezione (priorità 2 della roadmap)

**Il nodo era il determinismo.** Una sfida uguale per tutti non serve a niente se le due
partite divergono: tutto il caso della battaglia — la squadra avversaria, il tiro del
danno nel `strike()`, le scelte dell'IA — passa ora da `caso()`, che di norma è
`Math.random` e durante la sfida è il generatore col seme del giorno. Restano fuori di
proposito gli identificativi delle pedine, il ritardo delle animazioni e il rumore
dell'audio: non cambiano una partita. Il controllo gioca due volte la stessa sfida con le
stesse scelte e pretende la **stessa sequenza di punti vita, colpo per colpo**.

La squadra è pescata dal seme fra le unità **fino al rango 4**, così la sfida non premia
chi ha allevato di più; l'avversario è sempre allo stesso livello (esperto). Il profilo di
rank è `SFIDA_PROF`, che sostituisce `RANKS[S.rankIdx]` via `profRank()` — così
`buildEnemy()` e i badge funzionano senza sapere niente della sfida.

**Non tocca il torneo**: la squadra della carriera viene messa da parte con lo stesso
meccanismo del secondo giocatore (`S.career` / `careerHeld`) e rimessa a posto alla fine.
Si gioca **una volta al giorno**: se si potesse riprovare, il punteggio non direbbe niente.

**La modalità si mette da parte insieme alla squadra** *(difetto segnalato giocando, 30
settembre)*. `avviaSfida()` non toccava `S.vs`, quindi la sfida ereditava la modalità del
torneo: chi stava in **PC vs PC** vedeva la propria sfida giocata dal computer, con «Fine
turno» nascosto e al suo posto «Torna al roster»; chi stava in **due giocatori** non vedeva
il pulsante affatto. Adesso `S.vs` finisce in `S.career` accanto alla squadra e la sfida
parte sempre in `hvp`; `backToCareer()` lo rimette com'era, e `datiSalvataggio()` salva
sempre la modalità **del torneo**, non quella prestata alla sfida. Nello stesso giro è
sparita un'altra promessa sbagliata: l'esito offriva «Rivincita» e «Cambia squadra» per una
partita che si gioca una volta al giorno — adesso dice «Torna al roster». Dodici controlli
nuovi in `sfida.js` partono dalle tre modalità e verificano tutte e quattro le cose.

**Collezione e traguardi.** `S.visti` si riempie in `startBattle()` — si conoscono
incontrandoli, da una parte o dall'altra — e gli otto traguardi si accendono dove le cose
succedono (prima vittoria, battaglia senza perdite, adulto, cattura, figlio, sfida, Rank S,
collezione completa). Nel salvataggio entrambi vengono **ripuliti in migrazione**: un id
inventato a mano sparisce.

Un difetto trovato guardando le schermate e non dai test: nella prima versione la riga
introduttiva della collezione mostrava `c\u00e8` invece di «c'è». Gli accenti dentro
all'HTML devono restare lettere, e la conversione che uso per il codice JavaScript li
aveva toccati anche lì.

## Riproduzione

Chiuso il piano dell'allevamento: mancava solo questa. Due adulti di sesso diverso danno
un figlio del **gradino successivo**, che eredita il **90% del meglio** dei due genitori —
i quali **si consumano**. È questo a rendere l'allevamento un ciclo invece di un accumulo.

**Le 18 coppie speciali.** Le fonti ne danno 23; cinque chiamano in causa unità che il
nostro roster non ha — e che quindi non hanno nemmeno un nome nostro — e
sono state scartate. Le altre sono in `COPPIE`, riga per riga. Sono documentate come
orientate — maschio di X e femmina di Y — ma qui **valgono nei due versi**: pretendere
anche l'orientamento avrebbe trasformato una scoperta in una lotteria.

**Il gradino successivo** non è «rango + 1»: le scale di famiglia hanno buchi (i Voltidi
va 1, 3, 4, 5), quindi `successore()` prende il prossimo che esiste. Se né il padre né la
madre hanno un gradino sopra, la coppia non ha discendenza, e la schermata lo dice invece
di mostrare un pulsante che non funziona.

**Il tetto.** Il figlio non supera di più di un gradino quello che il torneo ha aperto
(`tettoNascita()`), per la stessa ragione della cattura: altrimenti si arriva al rango 6
al Rank E e la curva misurata salta.

**Il sesso si alterna** (`ZOO_SEQ % 2`) invece di essere casuale: con dodici gabbie, una
serie sfortunata di soli maschi renderebbe impossibile riprodursi, e non sarebbe una
difficoltà interessante — sarebbe un dado.

**Equilibrio rimisurato** (200 battaglie per scenario, `sim-ripro.js`). La domanda era se
una linea allevata sfondi la curva. Non la sfonda:

| Rank | roster | tre regalati | cinque (cattura) | tutto su uno | linea allevata |
|---|---|---|---|---|---|
| E | 99% | 100% | 100% | 100% | 100% |
| B | 74% | 89% | 82% | 88% | 87% |
| S | 26% | 55% | 50% | 46% | 46% |

Al Rank S la linea allevata sta al **46%**, cioè come «tutto su uno» e **sotto** i tre
esemplari in regalo. Il motivo è che il cibo è lo stesso in tutti gli scenari: riprodursi
non moltiplica niente, **converte** due adulti in uno di gradino superiore al 90%, e in
cambio dà una base migliore. È un modo diverso di spendere lo stesso cibo, non una
scorciatoia — ed è esattamente quello che serviva.

Un difetto trovato dai controlli e non a occhio: nella prima versione il figlio non veniva
mai messo nelle gabbie. I genitori sparivano e non nasceva nessuno.

## Mondo e cattura (forma C del piano)

Implementata la **forma C** di `PIANO-MONDO.md`: spedizioni (niente mappa percorribile) e
mondo generato da un seme condivisibile. La mappa a caselle resta fuori, ed è prezzata a
parte nel piano.

**Il dato che ha deciso la fattibilità.** Il dataset ha tre campi mai usati prima —
`traps`, `bait`, `location`. Contati per unità coprono un terzo del roster (12 su 35 hanno
tutti e tre); ma una tabella di cattura lavora **per famiglia**, ed è la famiglia a
decidere l'esca come decide la mossa speciale: così contate, **11 famiglie su 13** sono
documentate. Mancano solo Trivellidi e Ventalidi, e per quelle la scelta è dichiarata
come nostra nel commento del codice.

**Le `location` non sono state usate**, ed è una scelta di merito: sono i livelli di
*Rogue Galaxy* (Juraika, Zerard, Rosencaster Prison…), cioè l'ambientazione altrui, che è
l'unica cosa che questo progetto ha sempre evitato. I cinque habitat — Frutteto, Cava,
Fornace, Pantano, Radura reale — sono nostri, e sono ricavati **raggruppando le esche per
tipo**. Chi vive dove resta documentato (`ESCA_FAM` nel codice è la tabella delle fonti,
riga per riga); inventati sono i nomi.

**Il seme.** Il mondo non si salva: si **ricalcola**. `luoghiDi(seme)` genera luoghi,
abitanti e fortuna con un mulberry32 innescato da un FNV-1a del seme, quindi nel
salvataggio stanno sei caratteri invece di una mappa, e lo stesso seme dà lo stesso mondo
su qualsiasi dispositivo. Anche **l'esito di una spedizione** è deciso dal seme più il
numero della spedizione: lo stesso mondo, giocato con le stesse scelte, dà gli stessi
risultati.

Il piano prevedeva anche un codice `INSECTRON-MONDO-…` con marca e impronta: si è
rivelato ridondante. Un mondo *è* sei caratteri, e il salvataggio completo se lo porta
già dentro.

**L'economia.** Una trappola per rank conquistato (I fino al Rank D, II fino al B, III da
lì in su), un'esca per spedizione presa dalla dispensa, due partite di attesa, tre
trappole in giro al massimo. Se la trappola torna vuota, l'esca è persa ma **la trappola
torna nel magazzino**: perdere due cose per un tiro andato male sarebbe solo punitivo.
Il selvatico nasce con le statistiche minime della sua unità **più 0-10%**: il `max` del
dataset (999 HP, 99 sulle altre) è il tetto di crescita dell'originale, non la forbice di
ciò che si trova in natura, quindi la varianza è nostra e tenuta stretta.

Non si cattura mai oltre `maxRank()`, cioè oltre quello che il torneo ha già aperto:
altrimenti si va a prendere un rango 6 al Rank E e la curva misurata salta.

**La variante scelta è «affianca»** (§12 del piano): tre esemplari restano in regalo, così
chi apre il gioco per due minuti vede comunque le gabbie; dal quarto in poi si cattura.

**Equilibrio rimisurato** (200 battaglie per scenario, `sim-mondo2.js`). La domanda era se
la cattura gonfi la squadra. Non la gonfia:

| Rank | squadra del roster | tre esemplari in regalo | col Mondo: cinque | col Mondo: tutto su uno |
|---|---|---|---|---|
| E | 99% | 100% | 100% | 100% |
| B | 72% | 88% | 84% | 93% |
| S | 20% | 57% | 56% | 55% |

Al Rank S le tre strade si chiudono a **55-57%**: nessuna domina. Il senso è quello
giusto — la cattura non aggiunge potenza, cambia **da dove vengono** gli esemplari e
permette di schierarne cinque invece di tre, al prezzo di un quarto del cibo che va in
esche. Le cifre restano in linea con quelle misurate per l'allevamento (Rank S attorno al
60%), e il Rank S resta una partita da giocare.

## Un gesto solo, in tutto il gioco

**Tocco breve: scegli. Tocco lungo: ti dico tutto quello che so.** La stessa coppia nel
roster e in battaglia, col dito e col mouse, perché un'interfaccia dove lo stesso comando
fa cose diverse a seconda dello schermo è un'interfaccia da reimparare ogni volta.

| | tocco breve | tocco lungo (450 ms) |
|---|---|---|
| **roster** | mette l'Insector in squadra, o lo toglie | apre la scheda: vita, forza, difesa, movimento, speciale |
| **battaglia** | sceglie la pedina da muovere | apre la scheda, anche di una pedina avversaria |

Il tocco lungo ha due vie in più, che non sono un di più: il **tasto destro** e, da
tastiera, il tasto Menu o `Maiusc+F10`. Sono il modo standard di dire «dimmi di più», e
senza di esse chi non può tenere premuto resterebbe fuori. Da tastiera `Invio` vale come
tocco breve, e il fuoco **resta sulla scheda** anche quando il roster si ridisegna — prima
si perdeva, e il secondo `Invio` finiva nel vuoto.

Dettagli che decidono se il gesto funziona davvero: se il dito si sposta di più di 10 px
il conto si ferma, perché sta scorrendo la pagina e non tenendo premuto; il menu di
sistema, la lente e la selezione del testo sono disattivati sui bersagli del gesto; e dove
il tocco breve non potrebbe fare niente — una larva, la squadra già al completo — invece
di non succedere nulla si apre la scheda, che il perché lo dice.

## Il campo risponde da solo

Scelta una pedina, il campo si illumina **subito**: in blu (`#16405c`, bordo azzurro)
dove può andare, in rosso (`#5c1f22`, bordo rosso) chi può colpire. Prima bisognava
premere «Muovi» o «Attacca» per vedere la stessa cosa: due pulsanti che dicevano quello
che il campo sapeva già mostrare. Toccare una casella illuminata **fa partire l'azione**,
senza passare dai pulsanti — che restano, perché servono alla speciale, a passare il turno
e a chi gioca da tastiera.

**La ricarica della speciale è scritta sulla pedina.** Il numero dei turni che mancano
compare in una targhetta sotto all'unità, e sparisce invece di dire «0» quando è pronta:
a colpo d'occhio si vede quale dei cinque può usarla, senza selezionarle una per una. Lo
stesso numero sta sul pulsante («Danza delle falci · fra 2») e per esteso nella scheda
(«pronta fra 2 turni»).

## Spiegazioni in contesto: le nuvolette

Gabbie e Mondo sono le due schermate che hanno regole vere da capire — un budget di
vita che non si rigenera, un'esca che è cibo tolto a qualcun altro, una trappola che
costa partite di torneo. Quelle regole stavano scritte in cima alla schermata, dove si
leggono una volta e non si rileggono più.

Adesso ogni regola sta **attaccata al pezzo di interfaccia che la applica**: una
nuvoletta piccola, ancorata, con un anello azzurro (il «faro») intorno a quello di cui
parla e un becco che lo indica. Dentro ci sono tre comandi: `‹` indietro, il contatore
(«3 di 5»), `›` avanti e `×` per chiudere.

| | Il roster | In battaglia | Allevamento | Cattura |
|---|---|---|---|---|
| passi | 3 | 4 | 5 | 6 |
| vanno su | una scheda · la stessa scheda · la striscia della squadra | la pedina scelta · una casella blu · il pulsante della speciale · «Fine turno» | gabbie · dispensa · un cibo · anteprima · «Accoppia due adulti» | un luogo · trappola · esca · probabilità · «Posa la trappola» · trappole posate |

I primi due giri sono quelli che spiegano il gesto: dicono per esteso che il tocco breve
sceglie, che tenendo premuto si vedono le caratteristiche, che il tasto destro fa lo
stesso, che il blu è dove si va e il rosso chi si colpisce, e che il numero sulla pedina
è la ricarica.

**Le regole che il sistema si dà.**

- **Si apre da sola la prima volta** che entri in una delle due schermate, e una volta
  chiusa non torna più: la scelta resta in `localStorage`, come la guida del primo minuto.
- **Si riapre quando vuoi**, dal punto interrogativo tondo accanto al titolo. Un
  onboarding che non si può rivedere è un onboarding che hai perso.
- **Non si mangia i clic.** Il corpo della nuvoletta ha `pointer-events: none`: un
  pulsante che le finisce sotto resta cliccabile. Intercettano solo i tre comandi, non
  il contatore. Questo era un bug vero, trovato dalla suite dell'allevamento che non
  riusciva più a cliccare un cibo.
- **Non indica il vuoto.** Ogni passo elenca più ancore e usa la prima che esiste **e
  occupa spazio** (almeno 8×8 px): a dispensa vuota il passo del cibo ripiega sul
  riquadro, e un riquadro svuotato — che nel DOM esiste ancora, alto zero — non viene
  mai scelto. Se nessuna ancora è viva, il passo sparisce e il contatore dice quelli
  veri, non cinque.
- **Sta dentro la finestra.** Il lato preferito vale se ci sta; se non ci sta si prende
  quello con più spazio, e in ogni caso viene riportata dentro con 10 px di margine. Il
  becco punta comunque al centro del bersaglio, anche quando la nuvoletta è stata
  spostata.
- **Segue quello che spiega.** Gabbie e Mondo si ridisegnano a ogni clic: `drawGabbie`,
  `drawMondo` e `drawSpedizione` chiamano `spiegaRiposiziona()`, e scorrimento e
  ridimensionamento la rimettono a posto una volta per frame.
- **Da tastiera**: `←` e `→` scorrono i passi, `Esc` chiude, e il fuoco torna dov'era.
- **Nella demo non esiste**, perché nella demo non esistono gabbie e mondo.

## Suono e guida del primo minuto

**Suono.** Tredici suoni sintetizzati con WebAudio: oscillatori che scivolano di frequenza
più scariche di rumore bianco filtrato. Nessun file, quindi la promessa «dentro al gioco
non c'è un solo file immagine» vale ora anche per l'audio, e il peso non cambia di un byte.

Tre scelte tecniche che vale la pena ricordare, perché nascono da come si comportano i
browser e non da preferenze:

1. **Il contesto audio si crea al primo suono**, non al caricamento: prima di un gesto
   dell'utente i browser lo tengono sospeso, e crearlo a vuoto tiene occupata la scheda
   audio per niente. `suona()` lo istanzia alla prima chiamata e lo risveglia se sospeso.
2. **Ogni chiamata torna `true`/`false` invece di lanciare.** Su un browser senza
   `AudioContext` il gioco resta muto e continua: c'è un controllo che glielo toglie di
   mano apposta per verificarlo.
3. **Volume a 0,22** sul guadagno principale. Si gioca anche in ufficio.

Il pulsante in testata porta l'etichetta corta «Suono» e dice il suo stato con `title`,
`aria-label`, `aria-pressed` e il tratto sopra il testo: in testata ci sono già cinque
pulsanti e su un telefono ogni parola in più è una riga in più prima del gioco.

**Colonna sonora.** Due **melodie scritte**, non generate: `BRANI` è una tabella di note.
Formato: un brano è una griglia di sedicesimi, ogni voce è una fila di coppie
`[semitono, quanti passi dura]`, `null` è una pausa, `ott` sposta la voce di un'ottava.
Qualche riga di dati invece di un file audio — è il modo in cui facevano musica le
macchine con 64 KB.

Due brani, entrambi in la minore naturale su quattro battute: `roster` (88 bpm: melodia,
basso tenuto, controcanto rado) e `campo` (132 bpm: melodia staccata, basso in ottavi,
percussione di rumore filtrato sul quarto). Cambiano con la **schermata** e non con
l'andamento della partita, per scelta del committente; cambiando brano si riparte dalla
prima battuta, perché i due tempi sono diversi e riprenderli a metà suona come un inciampo.

I controlli verificano che il secondo giro sia **identico** al primo (è scritto, non
improvvisato), che tutte le note stiano nella scala dichiarata, e che i due temi stiano
**allo stesso livello** — il campo è più intenso perché è tre volte più fitto (9,2 note al
secondo contro 2,8), non perché è più forte: un salto di volume fra due schermate sarebbe
un difetto.

Il punto tecnico che conta è lo **scheduler con anticipo**: le note non partono con
`setTimeout`, si programmano sul clock audio 250 ms prima del momento giusto, in una
finestra che un timer da 120 ms tiene sempre piena. È la differenza fra una musica a tempo
e una che zoppica ogni volta che il browser è occupato a disegnare. Il controllo verifica
proprio questo: che ogni nota sia programmata **nel futuro** di `currentTime`.

Tre accorgimenti: bus separato dagli effetti (interruttori indipendenti: c'è chi vuole i
colpi ma non la musica), avvio rimandato al primo cambio di schermata — creare il contesto
audio prima di un gesto vuol dire tenere accesa la scheda audio per una musica che il
browser terrebbe sospesa — e stop automatico quando la scheda va in secondo piano.

**Livello tarato a misura, non a orecchio.** Il controllo rende nove secondi di musica in
un `OfflineAudioContext` e misura il segnale: valore efficace attorno a **0,013**
(≈ −38 dBFS) per entrambi i temi, con **2% di differenza** fra i due, picchi sotto 0,15 —
sottofondo udibile, circa metà del picco di un colpo, nessun clipping e nessun salto di
volume quando si cambia schermata.

**Il menu.** In testata restano tre pulsanti; `Mondo`, `Gabbie`, `Suono` e `Musica` stanno
in un pannello con `role="menu"`, gli interruttori come `menuitemcheckbox` con
`aria-checked` e lo stato scritto accanto. Esc chiude e restituisce il fuoco, un clic fuori
chiude, scegliere una destinazione chiude — toccare un interruttore no, così si regolano
tutti e due. Nella demo il pannello resta con i soli due interruttori, separatore compreso.

**Guida.** Quattro passi (`squadra`, `re`, `schiera`, `muovi`), ognuno con una condizione
invece che con un pulsante «avanti»: la riga compare quando la condizione è vera e sparisce
da sola quando smette di esserlo. `guidaAggiorna()` è chiamata dai punti dove il gioco già
si ridisegna — `show()`, `drawSlots()`, `drawBrief()`, `draw()` — quindi non c'è nessun
timer e nessuno stato parallelo da tenere allineato.

Non la vede chi ha già un torneo in corso (rank, round, squadra o titolo di campione nel
salvataggio), e «Salta la guida» la spegne per sempre in `insectron-guida`.

## Uso da telefono

Il difetto, segnalato giocando e poi **misurato** su 390×844: selezionata una pedina, i
pulsanti delle azioni finivano a 1084 px con una finestra di 844 — **311 pixel di
scorrimento per ogni mossa**, e lo stesso in schieramento, con la panchina fuori dallo
schermo.

La soluzione, tutta sotto `@media(max-width:900px)`: `#ucard` prende la classe `ancorata` e
diventa una barra `position:fixed` in fondo allo schermo, con i pulsanti a 46 px (sopra la
soglia dei 44 delle linee guida), la prosa della speciale nascosta — sta nel roster — e la
lista della panchina a scorrimento interno.

Tre dettagli che sono costati più del resto:

1. **La scacchiera si restringe da sola.** `.conScheda .board` calcola la larghezza massima
   dall'altezza libera (`100vh` meno la barra meno l'ingombro fisso), tenendo il rapporto
   5:7. Un campo un po' più piccolo è meglio di un campo da inseguire scorrendo.
2. **La pagina si sposta solo se serve.** `avvicinaCampo()` confronta il rettangolo della
   scacchiera con il bordo superiore della barra e non fa niente se si vede già tutto:
   scorrere a ogni tocco sarebbe fastidioso quanto doverlo fare a mano.
3. **Misurare a schermata nascosta non funziona.** La prima versione non scorreva mai,
   perché `drawDeploy()` gira quando `#s-battle` è ancora `display:none` e tutti i
   rettangoli sono a zero. La chiamata giusta parte da `show()`, un tick dopo.

### Secondo passaggio (30 settembre)

Con la barra a posto restava scomodo tutto quello che le sta **intorno**, misurato sulla
stessa finestra:

| | Prima | Adesso |
|---|---|---|
| testata | 3 righe, ~250 px, con «Azzera torneo» accanto al pollice | 2 righe, 104 px; Salvataggio e Azzera nel menu |
| pulsanti | 32-36 px di altezza | nessuno sotto i 44 |
| «Fine turno» | in cima alla pagina, fuori schermo appena si scorre | `.turnbar` in `position:sticky`, sempre a vista |
| slot della squadra | 5 righe «Slot libero», ~300 px | le pedine scelte + una riga che dice quante mancano |
| scheda del roster | sotto la lista, da cercare | portata a vista al tocco, se non c'è già |
| «Entra in arena» | dopo 5 schede e ~1.700 px | barra azioni `sticky` in basso |
| carte del roster | 3 per riga sui telefoni larghi, col nome a capo | 1 o 2 per riga (`minmax` da 148 a 158 px) |
| roster in tutto | 1.404 px | 1.143 px |

Due cose imparate, che valgono oltre questa schermata:

1. **`hidden` è un attributo, e qualsiasi regola con `display` lo batte.** Era già successo
   a cinque elementi, corretti uno per uno con `.classe[hidden]{display:none}`; al banner
   del riepilogo no, e restava una striscia vuota sotto la testata su **ogni** schermo.
   Adesso c'è una regola sola, `[hidden]{display:none!important}`, e le cinque toppe sono
   sparite.
2. **Le voci del menu non duplicano il comportamento**: premono il pulsante vero, che sullo
   schermo stretto è solo nascosto dal CSS. Un solo `onclick` da mantenere.

Girando il telefono si riattraversa la soglia dei 900 px: un ascoltatore su `matchMedia`
ridisegna gli slot e, se si è in campo, la scacchiera — altrimenti resta la forma di prima.

I 26 controlli di `mobile.js` girano in una finestra da telefono e verificano i numeri, non
l'aspetto: zero pixel da scorrere per arrivare alle azioni, nessuna delle dieci caselle di
schieramento coperta dalla barra, scacchiera interamente sopra la barra, **nessun pulsante
sotto i 44 px**, testata sotto i 170, menu a sette voci che aprono davvero quello che
promettono, slot riassunti, scheda portata a vista, e che su schermo largo non cambi niente.

## Edizione demo ed eco (priorità 1 della roadmap)

**Edizione.** `EDIZIONE` in `gioca.html` vale `"completa"` o `"demo"`; `crea-demo.sh`
genera la build della demo cambiando quella riga sola. Nella demo i due pulsanti laterali
spariscono **e** `apriGabbie()`/`apriMondo()` si rifiutano, la scheda del roster spiega
invece di offrire, e il premio di rank non nomina gabbie e mondo. I salvataggi restano
compatibili nelle due direzioni: un salvataggio della demo ha semplicemente zoo e dispensa
vuoti.

Un flag lato client non protegge niente, e va bene così: in una demo non c'è niente da
proteggere, e chi lo scopre ha visto il gioco intero. L'edizione a pagamento, se ci sarà,
sarà un file diverso consegnato dallo store — vedi `PIANO-VENDITE.md` §4.

**La demo non è pubblicata**: lo script c'è, il file si genera in un comando, ma sul sito
oggi resta solo il gioco completo, che è gratuito. La demo serve quando il completo va
altrove.

**Eco.** Cinque tappe (`apre`, `squadra`, `prima`, `rankD`, `ritorno`) più i conteggi di
partite, vittorie, sconfitte e modalità. Stanno in `localStorage` sotto `insectron-eco`,
**separati dal salvataggio**, perché azzerare il torneo non deve azzerare quello che
sappiamo, e viceversa.

Le regole che il codice rispetta, e che i controlli verificano:

1. niente cookie, niente identificatori, niente profilazione: il rapporto è fatto di
   numeri e di date al giorno, e non contiene un solo campo che dica chi sei;
2. **non parte niente da solo.** `eco.js` registra ogni richiesta di rete della pagina e
   pretende che siano zero per l'intera sessione;
3. quello che si manda si vede prima, per intero, nello stesso testo che verrà copiato;
4. l'invito compare **una volta sola**, dopo la prima vittoria, e ha il suo «non adesso».

`EMAIL_FEEDBACK` e `TELEMETRIA_URL` sono vuote di proposito. Finché lo sono, la pagina non
fa una richiesta di rete e non ha bisogno di nessun banner del consenso.

### Telemetria passiva (priorità 5 della roadmap) — costruita, spenta

Il limite della raccolta volontaria era che **arriva quello che la gente decide di
mandare**: poco, e distorto verso chi è contento. Il meccanismo passivo adesso c'è per
intero, e si accende con una riga.

**Nel gioco.** `ecoAuto()` manda un rapporto **una volta per visita**, su
`visibilitychange → hidden` e su `pagehide`: è l'unico momento in cui il quadro è completo,
e `sendBeacon` sopravvive alla chiusura della scheda mentre una `fetch` no. Il corpo è
`ecoRapporto()` con `auto: 1` e **senza** il commento libero. `TELEMETRIA_URL` vuota
significa zero richieste, come prima; `ECO_INVIO` (chiave `insectron-eco-invio`) è
l'interruttore che compare nel menu e nel pannello quando la raccolta è accesa.

Due scelte che valgono più del codice:

1. **Il testo segue la configurazione.** `ecoPrivacy()` genera la frase del pannello a
   partire da `TELEMETRIA_URL` e da `ECO_INVIO`. Scritta a mano, quella frase sarebbe vera
   in una versione e falsa nella successiva: così non può.
2. **Quello che parte è identico a quello che si vede**, e il controllo lo verifica
   confrontando i due oggetti serializzati — non a parole, campo per campo.

**Il servizio** sta in `telemetria/`, in questo repository privato: Worker Cloudflare più
database D1, 153 righe di README con la procedura, e `prova.mjs` che gira il Worker in un
contesto vuoto con un D1 finto — 19 controlli, **senza toccare la rete**. Le regole che
quel codice difende:

| Regola | Come |
|---|---|
| l'IP non si conserva | il Worker non legge mai `CF-Connecting-IP`, e `[observability] enabled = false` tiene spenti i log di Cloudflare — con quelli accesi l'informativa direbbe il falso |
| si scrivono solo le colonne dichiarate | un campo sconosciuto viene buttato via; il controllo prova a mandare nome, email e IP e verifica che non arrivino in nessuna colonna |
| l'ora si arrotonda alla mezz'ora | un orario al secondo, su pochi giocatori, è di fatto un modo per riconoscere una visita |
| dodici mesi e poi via | un cron notturno cancella le righe vecchie |
| gli aggregati hanno una chiave | `/numeri` risponde 401 senza il secret, e non restituisce mai una riga singola |

**L'informativa** è `privacy.html`, pubblicata e collegata dal piè di pagina di entrambe le
landing, con dieci controlli in `land.js`. Dichiara lo stato di oggi — raccolta spenta — e
il riquadro va cambiato insieme alla costante: è il passo 3 della procedura in
`telemetria/README.md`, insieme all'indirizzo email che manca e senza il quale
un'informativa non è un'informativa.

**Perché è spenta.** Passare da volontario a passivo cambia la posizione giuridica anche a
parità di dati raccolti. Quella conferma la deve dare un consulente privacy, non il codice:
finché non arriva, `TELEMETRIA_URL` resta vuota e il gioco non manda niente. Le tre cose da
fargli guardare sono elencate in cima a `telemetria/README.md`.

## Cosa è ricostruzione di design (non documentato sul wiki)

Queste scelte sono nostre e si possono cambiare in un punto solo del codice:

1. ~~Griglia 6×6~~ → **Campo 5×7** (5 colonne, 7 file). Nessuna delle due fonti scritte
   indicava la dimensione; l'informazione è arrivata dal committente sulla base del gioco
   originale. Il campo rettangolare e profondo bilancia i movimenti obliqui, che su una
   griglia quadrata coprivano troppo. Costanti `NX` e `NY`.
2. **Formula di danno.** Assente da entrambe le fonti.
   `max(str×0.3, str×2 − def) × moltiplicatore × (0.9…1.1)`.
   Il pavimento al 30% della forza serve a evitare che un DEF alto renda un'unità
   letteralmente invulnerabile agli attaccanti deboli (Barbacane ha DEF 32
   contro STR 14 di Lusinga). Funzione `strike()`.
3. **Scalatura difficoltà.** Due assi: un moltiplicatore di statistiche crescente per
   rank (campo `mul` in `RANKS`) e il profilo di IA (`RANK_AI`). Il secondo conta più del
   primo: un avversario grosso ma ottuso spreca il vantaggio.
4. **Cooldown 3 turni** sulle mosse speciali: nel gioco originale la gestione è
   diversa, qui serve a evitare lo spam della stessa mossa.
5. **IA avversaria.** Vedi la sezione sulla difficoltà. I profili 3 e 4 assegnano un
   punteggio a ogni coppia (destinazione, azione) in `scorePlan()` e scelgono il massimo
   in `bestPlan()`. La prudenza è pesata sulla propria stazza: in valore assoluto
   un'unità robusta sprecava il proprio vantaggio restando alla larga.
6. **Un movimento e un'azione per unità per turno.** Lo spostamento si può fare una
   volta sola; dopo si può ancora attaccare o usare la speciale, ma attaccare chiude il
   turno della pedina. Attacco e speciale non si sommano.

## Discrepanze fra le fonti

- **Premio del Rank B**: il wiki dice *Devil Forks*, la FAQ dice *Spirit Calibur*.
  Nel demo resta il valore del wiki.
- **Movimento dei volanti**: il wiki dice 7×7 (3 caselle), i diagrammi della FAQ si
  fermano a 2 perché la griglia disegnata è 5×5. Vale il wiki: il testo della FAQ
  stessa cita "flying insectrons (3 square movement range)".

## Cosa NON c'è (esiste sul wiki ma è fuori dallo scopo di una demo)

- Cattura con trappole ed esche, luoghi di spawn, probabilità
- Riproduzione, ereditarietà delle statistiche, special breeding, alberi delle famiglie
  (l'allevamento implementato è solo la crescita per alimentazione: vedi sopra)
- La **mappa percorribile**: si sceglie il luogo da un elenco, non ci si cammina dentro
  (è la forma B del piano, prezzata a parte)
- Sesso, condizione e satietà; i luoghi veri dell'originale (vedi sopra: sono i suoi
  livelli, e restano fuori di proposito)
- Le 6 resistenze (Knockback, Confusion, Cut, Explosion, Throw, Poison): i cibi le
  accumulano e la scheda le mostra, ma in battaglia non fanno ancora niente e il gioco
  lo dice
- Le 136 unità complete: il wiki ha schede dettagliate solo per 35
- Colore e aspettativa di vita reale (qui la "vita" è solo il budget di crescita)
- Modalità Vs. con password a 118 caratteri
- Modalità **"Eliminate the enemy"** (documentata nella FAQ per le partite Vs.: nessun
  Re designato, si vince solo abbattendo tutti). Implementabile rapidamente: cambia
  solo la condizione di vittoria
- Famiglie senza scheda statistiche sul wiki e quindi senza unità giocabili, per cui
  la FAQ documenta comunque la mossa: Hopper (Giant Leap), Springtail (Hypnotasm),
  Stingbee (Poison Needle), Bombsnail (Bomb Drop), Silkspider (Sticky Net)

## Grafica

Tutto disegnato per questo prototipo, generato da codice: nessun file immagine nel repo.

**Personaggi.** La funzione `art(famiglia, ruotato, rank)` compone un SVG per ciascuna
famiglia. Ogni SVG riceve un id di gradiente univoco: con id ripetuti il browser risolve
`url(#id)` alla prima definizione del documento, e se quella sta in una sezione
`display:none` il gradiente non viene dipinto affatto.

Tutte e 13 le famiglie condividono quattro attrezzi, definiti una volta sola dentro
`art()` e richiamati da ogni sagoma:

| Attrezzo | Cosa fa |
|---|---|
| `zampe()` | sei zampe articolate, tre per lato, sfalsate come nell'insetto vero |
| `luce()` | riflesso speculare sul guscio, **specchiato** sul lato ruotato |
| `bordo()` | filo di luce sul bordo superiore, che stacca la sagoma dallo sfondo scuro |
| `occhi()` / `antenne()` | occhi con il punto di luce, antenne con il bulbo in punta |

Sono le zampe, più di ogni altra cosa, a togliere l'effetto «macchia colorata»: prima
di averle, ogni famiglia era un ovale con un dettaglio sopra.

Ogni sagoma ha poi la sua anatomia: torace e addome separati nella mantide, corno
biforcuto attaccato al capo nei Bastidi, mandibole specchiate nei Tenaglidi (una sola
disegnata e ribaltata, così restano identiche), canna con volata nei Bombardidi, quattro
ali velate in Silfidi e Ventalidi, segmenti con zampette nei Trivellidi, palla appoggiata
al dorso nei Sferidi, criniera a ciuffi nei Corsidi, corona a punte e mantello nei
Tonantidi.

**Il grado dentro la famiglia** *(rifatto il 5 ottobre 2026)*. Prima il disegno cambiava
su tre livelli di rank (1-2, 3-4, 5-6). Siccome i rank di una famiglia non sono
consecutivi — i Lamidi hanno R1, R3, R4, R5 — due membri su quattro finivano nello stesso
livello e uscivano **identici al pixel**: misurate a 46 px, la dimensione in cui le pedine
si vedono davvero, nove coppie erano diverse allo 0%.

Adesso `gradoDi(famiglia, rank)` dice quanti gradini ha quella famiglia e a quale sei, e
il disegno dipende da quello: una famiglia da quattro membri ha quattro figure. Ogni
gradino cambia le misure del pezzo che dà il nome alla famiglia (la lama dei Lamidi, il
corno dei Bastidi, la canna dei Bombardidi, la pala dei Voltidi, la falce dei Falcidi) e
aggiunge un elemento in una zona sua, perché i segni non si coprano fra loro: barbe e
elsa, mandibole e piastre di coda, culatta, sfiati e ruote dell'affusto, pattini e punte
del forcone, dentellatura, spine e uncino.

| | prima | adesso |
|---|---:|---:|
| coppie identiche | 9 | **0** |
| passo minimo fra un grado e il successivo | 0% | **5,0%** |
| passo medio | — | **8,0%** |
| distanza fra le due famiglie più somiglianti | 7% | 11% |
| sprite tagliati dal bordo della casella | 5 | **0** (margine minimo 2 px) |

La stazza d'insieme non cresce più oltre la taglia naturale del disegno: i gradi alti
arrivano a 1, i bassi stanno a 0,93. Era il contrario — cresceva fino a +14% — ed è il
motivo per cui cinque sprite uscivano dalla casella. Chi è solo nella sua famiglia
(Bufera, Balsamina, Galoppo, Folgore) e gli sprite dei luoghi del Mondo che chiedono un
rank inesistente ricadono sulla vecchia taglia e sono rimasti **identici al byte**.

Le unità avversarie sono ruotate di 180° per fronteggiare il giocatore, con le fermate del
gradiente invertite e il riflesso specchiato: altrimenti la luce arriverebbe dal basso e
sembrerebbero capovolte.

**Animazione.** I token non vengono ridisegnati a ogni azione: vivono su uno strato sopra
la griglia e si spostano con una transizione, quindi movimento, spinte e lanci sono animati
gratis. Sopra a questo:

Due regole tengono insieme il movimento: **prima di ogni azione forte c'è un piccolo
movimento contrario** (l'anticipo), e **ogni impatto deforma la sagoma** invece di
spostarla soltanto. Sono i due trucchi che fanno leggere il peso.

| Evento | Effetto |
|---|---|
| Riposo | oscillazione lenta, con sfasamento casuale per unità |
| Ali (Silfidi, Ventalidi) | battito continuo, solo per chi le ha |
| Selezione | alone pulsante del colore dello schieramento |
| Spostamento | passo: stacco, volo breve, atterraggio schiacciato, con l'ombra che si stringe mentre la pedina è in aria |
| Attacco | carica all'indietro e poi affondo sul bersaglio |
| Colpo subito | scossa laterale + lampo bianco + schiacciamento elastico |
| Mossa speciale | raccolta e poi ingrandimento dell'attaccante |
| Aree (Danza delle falci, Colpo d’ali, Ira del Tonante) | onda circolare espansiva |
| Cannonata | proiettile che viaggia da attaccante a bersaglio |
| Danza balsamica / Sfera scudo | onda verde / beige |
| K.O. | cede su se stessa, poi dissolvenza con rotazione |
| Ring-out | volo fuori dal campo con rotazione di 560° |

Gli effetti d'area stanno su uno strato ritagliato sul bordo della scacchiera; i token no,
così un ring-out può davvero uscire dal campo. Tutte le animazioni si disattivano con
`prefers-reduced-motion`.

## Accessibilità

La scacchiera è una **griglia ARIA** (`role="grid"` con righe e celle), non un mucchio di
`div` cliccabili: si gioca interamente da tastiera e uno screen reader legge il campo.

- **Frecce** muovono il cursore, **Home/End** a inizio e fine riga, **PagSu/PagGiù** alla
  prima e ultima riga, **Invio/Spazio** seleziona o conferma
- *Roving tabindex*: si entra nella griglia con un solo Tab, poi ci si muove con le frecce,
  senza dover attraversare 36 elementi
- Ogni casella ha un nome parlato: posizione, chi la occupa, punti vita e stato
  (*Re, immobilizzato, protetto, scoperto, ha già agito, bersaglio disponibile*)
- Focus da tastiera **bianco**, selezione della pedina **gialla**: due segnali distinti
- Il diario di battaglia è una regione `aria-live="polite"`, quindi le azioni vengono
  annunciate mentre accadono
- Gli strati grafici e le icone di stato sono `aria-hidden`: lo stato passa dal nome della
  casella, non da emoji nude
- Azzerare il torneo chiede conferma, ma solo se c'è davvero qualcosa da perdere

Verificato con l'audit della skill `web-design-guidelines`. Sistemati anche:
`transition` shorthand (equivale a `transition: all`), `color-scheme: dark`,
`<meta name="theme-color">`, `touch-action: manipulation`, `-webkit-tap-highlight-color`,
`font-variant-numeric: tabular-nums` sulle colonne di statistiche, `text-wrap: balance`
sui titoli.

## Verifiche fatte

- 23 controlli automatici sulla nomenclatura: tutte e 118 le stringhe vecchie cercate nei
  dati **e nel testo della pagina**, i 118 nomi nuovi contati e verificati senza doppioni,
  la coerenza fra le tabelle (ogni unità in una famiglia che esiste, esche e habitat che
  nominano cibi e famiglie vere), e la migrazione allo schema 6 — un salvataggio vecchio
  che ritrova la dispensa, somma le quantità se ha entrambe le forme del nome, converte
  l'esca di una trappola già piazzata e non perde né squadra né gabbie né collezione;
  e che nella tabella di conversione i nomi vecchi non compaiano nemmeno lì, perché sono
  ridotti a 22 impronte FNV-1a distinte
- 39 controlli automatici sulle resistenze: la scala del danno e il suo tetto nei due
  versi, la resistenza sbagliata che non serve, quello che l'esemplare ha mangiato che
  arriva in campo e l'avversario che resta a zero, la spinta che si accorcia di una
  casella ogni quattro punti, la presa sul bordo che salva dal ring-out **e che qualche
  volta cede**, l'ammaliamento dei Silfidi che fallisce ma si paga lo stesso, la stima
  della scheda che coincide col danno che poi arriva, e il dado che **non viene tirato**
  quando la resistenza è zero — cioè le partite di prima restano identiche
- 30 controlli automatici sulle tre schede: il pop-up del roster si apre toccando la
  pedina, mostra caratteristiche, movimento, speciale e danni, non mette in squadra senza
  conferma, si chiude da solo appena hai scelto e riaperto offre «Togli»; il riepilogo
  genera una card per pedina, **senza una riga di prosa**, col tondo «i» che apre la
  scheda completa, e blocca l'ingresso in arena finché manca il Re; la card di battaglia
  riporta danno d'attacco, danno speciale e movimento residuo
- 39 controlli automatici sul gesto e sul campo: nel roster il tocco breve mette e toglie
  dalla squadra senza aprire niente, il tocco lungo apre la scheda senza mettere in
  squadra, e lo stesso fa il tasto destro; da tastiera `Invio` vale come tocco breve e il
  fuoco resta dov'era; a squadra piena il tocco breve apre la scheda invece di non fare
  nulla. In battaglia: senza pedina scelta il campo è spento; scelta una pedina compaiono
  **tante caselle blu quante sono le mosse e tante rosse quanti i nemici a tiro**, col
  colore misurato a transizione finita (`rgb(22, 64, 92)` e `rgb(92, 31, 34)`); toccando
  una casella blu la pedina ci si sposta senza premere «Muovi»; il tocco lungo apre la
  scheda anche di un avversario, e non lo seleziona. Più il countdown: la targhetta sulla
  pedina dice i turni che mancano, il pulsante li ripete, la scheda li scrive per esteso,
  e a ricarica finita la targhetta sparisce invece di dire zero
- 48 controlli automatici sulle spiegazioni in contesto: la nuvoletta si apre da sola
  al primo ingresso e non torna più dopo averla chiusa; il punto interrogativo la
  riapre dal primo passo; avanti e indietro si spengono agli estremi e il testo cambia;
  ogni passo sta **attaccato al suo pezzo** (misurato: mai più di 26 px di distanza, col
  faro sul bersaglio al pixel), non lo copre e non esce dalla finestra, né su schermo
  largo né a 360×740; a gabbie e dispensa vuote nessun passo indica un pezzo di schermo
  vuoto; un pulsante che finisce sotto alla nuvoletta **resta cliccabile**, mentre i suoi
  tre comandi intercettano; `←` `→` `Esc` funzionano; e nella demo non si apre
- 52 controlli automatici sulla schermata unica: squadra e riepilogo stanno dentro il
  viewport senza scorrimento di pagina a 1280×900, 412×915 e 360×740, anche a squadra
  piena; il roster elenca **solo** gli Insector disponibili e dice quanti ne restano da
  sbloccare; il pop-up è un `dialog` con `aria-modal`, il fuoco ci entra e torna sulla
  pedina di partenza, si chiude con Esc, con la ×, col clic fuori e cambiando schermata;
  il tondo «i» del riepilogo apre la scheda **senza** nominare il Re; sul telefono le
  cinque scelte sono una striscia orizzontale alta 65 px invece di cinque righe da 288,
  con tutte e cinque le pedine dentro e la crocetta per toglierle; e sotto i 640 px di
  altezza, dove la schermata non ci sta comunque, la pagina torna a scorrere **senza
  tagliare niente** e i tre pulsanti restano raggiungibili. Più, dalla segnalazione del
  2 ottobre: il pannello del menu sta dentro la finestra a **undici larghezze** fra 320 e
  1280 px, e «Scegli la squadra» si vede senza scorrere su schermo largo, telefono e
  telefono piccolo, con la sfumatura che compare solo quando sotto c'è davvero altro e
  sparisce arrivati in fondo; sugli schermi bassi, dove la pagina scorre comunque, la
  riga dei pulsanti resta appoggiata al bordo
- 11 controlli sul passaggio del mouse, da cui era nato il bug della scheda che cambiava
  mentre andavi verso il pulsante: ora che la scheda è un pop-up il giro del mouse per
  tutta la finestra non la tocca, e il click aggiunge proprio quello che stai leggendo
- 4 controlli sul campo rettangolare: 5 colonne, 7 file, e i limiti su entrambi gli assi

- 32 controlli automatici su Human vs Human: la modalità si sceglie entrando nel gioco
  e la fascia del roster la ricorda; le consegne nominano il giocatore giusto a ogni passaggio; a
  inizio schieramento il campo è vuoto e si vedono solo le cinque pedine di chi sta
  schierando; ognuno schiera nella propria metà; a battaglia iniziata compaiono tutte e
  dieci; non si seleziona una pedina avversaria; «Fine turno» è attivo per tutti e due;
  una partita completa giocata via UI arriva a un vincitore dichiarato per nome; la
  rivincita riparte dalle stesse squadre; tornando al roster la squadra del torneo è
  intatta, nel salvataggio e a schermo, e i badge del torneo ricompaiono. Nessun
  errore in console.

- 44 controlli automatici sulla schermata «Chi gioca» e su PC vs PC: è la prima
  schermata del gioco, la testata non ha selettori, il pulsante «Cambia» del roster la
  riapre con il ritorno alla squadra e la scelta sopravvive al ricaricamento; le tre
  carte sono nell'ordine giusto con le etichette chieste e
  l'icona accanto a ogni parola (umana accanto a «Human», monitor accanto a «PC»);
  sotto le carte compaiono i nomi in Human vs Human, un livello in Human vs PC e due in
  PC vs PC, con la descrizione del profilo che segue la scelta; i livelli scelti
  arrivano ai due lati e sopravvivono al ricaricamento; PC vs PC entra in campo senza
  schierare, con dieci pedine e senza «Fine turno», va avanti da solo fino a un
  vincitore, non muove rank e round e si può abbandonare a metà; Human vs PC continua a
  passare dallo schieramento e mostra in campo il livello scelto.

- 25 controlli sui salvataggi: il salvataggio porta il numero di versione dello schema;
  la finestra si apre col fuoco dentro e si chiude con Esc restituendo il fuoco; il
  codice esportato ha marca e impronta e sta in poche righe; il file scaricato ha il
  nome con la data; in un browser pulito il ripristino riporta rank, round, campione,
  squadra e difficoltà, anche se il codice viene incollato spezzato su più righe; un
  codice vuoto, estraneo, troncato o mutilato viene rifiutato con un messaggio e
  **senza toccare il salvataggio esistente**; un salvataggio vecchio senza numero di
  versione viene letto lo stesso e portato alla versione corrente alla prima scrittura;
  un salvataggio scritto da una versione futura non viene interpretato, viene detto a
  schermo e resta intatto

- 13 controlli sul movimento delle pedine: respiro a riposo, alone sulla selezione,
  passo con ombra che si stringe, anticipo dell'attacco, schiacciamento di chi incassa,
  battito d'ali solo per le famiglie alate, animazione del K.O., e tutto fermo quando il
  sistema chiede meno animazioni

- 18 controlli sulla rotazione della scacchiera, a 1280 e 390 px: col primo giocatore
  la mappatura è diretta, col secondo è girata di mezzo giro; la zona di schieramento
  di chi sta schierando è in basso sullo schermo; le pedine di chi ha il turno stanno
  nella metà bassa; le righe annunciate agli screen reader seguono quello che si vede;
  la freccia «giù» muove verso il basso dello schermo anche a scacchiera girata.

- 10 controlli automatici sulla landing: nessuna risorsa mancante, immagini caricate con
  dimensioni dichiarate e testo alternativo, un solo `h1` con gerarchia coerente, skip
  link funzionante, pulsante che apre davvero il gioco, nessuno scroll orizzontale a
  1280, 820 e 390 px

- 9 controlli automatici sul sistema di difficoltà: selettore etichettato, default
  automatico, forzatura del livello, scelta salvata e ripristinata al ricaricamento,
  scala che sale col rank, profilo mostrato in battaglia, turno avversario senza errori
- Misura a specchio dei quattro profili (300 partite ciascuno) con verifica di simmetria:
  due IA identiche danno ≈50%, come deve essere

- 8 controlli automatici sulla regola del movimento: "Muovi" attivo a inizio turno,
  spostamento registrato, pulsante che diventa "Già mossa" e si disattiva, nessuna casella
  raggiungibile evidenziata dopo il primo spostamento, secondo spostamento rifiutato anche
  forzando la modalità, azione e passo ancora disponibili, movimento di nuovo possibile al
  turno successivo: tutti superati

- 14 controlli automatici sull'accessibilità: struttura della griglia, roving tabindex,
  nomi delle caselle, navigazione con frecce/Home/End, cursore che non esce dal bordo,
  selezione con Invio, contorno di focus visibile, regione live: tutti superati
- 20 controlli automatici sulla fase di schieramento (zona valida, rifiuto dei click
  fuori zona, ritorno in panchina, "schiera a caso" che non sposta il già piazzato,
  avvio bloccato finché mancano pedine): tutti superati
- 26 controlli automatici sulle regole di targeting e sugli effetti corretti dalla FAQ
  (area ortogonale, blocco della linea di tiro, rimbalzo a catena, ring-out, vulnerabilità
  da ribaltamento, cura non su se stessa, movimento dei Corsidi, cariche infinite
  dell'Imperatore): tutti superati

- 720 battaglie simulate headless: nessuna eccezione, nessuno stallo
- Tutte e 13 le mosse speciali eseguite (da 48 a 554 volte ciascuna) senza errori
- Partita completa giocata via UI automatizzata: nessun errore in console
- Curva di difficoltà su 1800 battaglie, con il roster limitato dallo sblocco progressivo.
  La colonna che conta è la seconda: scegliere bene la squadra è ora una decisione vera.

  | Rank | squadra a caso | squadra scelta bene |
  |---|---|---|
  | E | 82% | 89% |
  | D | 62% | 95% |
  | C | 34% | 73% |
  | B | 20% | 80% |
  | A | 7% | 77% |
  | S | 2% | 25% |
- Layout verificato a 1280px e 390px, nessuno scroll orizzontale, schermate nuove
  comprese (scelta della modalità, consegna, squadra del secondo giocatore,
  schieramento a scacchiera girata, gabbie, dispensa, mondo e spedizione)
- Allevamento: 200 battaglie per scenario su tre rank, tabella nella sezione
  «Allevamento»; la prima taratura è stata rifatta perché rendeva il Rank S troppo facile
- Cattura: altre 200 battaglie per scenario, tabella nella sezione «Mondo e cattura»;
  verificato in particolare che la probabilità **dichiarata** sia quella applicata, su
  10.000 estrazioni
- Resistenze: 400 battaglie per scenario a budget di cibo pari, tabella nella sezione
  «Allevamento»
- Sprite: tutti e 34 resi e confrontati fra loro a maschera alfa. Nessuna coppia della
  stessa famiglia produce lo stesso disegno; fra un grado e il successivo cambia almeno
  il 5% della sagoma (in media l'8%), contro l'11% che separa le due famiglie più
  somiglianti; nessuno sprite tocca il bordo della sua casella
- Le suite stanno in **[`prove-automatiche/`](prove-automatiche/)**, col loro README:
  `sh prove-automatiche/batteria.sh` le lancia tutte. Girano in Chromium vero sul
  `gioca.html` che viene pubblicato, non su una copia di prova
- Totale dei controlli automatici sul gioco: **816** (meccaniche 30, schieramento 20,
  schede 30, accessibilità 14, difficoltà 10, regola del movimento 13, passaggio del mouse 14,
  Human vs Human 32, modalità e PC vs PC 44, rotazione 18, animazione 13, salvataggi 25,
  allevamento 28, mondo e cattura 44, edizione demo 14, eco e telemetria 44, suono 23,
  guida 19, musica 31, menu 17, telefono 30, riproduzione 32, sfida del giorno 40,
  collezione 20, resistenze 39, nomenclatura 23, schermata unica 52, spiegazioni 48,
  gesto e campo 39, sprite 10),
  più 21 sulla landing e sull'informativa, 19 sul sito installabile (manifest, icone,
  service worker e prova offline con la rete staccata) e 19 sull'endpoint della
  telemetria, che gira in un contesto vuoto con un D1 finto e senza toccare la rete
- Animazioni: affondo, scossa, numero di danno, proiettile, onda, movimento e ring-out
  verificati attivi nel browser; 3 partite complete giocate via UI senza errori in console
  e senza token fantasma rimasti sul campo

## Testi del sito e attribuzione

Su richiesta del committente, **il sito non riporta più fonti, crediti o riferimenti
esterni**: il footer dice solo che è una demo prodotta da Experiences Srl.

Perché fosse una scelta legittima e non una violazione, le descrizioni delle unità sono
state **riscritte da zero**: ora parlano del ruolo in campo ("Artiglieria. Colpisce da
lontano ma va tenuta al riparo") invece di tradurre la prosa del wiki. Statistiche,
regole e diagrammi sono fatti, non materiale protetto. Così non è dovuta alcuna
attribuzione CC BY-SA e il footer può restare di una riga.

La tracciabilità delle fonti resta in questo README, che è documentazione interna e non
viene pubblicata come pagina del sito.

## I 118 nomi

Fino al 30 settembre 2026 la nomenclatura era quella dell'originale, presa dal wiki
insieme alle statistiche. Le statistiche sono fatti di gioco; i nomi no. Prima di
qualunque passo commerciale andavano sostituiti (`PIANO-VENDITE.md` §10), e la
sostituzione è questa. **Nel gioco non resta nessun nome dell'originale**: lo verifica
`nomi.js`, che cerca tutte e 118 le stringhe vecchie nei dati e nella pagina.

Cosa **non** è cambiato, di proposito: gli **id interni** (`knife_beetle`, `jumping_stab`,
`frutteto`…). Stanno nei salvataggi della gente e nei codici di esportazione, e cambiarli
avrebbe buttato via le partite in corso senza guadagnare niente — un id non si vede.
Restano invece dell'originale le **regole, le statistiche e la struttura del torneo**, che
sono la cosa che stiamo dichiaratamente ricostruendo, e il nome **Insectron** nel titolo:
quello è una decisione a parte, perché cambia URL, manifest e chiave di salvataggio.

**Le famiglie** diventano nomi tassonomici inventati, in `-idi`: si leggono come una
famiglia di insetti e non hanno bisogno di traduzione quando arriverà l'inglese.

| Famiglia | Prima | Unità (rank) |
|---|---|---|
| **Lamidi** | Knife Beetle | Sfregio (1), Rasoio (3), Bipenne (4), Trinciaferro (5) |
| **Voltidi** | Flipperbug | Ribalta (1), Girandola (3), Capovolta (4), Rovescio (5) |
| **Bombardidi** | Bazoo Beetle | Mortaio (3), Colubrina (4), Bombarda (5), Basilisco (6) |
| **Bastidi** | Hercules Beetle | Bastione (1), Barbacane (3), Rivellino (4), Mastio (5) |
| **Falcidi** | Mantis | Falcetta (1), Falcione (2), Roncola (3), Turbine (4) |
| **Tenaglidi** | Staggy | Tenaglia (1), Morsa (2), Ganascia (3) |
| **Silfidi** | Faerie | Lusinga (1), Malia (2), Incanto (3) |
| **Sferidi** | Dung Roller | Ruzzola (2), Macigno (3) |
| **Trivellidi** | Cutterpillar | Trivella (4), Punteruolo (6) |
| **Ventalidi** | Flutterbug | Bufera (4) |
| **Tonantidi** | Dark Emperor | Folgore (1) |
| **Corsidi** | Itsahorse | Galoppo (1) |
| **Coccinidi** | Lady Beetle | Balsamina (3) |

**Le unità**, una per una:

| id (invariato) | Prima | Adesso |
|---|---|---|
| `hercules_beetle` | Hercules Beetle | Bastione |
| `orion_beetle` | Orion Beetle | Barbacane |
| `narcissus_beetle` | Narcissus Beetle | Rivellino |
| `susanoo_beetle` | Susanoo Beetle | Mastio |
| `fishface_beetle` | Fishface Beetle | Mortaio |
| `planet_beetle` | Planet Beetle | Colubrina |
| `kaboom_beetle` | Kaboom Beetle | Bombarda |
| `western_beetle` | Western Beetle | Basilisco |
| `spotted_lady` | Spotted Lady | Balsamina |
| `itsahorse` | Itsahorse | Galoppo |
| `mantis` | Mantis | Falcetta |
| `slaying_mantis` | Slaying Mantis | Falcione |
| `super_mantis` | Super Mantis | Roncola |
| `tornado_mantis` | Tornado Mantis | Turbine |
| `knife_beetle` | Knife Beetle | Sfregio |
| `saber_beetle` | Saber Beetle | Rasoio |
| `hatchet_beetle` | Hatchet Beetle | Bipenne |
| `carver_beetle` | Carver Beetle | Trinciaferro |
| `gum_roller` | Gum Roller | Ruzzola |
| `bomb_roller` | Bomb Roller | Macigno |
| `faerie` | Faerie | Lusinga |
| `handsome_faerie` | Handsome Faerie | Malia |
| `miss_mysterious` | Miss Mysterious | Incanto |
| `staggy` | Staggy | Tenaglia |
| `big_staggy` | Big Staggy | Morsa |
| `stun_staggy` | Stun Staggy | Ganascia |
| `dark_emperor` | Dark Emperor | Folgore |
| `drillerpillar` | Drillerpillar | Trivella |
| `stinger_bill` | Stinger Bill | Punteruolo |
| `butterflap` | Butterflap | Bufera |
| `flipperbug` | Flipperbug | Ribalta |
| `turner` | Turner | Girandola |
| `shoveler` | Shoveler | Capovolta |
| `dustpan` | Dustpan | Rovescio |

**Le mosse** passano all'italiano: la scheda che le descrive è già in italiano,
e tenerle in inglese era un residuo della fonte.

| Prima | Adesso |
|---|---|
| Jumping Stab | Stoccata alta |
| Crushing Horn | Cornata d’urto |
| Cannon Blast | Cannonata |
| Over Easy | Ribaltone |
| Scissor Throw | Proiezione |
| Sickle Dance | Danza delle falci |
| Body Blow | Carica a trivella |
| Wing Flap | Colpo d’ali |
| Healing Jig | Danza balsamica |
| Fill Hole | Sfera scudo |
| Itsakick | Doppio calcio |
| Charm Beam | Raggio di malia |
| The Emperor’s Rage | Ira del Tonante |

**I cibi**. Qui c'è un effetto collaterale sui salvataggi: la dispensa e le trappole
già piazzate sono indicizzate **per nome del cibo**, non per id. Senza conversione
chi aveva giocato avrebbe riaperto il gioco con la dispensa vuota. Da qui lo
**schema 6**: `CIBI_VECCHI` mappa i 22 nomi vecchi sui nuovi, `migra()` li converte
una volta sola e somma le quantità se il salvataggio contiene entrambe le forme.

| Prima | Adesso | | Prima | Adesso |
|---|---|---|---|---|
| Battle Feed | Mangime | | Dark Onyx | Onice scura |
| Diamond | Diamante | | Edensia | Ambrosia |
| Electric Eel | Anguilla elettrica | | Firestone | Pietrafuoco |
| Hard Candy | Caramella dura | | Juraikan Coffee Beans | Chicchi di caffè |
| Lapis Lazuli | Lapislazzuli | | Mellow Banana | Banana matura |
| Nebula Opal | Opale di nebulosa | | Pirate’s Grog | Grog del corsaro |
| Primeval Beef | Bistecca primordiale | | Royal Fruit | Frutto regale |
| Ruby | Rubino | | Sanchez Fruit | Frutto del Vesuvio |
| Seventhmoon | Settima luna | | Smoked Rainbow Newt | Tritone affumicato |
| Stella Crystal | Cristallo di stella | | Sticky Gum | Gomma appiccicosa |
| Ultraspicy Pepper | Peperoncino infernale | | Yago Milk | Latte di rugiada |

**Gli avversari del torneo** diventano nomi italiani, con gli epiteti che compaiono
solo salendo di rank: ai primi gradini si affrontano persone, agli ultimi personaggi.

| Rank | Prima | Adesso |
|---|---|---|
| E | Zak, Randall, Matilda, Keller, Robert | Nino, Rosa, Peppe, Lilla, Carmine |
| D | Matty, Philly, Medis, Cordison, Fabre | Sasà, Immacolata, Mimmo, Concetta, Gaetano |
| C | Retslyn, Sam, Denver, Matthew, Bolgo | Vincenzo, Assunta, Rocco, Nunzia, Salvo |
| B | Emp, Henry, Osmond, Ertessa, Bari | Ferdinando, Zaira, Ottavio, Marisa, Fulvio |
| A | Kalt, Gary, Jaques, Starr, Monj | Nando il Secco, Ada, Corrado, Ersilia, Tancredi |
| S | Camilla, Balta, Nolli, Lucy Dyne, Jin Red | Donna Amalia, Bartolo, Isaura, Fosca, Don Gerardo |

**I premi di rank** sono trofei, non oggetti usabili: cambiano solo di nome.

| Prima | Adesso |
|---|---|
| Battle Feed ×5 | Mangime ×5 |
| Feed Formula ×5 | Mangime rinforzato ×5 |
| Murakumo Type-S | Sciabola Tipo S |
| Devil Forks | Forconi del diavolo |
| Grand Calibur | Gran Calibro |
| Demon Medium | Sigillo del Demone |

Il conto torna: 34 unità + 13 famiglie + 13 mosse + 22 cibi + 30 avversari + 6 premi =
**118**, tutti diversi. La mappatura completa sta anche in `nomi.json` nello scratchpad
della sessione, ed è quella che ha guidato la sostituzione: nessun nome è stato scritto
a mano due volte.

## Licenze e diritti

- **Dati** (statistiche, famiglie, regole, torneo): Rogue Galaxy Wiki (Fandom) e la
  In-Depth FAQ di Paul Michael «VHAYSTE». Sono fatti di gioco, non prosa riutilizzata.
- **Nomi**: nostri, tutti e 118, dal 30 settembre 2026 — vedi «I 118 nomi». Dall'originale
  non resta nemmeno un nome di unità, famiglia, mossa, cibo, avversario o premio.
- **Grafica**: interamente originale, generata da codice. **Nessuno sprite, artwork o
  screenshot del gioco è stato usato**, e non c'è alcun file immagine nel repo.
- *Rogue Galaxy* è © Sony Interactive Entertainment / Level-5. Questo prototipo è un
  esercizio tecnico non affiliato, non autorizzato e non commerciale.
