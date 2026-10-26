#!/bin/sh
# Genera la build della demo dal gioco completo: cambia una riga, non tocca altro.
#
#   ./crea-demo.sh [sorgente] [destinazione]
#
# Senza argomenti prende il gioco del sito pubblico e scrive gioca-demo.html
# accanto. La demo e' il torneo senza Gabbie e Mondo: le due schermate restano
# nel file ma non sono raggiungibili, e le funzioni che le aprono si rifiutano.
set -e
QUI=$(cd "$(dirname "$0")" && pwd)
SORGENTE="${1:-$QUI/gioca.html}"
DESTINAZIONE="${2:-$QUI/gioca-demo.html}"

if ! grep -q 'let EDIZIONE = "completa";' "$SORGENTE"; then
  echo "errore: in $SORGENTE non trovo la riga dell'edizione" >&2
  exit 1
fi
sed 's/let EDIZIONE = "completa";/let EDIZIONE = "demo";/' "$SORGENTE" > "$DESTINAZIONE"
grep -q 'let EDIZIONE = "demo";' "$DESTINAZIONE" || { echo "errore: la sostituzione non ha preso" >&2; exit 1; }
echo "demo generata: $DESTINAZIONE"
