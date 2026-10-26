# Allevamento: cibo, crescita e riproduzione — piano di lavoro

Documento di decisione. Stessa struttura del piano per il multiplayer, così i due si
confrontano. Alla fine c'è la decisione da prendere.

> **Nota del 30 settembre 2026.** I nomi che compaiono qui sotto sono quelli
> **dell'originale**, perché questo documento serve a dire da dove vengono i dati.
> Nel gioco non ci sono più: la corrispondenza fra vecchi e nuovi sta nella sezione
> «I 118 nomi» del `DOCUMENTAZIONE.md`.

> **Esito: fatto per intero.** Gabbie, cibo e crescita prima; **la riproduzione poi**,
> con le 18 coppie speciali giocabili delle 23 documentate; e dal 29 settembre anche
> **le sei resistenze in battaglia**, che erano l'ultimo pezzo promesso e non mantenuto.
> Il resoconto, con i numeri rimisurati, sta nelle sezioni «Allevamento» e
> «Riproduzione» del README.

Stato attuale: le unità si sbloccano vincendo i rank del torneo. Le statistiche sono
fisse, decise dalla famiglia e dal rank. Il cibo esiste già — ma solo come nome dei premi.

---

## 1. Cosa deve fare, e cosa no

**Dentro lo scopo**

- **nutrire** un Insector per farlo crescere, spendendo un budget che non si rigenera;
- **far diventare adulta** una larva, che è la condizione per riprodursi;
- **accoppiare** due adulti per ottenere un figlio di rango superiore, che eredita dai
  genitori — i quali nel farlo si consumano;
- un **inventario del cibo**, alimentato dai premi del torneo, che già oggi sono cibi.

**Fuori dallo scopo**

- cattura con trappole, esche e luoghi di spawn: è un altro gioco, quello dell'esplorazione;
- sesso, colore e condizione come tratti estetici: tengo il sesso solo se serve alla
  riproduzione;
- le 136 unità dell'originale: restiamo sulle 34 giocabili documentate.

---

## 2. I dati: ci sono già, e sono di prima mano

Verificato nel materiale scaricato, non a memoria.

**La tabella dei cibi è completa**: 22 cibi × 11 colonne (HP, Forza, Difesa, le sei
resistenze, il costo in punti vita). Qualche riga, per dare la misura:

| Cibo | HP | Str | Def | Resistenze | Vita |
|---|---|---|---|---|---|
| Sanchez Fruit | +3 | +1 | +1 | — | −3 |
| Royal Fruit | +5 | +2 | +2 | +2 a tutte e sei | −1 |
| Firestone, Ruby, Primeval Beef | — | +2 | — | — | −1 |
| Lapis Lazuli, Mellow Banana, Nebula Opal | +5 | — | — | — | −1 |
| Stella Crystal | +2 | — | +1 | +1 a quattro, **−1** a due | −2 |
| Seventhmoon | +1 | — | — | +1 a cinque, **−1** a una | −3 |
| Battle Feed | — | — | — | — | −1 |

Due cose si leggono subito in questa tabella, e sono il cuore della meccanica: **alcuni
cibi tolgono**, e i cibi più generosi costano più vita. Non esiste il pasto gratis.

**La riproduzione è documentata per la maggior parte delle unità**: su 35 schede,
**26 hanno la riproduzione normale** («Staggy + qualsiasi femmina di rango e livello non
superiori») e **23 hanno una riproduzione speciale**, cioè una coppia precisa che dà un
risultato fuori dalla linea di famiglia — per esempio `(M) Flipperbug + Flipperbug (F)`
produce un Dung Roller di rango 3. Quindi l'albero si ricostruisce.

**Le sei resistenze sono già nel dataset** (Knockback, Confusion, Cut, Explosion, Throw,
Poison) e oggi **non sono usate in battaglia**. L'allevamento darebbe loro un senso: le
alleneresti per poi vederle contare. *(Fatto il 29 settembre: cinque contano davvero, il
Veleno no, perché nel roster giocabile non c'è una mossa che avveleni — e il gioco lo
dice invece di inventarla.)*

**Le regole di eredità** stanno nella prosa delle fonti: il figlio prende circa il **90%
della statistica migliore fra i due genitori**, sale di un rango rispetto al genitore più
alto, e se scende sotto il minimo del suo rango viene riportato al minimo.

---

## 3. Il nodo tecnico vero: l'economia dell'originale è fatta di tempo reale

Nell'originale la crescita si paga in **minuti**: cinque minuti perché un Insector
digerisca, mezz'ora per portare una larva ad adulta, un'ora e mezza per un esemplare
forte. Funziona su una console con un gioco lungo attorno; in una pagina web, dove la
visita media dura pochi minuti, è una barriera assurda.

**Va tradotta, non copiata.** Propongo di sostituire il tempo con il **torneo**:

| Originale | Qui |
|---|---|
| 5 minuti per digerire | un pasto per ogni round giocato |
| lo stadio dà esperienza | lo stadio dà **cibo**, come già fa |
| 160 punti vita totali | 160 punti vita totali (**si tiene**) |
| 20 punti per diventare adulto | 20 punti (**si tiene**) |

Il budget di vita resta identico all'originale perché è la parte bella: **140 punti
spendibili** significano che non puoi massimizzare tutto, e ogni insetto diventa una
scelta — corazzato o veloce, specialista o equilibrato. Quello che cambia è solo la
moneta con cui si compra il tempo: round di torneo invece di minuti d'orologio.

---

## 4. Le regole che propongo

1. Ogni Insector ha, oltre alle statistiche: **vita residua** (parte da 160), **stato**
   (larva o adulto), **sesso**, e la **fame** (un pasto per round).
2. **Nutrire** applica gli effetti della tabella e scala il costo dalla vita. A vita zero
   l'insetto non si nutre più: resta com'è, e può solo combattere o riprodursi.
3. **Larva → adulto** quando ha speso 20 punti di vita in cibo. Solo gli adulti combattono
   nei rank alti e solo gli adulti si riproducono.
4. **Accoppiamento**: due adulti compatibili producono un figlio di **rango +1** rispetto
   al più alto dei due, con statistiche pari al **90% della migliore fra i genitori**,
   mai sotto il minimo del suo rango. **I genitori si consumano nel processo.** È questo
   che rende il ciclo un ciclo e non un accumulo.
5. **Coppie speciali**: le 23 combinazioni documentate danno risultati fuori linea, ed è
   il contenuto da scoprire — la ragione per rigiocare.
6. **Il cibo si guadagna** vincendo round e rank. I premi attuali (`Battle Feed ×5`,
   `Feed Formula ×5`) diventano oggetti veri in inventario.

---

## 5. Cosa succede alla progressione attuale

Oggi: vinci un rank, si sblocca la generazione successiva. È una progressione che
funziona e che abbiamo **misurato** con 1800 partite simulate.

Due strade:

| | Come | Rischio |
|---|---|---|
| **A. Sostituire** | le unità si ottengono **solo** allevando | fedele all'originale, ma butta via la curva misurata e allunga molto la prima partita |
| **B. Affiancare** (consigliata) | lo sblocco per rank resta la via breve, l'allevamento è la via profonda per avere esemplari **migliori** di quelli sbloccati | reversibile, non invalida niente, e si può passare ad A dopo aver visto i numeri |

Con B, chi arriva per due minuti gioca come oggi; chi resta scopre che può crescere un
mostro. Mi sembra la scelta giusta per una demo.

**In ogni caso la curva va rimisurata**: se il giocatore può portare in campo unità
allevate, la difficoltà degli avversari — oggi tarata sul moltiplicatore per rank — non è
più quella misurata. Mezza giornata di simulazioni, con gli strumenti che già esistono.

---

## 6. Impatto sul salvataggio

Oggi un salvataggio è una riga da 150 byte. Con l'allevamento diventa un elenco di
insetti con statistiche, vita, stato e sesso: **qualche KB**, comunque lontanissimo dal
limite di `localStorage`.

Il meccanismo per farlo senza rompere niente **c'è già**: si alza `SCHEMA` a 2 e si
aggiunge il gradino dentro `migra()`. I salvataggi attuali diventeranno «hai queste unità
sbloccate, nessun insetto allevato», e chi stava giocando non perde il torneo. È
esattamente il motivo per cui la versione dello schema andava messa prima.

---

## 7. Le schermate

Tre, tutte raggiungibili da una voce nuova in testata («Gabbie»):

1. **Gabbie** — l'elenco dei tuoi insetti: sprite, rango, statistiche, vita residua come
   barra, stato (larva/adulto), sesso. È qui che si vede il patrimonio.
2. **Nutri** — scegli l'insetto e il cibo dall'inventario; **prima di confermare** vedi
   l'effetto: «+3 HP, +1 Forza, +1 Difesa, −3 di vita, restano 137». Niente sorprese:
   la stessa regola della scheda del roster, dove si conferma e non si subisce.
3. **Accoppia** — scegli due adulti compatibili; vedi in anticipo **rango e stima delle
   statistiche del figlio**, e l'avviso che i genitori si consumeranno. Conferma esplicita.

Il resto del gioco non cambia: la squadra si compone dal roster come oggi, solo che fra i
candidati ci sono anche gli esemplari allevati.

---

## 8. Collaudo

Criteri di accettazione:

1. il budget di vita non si può sforare, e a zero l'insetto smette di nutrirsi;
2. venti punti spesi trasformano la larva in adulto, né prima né dopo;
3. il figlio ha rango +1 e statistiche al 90% della migliore fra i genitori;
4. una statistica sotto il minimo del rango viene riportata al minimo;
5. i genitori spariscono dalle gabbie dopo l'accoppiamento;
6. i cibi che **tolgono** tolgono davvero (Stella Crystal e Seventhmoon sono i casi da
   provare);
7. l'inventario scala correttamente e non va sotto zero;
8. un salvataggio della versione 1 si apre, migra e non perde il torneo in corso;
9. la curva di difficoltà rimisurata resta giocabile a ogni rank.

---

## 9. Tempi

| Blocco | Giornate |
|---|---|
| Dati: estrazione della tabella dei cibi e dell'albero di riproduzione dal materiale | 0,5 |
| Alimentazione: vita, fame, crescita, inventario, schermata Nutri | 1 |
| Riproduzione: adulti, sesso, coppie speciali, schermata Accoppia | 1 |
| Gabbie, integrazione col roster, migrazione del salvataggio a schema 2 | 0,5 |
| Rimisurazione dell'equilibrio e collaudo automatico | 0,5 |
| **Totale** | **3,5** |

Una **versione ridotta** — solo alimentazione, senza riproduzione — sta in **1,5
giornate** ed è già un ciclo giocabile: vinci, nutri, torni più forte.

---

## 10. Costi

Nessuno. Nessun servizio, nessun account, nessun dato personale, nessun canone: tutto
resta nel browser e continua a funzionare offline.

È la differenza sostanziale con il multiplayer online, a parità di giornate di lavoro.

---

## 11. Rischi

| Rischio | Quanto pesa | Come lo si tiene basso |
|---|---|---|
| La demo si gonfia e non si spiega più in un minuto | **alto** | l'allevamento è una sezione a parte: chi vuole solo giocare non ci passa mai |
| L'economia tradotta male: o banale o punitiva | alto | il budget di 160 punti è dell'originale ed è già bilanciato; si tara solo il ritmo con cui arriva il cibo |
| La curva di difficoltà salta | medio | rimisurata prima di pubblicare, con gli strumenti che già esistono |
| Salvataggi vecchi illeggibili | basso | schema versionato, già pronto e collaudato |
| Le fonti non coprono tutto (9 unità su 35 senza riproduzione documentata) | basso | per quelle vale la regola generale: predecessore + femmina di rango non superiore |

---

## 12. Confronto con il multiplayer online

| | Allevamento | Multiplayer online |
|---|---|---|
| Giornate | 3,5 (1,5 la versione ridotta) | 3,5 |
| Costo ricorrente | **zero** | ~5 $/mese da verificare |
| Cosa resta da mantenere | niente | un servizio |
| Rischio tecnico | basso: tutto locale e deterministico | medio: rete, disallineamenti, disconnessioni |
| Il lavoro difficile è | **bilanciare** | **far concordare due macchine** |
| Cosa aggiunge | profondità: una ragione per tornare | socialità: una ragione per invitare qualcuno |

---

## 13. Decisione

1. **Versione ridotta** (1,5 giornate): solo alimentazione e crescita. Ciclo completo e
   rischio minimo;
2. **Versione completa** (3,5 giornate): con riproduzione, coppie speciali e gabbie;
3. **Prima il multiplayer**, e l'allevamento dopo;
4. **Nessuno dei due**: il gioco resta com'è.

La mia raccomandazione: **1**, e si decide se proseguire dopo aver visto giocare qualcuno.
È l'unica delle quattro che produce qualcosa di finito in una giornata e mezza senza
lasciare debiti.
