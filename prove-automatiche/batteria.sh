#!/bin/sh
# Tutte le prove del gioco, in un colpo solo.
#
#   sh batteria.sh            tutte
#   sh batteria.sh ux sprite  solo quelle nominate
#
# Serve node con Playwright e un Chromium:
#   npm i -D playwright && npx playwright install chromium
# Se Playwright sta altrove: PLAYWRIGHT_PATH=/percorso/a/playwright sh batteria.sh
set -e
QUI=$(cd "$(dirname "$0")" && pwd)
DEMO=$(dirname "$QUI")
PORTA=${INSECTRON_PORTA:-8232}

# mech.js e game.js sono derivati dal gioco: si rifanno adesso, cosi' le prove
# sulle meccaniche girano sul file di adesso e non su una copia vecchia.
python3 "$QUI/strumenti/rigenera-mech.py" >/dev/null

# Alcune prove vogliono un'origine vera (localStorage, service worker). Si
# serve la radice del sito pubblicato se c'e' -- ha manifest, sw.js e icone --
# altrimenti la cartella della demo: gira tutto tranne pwa.js.
RADICE=$(cd "$QUI" && node -e "console.log(require('./comune').RADICE_SITO)")
echo "gioco:  $DEMO/gioca.html"
echo "radice servita su :$PORTA:  $RADICE"
echo

(cd "$RADICE" && exec python3 -m http.server "$PORTA" >/dev/null 2>&1) &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT INT TERM

# Si aspetta che il server RISPONDA, non un secondo a caso: su una macchina
# fredda un secondo non basta, e le prove che vogliono l'origine falliscono
# tutte insieme per un motivo che non c'entra niente con loro.
i=0
while [ $i -lt 50 ]; do
  if python3 -c "import socket,sys; s=socket.socket(); s.settimeout(.2); sys.exit(s.connect_ex(('127.0.0.1',$PORTA)))" 2>/dev/null; then break; fi
  i=$((i+1)); sleep 0.2
done
[ $i -ge 50 ] && { echo "il server statico non risponde sulla porta $PORTA" >&2; exit 1; }

TUTTE="mech deploy a11y move move2 diff cards hover duo modes rot motion salva alleva mondo demo
eco suono guida musica menu mobile ripro sfida coll resist nomi ux spiega tocco sprite
interfaccia arena"
[ $# -gt 0 ] && TUTTE="$*"

cd "$QUI"
tot=0; rotti=0
for t in $TUTTE; do
  out=$(node "$t.js" 2>&1) || true
  ok=$(echo "$out" | grep -c "  OK  " || true)
  ko=$(echo "$out" | grep -c "  KO  " || true)
  echo "$t: $ok (errori: $ko)"
  if [ "$ko" != "0" ]; then echo "$out" | grep "  KO  "; rotti=$((rotti+ko)); fi
  tot=$((tot+ok))
done
echo "TOTALE: $tot controlli, $rotti falliti"

[ $# -gt 0 ] && exit 0
echo
echo "=== endpoint della telemetria (senza rete) ==="
node "$DEMO/telemetria/prova.mjs" 2>&1 | tail -2
echo "=== landing e informativa ==="; node land.js 2>&1 | tail -2
echo "=== sito installabile ==="; node pwa.js 2>&1 | tail -2
