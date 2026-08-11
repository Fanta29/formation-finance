/* Extraction des questions depuis l'ancien fichier HTML monolithique vers data/qcm/.
   Usage (depuis la racine du dépôt) :  node tools/extract-qcm.js chemin/vers/fiscalite-qcm.html */
const fs=require('fs'),path=require('path');
const src=process.argv[2] || '_sources/fiscalite-qcm.html';
const html=fs.readFileSync(src,'utf8');
const start=html.indexOf('const THEMES');
const end=html.indexOf('/* ===================== STATE ===================== */');
if(start<0||end<0) throw new Error('marqueurs introuvables');
const {THEMES,QUESTIONS}=new Function(html.slice(start,end)+'\nreturn {THEMES,QUESTIONS};')();
let bad=0;const seen=new Map();const dup=[];
QUESTIONS.forEach((q,i)=>{
  const multi=Array.isArray(q.c);
  const cs=multi?q.c:[q.c];
  if(!q.t||!THEMES[q.t]){console.log('THEME INCONNU',i,q.t);bad++;}
  if(typeof q.q!=='string'||!q.q.trim()){console.log('Q VIDE',i);bad++;}
  if(!Array.isArray(q.o)||q.o.length<2){console.log('OPTIONS KO',i);bad++;}
  if(!cs.length||cs.some(c=>!Number.isInteger(c)||c<0||c>=q.o.length)){console.log('INDEX KO',i);bad++;}
  if(multi&&new Set(cs).size!==cs.length){console.log('INDEX DOUBLE',i);bad++;}
  if(typeof q.e!=='string'||!q.e.trim()){console.log('EXPL VIDE',i);bad++;}
  const k=q.q.toLowerCase().replace(/[^a-z0-9àâäéèêëîïôöùûüç]/g,'');
  if(seen.has(k)) dup.push([seen.get(k),i]); else seen.set(k,i);
});
console.log('questions',QUESTIONS.length,'| anomalies',bad,'| doublons',dup.length);
const outdir='data/qcm';
const index=[];let multiCount=0;
Object.entries(THEMES).forEach(([id,label])=>{
  const qs=QUESTIONS.filter(q=>q.t===id).map((q,n)=>{
    if(Array.isArray(q.c))multiCount++;
    return {id:`${id}-${String(n+1).padStart(3,'0')}`,q:q.q,o:q.o,c:q.c,e:q.e};
  });
  fs.writeFileSync(path.join(outdir,id+'.json'),JSON.stringify(qs,null,1),'utf8');
  index.push({id,label,count:qs.length});
});
fs.writeFileSync(path.join(outdir,'index.json'),JSON.stringify({total:QUESTIONS.length,multi:multiCount,themes:index},null,1),'utf8');
console.log('QCM à choix multiples :',multiCount);
console.log(index.map(t=>t.id+':'+t.count).join(' | '));
