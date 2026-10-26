/* Prova dell'endpoint senza Cloudflare: il Worker gira in un contesto vuoto con
 * un finto D1 che si limita a ricordare le righe. Serve a verificare le regole
 * che contano — quello che NON deve finire nel database — prima di pubblicare.
 *
 *   node prova.mjs
 */
import fs from "node:fs";
import vm from "node:vm";

const sorgente = fs.readFileSync(new URL("./worker.js", import.meta.url), "utf8")
  .replace("export default", "globalThis.WORKER =");
const ctx = vm.createContext({ Response, Request, URL, Date, JSON, Math, console, TextEncoder });
vm.runInContext(sorgente, ctx);
const worker = ctx.WORKER;

const ok = [], ko = [];
const chk = (c, m) => (c ? ok : ko).push(m);

/* --- un D1 finto: ricorda le righe e i parametri con cui sono state scritte --- */
function finto(){
  const righe = [];
  return {
    righe,
    prepare(sql){
      return {
        bind(...p){ return { run: async () => { righe.push({ sql, p }); return {}; } }; },
        run: async () => ({}),
        first: async () => ({ n: righe.length }),
        all: async () => ({ results: [] })
      };
    }
  };
}
const env = () => ({ DB: finto(), ORIGINE: "https://esempio.test", CHIAVE_LETTURA: "segreta" });

const posta = (corpo, e, testate = {}) => worker.fetch(
  new Request("https://eco.test/", { method: "POST", body: corpo, headers: testate }), e);

const RAPPORTO = {
  gioco: "insectron", v: 1, edizione: "completa", primo: "2026-09-01", giorni: 4,
  tappe: ["apre", "squadra", "prima"], partite: 12, vinte: 7, perse: 5,
  rank: "C", squadra: 5, modi: { hvp: 10, hvh: 1, pvp: 1 },
  esemplari: 3, catture: 2, auto: 1
};

/* --- 1. un rapporto buono entra --- */
{
  const e = env();
  const r = await posta("INSECTRON-ECO " + JSON.stringify(RAPPORTO), e);
  chk(r.status === 204, "un rapporto valido riceve 204 e nessun contenuto");
  chk(e.DB.righe.length === 1, "e finisce nel database");
  const p = e.DB.righe[0].p;
  chk(p.includes("completa") && p.includes("apre,squadra,prima") && p.includes("C"),
      "coi campi al posto giusto");
  chk(/^\d{4}-\d{2}-\d{2}T\d{2}:(00|30)Z$/.test(p[0]),
      "l'ora e' arrotondata alla mezz'ora: " + p[0]);
}

/* --- 2. quello che non deve entrare --- */
{
  const e = env();
  await posta("INSECTRON-ECO " + JSON.stringify({
    ...RAPPORTO, ip: "203.0.113.9", nome: "Mario Rossi", email: "x@y.it",
    ua: "Mozilla/5.0", cookie: "abc", id: "u-123"
  }), e);
  const scritti = JSON.stringify(e.DB.righe[0].p);
  chk(!/203\.0\.113\.9|Mario Rossi|x@y\.it|Mozilla|abc|u-123/.test(scritti),
      "i campi che il gioco non manda vengono buttati via, non messi da parte");
  chk(e.DB.righe[0].p.length === 17, "si scrivono esattamente le 17 colonne dichiarate");
}
{
  const e = env();
  await posta("INSECTRON-ECO " + JSON.stringify({ ...RAPPORTO, auto: 1, nota: "testo libero" }), e);
  chk(!JSON.stringify(e.DB.righe[0].p).includes("testo libero"),
      "il commento libero non entra mai in un rapporto automatico");
}
{
  const e = env();
  await posta("INSECTRON-ECO " + JSON.stringify({ ...RAPPORTO, auto: 0, nota: "mi piace" }), e);
  chk(JSON.stringify(e.DB.righe[0].p).includes("mi piace"),
      "ma entra se lo hai scritto e mandato tu");
}

/* --- 3. quello che va scartato in silenzio --- */
for (const [corpo, perche] of [
  ["", "corpo vuoto"],
  ["x".repeat(3000), "corpo oltre il tetto di 2 KB"],
  ["INSECTRON-ECO {non json", "json rotto"],
  ['INSECTRON-ECO {"gioco":"altro"}', "rapporto di un altro gioco"],
  ["INSECTRON-ECO null", "json nullo"]
]){
  const e = env();
  const r = await posta(corpo, e);
  chk(r.status === 204 && e.DB.righe.length === 0, "scartato senza scrivere niente: " + perche);
}

/* --- 4. i numeri non escono senza la chiave --- */
{
  const e = env();
  const senza = await worker.fetch(new Request("https://eco.test/numeri"), e);
  chk(senza.status === 401, "gli aggregati chiedono la chiave");
  const con = await worker.fetch(new Request("https://eco.test/numeri?k=segreta"), e);
  chk(con.status === 200, "e con la chiave rispondono");
  const e2 = { ...env(), CHIAVE_LETTURA: "" };
  const vuota = await worker.fetch(new Request("https://eco.test/numeri?k="), e2);
  chk(vuota.status === 401, "con la chiave non configurata non risponde a nessuno");
}

/* --- 5. le altre strade sono chiuse --- */
{
  const e = env();
  const get = await worker.fetch(new Request("https://eco.test/"), e);
  chk(get.status === 404, "una GET sulla radice non fa niente");
  const opt = await worker.fetch(new Request("https://eco.test/", { method: "OPTIONS" }), e);
  chk(opt.status === 204 && opt.headers.get("Access-Control-Allow-Origin") === "https://esempio.test",
      "il preflight risponde, e solo al sito configurato");
  const r = await posta("INSECTRON-ECO " + JSON.stringify(RAPPORTO), e);
  chk(r.headers.get("Access-Control-Allow-Origin") === "https://esempio.test",
      "e anche la risposta al rapporto porta l'origine giusta");
}

console.log(ok.map(m => "  OK  " + m).join("\n"));
if (ko.length) console.log(ko.map(m => "  KO  " + m).join("\n"));
console.log("\n" + ok.length + " controlli superati, " + ko.length + " falliti");
process.exit(ko.length ? 1 : 0);
