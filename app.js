(()=>{'use strict';
const $=id=>document.getElementById(id), KEY='kalla-finance-complete-v1';
const today=()=>new Date().toISOString().slice(0,10);
const defaults={currency:'FCFA',profit:1000000,theme:'#d9b66f',
  main:[
    {id:'tithe',name:'Dîme',pct:10},
    {id:'salary',name:'Salaire personnel',pct:25},
    {id:'cash',name:'Trésorerie entreprise',pct:25},
    {id:'invest',name:'Fonds d’investissement',pct:40}
  ],
  sub:{
    invest:[
      {name:'Business',pct:35},
      {name:'Immobilier',pct:25},
      {name:'Placements financiers',pct:15},
      {name:'Voyages commerciaux',pct:10},
      {name:'Matériel et équipements',pct:10},
      {name:'Formations professionnelles',pct:5}
    ],
    cash:[
      {name:'Fonds de roulement',pct:35},
      {name:'Stock et marchandises',pct:20},
      {name:'Charges et impôts futurs',pct:15},
      {name:'Salaires et prestataires à venir',pct:10},
      {name:'Réserve d’urgence',pct:10},
      {name:'Maintenance et réparations',pct:5},
      {name:'Outils et logiciels',pct:5}
    ],
    salary:[
      {name:'Vie courante',pct:25},
      {name:'Logement',pct:18},
      {name:'Voiture',pct:8},
      {name:'Mariage',pct:8},
      {name:'Maison à long terme',pct:12},
      {name:'Famille et imprévus',pct:7},
      {name:'Épargne de sécurité',pct:5},
      {name:'Détente et loisirs',pct:5},
      {name:'Épargne enfants',pct:5},
      {name:'Santé',pct:7}
    ]
  },
  categories:{
    income:['Ventes','Prestations','Commissions','Loyers reçus','Autres revenus'],
    expense:['Achats et stock','Transport','Logement','Alimentation','Téléphone et Internet','Salaires et prestataires','Impôts et charges','Maintenance','Autres dépenses']
  },
  budgets:{},transactions:[],investments:[],businesses:[]
};

let data=load();
function clone(x){return JSON.parse(JSON.stringify(x))}
function load(){
  try{
    const x=JSON.parse(localStorage.getItem(KEY));
    if(x){
      const d={...clone(defaults),...x};
      d.main=Array.isArray(x.main)&&x.main.length?x.main:clone(defaults.main);
      d.sub=x.sub&&typeof x.sub==='object'?{...clone(defaults.sub),...x.sub}:clone(defaults.sub);
      d.main.forEach(m=>{ if(!d.sub[m.id]) d.sub[m.id]=[]; });
      d.categories=x.categories||clone(defaults.categories);
      d.transactions=Array.isArray(x.transactions)?x.transactions:[];
      d.investments=Array.isArray(x.investments)?x.investments:[];
      d.businesses=Array.isArray(x.businesses)?x.businesses:[];
      d.budgets=x.budgets||{};
      return d;
    }
  }catch(e){}
  try{
    const old=JSON.parse(localStorage.getItem('kalla-finance-settings-v2'));
    if(old){
      const d=clone(defaults);
      d.currency=old.currency||d.currency;
      d.profit=Number(old.amount)||d.profit;
      d.main=(old.main||d.main).map(x=>({id:x.id||('custom-'+Date.now()),name:x.name,pct:Number(x.pct)||0}));
      d.sub.invest=old.invest||d.sub.invest;
      d.sub.cash=old.cash||d.sub.cash;
      d.sub.salary=old.salary||d.sub.salary;
      d.main.forEach(m=>{if(!d.sub[m.id])d.sub[m.id]=[]});
      return d;
    }
  }catch(e){}
  return clone(defaults);
}
function save(){
  localStorage.setItem(KEY,JSON.stringify(data));
  const el=$('saveState');
  if(el) el.textContent='Enregistré sur cet appareil';
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(s){const t=$('toast');if(!t)return;t.textContent=s;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2400)}
function pctsum(arr){return (arr||[]).reduce((a,x)=>a+(Number(x.pct)||0),0)}
function money(n){return (Number(n)||0).toLocaleString('fr-FR',{maximumFractionDigits:0})+' '+data.currency}
function transactions(type){return data.transactions.filter(t=>!type||t.type===type)}
function totals(){const income=transactions('income').reduce((a,t)=>a+t.amount,0),expense=transactions('expense').reduce((a,t)=>a+t.amount,0);return {income,expense,net:income-expense}}
function allocation(id){return data.main.find(x=>x.id===id)?.pct||0}
function categoryOptions(){['income','expense'].forEach(type=>{const el=$('txCategory');if(!el)return;const old=el.value;if($('txType')&&$('txType').value!==type)return;const arr=data.categories[type]||[];el.innerHTML=arr.map(x=>`<option>${esc(x)}</option>`).join('');if(arr.includes(old))el.value=old})}

function bar(name,pct,amount,totalPct){
  const div=document.createElement('div');
  div.className='bar-item';
  const w=totalPct>0?Math.min(100,Math.max(0,(Number(pct)/totalPct)*100)):0;
  div.innerHTML=`<span class="bar-label">${esc(name)}</span><div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div><span class="bar-value">${Number(pct)||0}% · ${money(amount)}</span>`;
  return div;
}

function settingRow(name,pct,group,i){
  return `<div class="setting-row">
    <input class="name-input" data-name="${group}:${i}" value="${esc(name)}" maxlength="70" aria-label="Nom">
    <input type="number" min="0" max="100" step="any" data-pct="${group}:${i}" value="${Number(pct)||0}" aria-label="Pourcentage">
    <button class="danger-btn" data-remove="${group}:${i}" title="Retirer">Retirer</button>
  </div>`;
}

function renderDashboard(){
  const t = totals();
  if($('statIncome')) $('statIncome').textContent = money(t.income);
  if($('statExpense')) $('statExpense').textContent = money(t.expense);
  if($('statNet')) $('statNet').textContent = money(t.net);
  if($('statProfit')) $('statProfit').textContent = money(data.profit);

  // Répartition principale
  const list = $('allocationChart');
  if(list){
    list.innerHTML = '';
    data.main.forEach(x => {
      list.append(bar(x.name, x.pct, Number(data.profit) * Number(x.pct) / 100, pctsum(data.main)));
    });
  }
  if($('allocationNote')){
    const total = pctsum(data.main);
    $('allocationNote').textContent = Math.abs(total - 100) < 0.001
      ? 'Répartition principale équilibrée à 100 %.'
      : 'Attention : la répartition principale totalise ' + total + ' %. Ajuste-la dans Personnalisation.';
  }

  // Blocs de détail : Salaire + Trésorerie + Investissement
  const inv = $('investChart');
  if(inv){
    inv.innerHTML = '';

    const blocks = [
      {id: 'salary', title: 'Répartition du salaire personnel'},
      {id: 'cash', title: 'Répartition de la trésorerie entreprise'},
      {id: 'invest', title: 'Répartition du fonds d’investissement'}
    ];

    blocks.forEach(block => {
      const subList = data.sub[block.id] || [];
      if(subList.length === 0) return;

      const parentPct = allocation(block.id);
      const title = document.createElement('h3');
      title.textContent = block.title;
      title.style.margin = '18px 0 8px';
      title.style.color = 'var(--gold, #d9b66f)';
      inv.appendChild(title);

      const hint = document.createElement('p');
      hint.className = 'hint';
      hint.textContent = 'Calculée sur le montant disponible.';
      inv.appendChild(hint);

      subList.forEach(x => {
        inv.append(bar(x.name, x.pct, Number(data.profit) * parentPct / 100 * Number(x.pct) / 100, pctsum(subList)));
      });
    });
  }

  // Dernières opérations
  const recent = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  if($('recentList')){
    $('recentList').innerHTML = recent.length
      ? recent.map(t => `<div class="operation">
          <div>
            <div class="op-title">${esc(t.label)}</div>
            <div class="op-meta">${esc(t.date)} · ${esc(t.category)}</div>
          </div>
          <div class="${t.type === 'income' ? 'amount-in' : 'amount-out'}">
            ${t.type === 'income' ? '+' : '−'}${money(t.amount)}
          </div>
        </div>`).join('')
      : '<p class="muted">Aucune opération pour le moment.</p>';
  }
}

function renderTransactions(){
  const type=$('filterType')?.value||'';
  const q=($('filterText')?.value||'').toLowerCase();
  let list=data.transactions.slice().sort((a,b)=>b.date.localeCompare(a.date));
  if(type) list=list.filter(t=>t.type===type);
  if(q) list=list.filter(t=>(t.label+t.category+(t.note||'')).toLowerCase().includes(q));
  if($('transactionRows')){
    $('transactionRows').innerHTML=list.length
      ?list.map(t=>`<tr><td>${esc(t.date)}</td><td>${esc(t.label)}</td><td>${esc(t.category)}</td><td class="${t.type==='income'?'amount-in':'amount-out'}">${t.type==='income'?'+':'−'}${money(t.amount)}</td><td><button class="danger-btn" data-delete-tx="${t.id}">Suppr.</button></td></tr>`).join('')
      :'<tr><td colspan="5" class="muted">Aucune opération.</td></tr>';
  }
}

function renderBudget(){
  const el=$('budgetList');
  if(!el) return;
  const cats=data.categories.expense||[];
  el.innerHTML=cats.map(c=>{
    const spent=transactions('expense').filter(t=>t.category===c).reduce((a,t)=>a+t.amount,0);
    const limit=Number(data.budgets[c])||0;
    const pct=limit>0?Math.min(100,(spent/limit)*100):0;
    return `<div class="budget-row">
      <span>${esc(c)}</span>
      <input type="number" min="0" data-budget="${esc(c)}" value="${limit||''}" placeholder="Limite">
      <div class="budget-track-wrap"><div class="budget-track"><div class="budget-fill" style="width:${pct}%"></div></div>
      <small>${money(spent)}${limit?' / '+money(limit):''}</small></div>
    </div>`;
  }).join('');
}
function renderInvestments(){
  const el=$('investmentList');
  if(!el) return;
  const total=data.investments.reduce((a,x)=>a+Number(x.amount),0);
  if($('investTotal')) $('investTotal').textContent=money(total);
  el.innerHTML=data.investments.length
    ?data.investments.map(x=>`<div class="operation"><div><div class="op-title">${esc(x.name)}</div><div class="op-meta">${esc(x.date)} · ${esc(x.status)}</div></div><div>${money(x.amount)} <button class="danger-btn" data-delete-inv="${x.id}">×</button></div></div>`).join('')
    :'<p class="muted">Aucun investissement.</p>';
}

function renderBusinesses(){
  const el=$('businessList');
  if(!el) return;
  el.innerHTML=data.businesses.length
    ?data.businesses.map(x=>`<div class="operation"><div><div class="op-title">${esc(x.name)}</div><div class="op-meta">${esc(x.sector)} · ${esc(x.status)}</div></div><div>${money(x.capital)} <button class="danger-btn" data-delete-biz="${x.id}">×</button></div></div>`).join('')
    :'<p class="muted">Aucune activité.</p>';
}

function renderReports(){
  if($('reportCount')) $('reportCount').textContent=data.transactions.length;
  if($('reportInvest')) $('reportInvest').textContent=data.investments.length;
  if($('reportBiz')) $('reportBiz').textContent=data.businesses.length;
  const map={};
  data.transactions.forEach(t=>{
    if(!map[t.category]) map[t.category]={income:0,expense:0};
    map[t.category][t.type]+=t.amount;
  });
  if($('reportTable')){
    const rows=Object.keys(map).sort().map(c=>`<tr><td>${esc(c)}</td><td class="amount-in">${money(map[c].income)}</td><td class="amount-out">${money(map[c].expense)}</td><td>${money(map[c].income-map[c].expense)}</td></tr>`).join('');
    $('reportTable').innerHTML=rows||'<tr><td colspan="4" class="muted">Aucune donnée.</td></tr>';
  }
}

function renderSettings(){
  // Enveloppes principales (celles qui apparaissent sur le tableau de bord)
  if($('mainAllocationEditor')){
    $('mainAllocationEditor').innerHTML=data.main.map((x,i)=>settingRow(x.name,x.pct,'main',i)).join('');
  }
  const totalMain=pctsum(data.main);
  if($('mainPctTotal')) $('mainPctTotal').textContent=totalMain+' %';
  if($('mainPctStatus')){
    $('mainPctStatus').textContent=Math.abs(totalMain-100)<0.001?'Total équilibré : 100 %.':'Le total doit être de 100 %.';
    $('mainPctStatus').className=Math.abs(totalMain-100)<0.001?'good':'bad';
  }

  // Catégories revenus / dépenses
  ['income','expense'].forEach(type=>{
    const el=$(type==='income'?'incomeCategories':'expenseCategories');
    if(!el) return;
    el.innerHTML=(data.categories[type]||[]).map((n,i)=>`
      <div class="setting-row">
        <input class="name-input" data-cat-name="${type}:${i}" value="${esc(n)}" maxlength="50">
        <span></span>
        <button class="danger-btn" data-cat-delete="${type}:${i}">Retirer</button>
      </div>`).join('');
  });

  // Sous-catégories pour TOUTES les enveloppes principales
  if($('subAllocationEditors')){
    $('subAllocationEditors').innerHTML=data.main.map(m=>{
      const key=m.id;
      if(!data.sub[key]) data.sub[key]=[];
      const list=data.sub[key];
      return `<div class="settings-group">
        <h3>${esc(m.name)}</h3>
        <div class="settings-list">${list.map((x,i)=>settingRow(x.name,x.pct,key,i)).join('')}</div>
        <button class="secondary" data-add-sub="${key}">Ajouter une sous-catégorie</button>
        <p class="muted">Total actuel : ${pctsum(list)} %</p>
      </div>`;
    }).join('');
  }
}

function refreshAll(){
  document.documentElement.style.setProperty('--gold',data.theme||defaults.theme);
  if($('currency')) $('currency').value=data.currency;
  if($('profitAmount')) $('profitAmount').value=data.profit;
  if($('themeColor')) $('themeColor').value=data.theme||defaults.theme;
  renderDashboard();
  renderTransactions();
  renderBudget();
  renderInvestments();
  renderBusinesses();
  renderReports();
  renderSettings();
  categoryOptions();
}

function go(page){
  document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id==='page-'+page));
  document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.page===page));
  history.replaceState(null,'','#'+page);
  if(page==='settings') renderSettings();
  window.scrollTo({top:0,behavior:'smooth'});
}

function download(name,content,type){
  const a=document.createElement('a'),url=URL.createObjectURL(new Blob([content],{type}));
  a.href=url;a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportJSON(){download('kalla-finance-sauvegarde.json',JSON.stringify(data,null,2),'application/json')}
function exportCSV(){
  const rows=[['Date','Type','Libellé','Catégorie','Montant','Devise','Note'],...data.transactions.map(t=>[t.date,t.type,t.label,t.category,t.amount,data.currency,t.note||''])];
  download('kalla-finance-operations.csv','\ufeff'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n'),'text/csv;charset=utf-8');
}

// Navigation
document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));
document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.goto)));

// Devise & thème
if($('currency')) $('currency').addEventListener('change',e=>{data.currency=e.target.value;save();refreshAll()});
if($('themeColor')) $('themeColor').addEventListener('change',e=>{data.theme=e.target.value;save();refreshAll()});
if($('profitAmount')) $('profitAmount').addEventListener('change',e=>{data.profit=Math.max(0,Number(e.target.value)||0);save();refreshAll()});

// Transactions
if($('txType')) $('txType').addEventListener('change',categoryOptions);
if($('filterType')) $('filterType').addEventListener('change',renderTransactions);
if($('filterText')) $('filterText').addEventListener('input',renderTransactions);
if($('transactionForm')) $('transactionForm').addEventListener('submit',e=>{
  e.preventDefault();
  const amount=Number($('txAmount').value);
  if(!Number.isFinite(amount)||amount<=0) return toast('Saisis un montant positif.');
  data.transactions.push({
    id:crypto.randomUUID(),
    type:$('txType').value,
    label:$('txLabel').value.trim(),
    amount,
    category:$('txCategory').value,
    date:$('txDate').value||today(),
    note:$('txNote').value.trim()
  });
  save();e.target.reset();$('txDate').value=today();refreshAll();toast('Opération enregistrée.');
});
if($('transactionRows')) $('transactionRows').addEventListener('click',e=>{
  const b=e.target.closest('[data-delete-tx]');
  if(b&&confirm('Supprimer cette opération ?')){
    data.transactions=data.transactions.filter(t=>t.id!==b.dataset.deleteTx);
    save();refreshAll();toast('Opération supprimée.');
  }
});

// Investissements
if($('investmentForm')) $('investmentForm').addEventListener('submit',e=>{
  e.preventDefault();
  const amount=Number($('invAmount').value);
  if(amount<=0) return toast('Saisis un montant positif.');
  data.investments.push({id:crypto.randomUUID(),name:$('invName').value.trim(),amount,date:$('invDate').value||today(),status:$('invStatus').value});
  save();e.target.reset();$('invDate').value=today();refreshAll();toast('Investissement ajouté.');
});
if($('investmentList')) $('investmentList').addEventListener('click',e=>{
  const b=e.target.closest('[data-delete-inv]');
  if(b&&confirm('Supprimer cet investissement ?')){
    data.investments=data.investments.filter(x=>x.id!==b.dataset.deleteInv);
    save();refreshAll();
  }
});

// Entreprises
if($('businessForm')) $('businessForm').addEventListener('submit',e=>{
  e.preventDefault();
  data.businesses.push({id:crypto.randomUUID(),name:$('bizName').value.trim(),sector:$('bizSector').value.trim(),capital:Number($('bizCapital').value)||0,status:$('bizStatus').value});
  save();e.target.reset();refreshAll();toast('Activité ajoutée.');
});
if($('businessList')) $('businessList').addEventListener('click',e=>{
  const b=e.target.closest('[data-delete-biz]');
  if(b&&confirm('Supprimer cette activité ?')){
    data.businesses=data.businesses.filter(x=>x.id!==b.dataset.deleteBiz);
    save();refreshAll();
  }
});

// Budgets
if($('saveBudgets')) $('saveBudgets').addEventListener('click',()=>{
  document.querySelectorAll('[data-budget]').forEach(el=>data.budgets[el.dataset.budget]=Math.max(0,Number(el.value)||0));
  save();renderBudget();toast('Budgets enregistrés.');
});

// Édition des enveloppes principales
if($('mainAllocationEditor')) $('mainAllocationEditor').addEventListener('change',e=>{
  const el=e.target;
  if(el.dataset.name){
    const [g,i]=el.dataset.name.split(':');
    if(g==='main') data.main[Number(i)].name=el.value.trim()||'Nouvelle enveloppe';
  }
  if(el.dataset.pct){
    const [g,i]=el.dataset.pct.split(':');
    if(g==='main') data.main[Number(i)].pct=Math.max(0,Number(el.value)||0);
  }
  save();renderSettings();renderDashboard();
});

if($('subAllocationEditors')) $('subAllocationEditors').addEventListener('change',e=>{
  const el=e.target;
  if(el.dataset.name){
    const [g,i]=el.dataset.name.split(':');
    if(data.sub[g]) data.sub[g][Number(i)].name=el.value.trim()||'Catégorie';
  }
  if(el.dataset.pct){
    const [g,i]=el.dataset.pct.split(':');
    if(data.sub[g]) data.sub[g][Number(i)].pct=Math.max(0,Number(el.value)||0);
  }
  save();renderSettings();renderDashboard();
});

// Clics : retirer / ajouter sous-catégorie
document.addEventListener('click',e=>{
  const rm=e.target.closest('[data-remove]');
  if(rm){
    const [g,i]=rm.dataset.remove.split(':');
    if(g==='main'){
      if(data.main.length<=1) return toast('Garde au moins une enveloppe.');
      data.main.splice(Number(i),1);
    } else if(data.sub[g]){
      if(data.sub[g].length<=1) return toast('Garde au moins une sous-catégorie.');
      data.sub[g].splice(Number(i),1);
    }
    save();refreshAll();
    return;
  }

  const add=e.target.closest('[data-add-sub]');
  if(add){
    const key=add.dataset.addSub;
    if(!data.sub[key]) data.sub[key]=[];
    data.sub[key].push({name:'Nouvelle sous-catégorie',pct:0});
    save();renderSettings();
    return;
  }

  const del=e.target.closest('[data-cat-delete]');
  if(del){
    const [type,i]=del.dataset.catDelete.split(':');
    if(!confirm('Retirer cette catégorie ? Les opérations déjà enregistrées restent dans l’historique.')) return;
    data.categories[type].splice(Number(i),1);
    save();refreshAll();
  }
});

// ===== BOUTON PRINCIPAL : Ajouter une enveloppe =====
if($('addMainCategory')) $('addMainCategory').addEventListener('click',()=>{
  const id='custom-'+Date.now();
  data.main.push({id, name:'Nouvelle enveloppe', pct:0});
  data.sub[id]=[]; // crée l’espace pour les sous-catégories
  save();
  renderSettings();
  renderDashboard();
  toast('Nouvelle enveloppe ajoutée. Ajuste le % pour arriver à 100 %.');
});

// Catégories revenus/dépenses
['income','expense'].forEach(type=>{
  const form=$(type==='income'?'addIncomeCategory':'addExpenseCategory');
  if(form) form.addEventListener('submit',e=>{
    e.preventDefault();
    const input=$(type==='income'?'newIncomeCategory':'newExpenseCategory');
    const name=input.value.trim();
    if(!name) return;
    if(data.categories[type].some(x=>x.toLowerCase()===name.toLowerCase())) return toast('Cette catégorie existe déjà.');
    data.categories[type].push(name);
    input.value='';
    save();refreshAll();toast('Catégorie ajoutée.');
  });
});

if($('incomeCategories')) $('incomeCategories').addEventListener('change',renameCat);
if($('expenseCategories')) $('expenseCategories').addEventListener('change',renameCat);
function renameCat(e){
  const el=e.target;
  if(!el.dataset.catName) return;
  const [type,i]=el.dataset.catName.split(':');
  const old=data.categories[type][Number(i)];
  const name=el.value.trim();
  if(!name) return refreshAll();
  data.categories[type][Number(i)]=name;
  data.transactions.forEach(t=>{if(t.type===type&&t.category===old) t.category=name});
  save();refreshAll();
}

// Sauvegarde / import / reset
if($('saveSettings')) $('saveSettings').addEventListener('click',()=>{
  save();refreshAll();
  if($('settingsStatus')) $('settingsStatus').textContent='Paramètres enregistrés sur cet appareil.';
  toast('Paramètres enregistrés.');
});
if($('exportAll')) $('exportAll').addEventListener('click',exportJSON);
if($('importAll')) $('importAll').addEventListener('click',()=>$('importJsonFile')?.click());
if($('importJsonFile')) $('importJsonFile').addEventListener('change',async e=>{
  const f=e.target.files[0];
  if(!f) return;
  try{
    const x=JSON.parse(await f.text());
    if(!x||!Array.isArray(x.transactions)||!Array.isArray(x.main)) throw Error();
    if(!confirm('Remplacer les données actuelles par cette sauvegarde ?')) return;
    data={...clone(defaults),...x};
    data.main.forEach(m=>{if(!data.sub[m.id]) data.sub[m.id]=[]});
    save();refreshAll();toast('Sauvegarde importée.');
  }catch(err){toast('Fichier de sauvegarde invalide.')}
  e.target.value='';
});
if($('resetAll')) $('resetAll').addEventListener('click',()=>{
  if(!confirm('Effacer toutes les opérations, investissements, activités et réglages de cette application sur cet appareil ? Exporte une sauvegarde avant de continuer.')) return;
  localStorage.removeItem(KEY);
  data=clone(defaults);
  save();refreshAll();toast('Données réinitialisées.');
});

if($('exportCsv')) $('exportCsv').addEventListener('click',exportCSV);
if($('printReport')) $('printReport').addEventListener('click',()=>window.print());

// Init
if($('txDate')) $('txDate').value=today();
if($('invDate')) $('invDate').value=today();
refreshAll();
const hash=location.hash.slice(1);
if(['dashboard','transactions','budget','invest','business','reports','settings'].includes(hash)) go(hash);
})();

