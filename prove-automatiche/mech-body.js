let ok=0, ko_=0;
function check(n,c,x){ if(c){ok++;console.log("  OK  "+n);} else {ko_++;console.log("  KO  "+n+(x?" -> "+x:""));} }
function setup(){ S.units=[]; S.over=false; S.champion=true; }
function put(id,side,x,y,king){ const u=mk(byId[id],side,!!king,1); u.x=x;u.y=y; S.units.push(u); return u; }

console.log("\nCampo " + NX + " colonne x " + NY + " file\n");
console.log("1. Le speciali colpiscono solo le 4 caselle ortogonali");
setup();
const kb = put("knife_beetle","p",2,3);
const diag = put("mantis","e",3,4);
check("Stoccata alta non raggiunge la diagonale", specTargets(kb).length===0);
const orto = put("mantis","e",2,2);
check("Stoccata alta raggiunge l ortogonale", specTargets(kb).includes(orto));
check("l attacco normale raggiunge la diagonale", foesAdj(kb).includes(diag));

console.log("\n2. Danza delle falci resta a 8 direzioni");
setup();
const mn = put("mantis","p",2,3); put("staggy","e",3,4);
check("il nemico in diagonale viene falciato", foesAdj(mn).length===1);

console.log("\n3. Cannonata: bloccato da chiunque, amico o nemico");
setup();
const bz = put("fishface_beetle","p",2,6);
const far = put("mantis","e",2,4);
check("bersaglio a 2 caselle in linea", specTargets(bz).includes(far));
put("staggy","p",2,5);
check("un alleato in mezzo blocca il tiro", specTargets(bz).length===0);
setup();
const bz2 = put("fishface_beetle","p",2,6); const d2 = put("mantis","e",4,4);
check("non spara in diagonale", !specTargets(bz2).includes(d2));

console.log("\n4. Proiezione: nessun danno diretto, rimbalzo a catena");
setup();
const st = put("staggy","p",2,4);
const vic = put("mantis","e",2,3);
const wall = put("staggy","e",2,5);
const hp0 = vic.hp, hpw = wall.hp;
doSpecial(st, vic);
check("il bersaglio perde HP solo per il rimbalzo", vic.hp < hp0);
check("anche l ostacolo incassa", wall.hp < hpw);
check("il bersaglio finisce oltre l ostacolo", vic.alive ? vic.y===6 : true, "y="+vic.y);

console.log("\n5. Proiezione verso il bordo = ring-out");
setup();
const st2 = put("staggy","p",2,0);
const v2 = put("mantis","e",2,1);
doSpecial(st2, v2);
check("scagliato fuori dal campo", !v2.alive, "vivo, y="+v2.y);

console.log("\n6. Folgore: l attacco normale atterra e sbalza");
setup();
const de = put("dark_emperor","p",2,4);
const t3 = put("mantis","e",2,3);
basicAttack(de, t3);
check("il bersaglio e stordito", !t3.alive || t3.stun>0);
check("ed e stato spinto indietro", !t3.alive || t3.y===2, "y="+t3.y);

console.log("\n7. Ira del Tonante: bersaglio singolo, a distanza, senza ricarica");
setup();
const de2 = put("dark_emperor","p",2,5);
const a1 = put("mantis","e",2,3), a2 = put("staggy","e",3,4);
const tg = specTargets(de2);
check("raggiunge bersagli entro 2 caselle", tg.includes(a1) && tg.includes(a2));
const h2 = a2.hp;
doSpecial(de2, a1);
check("colpisce solo il bersaglio scelto", a2.hp === h2);
check("nessuna ricarica", de2.cd === 0);
check("puo rifarlo subito", canSpecial(de2));

console.log("\n8. Ribaltone: immobile e vulnerabile");
setup();
const fb = put("flipperbug","p",2,3); const v8 = put("mantis","e",2,2);
doSpecial(fb, v8);
check("immobilizzato 2 turni", !v8.alive || v8.stun===2);
if (v8.alive){
  const prima = v8.hp; raw(v8, 100); const danno1 = prima - v8.hp;
  v8.stun = 0; const prima2 = v8.hp; raw(v8, 100); const danno2 = prima2 - v8.hp;
  check("da ribaltato incassa di piu", danno1 > danno2, danno1+" vs "+danno2);
}

console.log("\n9. Danza balsamica: solo alleati ortogonali, mai se stessa");
setup();
const lb = put("spotted_lady","p",2,3);
const ally = put("staggy","p",2,2); const allyD = put("mantis","p",3,4);
lb.hp = 10; ally.hp = 10; allyD.hp = 10;
doSpecial(lb, null);
check("cura l alleato ortogonale", ally.hp > 10);
check("non cura quello in diagonale", allyD.hp === 10);
check("non cura se stessa", lb.hp === 10);

console.log("\n10. Galoppo: 1 casella ovunque, 2 in linea retta");
setup();
const ih = put("itsahorse","p",2,3);
const m = moves(ih).map(p=>p.x+","+p.y);
check("adiacente in diagonale", m.includes("3,4"));
check("2 caselle in verticale", m.includes("2,1"));
check("2 caselle in diagonale", m.includes("4,5"));
check("non 3 caselle", !m.includes("2,0"));

console.log("\n11. Il campo e rettangolare, non quadrato");
check("5 colonne", NX===5);
check("7 file", NY===7);
check("fuori campo a destra della quinta colonna", !inB(5,3));
check("dentro campo alla settima fila", inB(4,6) && !inB(4,7));

console.log("\n" + (ko_? "FALLITI: "+ko_ : "tutti i "+ok+" controlli superati"));
