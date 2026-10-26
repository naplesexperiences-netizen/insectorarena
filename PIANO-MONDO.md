# Un mondo esportabile per catturare gli Insector — piano di lavoro

Documento di decisione. Stessa struttura dei piani per il multiplayer e per
l'allevamento, così i tre si confrontano. Alla fine c'è la decisione da prendere.

> **Nota del 30 settembre 2026.** I nomi che compaiono qui sotto sono quelli
> **dell'originale**, perché questo documento serve a dire da dove vengono i dati.
> Nel gioco non ci sono più: la corrispondenza fra vecchi e nuovi sta nella sezione
> «I 118 nomi» del `DOCUMENTAZIONE.md`.

> **Esito: fatta la forma C.** Spedizioni, cattura con trappola ed esca, mondo generato da
> un seme di sei caratteri. È in `gioca.html`; il resoconto, con i numeri rimisurati, sta
> nella sezione «Mondo e cattura» del README. **La forma B — la mappa percorribile — non è
> stata fatta**, e resta qui descritta e prezzata.

Stato attuale: pagina statica, file unico da **3093 righe / 162 KB**, nessuna dipendenza,
funziona offline. Le unità si sbloccano vincendo i rank; gli esemplari da allevare si
creano **gratis** dalla scheda del roster; il cibo si vince conquistando i rank.

---

## 0. Risposta breve

Dipende quasi tutto da una scelta, non dal codice: **che cosa si intende per «mondo»**.

| Forma | Cosa aggiunge al programma | Giornate |
|---|---|---|
| **A. Spedizioni** — luoghi come carte, trappola + esca, esito dopo N round | ~500 righe, una schermata, due tabelle di dati | **2,5** |
| **B. Esplorazione a caselle** — mappa percorribile, terreno, incontri | ~1800 righe, un **secondo gioco** dentro il gioco, grafica di terreno che oggi non esiste | **7,5** |
| **C. A + mondo generato da seme e condivisibile** | A, più generatore e codice del mondo | **3** |

La raccomandazione è **C**. Non perché B sia difficile — è fattibile — ma perché B
raddoppia il programma per cambiare *che cosa è* questa demo, e quella è una decisione
commerciale, non tecnica. A e C aggiungono la cattura senza toccare il gioco che c'è.

Un dato utile per tarare le stime: l'allevamento, appena fatto, è costato **374 righe** e
una giornata e mezza, ed è un sottosistema della stessa taglia della forma A.

E una risposta secca alla domanda «quanto complica il programma»: con A o C, **la
battaglia non si tocca** — zero righe — e il gioco cresce di circa un sesto, come è
cresciuto con le gabbie. Con B cresce del 60% e va disegnato un mondo che oggi non
esiste.

---

## 1. Cosa deve fare, e cosa no

**Dentro lo scopo**

- **catturare** Insector invece di crearli dal nulla, spendendo trappole ed esche;
- **luoghi** diversi, con abitanti diversi: dove metti la trappola decide cosa prendi;
- un **mondo che è un dato**, non codice: si esporta, si passa a un'altra persona, si
  importa, e chi lo riceve gioca lo stesso mondo;
- gli esemplari catturati entrano nelle **gabbie** già fatte e si allevano come oggi.

**Fuori dallo scopo** (sono progetti a sé)

- esplorazione a caselle con personaggio che cammina: vedi §4, forma B;
- combattimento nel mondo (incontri casuali): il gioco di battaglia è il torneo, e
  raddoppiarlo significa bilanciarlo due volte;
- economia in denaro: le quote d'iscrizione del torneo sono **scritte ma non
  implementate**, non c'è portafoglio, e aggiungerlo è un altro sottosistema;
- la mappa di *Rogue Galaxy*. Sul perché, §3.

---

## 2. Cosa dicono le fonti, e soprattutto cosa non dicono

Il dataset `insectors.json` ha già tre campi che nessuna delle altre funzioni ha usato:
`traps`, `bait`, `location`. Li ho contati, ed è la parte più importante di questa
analisi:

| Campo | Unità coperte (su 35) |
|---|---|
| `location` — dove si trova | **19** |
| `bait` — con che esca | **17** |
| `traps` — con che trappola | **12** |
| tutti e tre insieme | **12** |

Quindi **per due unità su tre la cattura non è documentata**. È una differenza netta
rispetto a tutto quello che abbiamo fatto finora: le statistiche c'erano tutte, i
diagrammi delle mosse c'erano tutti, la tabella dei 22 cibi c'era per intero.

Ma contata per unità, questa tabella dice la cosa sbagliata. **Una tabella di spawn non
lavora per unità, lavora per famiglia** — è la famiglia che decide l'esca, come è la
famiglia che decide la mossa speciale. E contata per famiglia la copertura cambia faccia:

| | Famiglie giocabili coperte (su 13) |
|---|---|
| almeno un'esca documentata | **11** — mancano solo Cutterpillar e Flutterbug |
| almeno una trappola documentata | 10 |
| almeno una località | 11 |

Undici famiglie su tredici sono quindi **dato, non invenzione**. È questa riga che rende
la cosa fattibile senza inventarsi un gioco intero: per le due che restano vale una regola
dichiarata, non una scelta caso per caso.

E c'è un secondo aggancio, altrettanto buono:

> **13 esche su 15 sono cibi che abbiamo già implementato** — Sanchez Fruit, Firestone,
> Ruby, Lapis Lazuli, Diamond, Edensia, Royal Fruit, Sticky Gum, Electric Eel, Yago Milk,
> Ultraspicy Pepper, Smoked Rainbow Newt, Juraikan Coffee Beans. Le due che mancano sono
> Pirate Grog e «Iago Milk», che nelle fonti è la stessa cosa di Yago Milk scritta male.

Vuol dire che **la dispensa esiste già** ed è il posto giusto da cui pescare l'esca:
niente inventario nuovo, e l'esca diventa una spesa vera, perché quel cibo non lo darai
più da mangiare a nessuno. La meccanica economica è già lì, collaudata e misurata.

**Le statistiche alla cattura, invece, le fonti non le danno.** Il dataset ha `min` e
`max` per ogni statistica, ma il `max` è 999 (HP) e 99 (le altre): è il **tetto di
crescita** del sistema originale, non la forbice di ciò che trovi in natura. Oggi noi
usiamo il `min` come statistica base dell'unità. Quindi la varianza del selvatico è
**nostra da decidere**, e va tenuta stretta — proposta: `min` più 0-10%, arrotondato.
Pescare fra min e max darebbe mostri da 999 HP in un gioco dove il Dark Emperor ne ha
300.

---

## 3. Il nodo vero, prima ancora del codice: la mappa non si può usare

Le `location` del dataset sono i luoghi di *Rogue Galaxy*: Juraika (9 citazioni), Zerard
(7), Vedan (5), Rosa (4), Rosencaster Prison (4), Mariglenn (3), Burkaqua (3), Gladius
Towers, Starship Factory, Ghost Ship. Non sono nomi: sono **livelli di un gioco
altrui**, con una geografia che non abbiamo e che non potremmo disegnare senza copiarla.

Tutta la difesa costruita finora sta in una distinzione: implementiamo **fatti e regole**
(statistiche, range, formule), abbiamo **riscritto da zero** le descrizioni, e la grafica
è **generata da codice**, zero pixel altrui. Un mondo fatto di «Juraika, vicino al
teletrasporto» riprodurrebbe esattamente la cosa che abbiamo evitato: l'ambientazione.

**Proposta: habitat nostri, derivati dal fatto utile.** Il fatto utile non è *dove* vive
un insetto in quel gioco, è **con che esca si prende** — e quello è un dato, non
un'ambientazione. Gli habitat si ricavano raggruppando le esche:

| Habitat (nome nostro) | Esche | Famiglie che ci vivono |
|---|---|---|
| **Frutteto** | Sanchez Fruit, Edensia, Juraikan Coffee Beans | Hercules Beetle, Knife Beetle, Mantis, Faerie, Bazoo Beetle |
| **Cava** | Ruby, Lapis Lazuli, Diamond | Flipperbug, Mantis, Dung Roller, Staggy |
| **Fornace** | Firestone, Ultraspicy Pepper | Staggy, Lady Beetle, Dung Roller |
| **Pantano** | Electric Eel, Smoked Rainbow Newt, Yago Milk | Staggy, Itsahorse, Flipperbug, Dung Roller |
| **Radura reale** | Royal Fruit, Sticky Gum | Dark Emperor, Faerie, Lady Beetle |

**Ogni riga di quella terza colonna è documentata**: Sanchez Fruit prende davvero
Hercules Beetle, Knife Beetle, Mantis e Faerie; Royal Fruit prende il Dark Emperor;
Firestone prende Staggy e Lady Beetle. Nostri sono solo i cinque **nomi** e il fatto di
aver raggruppato le esche per tipo — frutta, minerali, fuoco, acqua, cose rare.

Restano fuori **Cutterpillar e Flutterbug**, che nel dataset non hanno né esca, né
località, né trappola. Qui un dato da seguire non c'è, e non serve fingere che ci sia:
la Flutterbug è l'unica famiglia che **vola** e la Faerie l'unica altra che non cammina,
quindi le metto insieme nel Frutteto; la Cutterpillar, che carica dritta, nel Pantano.
Sono due scelte nostre, dichiarate come tali, e sono due righe di tabella: se domani
salta fuori il dato, si cambiano senza toccare il codice.

---

## 4. Che forma dare al mondo

### A. Spedizioni (consigliata come base)

Nessuno cammina. Il mondo è un elenco di luoghi, disegnati come le carte della modalità
già esistente. Scegli **luogo + trappola + esca**, confermi, e la trappola resta piazzata:
l'esito si raccoglie dopo **N round di torneo giocati**. È la stessa traduzione che
abbiamo già fatto per l'allevamento — il tempo dell'originale diventa round di torneo —
e ha il pregio di legare le due cose: giochi per raccogliere.

Costo: una schermata, due tabelle, nessuna grafica nuova. Gli sprite ci sono già.

### B. Esplorazione a caselle

Un mondo percorribile, con terreno e incontri. Va detto per intero cosa comporta:

1. **grafica di terreno che oggi non esiste.** Tutto il nostro disegno da codice sono
   insetti: zampe, elitre, antenne. Erba, roccia, acqua e alberi sono un vocabolario
   nuovo, ed è la metà del lavoro, non un contorno;
2. **un secondo ciclo di gioco**: movimento continuo, camera, collisioni, stato del
   mondo separato da quello della battaglia;
3. **un secondo collaudo**: le 271 prove automatiche attuali coprono la battaglia, non
   coprirebbero niente di tutto questo;
4. il file unico passa da 162 KB a **250 KB circa**. Tecnicamente irrilevante — il
   service worker lo mette in cache lo stesso — ma diventa un programma che non si tiene
   più in testa tutto insieme, e quello si paga a ogni modifica futura.

Non è un «no». È un «è un'altra commessa», e va prezzata come tale.

### C. A, più il mondo generato da un seme

Il mondo nasce da un **seme** (sei caratteri). Stesso seme, stesso mondo: quali luoghi
esistono, chi ci abita, con che probabilità. Il seme si scambia come una parola, ed è
questo che rende il mondo davvero **esportabile**: «gioca il mondo `K7F2QA`» è tutto
quello che serve dire. Costa mezza giornata in più di A, perché il generatore è
deterministico e piccolo — e il generatore con seme era già previsto nel piano del
multiplayer, per un altro motivo.

---

## 5. «Esportabile»: cosa vuol dire in pratica, e un vincolo da conoscere

Il vincolo: **il gioco deve continuare a funzionare da `file://` e offline**, e da lì un
`fetch("mondo.json")` è bloccato dal browser. Quindi il mondo **di base va incorporato**
nella pagina, come lo sono i 34 Insector e i 22 cibi. Esportabile non significa «file
esterno che il gioco scarica».

Significa queste tre cose, tutte possibili senza rompere niente:

1. **Esportare** il proprio mondo come **codice** (`INSECTRON-MONDO-…`) o come file
   scaricato. Il meccanismo c'è già, fatto e collaudato per i salvataggi: marca,
   base64, impronta FNV-1a, rifiuto pulito di un codice troncato.
2. **Importare** un mondo da un codice incollato o da un file scelto a mano. Leggere un
   file scelto dall'utente funziona anche offline e anche da `file://`: è il browser che
   lo passa al gioco, non una richiesta di rete. Questo è già il modo in cui si
   ripristina un salvataggio.
3. **Il seme** (forma C): sei caratteri, e il mondo si ricostruisce identico. È
   l'esportazione più piccola possibile — e quella che la gente si scambia davvero.

**Salvataggio**: si alza `SCHEMA` a 3 e si aggiunge il gradino in `migra()`. I
salvataggi di oggi diventeranno «nessun mondo esplorato, nessuna trappola piazzata» e
non perderanno né torneo né gabbie. Il costo in byte è trascurabile: il mondo generato da
seme si salva come **seme più elenco di quel che hai preso**, non come mappa.

---

## 6. Le regole che propongo

1. **Cinque habitat** (§3). Ognuno dichiara, prima che tu spenda qualcosa, **quali
   famiglie ci vivono e con che probabilità**. Stessa regola della dispensa, dove ogni
   cibo dice effetto e costo prima dell'uso: niente sorprese.
2. **Una spedizione** consuma **un'esca dalla dispensa** e **una trappola**. L'esca
   decide *chi* può farsi prendere, la trappola (I, II, III — sono nei dati) decide *fino
   a che rango*. Le trappole si vincono conquistando i rank, come il cibo: nessuna valuta
   da implementare.
3. **L'esito arriva dopo N round** di torneo giocati, non subito. Il tempo dell'originale
   tradotto in round, come per il cibo.
4. **L'esemplare selvatico** arriva come **larva**, con statistiche pari al minimo della
   sua unità più 0-10%, e con il budget di vita pieno. Da lì è materia per le gabbie che
   già esistono: la cattura diventa **la sorgente** dell'allevamento.
5. **Il rango di quel che trovi è legato al rank del torneo**, come lo sblocco del
   roster. Altrimenti si va a catturare un rango 6 al Rank E e la curva misurata salta.
6. Nel mondo **non si combatte**. Si piazza e si raccoglie.

**Effetto collaterale, ed è quello buono:** oggi un esemplare da allevare si crea gratis
dalla scheda del roster. È il punto più debole di quel che abbiamo consegnato — non
costa niente, quindi non è una scelta. Con la cattura, un esemplare costa un'esca, una
trappola e dei round. L'allevamento smette di essere un distributore e diventa la fine di
una catena: **vinci → esca e trappola → cattura → cresci → torni più forte.**

---

## 7. Cosa cambia nel gioco che c'è

| Pezzo | Cosa cambia |
|---|---|
| Testata | una voce in più accanto a «Gabbie» |
| Schermata nuova | **Mondo**: luoghi, trappole piazzate, raccolto |
| Scheda del roster | «Alleva un esemplare» diventa «Cattura un esemplare» → porta al Mondo (o resta, se si sceglie di tenere entrambe le vie: §12) |
| Gabbie | invariate: ricevono l'esemplare invece di crearlo |
| Dispensa | invariata come magazzino, ma il cibo ha ora **due usi in concorrenza** — ed è una tensione buona |
| Premi di rank | oltre ai 4 cibi, **una trappola** |
| Salvataggio | schema 3, un gradino in `migra()` |
| Battaglia | **niente.** Zero righe toccate |

Quell'ultima riga è la cosa da guardare: come l'allevamento, il mondo è una sezione
laterale. Chi entra per giocare una partita non ci passa mai.

---

## 8. Impatto sul programma, in numeri

| | Oggi | Con A/C | Con B |
|---|---|---|---|
| Righe di `gioca.html` | 3093 | ~3600 | ~4900 |
| Peso del file | 162 KB | ~185 KB | ~250 KB |
| Schermate | 6 | 7 | 9 |
| Controlli automatici | 271 | ~295 | ~330 |
| Grafica nuova da disegnare | — | nessuna | **terreno: un vocabolario intero** |

Il peso non è un problema: il service worker mette in cache un file solo e il gioco resta
installabile e offline. Il costo vero di B non sono i byte: sono le quattro giornate di
mappa — di cui **circa due di solo disegno da codice** — e il fatto che da lì in poi ogni
modifica costa di più.

---

## 9. L'equilibrio va rimisurato

Se si possono portare in campo esemplari **catturati e cresciuti**, la curva del torneo
non è più quella misurata — vale esattamente come per l'allevamento, dove l'abbiamo
rifatta e la prima taratura era sbagliata (Rank S al 69%, cioè una formalità).

Gli strumenti ci sono: `sim-alleva.js` gira 200 battaglie per scenario in pochi minuti.
Scenari da misurare: chi non cattura, chi cattura poco, chi cattura il massimo possibile
a ogni rank. **Mezza giornata**, ed è già dentro le stime.

---

## 10. Collaudo

Criteri di accettazione:

1. una spedizione consuma esattamente un'esca e una trappola, e non parte se manchi di
   una delle due;
2. le probabilità dichiarate sono quelle applicate — verificato su 10.000 estrazioni, non
   a occhio;
3. la trappola non si può raccogliere prima dei round previsti, neanche forzando la
   funzione;
4. un esemplare catturato entra nelle gabbie come larva, con il budget pieno, e si nutre
   come gli altri;
5. il rango di quel che si cattura resta dentro la banda del rank corrente;
6. lo stesso seme produce lo stesso mondo su due browser diversi (forma C);
7. un mondo esportato e reimportato è identico, e un codice troncato viene rifiutato con
   un messaggio;
8. un salvataggio di schema 2 si apre, migra, e non perde né torneo né gabbie;
9. la curva di difficoltà rimisurata resta giocabile a ogni rank;
10. le tre modalità di gioco e il funzionamento offline restano identici.

---

## 11. Tempi

Giornate di lavoro, non di calendario.

| Blocco | A | C | B |
|---|---|---|---|
| Dati: habitat, tabelle di spawn, mappatura famiglia → esca | 0,5 | 0,5 | 0,5 |
| Cattura: schermata Mondo, trappole, esca, raccolto differito | 1 | 1 | 1 |
| Mondo come dato: esportazione, importazione, schema 3 | 0,5 | 0,5 | 0,5 |
| Generatore con seme, mondo condivisibile | — | 0,5 | 0,5 |
| Mappa percorribile: terreno da disegnare, movimento, camera | — | — | 4 |
| Rimisurazione dell'equilibrio e collaudo automatico | 0,5 | 0,5 | 1 |
| **Totale** | **2,5** | **3** | **7,5** |

---

## 12. Una decisione di design da prendere adesso, non dopo

**La cattura sostituisce la creazione gratuita, o la affianca?**

| | Come | Conseguenza |
|---|---|---|
| **Sostituisce** | gli esemplari si ottengono **solo** catturando | la catena diventa vera, l'allevamento acquista un costo. Ma chi apre il gioco per due minuti non vede più le gabbie |
| **Affianca** (consigliata) | creazione gratuita limitata (tre esemplari), poi solo cattura | nessuno resta fuori, e il mondo è la via per andare oltre. Reversibile |

Io consiglio **affianca**, per lo stesso motivo per cui l'allevamento è stato affiancato
allo sblocco per rank: una demo deve funzionare anche per chi non arriva in fondo.

---

## 13. Costi

Nessuno ricorrente: nessun servizio, nessun account, nessun dato personale. Resta una
pagina statica che funziona offline. È la stessa differenza sostanziale che l'allevamento
aveva rispetto al multiplayer online.

Il costo qui non è in euro, è in **superficie**: ogni funzione aggiunta è una funzione da
spiegare, da collaudare e da mantenere.

---

## 14. Rischi

| Rischio | Quanto pesa | Come lo si tiene basso |
|---|---|---|
| La demo smette di spiegarsi in un minuto | **alto** | il Mondo è una sezione laterale, come le Gabbie: la battaglia non cambia di una riga |
| Le parti inventate si vedono e stonano | medio | 11 famiglie su 13 hanno l'esca documentata: si inventano i nomi degli habitat, non chi ci vive. Per le due scoperte vale una regola dichiarata |
| Si riproduce l'ambientazione altrui | **alto se ignorato**, nullo se gestito | luoghi nostri, mai i nomi del gioco originale (§3) |
| La curva di difficoltà salta | medio | rimisurata prima di pubblicare, strumenti già pronti |
| Cattura banale (prendi tutto) o punitiva (non prendi mai) | medio | probabilità dichiarate e tarate su simulazione, non a sensazione |
| Salvataggi vecchi illeggibili | basso | schema versionato, già collaudato due volte |
| Il file unico diventa ingestibile | basso con A/C, **medio con B** | è la ragione principale per cui B è prezzato a parte |

---

## 15. Confronto con gli altri due piani

| | Mondo (A/C) | Allevamento | Multiplayer online |
|---|---|---|---|
| Giornate | 2,5-3 (7,5 la forma B) | 3,5 — fatta la ridotta in 1,5 | 3,5 |
| Costo ricorrente | **zero** | zero | ~5 $/mese da verificare |
| Da mantenere dopo | niente | niente | un servizio |
| Quanto è documentato nelle fonti | **11 famiglie su 13** (ma solo 12 unità su 35) | tutto: 22 cibi con effetti e costi | non pertinente |
| Il lavoro difficile è | **inventare senza che si veda** | bilanciare | far concordare due macchine |
| Cosa aggiunge | una catena: vinci → catturi → cresci | profondità | socialità |
| Rischio principale | la demo diventa un altro gioco | economia sbagliata | rete e disallineamenti |

---

## 16. Decisione

1. **Forma C** (3 giornate): spedizioni, cattura con trappola ed esca, mondo generato da
   seme ed esportabile come codice. Nessun costo ricorrente, la battaglia non si tocca,
   e l'allevamento acquista finalmente un prezzo;
2. **Forma A** (2,5 giornate): come sopra, senza seme né mondo condivisibile — si
   esporta comunque, ma come dato, non come parola da passare;
3. **Forma B** (7,5 giornate): mondo percorribile a caselle. È un'altra commessa, con
   due giornate di grafica di terreno che oggi non esiste;
4. **Si rimanda**: il gioco resta com'è, e gli esemplari continuano a nascere gratis.

La mia raccomandazione è **1**, con la variante «affianca» del §12. È la sola che, a
parità di giornate con gli altri due piani, **sistema un buco che abbiamo già in casa** —
l'esemplare gratis — invece di aggiungere soltanto materia nuova.

Se invece l'obiettivo è che la gente *esplori*, allora è la 3 e va detto chiaro: non è
l'estensione di questa demo, è il gioco successivo.
