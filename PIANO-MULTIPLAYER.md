# Multiplayer online — piano di lavoro

Documento di decisione, non ancora implementazione. Descrive come si aggiunge la partita
online fra due dispositivi diversi, quanto costa, quanto dura e cosa resta a carico di
Experiences Srl. Alla fine c'è la decisione da prendere.

Stato attuale: il gioco è una pagina statica su GitHub Pages, con tre modalità — Human vs
PC, Human vs Human sullo stesso dispositivo, PC vs PC. Nessun server, nessun account.

---

## 1. Cosa deve fare, e cosa no

**Dentro lo scopo**

- due persone, su dispositivi diversi, giocano la stessa partita in tempo reale;
- si entra con un **codice stanza** di sei caratteri, generato da chi apre la partita;
- si vede quando l'avversario è connesso, quando sta pensando, quando se n'è andato;
- lo schieramento resta **cieco** come nella modalità a due sullo stesso dispositivo;
- rivincita a squadre invariate senza rifare il giro dei codici.

**Fuori dallo scopo** (sono progetti a sé, non estensioni)

- account e profili;
- matchmaking automatico fra sconosciuti («trova un avversario»);
- classifica globale, che senza un arbitro server-side sarebbe falsificabile;
- chat testuale: apre moderazione e adempimenti che una demo non giustifica.

---

## 2. Perché serve un ponte

Due browser dietro due router domestici non si parlano da soli. Le opzioni reali:

| Strada | Perché sì | Perché no |
|---|---|---|
| **Relay WebSocket** (scelta) | funziona su qualsiasi rete, codice minimo da entrambe le parti | è un servizio da tenere acceso |
| WebRTC peer-to-peer | i dati non passano da noi | serve comunque un server di segnalazione, e su parte delle reti fallisce senza un TURN, che si paga a banda |
| SDK realtime (Firebase, Supabase) | pronto all'uso | introduce una dipendenza JavaScript nel gioco, che oggi è un file unico senza dipendenze e funziona offline |

**Scelta: Cloudflare Workers + Durable Objects.** Una stanza = un Durable Object, che è
l'unico posto dove vive lo stato della partita; i client usano la WebSocket nativa del
browser, quindi **nel gioco non entra nessuna libreria** e la promessa «un file, nessuna
dipendenza, funziona offline» resta intatta: la modalità online si attiva solo se la
scegli.

Il relay **non conosce le regole del gioco**. Ordina i messaggi, li inoltra, custodisce
gli schieramenti fino al momento giusto. Le regole restano nel client, dove sono già
scritte e collaudate.

---

## 3. Il protocollo

Messaggi JSON, una riga per messaggio.

**Dal client al relay**

| Messaggio | Quando | Contenuto |
|---|---|---|
| `hello` | all'ingresso | codice stanza, nome, versione del protocollo |
| `team` | squadra confermata | cinque unità con rank e Re designato |
| `deploy` | schieramento chiuso | posizioni delle proprie cinque pedine |
| `act` | ogni azione | `{seq, tipo, da, a, bersaglio, h}` |
| `end` | fine turno | `{seq, h}` |
| `rematch` | a partita finita | nessuno |
| `bye` | uscita volontaria | nessuno |

**Dal relay al client**

| Messaggio | Significato |
|---|---|
| `joined` | sei il lato in basso o in alto; ecco il **seme** condiviso della partita |
| `peer` | l'altro è entrato, uscito, o è tornato |
| `team` / `deploy` | la roba dell'altro, inoltrata quando è lecito vederla |
| `act` / `end` | l'azione dell'altro, con il suo numero d'ordine |
| `error` | stanza piena, codice inesistente, versione incompatibile, desync |

**Sequenza tipica**: `hello` → `joined` (con seme e ruolo) → squadre → schieramenti →
`peer ready` → turni alternati di `act` fino a `end` → esito calcolato dai due client,
che devono ottenere lo stesso risultato.

---

## 4. Il nodo tecnico vero: la partita non è deterministica

Rimandarsi solo le azioni («muovo da C3 a C4, attacco D4») funziona se i due client,
applicando la stessa azione, ottengono lo stesso risultato. Oggi **non è così**: in
`strike()` il danno ha una variazione casuale del ±10%

```js
const d = raw(t, core * mult * (0.9 + Math.random() * 0.2), label);
```

Con quella riga i due schermi divergono al primo colpo: stessi punti vita a monte,
numeri diversi a valle.

**Soluzione: un generatore pseudo-casuale con seme condiviso.** Il relay assegna un seme
alla stanza; entrambi i client lo usano per un generatore deterministico (mulberry32,
quattro righe) e sostituiscono `Math.random()` **solo nelle parti che decidono l'esito**
— il danno. Restano libere di essere casuali le cose puramente locali: l'ondeggiamento
delle pedine a riposo, la squadra rapida, lo schieramento a caso, che comunque vengono
trasmessi come risultato.

**Controllo di allineamento.** Ogni azione porta con sé `h`, un hash corto dello stato
risultante (posizioni, vita, stato delle pedine). Chi riceve applica l'azione e confronta
il proprio hash con quello ricevuto: se differiscono, la partita si ferma subito con un
messaggio onesto invece di proseguire su due realtà diverse. È anche il modo in cui si
scoprono i bug: un desync è un test che fallisce in produzione.

Effetto collaterale utile: con il seme condiviso la partita diventa **riproducibile**,
quindi i collaudi automatici che già esistono diventano più solidi.

---

## 5. Schieramento cieco senza fidarsi dell'avversario

La regola attuale è che nessuno dei due vede dove si schiera l'altro finché non si
comincia. Online non basta «non mostrarlo»: il messaggio arriverebbe comunque nel browser
avversario, e chi sa leggere una console lo legge.

Se ne occupa il relay, che è l'unico a non giocare: **trattiene** i due `deploy` e li
inoltra solo quando sono arrivati entrambi. Nessuno vede niente prima del tempo, e non
serve crittografia.

---

## 6. Disconnessioni, ritorni, abbandoni

| Situazione | Comportamento |
|---|---|
| Rete che salta per pochi secondi | il client riprova a connettersi da solo; la stanza resta viva |
| Riconnessione entro **2 minuti** | si rientra nella stessa partita: il relay rimanda l'ultimo stato buono |
| Oltre i 2 minuti | partita chiusa; a chi è rimasto viene detto che l'avversario non è tornato |
| Uscita volontaria (`bye`) | l'altro lo sa subito, senza aspettare il timeout |
| Stanza inattiva per **30 minuti** | viene distrutta: non conserviamo partite abbandonate |

Un battito ogni 25 secondi tiene aperta la connessione e accorge il client della caduta
prima che se ne accorga l'utente. In interfaccia serve un indicatore di stato
(connesso / in riconnessione / avversario assente): senza, l'attesa di un turno che non
arriva è indistinguibile da un guasto.

---

## 7. Correttezza delle mosse: cosa è protetto e cosa no

**Protetto.** Ogni azione ricevuta viene validata contro le regole prima di essere
applicata, con le funzioni che il gioco ha già — `moves()`, `foesAdj()`,
`specTargets()`, `canSpecial()`, il limite di un movimento per turno. Un'azione illegale
non viene eseguita: la partita si chiude con un errore. L'hash per turno impedisce di
falsificare gli esiti, e il seme condiviso impedisce di «ritirare i dadi» fino a ottenere
il colpo migliore.

**Non protetto.** Un client modificato può sempre giocare mosse *legali* usando
informazioni che l'interfaccia normalmente non mostra. Qui però, dopo lo schieramento,
**non c'è informazione nascosta**: il campo è visibile a entrambi. L'unico segreto è lo
schieramento iniziale, e quello lo custodisce il relay.

In pratica: per una partita fra amici la copertura è buona. Per un torneo con premi
servirebbe un arbitro server-side che esegue le regole e distribuisce solo i risultati —
un progetto diverso, non un'estensione di questo.

---

## 8. Cosa cambia nel gioco

- una quarta carta nella schermata «Chi gioca»: **Online**, con le due icone umane e il
  simbolo della rete;
- sotto, i campi per **creare** una stanza (che restituisce il codice) o **entrare** con
  un codice ricevuto;
- una riga di stato della connessione in battaglia;
- il motore dei turni **non cambia**: online riusa la modalità a due giocatori che c'è
  già, con l'avversario che invia le azioni invece di toccare lo schermo. Anche la
  rotazione della scacchiera è già pronta: ognuno vede le proprie pedine in basso.

Quello che si aggiunge davvero è il livello di rete, non la logica di gioco.

---

## 9. Collaudo

Tutto provabile **qui**, prima di qualsiasi deploy: il relay gira in locale e due contesti
di browser separati giocano una partita vera l'uno contro l'altro.

Criteri di accettazione:

1. partita completa fra due browser, dal codice stanza all'esito, con gli stessi punti
   vita su entrambi gli schermi a ogni turno;
2. schieramento cieco verificato **ispezionando i messaggi**, non solo l'interfaccia;
3. caduta di rete simulata e riconnessione entro la finestra, con la partita che riprende;
4. abbandono oltre la finestra, gestito con un messaggio e non con un blocco;
5. azione illegale iniettata a mano: rifiutata;
6. divergenza forzata: intercettata dall'hash e dichiarata, non ignorata;
7. le tre modalità esistenti e il gioco offline continuano a funzionare identici.

---

## 10. Tempi

Stimati in giornate di lavoro, non in giorni di calendario.

| Blocco | Giornate |
|---|---|
| Relay: stanza, inoltro, custodia degli schieramenti, battito | 0,5 |
| Determinismo: generatore con seme, hash di stato, validazione delle azioni | 0,5 |
| Client: modalità online, creazione ed entrata in stanza, stato connessione | 1,5 |
| Disconnessioni, riconnessione, abbandono | 0,5 |
| Collaudo automatico a due browser, documentazione, deploy assistito | 0,5 |
| **Totale** | **3,5** |

---

## 11. Costi

| Voce | Costo |
|---|---|
| Traffico | trascurabile: una partita sono poche decine di messaggi da qualche centinaio di byte |
| Cloudflare Workers | piano gratuito ampiamente sufficiente per questi volumi |
| **Durable Objects** | **da verificare al momento dell'attivazione**: storicamente richiedevano il piano Workers a pagamento, circa 5 $ al mese; Cloudflare ne ha poi aperta una parte al piano gratuito. È l'unica voce che potrebbe costare, ed è comunque dell'ordine di 5 $/mese |
| Dominio | quello del sito, già previsto |

Alternative se quella voce non convince: **PartyKit** (stessa tecnologia, piano gratuito),
**Ably** (piano gratuito con connessioni contemporanee limitate), oppure un piccolo
servizio Node su Fly.io o Render. Il protocollo descritto qui non cambia: cambia solo
dove gira il ponte.

---

## 12. Cosa resta a carico di Experiences Srl

1. **Creare l'account** Cloudflare (o del servizio scelto) e lanciare il deploy: un
   comando, con le istruzioni scritte.
2. **Tenere d'occhio il servizio**: da qui in avanti esiste qualcosa che può rompersi
   mentre il sito statico, da solo, non si rompe.
3. **Nota privacy**: il relay vede le mosse e il nome scelto per la partita, e li tiene
   in memoria per la durata della stanza. Nessun account, nessun cookie, niente che
   sopravviva alla partita. Va detto in una riga sul sito.
4. **Decidere cosa succede se cresce**: oggi il dimensionamento è «due amici alla volta».
   Se il gioco girasse davvero, va rivisto.

---

## 13. Rischi

| Rischio | Quanto pesa | Come lo si tiene basso |
|---|---|---|
| Desync fra i due client | alto se non gestito | seme condiviso + hash per turno: si vede subito e si dichiara |
| Reti ostili (hotspot, reti aziendali) | medio | WebSocket su 443, che passa quasi ovunque; nessun P2P |
| Servizio giù | medio | il gioco offline e le altre tre modalità non ne risentono |
| Abuso della stanza (spam di connessioni) | basso | codici a sei caratteri, limite di due per stanza, stanza a scadenza |
| Costo che cresce | basso | volumi minuscoli; la soglia di allarme è il piano, non il traffico |

---

## 14. Se si preferisce non avere un servizio

Resta valida l'alternativa senza infrastruttura: **partita per link**. A fine turno il
gioco produce un link che contiene la partita compressa; lo si manda all'avversario, che
lo apre, muove e lo rimanda. Zero costi, zero manutenzione, nessuna privacy da gestire,
e funziona anche fra dispositivi che non saranno mai connessi insieme. Non è in diretta:
è il gioco per corrispondenza. Costo stimato: **una giornata**.

---

## 15. Decisione

1. **Si procede con il relay** (3,5 giornate, eventuale ~5 $/mese, un servizio da
   mantenere) — e in tal caso serve l'account Cloudflare;
2. **si preferisce la partita per link** (1 giornata, nessun costo ricorrente);
3. **si rimanda**: il sito resta com'è, con le tre modalità attuali.
