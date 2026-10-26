# Piano di vendita — edizioni, pubblicità e store interno

Documento di decisione, il quarto della serie. Stessa struttura degli altri tre, così si
confrontano. Alla fine c'è la decisione da prendere.

Stato attuale: gioco completo e **gratuito**, una pagina statica, **nessun account,
nessun tracciamento, nessun pagamento**. Verificato: nelle due pagine l'unica occorrenza
della parola «analytics» è il commento segnaposto che dice dove incollare uno snippet.

---

## 0. Risposta breve

Tre cose, in ordine di quanto pesano.

1. **Prima di ogni euro vanno cambiati i 118 nomi** presi dall'originale (§10). Non è una
   raccomandazione prudenziale: è la differenza fra un esercizio tecnico gratuito, che
   nessuno tocca, e un prodotto a pagamento costruito su materiale altrui, che gli store
   rimuovono su segnalazione in pochi giorni. **Fatto il 30 settembre 2026**; resta da
   decidere sul titolo (§10).
2. **La struttura a tre edizioni ha un punto che non torna**, ed è meglio scoprirlo adesso:
   così com'è scritta, la terza edizione offre a chi paga *un negozio dove spendere altri
   soldi*. Va girata: si paga per **togliere la pubblicità**, non per avere accesso a un
   negozio (§2).
3. **La pubblicità, ai volumi realistici di una demo, non paga il lavoro che costa.** Con
   500 giocatori al mese sono **6 € al mese**; l'integrazione costa una giornata e mezza e
   si porta dietro il banner del consenso, che oggi non serve perché non tracciamo nessuno
   (§6, §8).

**Quello che consiglierei:** demo gratuita per il feedback (com'è nella vostra idea),
versione completa gratuita, e **un solo acquisto una tantum** che toglie la pubblicità.
Lo store interno con la valuta è l'ultimo passo, si fa solo se i numeri lo giustificano, e
vende **solo cose che non spostano l'equilibrio** (§3).

---

## 1. Le tre edizioni, calate sul gioco che esiste

La buona notizia è che la divisione che avete in mente **esiste già nell'architettura**:
Gabbie e Mondo sono sezioni laterali, due pulsanti in testata e due schermate, e la
battaglia non dipende da loro.

| | Demo «solo arena» | Completa |
|---|---|---|
| Tre modalità (vs PC, in due, PC vs PC) | sì | sì |
| Torneo a sei rank, 34 Insector | sì | sì |
| Salvataggio ed esportazione | sì | sì |
| **Gabbie** (cibo, crescita) | no | sì |
| **Mondo** (cattura, semi) | no | sì |
| Schermate coinvolte | 5 | 7 |

La demo è quindi il gioco di adesso **meno due pulsanti e due schermate**: mezza giornata,
non una riscrittura. Ed è anche una demo onesta — l'arena è il gioco, il resto è la
profondità.

---

## 2. I due punti che non tornano, e come li girerei

**Primo: la terza edizione non offre niente alla seconda.** Se la «completa gratuita con
pubblicità» e la «completa con store interno» hanno lo stesso contenuto, chi paga sta
comprando il diritto di spendere ancora. È una proposta che il pubblico legge male, e a
ragione.

La forma classica, che funziona da quindici anni ed è quella che consiglio:

| Edizione | Prezzo | Cosa dà |
|---|---|---|
| **Demo** | gratis, **senza pubblicità** | l'arena. Serve a farsi provare e a raccogliere feedback |
| **Completa** | gratis, con pubblicità | tutto il gioco |
| **Completa senza pubblicità** | un acquisto una tantum | lo stesso gioco, in pace |

La demo **senza** pubblicità è importante: è la vetrina, e una vetrina con un banner
davanti vende meno. La pubblicità sta nella versione che dà tutto.

**Secondo, e più importante: vendere monete che comprano cibo e trappole disfa il gioco.**

L'intera economia è costruita sulla scarsità, e la scarsità è **misurata**: quattro cibi e
una trappola per rank conquistato, quaranta punti di vita per esemplare che non si
rigenerano, e al Rank S tutte le strade si chiudono fra il 55% e il 57% di vittorie. Sono
quei vincoli a rendere ogni boccone una scelta. Una valuta che compra cibo cancella
esattamente quella scarsità, e con essa il senso di tutte le misurazioni fatte finora: il
Rank S diventa una questione di portafoglio.

C'è anche un problema pratico: i salvataggi stanno in `localStorage`, in chiaro. Una
valuta comprata con soldi veri è **modificabile con dieci secondi di strumenti per
sviluppatori**. Finché tutto è gratuito non importa a nessuno; nel momento in cui si vende,
chi ha pagato scopre che poteva non pagare, e il rimedio è un server con gli account —
altre giornate, un servizio da mantenere, e dati personali da custodire.

---

## 3. Cosa si può vendere senza rompere niente

Il criterio è uno solo: **vendere contenuto e comodità, mai potenza**.

| Cosa | Sposta l'equilibrio? | Note |
|---|---|---|
| **Togliere la pubblicità** | no | il più semplice e il più onesto |
| **Colori e livree** degli Insector | no | gli sprite sono generati da codice: una tavolozza nuova sono poche righe |
| **Slot di gabbia** oltre i dodici | quasi no | comodità, non forza: il budget di vita resta 40 |
| **Pacchetti di mondi** (semi scelti a mano) | no | contenuto vero, e sfrutta una cosa che il gioco ha già |
| **L'edizione completa** come acquisto unico | no | l'alternativa alla pubblicità |
| Cibo, trappole, punti vita | **sì** | è il gioco. Non si vendono |
| Trappole a sorteggio | **sì**, e peggio | sarebbero *loot box*: vedi §9 |

Il vantaggio che avete e che quasi nessuno ha: **con il simulatore potete dimostrarlo**.
Per ogni oggetto in vendita si rimisurano le 200 battaglie per scenario e si verifica che
la curva non si muova. Un negozio che non sposta i numeri non è una promessa di marketing,
è un fatto verificabile.

---

## 4. Tre edizioni da un file solo (e perché un flag non basta)

Tecnicamente è una costante — `EDIZIONE` fra `"demo"`, `"completa"` e `"completa-pro"` —
che nasconde i due pulsanti in testata e le due schermate. Mezza giornata, compresi i
controlli automatici che verificano che nella demo quelle schermate non siano
raggiungibili nemmeno forzando le funzioni.

**Ma un flag lato client non protegge niente:** chiunque apra gli strumenti per
sviluppatori lo cambia. Quindi:

- la **demo** può essere un flag: non c'è niente da proteggere, anzi, se qualcuno lo
  scopre ha visto il gioco intero e magari lo compra;
- l'edizione **a pagamento dev'essere un file diverso**, consegnato dallo store a chi ha
  pagato. Non è più lavoro: sono due build dello stesso sorgente;
- se un giorno si vendono **oggetti singoli**, lì serve davvero un server che tenga il
  registro degli acquisti. È la prima cosa in tutto questo progetto che richiede
  infrastruttura, e va deciso sapendolo.

---

## 5. La demo serve a raccogliere feedback: oggi non ne raccoglie

Va detto chiaro, perché è il punto in cui l'idea attuale rischia di girare a vuoto. Il
gioco **non misura niente**, per scelta: nessun cookie, nessun tracciamento. Se la demo
esce così, il feedback che arriva è quello che qualcuno si prende la briga di scrivervi:
pochissimo, e non rappresentativo.

Il minimo utile, e resta senza cookie e senza banner:

1. **Un imbuto di cinque tappe**: apre il gioco → compone la squadra → finisce la prima
   battaglia → arriva al Rank D → torna il giorno dopo. Cinque numeri che dicono *dove* la
   gente smette, che è l'unica cosa che conta all'inizio.
2. **Statistiche senza cookie**: Cloudflare Web Analytics è gratuito, non usa cookie e non
   richiede il banner. Il posto dove incollarlo è già segnato in testa alle due pagine.
3. **Una domanda sola dentro al gioco**, dopo la prima vittoria: «ci diresti com'è andata?»
   con un campo di testo e nient'altro. Una riga di risposta vale dieci sessioni misurate.

Costo: **mezza giornata**. È la spesa con il ritorno più alto di tutto questo documento,
perché tutte le decisioni sotto (prezzo, pubblicità, negozio) hanno senso solo con dei
numeri davanti.

---

## 6. Pubblicità: cosa comporta davvero

- **Serve un'app vera.** Le reti che pagano decentemente (AdMob, Unity) vivono su Android
  e iOS; sul web aperto un gioco piccolo raccoglie briciole. Quindi la pubblicità implica
  il pacchetto per gli store, non solo il sito.
- **Porta con sé tutto lo stack del consenso.** Oggi il sito non ha banner perché non
  traccia nessuno: è una posizione pulita e difendibile. Con la pubblicità servono una
  piattaforma di consenso, l'informativa, la gestione del rifiuto (e chi rifiuta vale meno).
- **Se fra il pubblico ci sono bambini**, cosa tutt'altro che improbabile per un gioco di
  insetti, si entra nelle regole sui minori: niente annunci personalizzati, categoria
  «famiglie», adempimenti in più.
- **E rende poco.** Vedi la tabella sotto.

---

## 7. Chi è il venditore: la differenza che nessuno guarda

| | Store (Play / App Store) | Sito vostro (Stripe) |
|---|---|---|
| Chi vende | **loro**: sono il venditore verso il cliente | **voi** |
| IVA europea | la gestiscono loro | la gestite voi (OSS, fatture, aliquote per paese) |
| Commissione | 15-30% *(da riverificare)* | ~3% + fisso *(da riverificare)* |
| Beni digitali dentro l'app | **obbligatorio** usare il loro sistema | non pertinente |
| Recesso, rimborsi, assistenza | in gran parte loro | tutta vostra |

Il margine migliore è sul web; gli adempimenti minori sono sugli store. Per una prima
vendita, la quiete amministrativa di Play vale probabilmente più del 27% di differenza.

---

## 8. Il conto della serva

Aritmetica su **ipotesi dichiarate**, non dati di mercato: 3 sessioni al mese per
giocatore, 2 inserzioni a sessione, eCPM 2 €; sblocco a 2,99 € comprato dal 3% dei nuovi;
valuta interna comprata dall'1,5% che spende 4 € al mese; commissione store 30%. **Vanno
rifatti con i vostri numeri appena la demo ne produce.**

| Giocatori/mese | Pubblicità | Sblocco 2,99 € | Valuta interna |
|---|---|---|---|
| 500 | **6 €** | 31 € | 21 € |
| 2.000 | 24 € | 126 € | 84 € |
| 10.000 | 120 € | 628 € | 420 € |
| 50.000 | 600 € | 3.140 € | 2.100 € |

Due letture. La prima: **sotto le decine di migliaia di giocatori la pubblicità non paga
nemmeno la giornata e mezza che costa integrarla**, e in cambio peggiora il gioco per
tutti. La seconda: lo sblocco una tantum rende più della valuta interna fino a volumi alti,
e costa una frazione del lavoro — niente catalogo, niente server, niente registro degli
acquisti.

---

## 9. Obblighi da mettere in conto

- **Informativa privacy** e **condizioni d'uso**: obbligatorie appena c'è pubblicità o un
  acquisto. Oggi non servono perché non raccogliete niente.
- **Condizioni di vendita e diritto di recesso** (consumatori UE): sugli store le gestiscono
  loro, sul vostro sito no.
- **Loot box.** Le trappole hanno una probabilità dichiarata: è una bella meccanica finché è
  gratuita, ma **venderle sarebbe vendere un sorteggio**, che in alcuni paesi europei è
  vietato e ovunque richiede la pubblicazione delle probabilità. Semplicemente: non si
  vendono trappole.
- **Minori**: se il gioco è classificato per bambini cambiano le regole su pubblicità e
  acquisti. Va deciso a monte, perché condiziona tutto il resto.
- **Fatturazione**: con Stripe siete voi il venditore, con IVA OSS e fatture; sugli store no.

---

## 10. Il prerequisito: i 118 nomi

> **Fatto il 30 settembre 2026.** Tutte e 118 le stringhe sono state sostituite e nel
> gioco non resta nessun nome dell'originale; la mappatura completa e il perché di ogni
> scelta stanno nella sezione «I 118 nomi» del `DOCUMENTAZIONE.md`. Resta aperta una sola cosa,
> più piccola ma non nulla: il nome **Insectron** nel titolo e la parola **Insector**
> usata per le creature vengono dal minigioco. Cambiarli tocca URL, manifest, chiave di
> salvataggio e prefisso dei codici esportati, quindi è una decisione a sé.

Non era aggirabile, e per fortuna era poco lavoro, perché il resto era già nostro: le 34
descrizioni sono riscritte da zero, la grafica è interamente generata da codice, e regole e
statistiche sono fatti. Resta solo la nomenclatura:

| Cosa | Quanti | Dove |
|---|---|---|
| nomi delle unità | 34 | `UNITS` |
| famiglie | 13 | `FAMS` |
| mosse speciali | 13 | `FAMS` |
| cibi | 22 | `CIBI` |
| avversari del torneo | 30 | `RANKS` |
| premi dei rank | 6 | `RANKS` |
| **totale** | **118 stringhe** | tre tabelle di dati, zero logica |

Mezza giornata di codice; il tempo vero è trovare 118 nomi belli.

---

## 11. Tempi

| Blocco | Giornate |
|---|---|
| Rinomina completa (i 118 nomi) | 0,5 |
| Edizioni: costante, due build, controlli che la demo resti chiusa | 0,5 |
| **Telemetria minima e domanda dentro al gioco** | **0,5** |
| Pacchetto per lo store (TWA per Android) | 1 |
| Pubblicità: rete, consenso, categoria famiglie | 1,5 |
| Acquisto «togli la pubblicità» (Play Billing) | 1,5 |
| Store interno con valuta: catalogo, server, registro acquisti, anti-manomissione | 3-4 **+ un servizio da mantenere** |

---

## 12. Rischi

| Rischio | Quanto pesa | Come lo si tiene basso |
|---|---|---|
| Vendere su materiale altrui | **il più alto di tutti** | i 118 nomi prima di qualsiasi incasso |
| La valuta disfa l'equilibrio misurato | **alto** | si vende solo ciò che non sposta i numeri, e lo si rimisura |
| Valuta manomissibile in `localStorage` | alto se si vende valuta | non venderla; oppure account lato server |
| La pubblicità costa più di quanto renda | alto ai vostri volumi | rimandarla finché i numeri non la giustificano |
| Tre edizioni da tenere allineate | medio | due build dallo stesso sorgente, mai due sorgenti |
| Il banner del consenso peggiora la demo | medio | la demo resta senza pubblicità e senza tracciamento con cookie |
| Decidere senza dati | **alto, ed è quello attuale** | mezza giornata di telemetria prima di tutto il resto |

---

## 13. Decisione

L'ordine che consiglio, ognuno indipendente dal successivo:

1. **Telemetria minima e la domanda dentro al gioco** (0,5 giornate). Senza, tutto il
   resto si decide a sensazione.
2. **Demo «solo arena»** (0,5 giornate), gratuita e senza pubblicità, come l'avete pensata.
3. **I 118 nomi** (0,5 giornate), quando si decide che diventerà un prodotto.
4. **Pacchetto Android e acquisto «togli la pubblicità»** (2,5 giornate), se i numeri della
   demo dicono che qualcuno gioca davvero.
5. **Pubblicità** (1,5 giornate), solo sopra i diecimila giocatori al mese: sotto, toglie
   più di quanto dia.
6. **Store interno** (3-4 giornate e un servizio), per ultimo, e di soli oggetti che non
   spostano l'equilibrio.

Le prime due fanno **una giornata in tutto** e non impegnano a niente: si possono fare
adesso e decidere dopo, con dei numeri in mano.

---

## 14. Per la chat dedicata al marketing e alle vendite

Questa sezione esiste perché il seguito si farà altrove. Qui c'è tutto quello che serve per
ripartire senza rileggere il resto.

**Lo stato del prodotto, al 27 settembre 2026**

- Gioco completo e gratuito online: <https://naplesexperiences-netizen.github.io/insectorarena/>
- Una pagina statica, 3.599 righe, 187 KB (57 KB compressi sul filo), zero dipendenze,
  funziona offline ed è installabile come app (PWA) su Android e iOS
- Contenuto: torneo a 6 rank con 34 Insector, tre modalità di gioco, gabbie e allevamento,
  mondo e cattura con semi condivisibili, salvataggi esportabili
- 315 controlli automatici, equilibrio misurato a simulazione
- **Nessun account, nessun tracciamento, nessun pagamento, nessun cookie**

**Cosa è già deciso in questo documento**

1. La demo è «solo arena» e va **senza pubblicità**: è la vetrina.
2. Si vende **contenuto e comodità, mai potenza**. Cibo, trappole e punti vita non si
   vendono, perché sono l'economia misurata del gioco.
3. Le trappole a sorteggio non si vendono in nessun caso: sarebbero loot box.
4. L'edizione a pagamento è un **file diverso** consegnato dallo store, non un flag.

**Cosa resta aperto, e tocca a quella chat**

| Domanda | Serve per |
|---|---|
| Prezzo dello sblocco senza pubblicità | il modello di §8 |
| Pubblico: adulti o anche bambini? | decide le regole su pubblicità e acquisti (§9) |
| Store: Play, Apple, web, o più d'uno? | decide chi è il venditore e le commissioni (§7) |
| Nomi nuovi: chi li trova, e con che tono? | il prerequisito di §10 |
| Si vuole una valuta interna, sapendo §2? | l'unico punto dove consiglio di dire no |

**Le ipotesi da sostituire con dati veri** (oggi sono aritmetica, non misure): sessioni al
mese per giocatore, inserzioni a sessione, eCPM, tasso di conversione, spesa media. Escono
tutte dalla telemetria di §5, che va messa **prima** di decidere qualsiasi prezzo.

**Il vincolo che non si tratta:** i 118 nomi (§10) vengono prima di qualsiasi incasso, su
qualsiasi canale. Non è un parere prudenziale, è la condizione per poter vendere.

**Gli altri piani**, per chi arriva da fuori: `PIANO-MULTIPLAYER.md` (partita online, da
decidere), `PIANO-ALLEVAMENTO.md` (fatta la versione ridotta), `PIANO-MONDO.md` (fatta la
forma C; la mappa percorribile no). La documentazione tecnica completa è nel `DOCUMENTAZIONE.md`
di questa cartella.
