# Rigenera la copia che sta nell'hub delle demo partendo da questa, che e'
# quella buona:
#  + i due meta demo:* che servono all'indice dell'hub
#  - la registrazione del service worker (l'hub non ne ha uno)
#
#   python3 prove-automatiche/strumenti/specchia.py [sorgente] [destinazione]
#
# Serve solo a chi tiene anche la copia dentro all'hub. Senza argomenti
# prende il gioco di questo repository e scrive in experiences-demos, se sta
# nella cartella accanto.
import io, os, sys

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.dirname(os.path.dirname(QUI))          # il repository

sorgente = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RADICE, "gioca.html")
dst = sys.argv[2] if len(sys.argv) > 2 else os.path.join(
    os.path.dirname(RADICE), "experiences-demos", "demos", "insectron-arena", "gioca.html")
if not os.path.exists(sorgente):
    sys.exit("sorgente non trovata: " + sorgente)
src = io.open(sorgente, encoding="utf-8").read()

ancora = '<meta name="description" content="Battaglia tattica'
i = src.index(ancora); j = src.index("\n", i) + 1
meta = ('<meta name="demo:tags" content="videogame,gioco,tattico,turni,multiplayer,prototipo,canvas,javascript">\n'
        '<meta name="demo:category" content="videogame">\n')
src = src[:j] + meta + src[j:]

sw = """<script>
/* Service worker: da qui in poi il gioco resta disponibile anche senza rete e
   si puo' aggiungere alla schermata home come un'app. Su file:// o sui browser
   che non lo supportano semplicemente non succede niente. */
if ("serviceWorker" in navigator){
  addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
</script>
"""
if sw not in src: sys.exit("blocco del service worker non trovato")
src = src.replace(sw, "")

io.open(dst, "w", encoding="utf-8").write(src)
print("scritto", dst, len(src), "caratteri")
