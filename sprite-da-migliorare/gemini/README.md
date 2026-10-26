# Le richieste per Gemini

*16 ottobre 2026.* Tutto il materiale per far generare gli Insector da
**Nano Banana 2.1** (`gemini-nano-banana-2.1`) via API, invece che a mano da
una consolle.

```sh
node genera-richieste.js          # costruisce le richieste da gioca.html
export GEMINI_API_KEY=...         # vedi «La chiave» in fondo
node invia.mjs famiglie bastidi   # una prova da 7 centesimi
```

| file | cosa è |
|---|---|
| `animazioni.txt` | **I quattro prompt di animazione**, in chiaro: attacco, colpito, vittoria, sconfitta. Leggibili e modificabili a mano. |
| `../prompt-famiglie/*.txt` | I 13 prompt di famiglia, generati da `art()` |
| `genera-richieste.js` | Impagina gli uni e gli altri nel formato che l'API vuole |
| `invia.mjs` | Manda le richieste sincrone e salva i ritorni. **Mai eseguito**: qui non c'è una chiave |
| `riferimento.png` | Il ritratto di stile. **Va messo a mano**, vedi sotto |

## Una striscia per stato, non un fotogramma alla volta

La cosa che cambia il conto: si chiede **una striscia di fotogrammi in
un'immagine sola**, non un fotogramma per richiesta. I fogli che ha prodotto
Emergent sono già così — sei pose affiancate in un PNG.

Quindi 34 Insector × 4 stati = **136 generazioni**, non 748. E i fotogrammi
dentro una striscia nascono insieme, il che è anche il motivo per cui restano
coerenti fra loro meglio che generati uno a uno.

| | 2K standard | 2K batch |
|---|---:|---:|
| 13 fogli di famiglia | $0,66 | $0,33 |
| 136 strisce di animazione | $6,85 | $3,43 |
| **tutto, con un terzo da rifare** | **$9,99** | **$4,99** |

## Le due API, e perché due

Google ne espone due, con forma diversa. `genera-richieste.js` scrive in
entrambi i formati perché servono a due momenti diversi del lavoro.

**Interactions** — sincrona, prezzo pieno, risponde subito.

```
POST https://generativelanguage.googleapis.com/v1beta/interactions
x-goog-api-key: $GEMINI_API_KEY

{ "model": "gemini-nano-banana-2.1",
  "input": [ {"type":"text","text":"..."},
             {"type":"image","mime_type":"image/png","data":"<base64>"} ],
  "response_format": {"type":"image","mime_type":"image/png",
                      "aspect_ratio":"4:1","image_size":"2K"} }
```

L'immagine torna in `output_image.data`, in base64. Va usata per **i 13 fogli
di famiglia e per il pilota**: sono poche richieste, le guardi subito e
correggi il prompt nello stesso minuto.

**Batch** — asincrona, metà prezzo, fino a 24 ore. Formato diverso:
`contents` / `parts` invece di `input`, e `response_modalities` dentro
`generation_config`. Una richiesta per riga in un file JSONL, con una
`key` che dice a quale Insector appartiene il ritorno. Va usata per **le 136
strisce**, una volta che il prompt è assestato.

Nota: un lavoro che resta in coda oltre 48 ore scade senza risultati, e i
ritorni si conservano sei settimane. Scaricali.

## Il riferimento di stile, che è la cosa che tiene tutto

**Sul `seed`, per ordine.** Nella **chat** di Gemini non esiste: è un riquadro
di testo. Sull'**API** delle immagini Google non lo documenta, compare in
`generationConfig` in SDK di terze parti, e c'è chi riporta che non viene
comunque rispettato alla lettera. **Higgsfield** invece lo dichiara per
`nano_banana_2_1`. Qui si può mettere con `SEED=12345 node genera-richieste.js`
— tentativo in più, non garanzia.

Il modo documentato per tenere coerente una serie è un altro, e sta già dentro
queste richieste:

1. **La stessa immagine di riferimento in ogni richiesta.** Metti il ritratto
   di Falcetta a 512 px come `riferimento.png` in questa cartella: ogni
   richiesta se lo porta dietro in base64. È quello che tiene insieme tredici
   famiglie generate in momenti diversi. Senza, `genera-richieste.js` avvisa e
   le richieste escono spoglie.
2. **Stessi `aspect_ratio` e `image_size` in tutta la serie**, già fissati.
3. **Le stesse parole in ogni prompt** per quello che non deve cambiare — nei
   modelli di `animazioni.txt` è il paragrafo in maiuscolo.
4. Per correggere una striscia quasi giusta, l'API documenta il
   concatenamento con `previous_interaction_id`: si riparte dal ritorno
   precedente e si chiede solo la modifica. Meglio che rigenerare da zero,
   che rimette in gioco anche quello che andava bene.

## Lo sfondo

I prompt chiedono uno sfondo **pieno** `#2a3147`, non trasparente. L'alfa si
toglie dopo, con uno scontorno deterministico: il colore è piatto e noto, si
rimuove senza ambiguità. Chiedere la trasparenza al modello sarebbe una
variabile in più che non serve.

I fogli di animazione di Emergent tornavano già trasparenti, quelli di
famiglia no: la differenza va risolta da noi, non chiesta al modello.

## La chiave

Serve una chiave API Gemini a consumo (non c'è piano gratuito per le
immagini). Per farla usare a una sessione in cloud, va messa nelle
impostazioni dell'ambiente — menu dell'ambiente nella barra del titolo, poi
Edit — come variabile `GEMINI_API_KEY`, oppure sotto «Network secrets» dove
quella sezione c'è. La raccoglie la sessione successiva. Non va incollata in
chat.

## Prima di generare 136 strisce

Fai il pilota: due famiglie sole, **Bombardidi e Tenaglidi**, che sono le
sagome più lontane dalla mantide del riferimento. Costa 7 centesimi e risponde
alla domanda che conta — se la coerenza regge quando il soggetto non somiglia
al riferimento — invece che a quella a cui abbiamo già risposto, cioè se un
insetto solo viene bene.

E vale sempre quello che dice il README della cartella sopra: quello che torna
è **un'immagine**, mentre oggi il gioco non ha un solo file immagine. La
domanda non è «li incolliamo?» ma «valgono il peso, lo scontorno e la perdita
del parametro colore?».
