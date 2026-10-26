/* Endpoint della telemetria di Insectron Arena — Cloudflare Worker + D1.
 *
 * Fa tre cose e nessun'altra:
 *   POST /          riceve un rapporto dal gioco e scrive una riga
 *   GET  /numeri    restituisce gli aggregati, protetto da un segreto
 *   OPTIONS /       risponde al preflight, se mai ne arrivasse uno
 *
 * Le regole che questo file rispetta, e che sono il motivo per cui e' scritto
 * cosi' invece che in tre righe:
 *
 *   1. L'indirizzo IP non viene MAI letto. `request.headers` porta con se'
 *      `CF-Connecting-IP` come qualunque richiesta HTTP: qui non lo tocca
 *      nessuno, non finisce in nessuna colonna e non finisce in nessun log.
 *      Stessa cosa per User-Agent, Referer e paese.
 *   2. Si scrivono SOLO le colonne dichiarate. Un campo sconosciuto nel corpo
 *      viene buttato via, non messo da parte "per sicurezza": cosi' un difetto
 *      futuro nel gioco non puo' far arrivare qui qualcosa che non abbiamo
 *      promesso di raccogliere.
 *   3. L'ora si arrotonda alla mezz'ora. Un orario al secondo, su pochi
 *      giocatori, e' di fatto un modo per riconoscere una visita: mezz'ora no.
 *   4. Le righe piu' vecchie di dodici mesi si cancellano da sole, ogni notte.
 */

const LIMITE_CORPO = 2048;          /* byte: un rapporto vero sta sotto i 400 */
const MARCA = "INSECTRON-ECO ";
const TAPPE = ["apre", "squadra", "prima", "rankD", "ritorno"];
const RANK = ["E", "D", "C", "B", "A", "S"];

const intero = (v, max) => Math.max(0, Math.min(max, parseInt(v, 10) || 0));
const testo = (v, lung) => typeof v === "string" ? v.slice(0, lung) : null;
const data = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? String(v) : null;

/* Alla mezz'ora, in UTC. */
function quandoArrotondato(){
  const d = new Date();
  d.setUTCMinutes(d.getUTCMinutes() < 30 ? 0 : 30, 0, 0);
  return d.toISOString().slice(0, 16) + "Z";
}

function intestazioni(env){
  return {
    "Access-Control-Allow-Origin": env.ORIGINE || "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}

export default {
  async fetch(request, env){
    const url = new URL(request.url);
    const cors = intestazioni(env);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    if (request.method === "GET" && url.pathname === "/numeri") return numeri(request, env, cors);

    if (request.method !== "POST" || url.pathname !== "/")
      return new Response("no", { status: 404, headers: cors });

    /* Corpo: si legge con un tetto, prima di parlare di JSON. */
    const grezzo = await request.text();
    if (!grezzo || grezzo.length > LIMITE_CORPO)
      return new Response(null, { status: 204, headers: cors });   /* si scarta in silenzio */

    let r;
    try {
      const json = grezzo.startsWith(MARCA) ? grezzo.slice(MARCA.length) : grezzo;
      r = JSON.parse(json);
    } catch(e){ return new Response(null, { status: 204, headers: cors }); }

    if (!r || typeof r !== "object" || r.gioco !== "insectron")
      return new Response(null, { status: 204, headers: cors });

    /* Solo le colonne dichiarate, tutte ricondotte a un tipo e a un tetto. */
    const tappe = Array.isArray(r.tappe)
      ? r.tappe.filter(t => TAPPE.includes(t)).join(",") : "";
    const modi = (r.modi && typeof r.modi === "object") ? r.modi : {};
    const riga = {
      quando:    quandoArrotondato(),
      edizione:  r.edizione === "demo" ? "demo" : "completa",
      primo:     data(r.primo),
      giorni:    intero(r.giorni, 3650),
      tappe:     tappe,
      partite:   intero(r.partite, 100000),
      vinte:     intero(r.vinte, 100000),
      perse:     intero(r.perse, 100000),
      rank:      RANK.includes(r.rank) ? r.rank : null,
      squadra:   intero(r.squadra, 5),
      hvp:       intero(modi.hvp, 100000),
      hvh:       intero(modi.hvh, 100000),
      pvp:       intero(modi.pvp, 100000),
      esemplari: intero(r.esemplari, 100),
      catture:   intero(r.catture, 100000),
      auto:      r.auto ? 1 : 0,
      nota:      r.auto ? null : testo(r.nota, 800)   /* il testo libero solo se mandato a mano */
    };

    try {
      await env.DB.prepare(
        "INSERT INTO visite (quando,edizione,primo,giorni,tappe,partite,vinte,perse,rank," +
        "squadra,hvp,hvh,pvp,esemplari,catture,auto,nota) " +
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
      ).bind(riga.quando, riga.edizione, riga.primo, riga.giorni, riga.tappe, riga.partite,
             riga.vinte, riga.perse, riga.rank, riga.squadra, riga.hvp, riga.hvh, riga.pvp,
             riga.esemplari, riga.catture, riga.auto, riga.nota).run();
    } catch(e){ /* il database non risponde: si perde una riga, non si rompe una partita */ }

    return new Response(null, { status: 204, headers: cors });
  },

  /* Pulizia notturna: dodici mesi, come dice l'informativa. */
  async scheduled(evento, env){
    await env.DB.prepare("DELETE FROM visite WHERE quando < ?")
      .bind(new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString().slice(0, 16) + "Z")
      .run();
  }
};

/* Gli aggregati. Nessuna riga singola esce da qui: solo conteggi. */
async function numeri(request, env, cors){
  const chiave = new URL(request.url).searchParams.get("k");
  if (!env.CHIAVE_LETTURA || chiave !== env.CHIAVE_LETTURA)
    return new Response("no", { status: 401, headers: cors });

  const uno = async (sql) => (await env.DB.prepare(sql).first()) || {};
  const tutte = async (sql) => ((await env.DB.prepare(sql).all()).results) || [];

  const tot = await uno("SELECT COUNT(*) n, MIN(quando) dal, MAX(quando) al FROM visite");
  const imbuto = {};
  for (const t of TAPPE){
    const r = await uno("SELECT COUNT(*) n FROM visite WHERE ',' || tappe || ',' LIKE '%," + t + ",%'");
    imbuto[t] = r.n || 0;
  }
  const medie = await uno(
    "SELECT ROUND(AVG(partite),1) partite, ROUND(AVG(giorni),2) giorni, " +
    "SUM(CASE WHEN giorni >= 2 THEN 1 ELSE 0 END) tornati FROM visite");
  const perRank = await tutte("SELECT rank, COUNT(*) n FROM visite WHERE rank IS NOT NULL GROUP BY rank");
  const perGiorno = await tutte(
    "SELECT substr(quando,1,10) g, COUNT(*) n FROM visite GROUP BY g ORDER BY g DESC LIMIT 30");
  const note = await tutte(
    "SELECT substr(quando,1,10) g, nota FROM visite WHERE nota IS NOT NULL ORDER BY id DESC LIMIT 50");

  return new Response(JSON.stringify({
    visite: tot.n || 0, dal: tot.dal || null, al: tot.al || null,
    imbuto, medie, perRank, perGiorno, note
  }, null, 1), { status: 200, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });
}
