-- Telemetria di Insectron Arena: una riga per visita, nessuna colonna che dica
-- chi. Non ci sono indirizzi IP, user agent, paesi, identificativi di sessione
-- né chiavi che permettano di collegare due righe fra loro: quello che non c'è
-- non si può perdere, né essere chiesto da nessuno.
CREATE TABLE IF NOT EXISTS visite (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  quando    TEXT    NOT NULL,  -- UTC arrotondato alla mezz'ora (2026-09-30T14:30Z)
  edizione  TEXT,              -- "demo" | "completa"
  primo     TEXT,              -- data della prima apertura su quel browser
  giorni    INTEGER,           -- giorni diversi in cui il gioco è stato aperto
  tappe     TEXT,              -- csv fra apre,squadra,prima,rankD,ritorno
  partite   INTEGER,
  vinte     INTEGER,
  perse     INTEGER,
  rank      TEXT,              -- E D C B A S
  squadra   INTEGER,           -- pedine schierate, 0-5
  hvp       INTEGER,           -- partite contro il computer
  hvh       INTEGER,           -- partite in due sullo stesso schermo
  pvp       INTEGER,           -- partite fra computer
  esemplari INTEGER,           -- insetti nelle gabbie
  catture   INTEGER,           -- catture nel Mondo
  auto      INTEGER NOT NULL,  -- 1 = rapporto automatico, 0 = mandato a mano
  nota      TEXT               -- commento libero: solo con auto = 0
);

-- Le due letture che si fanno sempre: quante visite al giorno, e l'imbuto.
CREATE INDEX IF NOT EXISTS visite_quando ON visite (quando);
CREATE INDEX IF NOT EXISTS visite_tappe  ON visite (tappe);
