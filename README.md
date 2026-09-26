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

> **Quando pubblichi una modifica, alza `VERSIONE` in `sw.js`** (`insectron-v1` →
> `insectron-v2`). È quello che fa buttare via la cache vecchia: senza, chi ha già
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
