(()=>{'use strict';
const KEY='grandpa-number-game-v2';
const $=id=>document.getElementById(id);
let state=null,toastTimer;const seedValues=[null,null];
const valid12=n=>n===1||n===2;
function computeNext(prev,a,rowIndex){
 const b=a===prev.a?1:2;
 const c=rowIndex>=2?(b===prev.b?1:2):null;
 const d=rowIndex>=3?(c===prev.c?1:2):null;
 return {a,b,c,d};
}
function validState(s){
 if(!(s&&s.version===2&&['a','d'].includes(s.mode)&&Array.isArray(s.rows)&&s.rows.length>=2&&s.rows.length<=200000&&Number.isSafeInteger(s.startRow)&&s.startRow>=1))return false;
 const [r1,r2]=s.rows;
 if(!(r1&&valid12(r1.a)&&r1.b===null&&r1.c===null&&r1.d===null&&r2&&valid12(r2.a)))return false;
 for(let i=1;i<s.rows.length;i++){
  const expect=computeNext(s.rows[i-1],s.rows[i].a,i);
  if(!valid12(s.rows[i].a)||Object.keys(expect).some(k=>expect[k]!==s.rows[i][k]))return false;
 }
 return true;
}
function getStored(){try{const s=JSON.parse(localStorage.getItem(KEY));return validState(s)?s:null;}catch{return null;}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));$('saveStatus').textContent='Saved automatically on this device';}catch{$('saveStatus').textContent='Storage unavailable — please download a backup';}}
function notify(message){const el=$('toast');el.textContent=message;el.classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add('hidden'),3000);}
function render(){
 const ready=!!state;$('modeControls').classList.toggle('hidden',!ready);$('gameActions').classList.toggle('hidden',!ready);$('saveStatusRow').classList.toggle('hidden',!ready);$('history').classList.toggle('hidden',!ready);$('saveManager').classList.toggle('hidden',!ready);
 if(!ready){$('inputQuestion').textContent='Which number are you entering?';$('prompt').textContent=seedValues[0]===null?'Choose A1 (row 1)':'Choose A2 (row 2)';$('modeHelp').textContent=seedValues[0]===null?'Start with the first number in Column A.':'Now enter the second number in Column A.';$('initialTools').classList.remove('hidden');$('undo').textContent='↶ Change A1';$('undo').classList.toggle('hidden',seedValues[0]===null);return;}
 $('inputQuestion').textContent='Which column are you entering?';$('initialTools').classList.add('hidden');
 const canD=state.rows.length>=4;
 if(!canD)state.mode='a';
 const isA=state.mode==='a';
 $('modeA').classList.toggle('active',isA);$('modeD').classList.toggle('active',!isA);
 $('modeA').setAttribute('aria-pressed',String(isA));$('modeD').setAttribute('aria-pressed',String(!isA));
 $('modeD').disabled=!canD;$('modeD').style.opacity=canD?'1':'.45';
 $('prompt').textContent='Choose the next number for '+(isA?'A':'D');
 $('modeHelp').textContent=canD?'You may switch columns at any time.':'Enter A for row '+(state.startRow+state.rows.length)+'. Column D unlocks once row '+(state.startRow+3)+' is complete.';
 $('undo').textContent='↶ Undo last';$('undo').classList.remove('hidden');
 $('undo').disabled=state.rows.length===2;$('undo').style.opacity=state.rows.length===2?'.45':'1';
 $('rowCount').textContent=state.rows.length+' rows';
 const fragment=document.createDocumentFragment();
 for(let i=0;i<state.rows.length;i++){const r=state.rows[i],tr=document.createElement('tr'),values=[state.startRow+i,r.a,r.b,r.c,r.d];for(let j=0;j<5;j++){const td=document.createElement('td');td.textContent=values[j]===null?'—':String(values[j]);if(j===0&&i<2){const small=document.createElement('span');small.className='marker';small.textContent='start';td.appendChild(small);}tr.appendChild(td);}fragment.appendChild(tr);}
 $('rows').replaceChildren(fragment);
}
function choose(n){
 if(!state){
  if(seedValues[0]===null){seedValues[0]=n;render();return;}
  const r1={a:seedValues[0],b:null,c:null,d:null};
  state={version:2,mode:'a',startRow:1,rows:[r1,computeNext(r1,n,1)]};save();render();notify('Game started');return;
 }
 const index=state.rows.length,prev=state.rows[index-1];let row;
 if(state.mode==='a')row=computeNext(prev,n,index);
 else{
  if(index<4){notify('Enter A for rows 3 and 4 first');return;}
  const d=n,c=d===1?prev.c:3-prev.c,b=c===1?prev.b:3-prev.b,a=b===1?prev.a:3-prev.a;
  row={a,b,c,d};
 }
 state.rows.push(row);save();render();notify('Row '+(state.startRow+state.rows.length-1)+' added');
}
$('modeA').addEventListener('click',()=>{state.mode='a';save();render();});
$('modeD').addEventListener('click',()=>{if(state.rows.length<4)return;state.mode='d';save();render();});
$('pick1').addEventListener('click',()=>choose(1));$('pick2').addEventListener('click',()=>choose(2));
$('undo').addEventListener('click',()=>{if(!state){seedValues[0]=null;render();return;}if(state.rows.length<=2)return;state.rows.pop();save();render();notify('Last row undone');});
$('showHistory').addEventListener('click',()=>$('history').scrollIntoView({behavior:'smooth',block:'start'}));
$('newGame').addEventListener('click',()=>{if(!confirm('Start a new sequence? Your current rows will be erased from this device. Download a backup first if you want to keep them.'))return;state=null;seedValues[0]=null;try{localStorage.removeItem(KEY);}catch{}render();window.scrollTo({top:0,behavior:'smooth'});});
function download(name,text,type){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
function stamp(){return new Date().toISOString().slice(0,10);}
$('exportCsv').addEventListener('click',()=>{const lines=['Row,A,B,C,D'];state.rows.forEach((r,i)=>lines.push([state.startRow+i,...['a','b','c','d'].map(k=>r[k]===null?'':r[k])].join(',')));download('number-game-'+stamp()+'.csv','\uFEFF'+lines.join('\r\n'),'text/csv;charset=utf-8');notify('CSV downloaded');});
$('exportBackup').addEventListener('click',()=>{download('number-game-backup-'+stamp()+'.json',JSON.stringify(state,null,2),'application/json');notify('Backup downloaded');});
function openRestore(){$('backupFile').value='';$('backupFile').click();}
$('restoreBackup').addEventListener('click',openRestore);
$('initialRestore').addEventListener('click',openRestore);
$('backupFile').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const loaded=JSON.parse(await file.text());if(!validState(loaded))throw Error('Invalid backup');if(state&&!confirm('Replace your current game with this backup?'))return;state=loaded;save();render();notify('Backup restored');}catch{alert('This backup could not be opened. Please choose a valid game backup JSON file.');}});
state=getStored();render();
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
})();
