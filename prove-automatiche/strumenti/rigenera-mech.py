# game.js = il corpo dello <script> principale di gioca.html, cosi' com'e'.
# mech.js = stub del DOM + quel corpo + le prove sulle meccaniche.
#
#   python3 strumenti/rigenera-mech.py [gioca.html]
#
# I due file sono DERIVATI e non stanno nel repository: la batteria li rifa'
# da sola a ogni giro, cosi' le prove girano sempre sul gioco di adesso e non
# su una copia vecchia di 200 KB.
import io, os, sys

QUI = os.path.dirname(os.path.abspath(__file__))
PROVE = os.path.dirname(QUI)
DEMO = os.path.dirname(PROVE)

sorgente = sys.argv[1] if len(sys.argv) > 1 else os.path.join(DEMO, "gioca.html")
src = io.open(sorgente, encoding="utf-8").read().split("\n")
a = next(i for i, l in enumerate(src) if l == "<script>")
b = next(i for i, l in enumerate(src) if l == "</script>" and i > a)
corpo = "\n".join(src[a+1:b])

io.open(os.path.join(PROVE, "game.js"), "w", encoding="utf-8").write(corpo + "\n")
mech = (io.open(os.path.join(PROVE, "harness.js"), encoding="utf-8").read() + "\n" +
        corpo + "\n" +
        io.open(os.path.join(PROVE, "mech-body.js"), encoding="utf-8").read())
io.open(os.path.join(PROVE, "mech.js"), "w", encoding="utf-8").write(mech)
print("game.js", len(corpo), "caratteri; mech.js", len(mech))
