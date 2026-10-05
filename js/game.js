const FORMS={"4-3-3":{POR:1,DEF:4,MIG:3,DAV:3},"4-4-2":{POR:1,DEF:4,MIG:4,DAV:2},"3-4-3":{POR:1,DEF:3,MIG:4,DAV:3},"3-5-2":{POR:1,DEF:3,MIG:5,DAV:2}};
const STYLES={"Defensiu":{a:-2,d:2},"Equilibrat":{a:0,d:0},"Ofensiu":{a:2,d:-2}};
const MODES={"Clàssic":{rr:3,show:true,desc:"Veus la valoració de cada jugador. 3 re-tirades."},"Almanac":{rr:1,show:false,desc:"Valoracions amagades: tira de memòria. 1 re-tirada."}};
const ORDER=["DAV","MIG","DEF","POR"];
const KINDS={"Repte del dia":"dia","Lliga privada":"lliga","Lliure":"lliure"};

/* Atzar amb llavor: en un repte, tothom rep els mateixos daus i els mateixos rivals */
function hashStr(s){let h=1779033703^s.length;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),3432918353);h=h<<13|h>>>19;}return h>>>0;}
function rngFrom(s){let a=hashStr(s);return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
let R=Math.random;
const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");};
const cleanCode=c=>String(c||"").toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,20);
function chKey(st=S){if(st.kind==="dia")return"dia-"+today();if(st.kind==="lliga"&&cleanCode(st.code))return"lliga-"+cleanCode(st.code);return null;}
function chLabel(k){if(!k)return"";if(k.startsWith("dia-"))return"Repte del dia "+k.slice(4).split("-").reverse().join("/");return"Lliga "+k.slice(6);}

let S;
function fresh(keep){return{kind:keep?.kind||"dia",code:keep?.code||"",form:keep?.form||"4-3-3",style:keep?.style||"Equilibrat",mode:keep?.mode||"Clàssic",picks:[],season:null,drawn:[],rollN:0,rerolls:MODES[keep?.mode||"Clàssic"].rr,last:null,result:null,saved:null};}

const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const rnd=a=>a[Math.floor(R()*a.length)];
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function openCount(pos){return FORMS[S.form][pos]-S.picks.filter(p=>p.pos===pos).length;}
function usedName(n){return S.picks.some(p=>p.name===n);}
function eligible(season){return season.p.some(([n,pos])=>openCount(pos)>0&&!usedName(n));}
function full(){return S.picks.length===11;}

function strength(){
  const by=pos=>S.picks.filter(p=>p.pos===pos).map(p=>p.r);
  if(!S.picks.length)return null;
  const counts={};S.picks.forEach(p=>counts[p.y]=(counts[p.y]||0)+1);
  const chem=Math.min(4,Object.values(counts).reduce((s,c)=>s+(c-1)*0.75,0));
  const st=STYLES[S.style];
  const dav=by("DAV"),mig=by("MIG"),def=by("DEF"),por=by("POR");
  const A=dav.length&&mig.length?avg(dav)*.65+avg(mig)*.35:avg(dav.length?dav:mig);
  const D=por.length&&def.length?avg(por)*.35+avg(def)*.65:avg(def.length?def:por);
  const M=avg(mig.length?mig:dav.concat(def));
  return{att:A+st.a+chem,mid:M+chem,def:D+st.d+chem,chem,ovr:avg(S.picks.map(p=>p.r))};
}

/* Render */
function chips(el,opts,cur,key,locked){
  el.innerHTML=Object.keys(opts).map(k=>`<button class="chip" aria-pressed="${k===cur}" data-k="${esc(k)}" ${locked?"disabled":""}>${esc(k)}</button>`).join("");
  el.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{S[key]=b.dataset.k;if(key==="mode")S.rerolls=MODES[S.mode].rr;render();});
}
function render(){
  const locked=S.picks.length>0;
  const kd=$("kdChips");
  kd.innerHTML=Object.entries(KINDS).map(([lbl,k])=>`<button class="chip" aria-pressed="${k===S.kind}" data-k="${k}" ${locked?"disabled":""}>${lbl}</button>`).join("");
  kd.querySelectorAll(".chip").forEach(b=>b.onclick=()=>{S.kind=b.dataset.k;S.season=null;S.drawn=[];S.rollN=0;S.rerolls=MODES[S.mode].rr;render();});
  $("codeGroup").hidden=S.kind!=="lliga";
  const ci=$("codeIn");if(document.activeElement!==ci)ci.value=S.code;ci.disabled=locked;
  chips($("fmChips"),FORMS,S.form,"form",locked);
  chips($("stChips"),STYLES,S.style,"style",!!S.result);
  chips($("mdChips"),MODES,S.mode,"mode",locked);
  const kh=S.kind==="dia"?"Repte del dia: tothom rep els mateixos daus i rivals avui. Compta el primer resultat.":S.kind==="lliga"?"Lliga privada: comparteix el codi amb els amics i tots rebreu els mateixos daus.":"Partida lliure: daus a l'atzar, no puntua a la classificació.";
  $("setupHint").textContent=kh+" "+MODES[S.mode].desc+(locked?"":" Tot es bloqueja quan fitxes el primer jugador.");
  const show=MODES[S.mode].show||!!S.result;

  // pitch
  let html='<div class="box top"></div><div class="box bot"></div>';
  ORDER.forEach(pos=>{
    const n=FORMS[S.form][pos],ps=S.picks.filter(p=>p.pos===pos);
    html+='<div class="row">';
    for(let i=0;i<n;i++){
      const p=ps[i];
      html+=p?`<div class="slot filled ${p===S.last?"new":""}"><span class="pos">${pos}</span><span class="nm">${esc(p.name)}</span><span class="yr">${esc(p.y)}</span>${show?`<span class="rt">${p.r}</span>`:""}</div>`
             :`<div class="slot"><span class="pos">${pos}</span></div>`;
    }
    html+='</div>';
  });
  $("pitch").innerHTML=html;

  const s=strength();
  $("cPicked").textContent=S.picks.length+"/11";
  $("cRerolls").textContent=S.rerolls;
  $("cOvr").textContent=s&&show?Math.round(s.ovr):"–";
  $("sAtt").textContent=s&&show?s.att.toFixed(1):"–";
  $("sMid").textContent=s&&show?s.mid.toFixed(1):"–";
  $("sDef").textContent=s&&show?s.def.toFixed(1):"–";
  $("sChem").textContent=s?"+"+s.chem.toFixed(1):"+0";

  // draft
  const rb=$("rollBtn");
  if(full()&&!S.result){rb.innerHTML="Juga el torneig";rb.className="btn gold";rb.disabled=false;}
  else if(S.result){rb.innerHTML="Torneig jugat";rb.className="btn";rb.disabled=true;}
  else{rb.innerHTML=rb.dataset.die;rb.className="btn";rb.disabled=!!S.season||(S.kind==="lliga"&&!cleanCode(S.code));}
  $("rerollBtn").disabled=!S.season||S.rerolls<=0;
  $("rerollBtn").textContent=`Torna a tirar (${S.rerolls})`;

  if(!S.season){
    $("seasonBox").innerHTML="";
    $("squadBox").innerHTML=full()?`<div class="empty">Onze complet. Prem <b>Juga el torneig</b> per enfrontar-te a set rivals històrics.</div>`
      :`<div class="empty">Prem <b>Tira el dau</b> per sortejar una temporada del Barça. Tens ${16} temporades possibles, de les Cinc Copes de Kubala al Barça de Flick.</div>`;
  }else{
    const se=S.season;
    $("seasonBox").innerHTML=`<div class="season"><div class="yr">${esc(se.y)}</div><div class="fita">${esc(se.fita)}</div><div class="meta">Entrenador: ${esc(se.coach)} · tria un jugador</div></div>`;
    const sorted=se.p.slice().sort((a,b)=>ORDER.indexOf(b[1])-ORDER.indexOf(a[1]));
    $("squadBox").innerHTML='<div class="squad">'+sorted.map(([n,pos,r],i)=>{
      const ok=openCount(pos)>0&&!usedName(n);
      const why=usedName(n)?" (ja el tens)":openCount(pos)<=0?" (posició plena)":"";
      return `<button class="pl" data-i="${se.p.findIndex(x=>x[0]===n)}" ${ok?"":"disabled"} aria-label="${esc(n)}, ${pos}${why}"><span class="tag ${pos}">${pos}</span><span class="n">${esc(n)}</span><span class="r">${MODES[S.mode].show?r:"?"}</span></button>`;
    }).join("")+'</div>';
    $("squadBox").querySelectorAll(".pl").forEach(b=>b.onclick=()=>pick(+b.dataset.i));
  }
  renderTour();
  renderRank();
  snapshot();
}

function draw(){
  const k=chKey();R=k?rngFrom(k+":dau:"+S.rollN):Math.random;S.rollN++;
  let pool=SEASONS.filter(s=>!S.drawn.includes(s.y)&&eligible(s));
  if(!pool.length)pool=SEASONS.filter(eligible);
  const se=rnd(pool);S.drawn.push(se.y);S.season=se;
}
function roll(){
  if(full()&&!S.result){playTournament();return;}
  const rb=$("rollBtn");rb.classList.add("rolling");rb.disabled=true;
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  setTimeout(()=>{rb.classList.remove("rolling");draw();render();},reduce?0:450);
}
function reroll(){if(S.rerolls<=0||!S.season)return;S.rerolls--;S.season=null;draw();render();}
function pick(i){
  const [n,pos,r]=S.season.p[i];
  if(openCount(pos)<=0||usedName(n))return;
  const p={name:n,pos,r,y:S.season.y};S.picks.push(p);S.last=p;S.season=null;render();
}

/* Simulació */
function poisson(l){const L=Math.exp(-l);let k=0,p=1;do{k++;p*=R();}while(p>L);return Math.min(k-1,9);}
function scorer(){
  const w=S.picks.map(p=>({p,w:({DAV:5,MIG:2,DEF:.45,POR:0})[p.pos]*Math.pow(1.08,p.r-80)}));
  let t=w.reduce((s,x)=>s+x.w,0)*R();
  for(const x of w){t-=x.w;if(t<=0)return x.p.name;}return w[0].p.name;
}
function match(opp,ko){
  const s=strength(),r=opp[1],m=(s.mid-r)/2.5;
  const gf=poisson(1.25*Math.exp((s.att+m-r)/8));
  const ga=poisson(1.05*Math.exp((r-s.def-m)/8));
  const goals=[];for(let i=0;i<gf;i++)goals.push(scorer());
  let res=gf>ga?"W":gf<ga?"L":"D",pens=null;
  if(ko&&res==="D"){
    const por=S.picks.find(p=>p.pos==="POR").r;
    const win=R()<0.5+(por-85)/100;
    pens=win?"Guanya als penals":"Perd als penals";res=win?"W":"L";
  }
  return{opp:opp[0],gf,ga,res,pens,goals};
}
function playTournament(){
  const key=chKey();
  R=key?rngFrom(key+":rivals"):Math.random;
  const groupOpp=shuffle(RIVALS_GROUP);
  const elite=shuffle(RIVALS_ELITE).slice(0,3).sort((a,b)=>a[1]-b[1]);
  const plan=[["Grup · J1",groupOpp[0],false],["Grup · J2",groupOpp[1],false],["Grup · J3",groupOpp[2],false],["Vuitens",groupOpp[3],true],["Quarts",elite[0],true],["Semifinal",elite[1],true],["Final",elite[2],true]];
  if(key){const sig=S.picks.map(p=>p.name+"|"+p.y).sort().join(",")+S.form+S.style;R=rngFrom(key+":partits:"+sig);}
  const games=[];let pts=0,gd=0,out=null;
  for(let i=0;i<plan.length;i++){
    const [ph,opp,ko]=plan[i];const g=match(opp,ko);g.ph=ph;games.push(g);
    if(!ko){pts+=g.res==="W"?3:g.res==="D"?1:0;gd+=g.gf-g.ga;
      if(i===2&&!(pts>=4||(pts===3&&gd>0))){out="Eliminats a la fase de grups";break;}}
    else if(g.res==="L"){out=ph==="Final"?"Subcampions":`Eliminats a ${({Vuitens:"vuitens",Quarts:"quarts",Semifinal:"semifinals"})[ph]}`;break;}
  }
  const wins=games.filter(g=>g.res==="W").length,ga=games.reduce((s,g)=>s+g.ga,0),gf=games.reduce((s,g)=>s+g.gf,0);
  let title,line;
  if(out){title=out;line=`Has jugat ${games.length} partits: ${wins} victòri${wins===1?"a":"es"}, ${gf} gols a favor i ${ga} en contra.`;}
  else if(wins===7&&ga===0){title="7 a 0!";line=`Set victòries de set i porteria a zero tot el torneig. ${gf} gols a favor. Història pura.`;}
  else if(wins===7){title="Campions invictes";line=`Set de set, però has encaixat ${ga} gol${ga===1?"":"s"}. El 7 a 0 queda per a la pròxima.`;}
  else{title="Campions";line=`Copa a les vitrines amb ${wins} victòries en 7 partits, ${gf}-${ga} en el global.`;}
  const tally={};games.forEach(g=>g.goals.forEach(n=>tally[n]=(tally[n]||0)+1));
  const top=Object.entries(tally).sort((a,b)=>b[1]-a[1])[0];
  const draws=games.filter(g=>g.res==="D").length;
  const champ=!out,seven=champ&&wins===7&&ga===0;
  const score=wins*3+draws+(gf-ga)+(champ?10:0)+(seven?20:0);
  S.result={games,title,line,out:!!out,top,gf,ga,wins,score,key};
  R=Math.random;
  S.revealed=0;render();revealNext();
  if(key)saveResult();
}
function revealNext(){
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(!S.result)return;
  if(reduce){S.revealed=S.result.games.length;renderTour();return;}
  if(S.revealed<S.result.games.length){S.revealed++;renderTour();setTimeout(revealNext,550);}
}
function renderTour(){
  const t=$("tour");
  if(!S.result){t.hidden=true;t.innerHTML="";return;}
  t.hidden=false;const R=S.result,n=S.revealed??R.games.length;
  const goals=g=>{if(!g.goals.length)return"";const c={};g.goals.forEach(x=>c[x]=(c[x]||0)+1);return"Gols: "+Object.entries(c).map(([k,v])=>esc(k)+(v>1?` (${v})`:"")).join(", ");};
  let h=`<h2>Copa de la Història</h2><div class="matches">`+R.games.slice(0,n).map(g=>
    `<div class="m ${g.res}"><span class="ph">${esc(g.ph)}</span><span class="op">Barça – ${esc(g.opp)}</span><span class="sc">${g.gf}-${g.ga}</span>${(g.goals.length||g.pens)?`<span class="gl">${goals(g)}${g.pens?(g.goals.length?" · ":"")+g.pens:""}</span>`:""}</div>`).join("")+`</div>`;
  if(n>=R.games.length){
    h+=`<div class="verdict ${R.out?"out":""}"><div class="big">${esc(R.title)}</div><div>${esc(R.line)}</div>${R.top?`<div class="foot">Màxim golejador: ${esc(R.top[0])} (${R.top[1]})</div>`:""}</div>
    ${R.key?`<p class="note" id="saveNote">${saveMsg()}</p>`:""}
    <div class="actions"><button class="btn" id="againBtn">Nova partida</button><button class="btn alt" id="shareBtn">Copia el resultat</button>${R.key?"":`<button class="btn alt" id="replayBtn">Torna a jugar amb aquest onze</button>`}</div>`;
  }
  t.innerHTML=h;
  if(n>=R.games.length){
    $("againBtn").onclick=reset;
    if(!R.key)$("replayBtn").onclick=()=>{S.result=null;playTournament();};
    $("shareBtn").onclick=e=>{
      const txt=`CuleDraft · ${R.title}${R.key?" · "+chLabel(R.key)+(R.key.startsWith("lliga-")?` (codi ${R.key.slice(6)})`:""):""}\n${R.wins}V · ${R.gf}-${R.ga} · ${R.score} punts\n${S.form} ${S.style}\n`+ORDER.map(pos=>S.picks.filter(p=>p.pos===pos).map(p=>`${p.name} '${p.y.slice(2,4)}`).join(", ")).join("\n");
      const b=e.currentTarget;
      const ok=()=>{b.textContent="Copiat";setTimeout(()=>b.textContent="Copia el resultat",1600);};
      try{navigator.clipboard.writeText(txt).then(ok,()=>{b.textContent="No s'ha pogut copiar";});}catch(_){b.textContent="No s'ha pogut copiar";}
    };
  }
}
function reset(){S=fresh(S);render();window.scrollTo({top:0,behavior:"smooth"});}

/* Classificació compartida */
const NET={db:null,user:null,me:null,all:[],names:{},state:"loading",writing:Promise.resolve(),readonly:false};
const myDoc=()=>NET.all.find(d=>d.id===NET.me);
function saveMsg(){
  const k=S.result?.key;if(!k)return"";
  if(S.saved==="ok")return"Resultat registrat a la classificació.";
  if(S.saved==="dup")return"Ja tenies un resultat en aquest repte. Compta el primer; aquest no s'ha desat.";
  if(S.saved==="err")return"No s'ha pogut desar el resultat. Torna-ho a provar més tard.";
  if(NET.state!=="ok")return"Per sortir a la classificació has d'obrir el joc amb la sessió de Claude iniciada.";
  return"Desant el resultat…";
}
function writeMine(body){
  NET.writing=NET.writing.then(()=>NET.db.doc("scores/"+NET.me).set(body)).catch(e=>{if(e?.code==="invalid_argument")NET.readonly=true;throw e;});
  return NET.writing;
}
async function saveResult(){
  if(NET.state!=="ok"||NET.readonly){renderRank();return;}
  const key=S.result.key,mine=myDoc()||{};
  if(mine.results&&mine.results[key]){S.saved="dup";renderTour();return;}
  const Rz=S.result;
  const entry={title:Rz.title,wins:Rz.wins,gf:Rz.gf,ga:Rz.ga,score:Rz.score,form:S.form,style:S.style,mode:S.mode,
    xi:ORDER.flatMap(pos=>S.picks.filter(p=>p.pos===pos).map(p=>p.name+" '"+p.y.slice(2,4))),at:Date.now()};
  const body={nick:mine.nick||$("nickIn").value.trim().slice(0,24)||"",results:{...(mine.results||{}),[key]:entry}};
  try{await writeMine(body);S.saved="ok";}catch(e){S.saved="err";}
  renderTour();
}
async function saveNick(){
  const v=$("nickIn").value.trim().slice(0,24);
  if(NET.state!=="ok"||NET.readonly)return;
  const mine=myDoc()||{};
  try{await writeMine({nick:v,results:mine.results||{}});$("nickBtn").textContent="Desat";setTimeout(()=>$("nickBtn").textContent="Desa",1500);}
  catch(e){$("nickBtn").textContent="No s'ha desat";}
}
async function resolveNames(){
  if(!NET.user)return;
  try{const ids=NET.all.map(d=>d.id);const ps=await NET.user.profiles(ids);NET.names={};ids.forEach(id=>NET.names[id]=ps?.[id]?.name||"");renderRank();}catch(_){}
}
function renderRank(){
  const box=$("rankBox");if(!box)return;
  const key=chKey()||"dia-"+today();
  $("rankSub").textContent=chLabel(key)+(S.kind==="lliure"?" (la partida lliure no puntua)":"");
  const ni=$("nickIn"),nb=$("nickBtn");
  const canWrite=NET.state==="ok"&&!NET.readonly;
  ni.disabled=!canWrite;nb.disabled=!canWrite;
  if(canWrite&&document.activeElement!==ni&&!ni.value)ni.value=myDoc()?.nick||"";
  if(NET.state==="loading"){box.innerHTML=`<div class="empty">Carregant la classificació…</div>`;return;}
  if(NET.state!=="ok"){box.innerHTML=`<div class="empty">La classificació només funciona obrint el joc a claude.ai amb la sessió iniciada. Pots jugar igualment.</div>`;return;}
  const rows=NET.all.filter(d=>d.results&&d.results[key]).map(d=>({id:d.id,nick:d.nick,...d.results[key]}))
    .sort((a,b)=>b.score-a.score||a.ga-b.ga||b.gf-a.gf||a.at-b.at);
  if(!rows.length){box.innerHTML=`<div class="empty">Encara no hi ha cap resultat a ${esc(chLabel(key).toLowerCase())}. Juga'l i obre la classificació.</div>`+(NET.readonly?`<p class="note">Amb el teu accés pots veure la classificació però no hi pots sortir. Demana a qui t'ha passat l'enllaç que et doni permís de col·laborador.</p>`:"");return;}
  box.innerHTML=`<div class="tbl"><table><thead><tr><th class="num">#</th><th>Jugador</th><th>Resultat</th><th class="num">V</th><th class="num">Gols</th><th class="num">Punts</th></tr></thead><tbody>`+
    rows.map((r,i)=>{const nm=r.nick||NET.names[r.id]||"Jugador";const me=r.id===NET.me;
      return`<tr class="${me?"me":""}"><td class="num ${i===0?"pos1":""}">${i+1}</td><td><div class="who">${esc(nm)}${me?" (tu)":""}</div><div class="xi">${esc((r.xi||[]).join(", "))}</div></td><td><span class="pill ${r.title==="7 a 0!"||r.title.startsWith("Campions")?"gold":""}">${esc(r.title)}</span></td><td class="num">${r.wins}</td><td class="num">${r.gf}-${r.ga}</td><td class="num"><b>${r.score}</b></td></tr>`;}).join("")+
    `</tbody></table></div><p class="foot">Punts: 3 per victòria, 1 per empat, la diferència de gols, +10 per ser campió i +20 si fas el 7 a 0.</p>`;
}
async function connect(){
  try{
    if(!window.claude?.use){NET.state="off";const r=document.querySelector(".rank");if(r)r.hidden=true;return;}
    const [user,db]=await Promise.all([claude.use("user"),claude.use("db")]);
    NET.user=user;NET.db=db;
    if(!db||!user){NET.state="off";renderRank();return;}
    NET.me=await user.id();
    if(!NET.me){NET.state="off";renderRank();return;}
    try{const c=await user.can("data.write");if(c===false)NET.readonly=true;}catch(_){}
    NET.state="ok";
    db.collection("scores").onSnapshot(snap=>{
      NET.all=snap.docs.filter(d=>d.exists).map(d=>({id:d.id,...d.data()}));
      renderRank();resolveNames();
    },()=>{NET.state="off";renderRank();});
    renderRank();
  }catch(_){NET.state="off";renderRank();}
}

/* Estat en actualitzacions */
function snapshot(){try{window.claude?.hot?.snapshot?.(()=>({S:JSON.parse(JSON.stringify({...S,season:S.season?S.season.y:null,last:null}))}));}catch(_){}}
function start(data){
  $("rollBtn").dataset.die=$("rollBtn").innerHTML;
  S=fresh();
  if(data&&data.S){S=data.S;S.season=S.season?SEASONS.find(s=>s.y===S.season):null;}
  $("rollBtn").onclick=roll;$("rerollBtn").onclick=reroll;$("resetBtn").onclick=reset;
  $("codeIn").addEventListener("input",e=>{S.code=cleanCode(e.target.value);render();});
  $("nickBtn").onclick=saveNick;
  $("nickIn").addEventListener("keydown",e=>{if(e.key==="Enter")saveNick();});
  render();
  connect();
}
window.claude?.hot?.ready?window.claude.hot.ready(start):start(window.claude?.hot?.data??{});
