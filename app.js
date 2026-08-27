const APP_KEY = "Teste_RH_V21_20260824";
const ENTITY = "MUNICÍPIO DE SANTA AURORA";

const USERS = {
  servidor:{id:"servidor-001",role:"SERVIDOR",name:"João Almeida",initials:"JA",matricula:"65821",cargo:"Agente Administrativo",secretaria:"Secretaria Municipal de Saúde",setor:"Vigilância em Saúde",chefia:"Marina Costa",jornada:"40h semanais"},
  chefia:{id:"chefia-001",role:"CHEFIA",name:"Marina Costa",initials:"MC",matricula:"51208",cargo:"Diretora de Departamento",secretaria:"Secretaria Municipal de Saúde",setor:"Vigilância em Saúde",chefia:"Secretária Municipal",jornada:"40h semanais"},
  rh:{id:"rh-001",role:"RH",name:"Renata Martins",initials:"RM",matricula:"39014",cargo:"Analista de Recursos Humanos",secretaria:"Secretaria Municipal de Administração",setor:"Recursos Humanos",chefia:"Diretoria Administrativa",jornada:"40h semanais"},
  admin:{id:"admin-001",role:"ADMIN",name:"Administrador",initials:"AD",matricula:"00001",cargo:"Administrador do Sistema",secretaria:"Secretaria Municipal de Administração",setor:"Tecnologia da Informação",chefia:"—",jornada:"—"}
};

const INITIAL_STATE={
  version:2,currentRole:"servidor",sequences:{BH:0,JP:0,DOC:0},requests:[],
  point:[
    {date:"2026-08-24",in1:"07:58",out1:"12:01",in2:"13:29",out2:"—",status:"Em andamento"},
    {date:"2026-08-21",in1:"07:56",out1:"12:03",in2:"13:28",out2:"17:34",status:"Regular"},
    {date:"2026-08-20",in1:"08:01",out1:"12:00",in2:"13:31",out2:"17:32",status:"Regular"}
  ],
  balances:{"servidor-001":{moves:[]}}
};

let state=load(),currentPage="Visão geral",pendingFile=null;
const MENUS={
  servidor:[["◔","Visão geral"],["◷","Meu ponto"],["⇄","Banco de horas"],["↔","Justificativas e atestados"],["≡","Minhas solicitações"],["♟","Dados funcionais"]],
  chefia:[["◔","Visão geral"],["⇄","Solicitações da equipe"],["♟","Minha equipe"]],
  rh:[["◔","Visão geral"],["⇄","Entrada do RH"],["◷","Banco de horas"],["↔","Justificativas e atestados"],["♟","Pessoas"]],
  admin:[["◔","Visão geral"],["♟","Pessoas"],["⌘","Estrutura organizacional"],["⚿","Usuários e perfis"]]
};

function clone(x){return JSON.parse(JSON.stringify(x))}
function load(){try{const x=localStorage.getItem(APP_KEY);if(x)return JSON.parse(x)}catch(e){}localStorage.setItem(APP_KEY,JSON.stringify(INITIAL_STATE));return clone(INITIAL_STATE)}
function save(){
  try{localStorage.setItem(APP_KEY,JSON.stringify(state));return true}
  catch(e){alert("Não foi possível salvar os dados locais desta demonstração. Se houver anexos grandes, remova-os e tente novamente.");console.error(e);return false}
}
function user(){return USERS[state.currentRole]}
function resetAll(){if(!confirm("Zerar toda a demonstração? Todos os processos, documentos, saldos e anexos serão apagados."))return;state=clone(INITIAL_STATE);currentPage="Visão geral";save();render()}

function render(){
  document.getElementById("app").innerHTML=`
  <header class="topbar"><div class="top-left"><div class="menu-glyph">≡</div><div class="brand"><div class="brand-mark">T</div><div class="brand-name">TESTE</div></div></div>
  <div class="top-actions"><span class="top-icon">?</span><span class="top-icon">⊞</span><span class="top-icon">♟${pendingCount()?`<span class="notification-badge">${pendingCount()}</span>`:""}</span>
  <div class="top-icon clickable" id="profileButton"><div class="avatar">${user().initials}</div><div class="profile-menu" id="profileMenu"><div class="profile-head"><strong>Trocar visão</strong><div class="small muted">Ambiente demonstrativo</div></div>${Object.entries(USERS).map(([key,u])=>`<div class="profile-item clickable" data-role="${key}"><div class="profile-circle">${u.initials}</div><div class="profile-meta"><strong>${u.name}</strong><small>${u.role} · ${u.setor}</small></div></div>`).join("")}</div></div></div></header>
  <aside class="sidebar">${MENUS[state.currentRole].map(([ico,label])=>`<div class="nav-item ${currentPage===label?"active":""}" data-nav="${label}"><div class="nav-icon">${ico}</div><div>${label}</div></div>`).join("")}${state.currentRole==="admin"?`<div class="sidebar-footer clickable" id="resetButton">⚑ &nbsp; Zerar demonstração</div>`:""}</aside>
  <main class="main"><div class="entitybar"><span>🏛️</span><span>Entidade: ${ENTITY}</span><span>⌄</span></div><div class="content">${renderPage()}</div></main>`;
  bindMain();
}

function bindMain(){
  document.querySelectorAll("[data-nav]").forEach(el=>el.onclick=()=>{currentPage=el.dataset.nav;render()});
  const b=document.getElementById("profileButton"),m=document.getElementById("profileMenu");b.onclick=e=>{e.stopPropagation();m.classList.toggle("open")};document.addEventListener("click",()=>m?.classList.remove("open"),{once:true});
  document.querySelectorAll("[data-role]").forEach(el=>el.onclick=e=>{e.stopPropagation();state.currentRole=el.dataset.role;currentPage="Visão geral";save();render()});
  document.getElementById("resetButton")?.addEventListener("click",resetAll);
  document.querySelectorAll("[data-open-request]").forEach(el=>el.onclick=()=>openRequest(el.dataset.openRequest));
  document.querySelectorAll("[data-new]").forEach(el=>el.onclick=()=>openNewRequest(el.dataset.new||""));
}

function pendingCount(){if(state.currentRole==="chefia")return state.requests.filter(r=>r.status==="Aguardando chefia").length;if(state.currentRole==="rh")return state.requests.filter(r=>["Aguardando RH","Em análise","Analisando inconsistência"].includes(r.status)).length;if(state.currentRole==="servidor")return state.requests.filter(r=>r.applicantId===user().id&&["Devolvida ao servidor","Analisando inconsistência"].includes(r.status)).length;return 0}
function renderPage(){return state.currentRole==="servidor"?renderServidor():state.currentRole==="chefia"?renderChefia():state.currentRole==="rh"?renderRH():renderAdmin()}
function pageTop(title,actions=""){return `<div class="page-top"><h1 class="page-title">${title}</h1><div class="toolbar">${actions}</div></div>`}
function sClass(s){if(["Concluída","Regularizada","Autorizada pela chefia"].includes(s))return"status-green";if(["Aguardando chefia","Aguardando RH","Em análise"].includes(s))return"status-blue";if(["Devolvida ao servidor","Analisando inconsistência"].includes(s))return"status-yellow";if(["Não autorizada pela chefia","Indeferida pelo RH"].includes(s))return"status-red";return"status-gray"}
function badge(s){return `<span class="status ${sClass(s)}">${s}</span>`}
function own(){return state.requests.filter(r=>r.applicantId===USERS.servidor.id)}
function terminal(s){return["Concluída","Não autorizada pela chefia","Indeferida pelo RH","Cancelada"].includes(s)}
function empty(text="Não há registros por aqui."){return `<div class="empty"><div class="empty-icon"></div><div>${text}</div></div>`}

function renderServidor(){
  const u=user(),req=own(),bal=balanceText(u.id);
  if(currentPage==="Visão geral")return `${pageTop("Visão geral")}<div class="grid-2"><div class="card welcome"><div><div class="welcome-name">Bem-vindo, ${u.name.split(" ")[0]}!</div><div>Matrícula: <span class="status status-gray">${u.matricula}</span> <span class="link small">(Alterar matrícula)</span></div><div class="small muted" style="margin-top:8px">Última atividade da conta: agora</div></div></div><div class="card card-pad"><div class="section-title">Situação funcional</div><div class="kv" style="margin-top:10px"><div class="k">Cargo</div><div>${u.cargo}</div><div class="k">Lotação</div><div>${u.setor}</div><div class="k">Chefia</div><div>${u.chefia}</div></div></div></div>
  <div class="grid-4" style="margin-top:10px"><div class="card metric"><div class="metric-label">Ponto de hoje</div><div class="metric-value" style="font-size:19px">Em andamento</div><div class="metric-sub">07:58 · 12:01 · 13:29 · —</div></div><div class="card metric"><div class="metric-label">Banco de horas</div><div class="metric-value">${bal}</div><div class="metric-sub">Saldo desta demonstração</div></div><div class="card metric"><div class="metric-label">Solicitações abertas</div><div class="metric-value">${req.filter(r=>!terminal(r.status)).length}</div><div class="metric-sub">Acompanhamento digital</div></div><div class="card metric"><div class="metric-label">Pendências</div><div class="metric-value">${req.filter(r=>["Devolvida ao servidor","Analisando inconsistência"].includes(r.status)).length}</div><div class="metric-sub">Requer atenção</div></div></div>
  <div class="grid-2"><div class="card section"><div class="section-head"><div class="section-title">Mural</div></div><div class="section-body">${req.length?`<div class="note">${latest(req[0])}</div>`:`<div class="small muted" style="padding:8px 0">Nenhuma atualização recente.</div>`}</div></div><div class="card section"><div class="section-head"><div class="section-title">Últimas solicitações</div><button class="btn btn-primary" data-new="">Nova solicitação</button></div><div class="section-body">${requestTable(req.slice(0,4))}</div></div></div>`;
  if(currentPage==="Meu ponto")return `${pageTop("Meu ponto",`<button class="btn btn-primary" data-new="JP">Justificar ponto</button>`)}<div class="card"><div class="section-head"><div class="section-title">Marcações recentes</div></div><div class="section-body">${pointTable()}</div></div>`;
  if(currentPage==="Banco de horas"){const bh=req.filter(r=>r.kind==="BH"),moves=state.balances[u.id]?.moves||[];return `${pageTop("Banco de horas",`<button class="btn btn-primary" data-new="BH">Solicitar inclusão</button>`)}<div class="grid-3"><div class="card metric"><div class="metric-label">Saldo atual</div><div class="metric-value">${bal}</div><div class="metric-sub">Calculado pelas movimentações concluídas</div></div><div class="card metric"><div class="metric-label">Em processamento</div><div class="metric-value">${bh.filter(r=>!terminal(r.status)).length}</div></div><div class="card metric"><div class="metric-label">Concluídas</div><div class="metric-value">${bh.filter(r=>r.status==="Concluída").length}</div></div></div><div class="card section"><div class="section-head"><div class="section-title">Movimentações</div></div><div class="section-body">${balanceTable(moves)}</div></div><div class="card section"><div class="section-head"><div class="section-title">Solicitações</div></div><div class="section-body">${requestTable(bh)}</div></div>`}
  if(currentPage==="Justificativas e atestados")return `${pageTop("Justificativas e atestados",`<button class="btn btn-primary" data-new="JP">Nova justificativa</button>`)}<div class="card"><div class="section-body" style="padding-top:14px">${requestTable(req.filter(r=>r.kind==="JP"))}</div></div>`;
  if(currentPage==="Minhas solicitações")return `${pageTop("Minhas solicitações",`<button class="btn btn-primary" data-new="">Nova solicitação</button>`)}<div class="card"><div class="section-body" style="padding-top:14px">${requestTable(req)}</div></div>`;
  return `${pageTop("Dados funcionais")}<div class="card card-pad"><div class="section-title">Ficha funcional resumida</div><hr class="sep"><div class="kv"><div class="k">Nome</div><div>${u.name}</div><div class="k">Matrícula</div><div>${u.matricula}</div><div class="k">Cargo</div><div>${u.cargo}</div><div class="k">Secretaria</div><div>${u.secretaria}</div><div class="k">Lotação</div><div>${u.setor}</div><div class="k">Chefia imediata</div><div>${u.chefia}</div><div class="k">Jornada</div><div>${u.jornada}</div></div></div>`;
}

function renderChefia(){const p=state.requests.filter(r=>r.status==="Aguardando chefia");if(currentPage==="Visão geral")return `${pageTop("Visão geral")}<div class="grid-2"><div class="card welcome"><div><div class="welcome-name">Bem-vinda, Marina!</div><div>${user().cargo}</div><div class="small muted" style="margin-top:8px">${user().setor}</div></div></div><div class="card card-pad"><div class="section-title">Pendências da chefia</div><div class="grid-2" style="margin-top:12px"><div><div class="metric-value">${p.length}</div><div class="metric-sub">Aguardando manifestação</div></div><div><div class="metric-value">${state.requests.filter(r=>r.approvedBy===user().name).length}</div><div class="metric-sub">Aprovadas</div></div></div></div></div><div class="card section"><div class="section-head"><div class="section-title">Aguardando sua manifestação</div></div><div class="section-body">${requestTable(p)}</div></div>`;if(currentPage==="Solicitações da equipe")return `${pageTop("Solicitações da equipe")}<div class="card"><div class="section-body" style="padding-top:14px">${requestTable(state.requests)}</div></div>`;return `${pageTop("Minha equipe")}<div class="card"><div class="section-body" style="padding-top:14px">${teamTable()}</div></div>`}
function renderRH(){const p=state.requests.filter(r=>["Aguardando RH","Em análise","Analisando inconsistência"].includes(r.status));if(currentPage==="Visão geral")return `${pageTop("Visão geral")}<div class="grid-4"><div class="card metric"><div class="metric-label">Recebidas</div><div class="metric-value">${p.length}</div><div class="metric-sub">Após manifestação da chefia</div></div><div class="card metric"><div class="metric-label">Em análise</div><div class="metric-value">${state.requests.filter(r=>r.status==="Em análise").length}</div></div><div class="card metric"><div class="metric-label">Inconsistências</div><div class="metric-value">${state.requests.filter(r=>r.status==="Analisando inconsistência").length}</div></div><div class="card metric"><div class="metric-label">Concluídas</div><div class="metric-value">${state.requests.filter(r=>r.status==="Concluída").length}</div></div></div><div class="card section"><div class="section-head"><div class="section-title">Entrada do Recursos Humanos</div></div><div class="section-body">${requestTable(p)}</div></div>`;if(currentPage==="Entrada do RH")return `${pageTop("Entrada do RH")}<div class="card"><div class="section-body" style="padding-top:14px">${requestTable(p)}</div></div>`;if(currentPage==="Banco de horas")return `${pageTop("Banco de horas")}<div class="card"><div class="section-body" style="padding-top:14px">${requestTable(state.requests.filter(r=>r.kind==="BH"&&r.status!=="Aguardando chefia"))}</div></div>`;if(currentPage==="Justificativas e atestados")return `${pageTop("Justificativas e atestados")}<div class="card"><div class="section-body" style="padding-top:14px">${requestTable(state.requests.filter(r=>r.kind==="JP"&&r.status!=="Aguardando chefia"))}</div></div>`;return `${pageTop("Pessoas")}<div class="card"><div class="section-body" style="padding-top:14px">${peopleTable()}</div></div>`}
function renderAdmin(){if(currentPage==="Visão geral")return `${pageTop("Visão geral")}<div class="grid-4"><div class="card metric"><div class="metric-label">Usuários</div><div class="metric-value">4</div></div><div class="card metric"><div class="metric-label">Perfis</div><div class="metric-value">4</div></div><div class="card metric"><div class="metric-label">Solicitações</div><div class="metric-value">${state.requests.length}</div></div><div class="card metric"><div class="metric-label">Documentos gerados</div><div class="metric-value">${state.requests.reduce((n,r)=>n+(r.documents?.length||0),0)}</div></div></div>`;if(currentPage==="Pessoas")return `${pageTop("Pessoas")}<div class="card"><div class="section-body" style="padding-top:14px">${peopleTable()}</div></div>`;if(currentPage==="Estrutura organizacional")return `${pageTop("Estrutura organizacional")}<div class="grid-2"><div class="card card-pad"><div class="section-title">Secretaria Municipal de Saúde</div><hr class="sep"><div>Vigilância em Saúde</div><div class="small muted" style="margin-top:5px">Chefia: Marina Costa</div></div><div class="card card-pad"><div class="section-title">Secretaria Municipal de Administração</div><hr class="sep"><div>Recursos Humanos</div></div></div>`;return `${pageTop("Usuários e perfis")}<div class="card"><div class="section-body" style="padding-top:14px">${peopleTable()}</div></div>`}

function requestTable(a){if(!a.length)return empty("Não há solicitações recentes por aqui.");return `<table><thead><tr><th>Protocolo</th><th>Assunto</th><th>Servidor</th><th>Referência</th><th>Situação</th></tr></thead><tbody>${a.map(r=>`<tr class="clickable" data-open-request="${r.id}"><td><span class="link">${r.id}</span></td><td>${r.title}</td><td>${r.applicant}</td><td>${refText(r)}</td><td>${badge(r.status)}</td></tr>`).join("")}</tbody></table>`}
function pointTable(){return `<table><thead><tr><th>Data</th><th>Entrada</th><th>Saída intervalo</th><th>Retorno</th><th>Saída</th><th>Situação</th></tr></thead><tbody>${state.point.map(p=>`<tr><td>${fmtDate(p.date)}</td><td>${p.in1}</td><td>${p.out1}</td><td>${p.in2}</td><td>${p.out2}</td><td>${badge(p.status)}</td></tr>`).join("")}</tbody></table>`}
function balanceTable(a){if(!a.length)return empty("Nenhuma movimentação registrada nesta demonstração.");return `<table><thead><tr><th>Data</th><th>Referência</th><th>Movimento</th><th>Saldo após movimento</th></tr></thead><tbody>${a.map((m,i)=>`<tr><td>${m.date}</td><td>${m.ref}</td><td><strong>${m.minutes>=0?"+":"-"}${minsText(Math.abs(m.minutes))}</strong></td><td>${runningBalanceAt(a,i)}</td></tr>`).join("")}</tbody></table>`}
function teamTable(){return `<table><thead><tr><th>Servidor</th><th>Cargo</th><th>Lotação</th><th>Situação</th></tr></thead><tbody><tr><td>João Almeida</td><td>Agente Administrativo</td><td>Vigilância em Saúde</td><td>${badge("Ativo")}</td></tr><tr><td>Ana Lima</td><td>Agente de Serviços</td><td>Vigilância em Saúde</td><td>${badge("Férias")}</td></tr><tr><td>Paulo Costa</td><td>Fiscal</td><td>Vigilância em Saúde</td><td>${badge("Ativo")}</td></tr></tbody></table>`}
function peopleTable(){return `<table><thead><tr><th>Nome</th><th>Matrícula</th><th>Cargo</th><th>Secretaria</th><th>Lotação</th><th>Situação</th></tr></thead><tbody>${[["João Almeida","65821","Agente Administrativo","Saúde","Vigilância em Saúde","Ativo"],["Marina Costa","51208","Diretora de Departamento","Saúde","Vigilância em Saúde","Ativo"],["Renata Martins","39014","Analista de Recursos Humanos","Administração","Recursos Humanos","Ativo"],["Ana Lima","61044","Agente de Serviços","Saúde","Vigilância em Saúde","Férias"]].map(r=>`<tr>${r.slice(0,5).map(x=>`<td>${x}</td>`).join("")}<td>${badge(r[5])}</td></tr>`).join("")}</tbody></table>`}

function openNewRequest(kind=""){if(!kind){openModal("Nova solicitação","Escolha o assunto",`<div class="choice-grid"><div class="choice" id="cBH"><div class="choice-title">Inclusão no Banco de Horas</div><div class="choice-sub">Horas extraordinárias para análise da chefia e processamento pelo RH.</div></div><div class="choice" id="cJP"><div class="choice-title">Justificativa de Ponto / Atestado</div><div class="choice-sub">Ponto não registrado, falha, atividade externa, atestado ou declaração.</div></div></div>`);document.getElementById("cBH").onclick=()=>{closeModal();openBH()};document.getElementById("cJP").onclick=()=>{closeModal();openJP()};return}kind==="BH"?openBH():openJP()}

function openBH(editId=null){
  const r=editId?state.requests.find(x=>x.id===editId):null,u=USERS.servidor;
  openModal(
    r?"Corrigir solicitação":"Nova solicitação",
    "Inclusão no Banco de Horas",
    `<div class="form-grid">
      <div class="field"><label>Servidor</label><input value="${u.name}" disabled></div>
      <div class="field"><label>Matrícula</label><input value="${u.matricula}" disabled></div>

      <div class="field">
        <label>Data inicial <span class="required-dot">*</span></label>
        ${dateControl("bhStart",r?.startDate||"")}
      </div>
      <div class="field">
        <label>Data final</label>
        ${dateControl("bhEnd",r?.endDate||"")}
        <div class="calendar-hint">Deixe vazio quando for apenas um dia.</div>
      </div>

      <div class="field">
        <label>Horas 50% <span class="required-dot">*</span></label>
        <input id="bh50" inputmode="numeric" autocomplete="off" value="${r?.hours50||"00:00"}" placeholder="HH:MM">
      </div>
      <div class="field">
        <label>Horas 100%</label>
        <input id="bh100" inputmode="numeric" autocomplete="off" value="${r?.hours100||"00:00"}" placeholder="HH:MM">
      </div>

      <div class="field full">
        <label>Motivo / atividade extraordinária <span class="required-dot">*</span></label>
        <textarea id="bhReason" placeholder="Ex.: participação em reunião extraordinária, atividade externa, fechamento de serviço...">${r?.reason||""}</textarea>
      </div>
      <div class="field full">
        <label>Observação complementar</label>
        <textarea id="bhNote" style="min-height:60px">${r?.note||""}</textarea>
      </div>
    </div>
    <div class="actionbar">
      <button class="btn" data-close>Cancelar</button>
      <button class="btn btn-primary" id="submitBH">${r?"Corrigir e reenviar":"Enviar para chefia"}</button>
    </div>`
  );

  bindDateControl("bhStart");
  bindDateControl("bhEnd");
  bindDurationInput("bh50");
  bindDurationInput("bh100");

  document.getElementById("submitBH").onclick=()=>{
    const start=readDateControl("bhStart",true);
    if(start===null)return;
    const end=readDateControl("bhEnd",false);
    if(end===null)return;

    const h50=normalizeDuration(v("bh50"));
    const h100=normalizeDuration(v("bh100"));
    const reason=v("bhReason"),note=v("bhNote");

    if(!reason||!validDuration(h50)||!validDuration(h100)||(h50==="00:00"&&h100==="00:00")){
      alert("Preencha o motivo e ao menos uma quantidade de horas válida no formato HH:MM.");
      return;
    }
    if(end&&end<start){
      alert("A data final não pode ser anterior à data inicial.");
      return;
    }

    if(r){
      Object.assign(r,{
        startDate:start,endDate:end,hours50:h50,hours100:h100,reason,note,
        status:"Aguardando chefia",returnReason:"",bossPublicReply:"",bossInternalNote:""
      });
      r.history.push(evt(u.name,"Solicitação corrigida e reenviada para a chefia"));
      addDoc(r,"SOLICITACAO","Solicitação reenviada",u.name,{label:"Versão corrigida pelo servidor"});
    }else{
      const id=nextId("BH");
      const nr={
        id,kind:"BH",title:"Inclusão no Banco de Horas",
        applicantId:u.id,applicant:u.name,matricula:u.matricula,cargo:u.cargo,
        secretaria:u.secretaria,setor:u.setor,startDate:start,endDate:end,
        hours50:h50,hours100:h100,reason,note,status:"Aguardando chefia",
        created:now(),history:[evt(u.name,"Solicitação criada"),evt(u.name,"Encaminhada para a chefia")],
        documents:[]
      };
      addDoc(nr,"SOLICITACAO","Comprovante da solicitação",u.name);
      state.requests.unshift(nr);
    }
    if(save()){closeModal();render()}
  };
}
function openJP(editId=null){
  const r=editId?state.requests.find(x=>x.id===editId):null,u=USERS.servidor;
  pendingFile=r?.attachment||null;

  openModal(
    r?"Corrigir justificativa":"Nova justificativa",
    "Justificativa de Ponto / Atestado",
    `<div class="form-grid">
      <div class="field"><label>Servidor</label><input value="${u.name}" disabled></div>
      <div class="field"><label>Matrícula</label><input value="${u.matricula}" disabled></div>

      <div class="field">
        <label>Assunto <span class="required-dot">*</span></label>
        <select id="jpNature">${options([
          "Esquecimento de marcação",
          "Falha no relógio/sistema de ponto",
          "Atividade externa a serviço",
          "Reunião/convocação institucional",
          "Atestado médico",
          "Declaração de comparecimento",
          "Outro"
        ],r?.nature)}</select>
      </div>

      <div class="field" id="jpOccurrenceWrap">
        <label>Ocorrência</label>
        <select id="jpOccurrence">${options([
          "Entrada",
          "Saída para intervalo",
          "Retorno do intervalo",
          "Saída final",
          "Mais de uma marcação",
          "Dia inteiro / ausência"
        ],r?.occurrence)}</select>
      </div>

      <div class="field">
        <label>Data inicial <span class="required-dot">*</span></label>
        ${dateControl("jpStart",r?.startDate||"")}
      </div>

      <div class="field" id="jpEndWrap">
        <label>Data final</label>
        ${dateControl("jpEnd",r?.endDate||"")}
      </div>

      <div class="field" id="jpTimeWrap">
        <label>Horário correto</label>
        ${clockControl("jpTime",r?.informedTime||"")}
        <div class="help">Formato brasileiro de 24 horas: HH:MM.</div>
      </div>

      <div class="field full">
        <label>Justificativa detalhada <span class="required-dot">*</span></label>
        <textarea id="jpReason" placeholder="Explique de forma objetiva o que ocorreu e o que precisa ser regularizado.">${r?.reason||""}</textarea>
        <div class="help" id="jpHelp"></div>
      </div>

      <div class="field full">
        <label>Documento / comprovante</label>
        <div class="file-box">
          <div class="file-name" id="fileName">${pendingFile?esc(pendingFile.name):"Nenhum arquivo selecionado"}</div>
          <div class="toolbar" style="margin:0">
            <input id="jpFile" type="file" accept=".pdf,image/*" class="hidden">
            <button class="btn" id="chooseFile" type="button">Selecionar arquivo</button>
            ${pendingFile?`<button class="btn btn-danger" id="removeFile" type="button">Remover</button>`:""}
          </div>
        </div>
        <div class="help">PDF ou imagem, até 2 MB nesta demonstração local.</div>
      </div>
    </div>

    <div class="actionbar">
      <button class="btn" data-close>Cancelar</button>
      <button class="btn btn-primary" id="submitJP">${r?"Corrigir e reenviar":"Enviar para chefia"}</button>
    </div>`
  );

  bindDateControl("jpStart");
  bindDateControl("jpEnd");
  bindClockInput("jpTime");

  const nat=document.getElementById("jpNature");
  const occ=document.getElementById("jpOccurrence");
  const fi=document.getElementById("jpFile");

  document.getElementById("chooseFile").onclick=()=>fi.click();
  fi.onchange=async()=>{
    const f=fi.files?.[0];
    if(!f)return;
    if(f.size>2*1024*1024){
      alert("Use um arquivo de até 2 MB.");
      fi.value="";
      return;
    }
    pendingFile=await storeFile(f);
    document.getElementById("fileName").textContent=f.name;
  };
  document.getElementById("removeFile")?.addEventListener("click",()=>{
    pendingFile=null;
    fi.value="";
    document.getElementById("fileName").textContent="Nenhum arquivo selecionado";
  });

  nat.onchange=adaptJP;
  occ.onchange=adaptJP;
  adaptJP();

  document.getElementById("submitJP").onclick=()=>{
    const nature=v("jpNature");
    const medical=nature==="Atestado médico";
    const declaration=nature==="Declaração de comparecimento";
    const pointContext=!medical&&!declaration;

    const start=readDateControl("jpStart",true);
    if(start===null)return;
    const end=readDateControl("jpEnd",false);
    if(end===null)return;

    const occVal=pointContext?v("jpOccurrence"):"";
    const rawTime=pointContext?v("jpTime"):"";
    const time=rawTime?normalizeClock(rawTime):"";
    const reason=v("jpReason");

    if(!reason){
      alert("Preencha a justificativa detalhada.");
      return;
    }
    if(end&&end<start){
      alert("A data final não pode ser anterior à inicial.");
      return;
    }
    if(medical&&!pendingFile){
      alert("Anexe o atestado para enviar.");
      return;
    }

    const needsTime=pointContext && occVal!=="Dia inteiro / ausência" && occVal!=="Mais de uma marcação";
    if(needsTime&&!time){
      alert("Informe o horário correto no formato HH:MM.");
      return;
    }
    if(time&&!validClock(time)){
      alert("Horário inválido. Use o formato de 24 horas HH:MM, de 00:00 a 23:59.");
      return;
    }

    if(r){
      Object.assign(r,{
        nature,occurrence:occVal,startDate:start,endDate:end,informedTime:time,reason,
        attachment:pendingFile,restrictedAttachment:medical,status:"Aguardando chefia",
        returnReason:"",bossPublicReply:"",bossInternalNote:""
      });
      r.title=titleNature(nature);
      r.history.push(evt(u.name,"Justificativa corrigida e reenviada para a chefia"));
      addDoc(r,"SOLICITACAO","Justificativa reenviada",u.name,{label:"Versão corrigida pelo servidor"});
    }else{
      const id=nextId("JP");
      const nr={
        id,kind:"JP",title:titleNature(nature),applicantId:u.id,applicant:u.name,
        matricula:u.matricula,cargo:u.cargo,secretaria:u.secretaria,setor:u.setor,
        nature,occurrence:occVal,startDate:start,endDate:end,informedTime:time,reason,
        attachment:pendingFile,restrictedAttachment:medical,status:"Aguardando chefia",
        created:now(),history:[evt(u.name,"Justificativa criada"),evt(u.name,"Encaminhada para a chefia")],
        documents:[]
      };
      addDoc(nr,"SOLICITACAO","Comprovante da justificativa",u.name);
      state.requests.unshift(nr);
    }

    pendingFile=null;
    if(save()){closeModal();render()}
  };
}

function adaptJP(){
  const nature=v("jpNature");
  const occ=v("jpOccurrence");
  const medical=nature==="Atestado médico";
  const declaration=nature==="Declaração de comparecimento";
  const pointContext=!medical&&!declaration;
  const noSingleTime=occ==="Dia inteiro / ausência"||occ==="Mais de uma marcação";

  document.getElementById("jpOccurrenceWrap")?.classList.toggle("hidden",!pointContext);
  document.getElementById("jpTimeWrap")?.classList.toggle("hidden",!pointContext||noSingleTime);

  const help=document.getElementById("jpHelp");
  if(!help)return;
  help.textContent=medical
    ?"Anexe o atestado. Não informe CID ou diagnóstico no texto."
    :declaration
      ?"Informe o período necessário para justificar a ocorrência e, se houver, anexe a declaração."
      :noSingleTime
        ?"Explique no texto quais marcações estão faltando e os respectivos horários."
        :"Informe o que ocorreu, qual marcação faltou e o horário correto.";
}
function openRequest(id){const r=state.requests.find(x=>x.id===id);if(!r)return;let actions=`<div class="actionbar"><button class="btn" data-close>Fechar</button></div>`;if(state.currentRole==="servidor"&&r.status==="Devolvida ao servidor")actions=`<div class="actionbar"><button class="btn" data-close>Fechar</button><button class="btn btn-primary" id="fixReq">Corrigir e reenviar</button></div>`;if(state.currentRole==="chefia"&&r.status==="Aguardando chefia")actions=bossControls(r);if(state.currentRole==="rh"&&["Aguardando RH","Em análise","Analisando inconsistência"].includes(r.status))actions=rhControls(r);openModal(r.id,r.title,`${processSteps(r)}<div style="display:flex;justify-content:space-between;gap:10px"><div><strong>${r.applicant}</strong><div class="small muted">Matrícula ${r.matricula} · ${r.cargo}</div></div>${badge(r.status)}</div><hr class="sep">${details(r)}${responses(r)}${attachment(r)}${documents(r)}<hr class="sep"><div class="section-title" style="font-size:15px;margin-bottom:12px">Histórico do processo</div><div class="timeline">${r.history.slice().reverse().map(h=>`<div class="timeline-item"><div class="timeline-title">${esc(h.action)}</div><div class="timeline-meta">${esc(h.by)} · ${h.at}</div></div>`).join("")}</div>${actions}`);bindActions(r)}
function processSteps(r){const idx=r.status==="Aguardando chefia"||r.status==="Devolvida ao servidor"||r.status==="Não autorizada pela chefia"?1:["Aguardando RH","Em análise","Analisando inconsistência","Indeferida pelo RH"].includes(r.status)?2:r.status==="Concluída"?3:0;return `<div class="process-steps">${["Servidor","Chefia","RH","Concluído"].map((x,i)=>`<div class="process-step ${i<idx?"done":""} ${i===idx?"current":""}"><strong>${i+1}. ${x}</strong>${i===0?"Solicitação":i===1?"Manifestação":i===2?"Processamento":"Resultado"}</div>`).join("")}</div>`}
function details(r){if(r.kind==="BH")return `<div class="kv"><div class="k">Secretaria</div><div>${r.secretaria}</div><div class="k">Lotação</div><div>${r.setor}</div><div class="k">Período</div><div>${refText(r)}</div><div class="k">Horas solicitadas</div><div><strong>${r.hours50} (50%)${r.hours100!=="00:00"?` · ${r.hours100} (100%)`:""}</strong></div><div class="k">Motivo</div><div>${esc(r.reason)}</div>${r.note?`<div class="k">Observação</div><div>${esc(r.note)}</div>`:""}${r.registered50?`<div class="k">Registrado pelo RH</div><div>${r.registered50} (50%)${r.registered100!=="00:00"?` · ${r.registered100} (100%)`:""}</div>`:""}</div>`;return `<div class="kv"><div class="k">Secretaria</div><div>${r.secretaria}</div><div class="k">Lotação</div><div>${r.setor}</div><div class="k">Assunto</div><div>${r.nature}</div><div class="k">Período</div><div>${refText(r)}</div><div class="k">Ocorrência</div><div>${r.occurrence}</div>${r.informedTime?`<div class="k">Horário informado</div><div><strong>${r.informedTime}</strong></div>`:""}<div class="k">Justificativa</div><div>${esc(r.reason)}</div>${r.rhResult?`<div class="k">Resultado do RH</div><div>${esc(r.rhResult)}</div>`:""}</div>`}
function responses(r){let h="";if(r.bossPublicReply)h+=`<div class="response-box public"><div class="response-title">Devolutiva da chefia ao servidor</div>${esc(r.bossPublicReply)}</div>`;if(r.rhPublicReply)h+=`<div class="response-box public"><div class="response-title">Devolutiva do RH ao servidor</div>${esc(r.rhPublicReply)}</div>`;if(state.currentRole!=="servidor"){if(r.bossInternalNote)h+=`<div class="response-box internal"><div class="response-title">Observação interna da chefia</div>${esc(r.bossInternalNote)}</div>`;if(r.rhInternalNote)h+=`<div class="response-box internal"><div class="response-title">Observação interna do RH</div>${esc(r.rhInternalNote)}</div>`}return h}
function attachment(r){if(!r.attachment)return"";if(state.currentRole==="chefia"&&r.restrictedAttachment)return `<hr class="sep"><div class="section-title" style="font-size:15px">Documento anexado <span class="restricted">conteúdo restrito ao RH</span></div><div class="small muted" style="margin-top:7px">${esc(r.attachment.name)}</div>`;return `<hr class="sep"><div class="section-title" style="font-size:15px">Documento anexado</div><div style="margin-top:8px"><button class="btn" id="openAttachment">Abrir ${esc(r.attachment.name)}</button></div>`}
function documents(r){if(!r.documents?.length)return"";return `<hr class="sep"><div class="section-title" style="font-size:15px">Documentos do processo</div><div class="docs-grid">${r.documents.map(d=>`<div class="doc-card clickable" data-process-doc="${d.id}"><div class="doc-card-left"><div class="doc-card-icon">▤</div><div style="min-width:0"><div class="doc-card-title">${esc(d.title)}</div><div class="doc-card-meta">${d.createdAt} · ${esc(d.createdBy)}</div></div></div><span class="link small">Abrir</span></div>`).join("")}</div>`}

function bossControls(r){return `<hr class="sep"><div class="form-section-title">Manifestação da chefia</div><div class="form-grid"><div class="field full"><label>Devolutiva ao servidor</label><textarea id="bossPublic" placeholder="Mensagem que o servidor verá. Para devolução ou não autorização, este campo é obrigatório."></textarea></div><div class="field full"><label>Observação interna</label><textarea id="bossInternal" style="min-height:60px" placeholder="Visível somente para Chefia, RH e Administração. Não aparece ao servidor nem nos documentos públicos."></textarea></div></div><div class="actionbar"><button class="btn btn-danger" id="bossDeny">Não autorizar</button><button class="btn btn-warning" id="bossReturn">Devolver para correção</button><button class="btn btn-success" id="bossApprove">${r.kind==="BH"?"Autorizar e encaminhar ao RH":"Aprovar e encaminhar ao RH"}</button></div>`}
function rhControls(r){
  const core=r.kind==="BH"
    ?`<div class="field"><label>Horas 50% a registrar</label><input id="rh50" inputmode="numeric" autocomplete="off" value="${r.registered50||r.hours50}"></div>
      <div class="field"><label>Horas 100% a registrar</label><input id="rh100" inputmode="numeric" autocomplete="off" value="${r.registered100||r.hours100}"></div>`
    :`<div class="field"><label>Providência</label><select id="rhResultType">${options([
        "Marcação regularizada",
        "Ausência justificada",
        "Atestado registrado",
        "Declaração registrada",
        "Sem alteração no ponto",
        "Outro"
      ],r.rhResultType)}</select></div>
      <div class="field" id="rhFixedTimeWrap">
        <label>Horário regularizado</label>
        ${clockControl("rhFixedTime",r.rhFixedTime||r.informedTime||"")}
        <div class="help">Formato de 24 horas: HH:MM.</div>
      </div>`;

  const analyzeButton=r.status==="Em análise"
    ?""
    :`<button class="btn" id="rhAnalyze">Marcar em análise</button>`;

  return `<hr class="sep">
    <div class="form-section-title">Processamento pelo RH</div>
    <div class="form-grid">
      ${core}
      <div class="field full">
        <label>Devolutiva ao servidor <span class="required-dot">*</span></label>
        <textarea id="rhPublic" placeholder="Explique o resultado, a pendência ou o motivo da decisão. Esta mensagem ficará visível ao servidor.">${r.rhPublicReply||""}</textarea>
      </div>
      <div class="field full">
        <label>Observação interna</label>
        <textarea id="rhInternal" style="min-height:60px" placeholder="Informação de trabalho interno; não será exibida ao servidor.">${r.rhInternalNote||""}</textarea>
      </div>
    </div>
    <div class="actionbar">
      <button class="btn btn-danger" id="rhDeny">Indeferir</button>
      <button class="btn btn-warning" id="rhFlag">Sinalizar inconsistência</button>
      ${analyzeButton}
      <button class="btn btn-success" id="rhComplete">Registrar e concluir</button>
    </div>`;
}

function bindActions(r){
  document.getElementById("fixReq")?.addEventListener("click",()=>{closeModal();r.kind==="BH"?openBH(r.id):openJP(r.id)});
  document.getElementById("openAttachment")?.addEventListener("click",()=>openFile(r.attachment));
  document.querySelectorAll("[data-process-doc]").forEach(el=>el.onclick=()=>openDocument(r.id,el.dataset.processDoc));

  if(r.kind==="BH"){
    bindDurationInput("rh50");
    bindDurationInput("rh100");
  }else{
    bindClockInput("rhFixedTime");
    const resultSel=document.getElementById("rhResultType");
    if(resultSel){resultSel.onchange=adaptRHResult;adaptRHResult()}
  }
  document.getElementById("bossApprove")?.addEventListener("click",()=>bossAction(r,"approve"));document.getElementById("bossReturn")?.addEventListener("click",()=>bossAction(r,"return"));document.getElementById("bossDeny")?.addEventListener("click",()=>bossAction(r,"deny"));document.getElementById("rhAnalyze")?.addEventListener("click",()=>rhAction(r,"analyze"));document.getElementById("rhFlag")?.addEventListener("click",()=>rhAction(r,"flag"));document.getElementById("rhDeny")?.addEventListener("click",()=>rhAction(r,"deny"));document.getElementById("rhComplete")?.addEventListener("click",()=>rhAction(r,"complete"))}
function bossAction(r,action){
  const pub=v("bossPublic"),internal=v("bossInternal");
  if(["return","deny"].includes(action)&&!pub){
    alert("Informe ao servidor o motivo da devolução ou da não autorização.");
    return;
  }

  r.bossPublicReply=pub||(action==="approve"
    ?"Solicitação aprovada pela chefia e encaminhada ao Setor de Recursos Humanos."
    :"");
  r.bossInternalNote=internal;
  r.bossActionBy=USERS.chefia.name;
  r.bossActionAt=now();

  if(action==="approve"){
    r.approvedBy=USERS.chefia.name;
    r.approvedAt=r.bossActionAt;
    r.status="Aguardando RH";
    r.history.push(evt(USERS.chefia.name,r.kind==="BH"?"Autorizada pela chefia":"Aprovada pela chefia"));
    r.history.push(evt("Sistema","Encaminhada ao RH"));
    addDoc(r,"CHEFIA","Manifestação da chefia — aprovada",USERS.chefia.name,{
      decision:"Aprovada",publicReply:r.bossPublicReply
    });
  }else if(action==="return"){
    r.status="Devolvida ao servidor";
    r.returnReason=pub;
    r.history.push(evt(USERS.chefia.name,`Devolvida para correção: ${pub}`));
    addDoc(r,"CHEFIA","Manifestação da chefia — devolvida",USERS.chefia.name,{
      decision:"Devolvida para correção",publicReply:pub
    });
  }else{
    r.status="Não autorizada pela chefia";
    r.history.push(evt(USERS.chefia.name,`Não autorizada: ${pub}`));
    addDoc(r,"CHEFIA","Manifestação da chefia — não autorizada",USERS.chefia.name,{
      decision:"Não autorizada",publicReply:pub
    });
  }

  if(save()){closeModal();render()}
}
function rhAction(r,action){const pub=v("rhPublic"),internal=v("rhInternal");if(!pub){alert("Preencha a devolutiva ao servidor antes de registrar a ação do RH.");return}r.rhPublicReply=pub;r.rhInternalNote=internal;r.rhBy=USERS.rh.name;r.rhAt=now();if(action==="analyze"){r.status="Em análise";r.history.push(evt(USERS.rh.name,"Análise iniciada pelo RH"));addDoc(r,"RH_ANALISE","Registro de análise do RH",USERS.rh.name,{publicReply:pub})}else if(action==="flag"){r.status="Analisando inconsistência";r.inconsistency=pub;r.history.push(evt(USERS.rh.name,`Inconsistência sinalizada: ${pub}`));addDoc(r,"RH_INCONSISTENCIA","Comunicado de inconsistência",USERS.rh.name,{publicReply:pub})}else if(action==="deny"){r.status="Indeferida pelo RH";r.rhResult="Indeferida";r.history.push(evt(USERS.rh.name,`Solicitação indeferida: ${pub}`));addDoc(r,"RH_DECISAO","Devolutiva do RH — indeferida",USERS.rh.name,{decision:"Indeferida",publicReply:pub})}else{if(!completeRH(r,pub))return}save();closeModal();render()}
function completeRH(r,pub){
  if(r.kind==="BH"){
    const h50=normalizeDuration(v("rh50")),h100=normalizeDuration(v("rh100"));
    if(!validDuration(h50)||!validDuration(h100)){
      alert("Use o formato HH:MM para as horas do Banco de Horas.");
      return false;
    }
    r.registered50=h50;
    r.registered100=h100;
    r.rhResult=`Inclusão registrada: ${h50} (50%)${h100!=="00:00"?` · ${h100} (100%)`:""}`;
    const added=toMins(h50)+toMins(h100);
    addBalance(r.applicantId,r.id,added);
    r.balanceAfter=balanceText(r.applicantId);
  }else{
    const typ=v("rhResultType");
    let fixed=v("rhFixedTime");
    if(typ==="Marcação regularizada"){
      fixed=normalizeClock(fixed);
      if(!fixed||!validClock(fixed)){
        alert("Para regularizar a marcação, informe um horário válido de 00:00 a 23:59.");
        return false;
      }
    }else{
      fixed="";
    }

    r.rhResultType=typ;
    r.rhFixedTime=fixed;
    r.rhResult=typ+(fixed?` · ${fixed}`:"");
    if(typ==="Marcação regularizada")applyPoint(r,fixed);
  }

  r.status="Concluída";
  r.inconsistency="";
  r.history.push(evt(USERS.rh.name,`Processamento concluído: ${r.rhResult}`));
  addDoc(
    r,
    "RH_CONCLUSAO",
    r.kind==="BH"?"Comprovante de inclusão no Banco de Horas":"Comprovante de regularização / registro",
    USERS.rh.name,
    {decision:"Concluída",publicReply:pub,result:r.rhResult,balanceAfter:r.balanceAfter||""}
  );
  return true;
}

function adaptRHResult(){
  const sel=document.getElementById("rhResultType");
  const wrap=document.getElementById("rhFixedTimeWrap");
  if(!sel||!wrap)return;
  wrap.classList.toggle("hidden",sel.value!=="Marcação regularizada");
}

function addDoc(r,type,title,by,meta={}){state.sequences.DOC++;r.documents=r.documents||[];r.documents.push({id:`DOC-${String(state.sequences.DOC).padStart(5,"0")}`,type,title,createdAt:now(),createdBy:by,meta,snapshot:snapshot(r)})}
function snapshot(r){return {id:r.id,kind:r.kind,title:r.title,applicant:r.applicant,matricula:r.matricula,cargo:r.cargo,secretaria:r.secretaria,setor:r.setor,startDate:r.startDate,endDate:r.endDate,hours50:r.hours50,hours100:r.hours100,reason:r.reason,note:r.note,nature:r.nature,occurrence:r.occurrence,informedTime:r.informedTime,status:r.status,bossPublicReply:r.bossPublicReply||"",rhPublicReply:r.rhPublicReply||"",registered50:r.registered50||"",registered100:r.registered100||"",rhResult:r.rhResult||""}}
function openDocument(reqId,docId){const r=state.requests.find(x=>x.id===reqId),d=r?.documents?.find(x=>x.id===docId);if(!r||!d)return;const s=d.snapshot,m=d.meta||{};let title=d.title,body="";if(d.type==="SOLICITACAO")body=s.kind==="BH"?`O servidor <strong>${s.applicant}</strong>, matrícula <strong>${s.matricula}</strong>, lotado em <strong>${s.setor}</strong>, solicita a inclusão no Banco de Horas de <strong>${s.hours50}</strong> hora(s) a 50%${s.hours100&&s.hours100!=="00:00"?` e <strong>${s.hours100}</strong> hora(s) a 100%`:""}, referentes a <strong>${refSnap(s)}</strong>.<br><br><strong>Motivo:</strong> ${esc(s.reason)}.`:`O servidor <strong>${s.applicant}</strong>, matrícula <strong>${s.matricula}</strong>, apresenta <strong>${(s.nature||"justificativa").toLowerCase()}</strong> referente a <strong>${refSnap(s)}</strong>${s.occurrence?`, ocorrência: <strong>${s.occurrence}</strong>`:""}${s.informedTime?`, horário informado: <strong>${s.informedTime}</strong>`:""}.<br><br><strong>Justificativa:</strong> ${esc(s.reason)}.`;else if(d.type==="CHEFIA")body=`A Chefia, representada por <strong>${d.createdBy}</strong>, registrou a manifestação <strong>${esc(m.decision||"")}</strong> sobre o processo <strong>${r.id}</strong>.<br><br><strong>Devolutiva ao servidor:</strong> ${esc(m.publicReply||"")}.`;else if(d.type==="RH_ANALISE")body=`O Setor de Recursos Humanos registrou o início da análise do processo <strong>${r.id}</strong>.<br><br><strong>Comunicação ao servidor:</strong> ${esc(m.publicReply||"")}.`;else if(d.type==="RH_INCONSISTENCIA")body=`Durante a análise do processo <strong>${r.id}</strong>, o Setor de Recursos Humanos identificou necessidade de conferência.<br><br><strong>Inconsistência comunicada:</strong> ${esc(m.publicReply||"")}.`;else body=`O Setor de Recursos Humanos concluiu o processamento do processo <strong>${r.id}</strong>.<br><br><strong>Resultado:</strong> ${esc(m.result||m.decision||s.rhResult||"")}<br><br><strong>Devolutiva ao servidor:</strong> ${esc(m.publicReply||"")}${m.balanceAfter?`<br><br><strong>Saldo demonstrativo após o registro:</strong> ${m.balanceAfter}`:""}.`;openModal("Documento do processo",r.id,`<div class="doc"><div class="doc-head"><div class="doc-org">${ENTITY}</div><div class="doc-unit">${s.secretaria}</div></div><div class="doc-title">${esc(title)}</div><div class="doc-body">${body}</div><div class="doc-sign"><div class="doc-line"></div><strong>${esc(d.createdBy)}</strong><br><span class="small">Registro eletrônico</span></div><div class="doc-proof"><strong>Registro do processo</strong><br>Protocolo: ${r.id}<br>Documento: ${d.id}<br>Gerado em: ${d.createdAt}<br>Situação registrada: ${esc(s.status)}</div></div><div class="actionbar"><button class="btn" onclick="window.print()">Imprimir / Salvar em PDF</button><button class="btn btn-primary" data-close>Fechar</button></div>`)}

function addBalance(uid,ref,minutes){state.balances[uid]=state.balances[uid]||{moves:[]};state.balances[uid].moves.push({date:todayBR(),ref,minutes})}
function balanceMinutes(uid){return (state.balances[uid]?.moves||[]).reduce((n,m)=>n+Number(m.minutes||0),0)}
function balanceText(uid){const n=balanceMinutes(uid);return `${n<0?"-":""}${minsText(Math.abs(n))}`}
function runningBalanceAt(moves,index){const chronological=moves.slice(0,index+1);const n=chronological.reduce((a,m)=>a+Number(m.minutes||0),0);return `${n<0?"-":""}${minsText(Math.abs(n))}`}
function applyPoint(r,fixed){const p=state.point.find(x=>x.date===r.startDate);if(!p)return;if(r.occurrence==="Entrada")p.in1=fixed;if(r.occurrence==="Saída para intervalo")p.out1=fixed;if(r.occurrence==="Retorno do intervalo")p.in2=fixed;if(r.occurrence==="Saída final")p.out2=fixed;p.status="Regular"}

function openModal(title,sub,html){const tpl=document.getElementById("modal-template"),node=tpl.content.cloneNode(true);node.querySelector("[data-modal-title]").textContent=title;node.querySelector("[data-modal-subtitle]").textContent=sub||"";node.querySelector("[data-modal-body]").innerHTML=html;document.body.appendChild(node);document.querySelectorAll("[data-close]").forEach(x=>x.onclick=closeModal);const back=document.querySelector("[data-backdrop]");back.onclick=e=>{if(e.target===back)closeModal()}}
function closeModal(){document.querySelector("[data-backdrop]")?.remove()}
function nextId(k){state.sequences[k]=(state.sequences[k]||0)+1;return `${k}-2026-${String(state.sequences[k]).padStart(6,"0")}`}
function evt(by,action){return{at:now(),by,action}}

function pad2(n){return String(n).padStart(2,"0")}

function now(){
  const d=new Date();
  return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function todayBR(){
  const d=new Date();
  return `${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}`;
}

function v(id){return(document.getElementById(id)?.value||"").trim()}

function options(a,sel=""){
  return a.map(x=>`<option ${x===sel?"selected":""}>${x}</option>`).join("");
}

function titleNature(n){
  return n==="Atestado médico"
    ?"Atestado"
    :n==="Declaração de comparecimento"
      ?"Declaração de comparecimento"
      :"Justificativa de Ponto";
}

/* Duração de banco de horas: pode ultrapassar 23h. */
function validDuration(x){
  if(!/^\d{1,3}:\d{2}$/.test(x))return false;
  const [h,m]=x.split(":").map(Number);
  return Number.isInteger(h)&&Number.isInteger(m)&&h>=0&&m>=0&&m<=59;
}
function normalizeDuration(x){
  const raw=String(x||"").trim();
  if(!raw)return"00:00";
  if(/^\d{1,3}:\d{1,2}$/.test(raw)){
    const [h,m]=raw.split(":");
    return `${String(Number(h)).padStart(2,"0")}:${String(Number(m)).padStart(2,"0")}`;
  }
  const digits=raw.replace(/\D/g,"").slice(0,5);
  if(digits.length>=3){
    const h=digits.slice(0,-2),m=digits.slice(-2);
    return `${String(Number(h)).padStart(2,"0")}:${m}`;
  }
  return raw;
}
function bindDurationInput(id){
  const el=document.getElementById(id);
  if(!el)return;
  el.addEventListener("blur",()=>{
    const n=normalizeDuration(el.value);
    if(validDuration(n))el.value=n;
  });
}

/* Horário de relógio: exclusivamente 24h, 00:00 a 23:59. */
function validClock(x){
  if(!/^\d{2}:\d{2}$/.test(x))return false;
  const [h,m]=x.split(":").map(Number);
  return h>=0&&h<=23&&m>=0&&m<=59;
}
function normalizeClock(x){
  const raw=String(x||"").trim();
  if(!raw)return"";
  if(/^\d{1,2}:\d{1,2}$/.test(raw)){
    const [h,m]=raw.split(":").map(Number);
    return `${pad2(h)}:${pad2(m)}`;
  }
  const digits=raw.replace(/\D/g,"").slice(0,4);
  if(digits.length===4)return `${digits.slice(0,2)}:${digits.slice(2)}`;
  if(digits.length===3)return `0${digits.slice(0,1)}:${digits.slice(1)}`;
  return raw;
}
function bindClockInput(id){
  const el=document.getElementById(id);
  if(!el)return;
  el.setAttribute("inputmode","numeric");
  el.setAttribute("autocomplete","off");
  el.setAttribute("maxlength","5");
  el.addEventListener("input",()=>{
    let d=el.value.replace(/\D/g,"").slice(0,4);
    if(d.length>2)d=d.slice(0,2)+":"+d.slice(2);
    el.value=d;
  });
  el.addEventListener("blur",()=>{
    const n=normalizeClock(el.value);
    if(validClock(n))el.value=n;
  });
}

function clockControl(id,value=""){
  return `<div class="field-control">
    <input id="${id}" class="clock-br-input" inputmode="numeric" autocomplete="off" maxlength="5"
      value="${esc(value)}" placeholder="HH:MM">
    <span class="field-control-icon" aria-hidden="true">◷</span>
  </div>`;
}

/* Data exibida e digitada em DD/MM/AAAA. O input nativo fica oculto apenas para abrir o calendário. */
function dateControl(id,iso=""){
  const shown=iso?fmtDate(iso):"";
  return `<div class="field-control date-control">
    <input id="${id}Br" class="date-br-input" inputmode="numeric" autocomplete="off" maxlength="10"
      value="${shown}" placeholder="DD/MM/AAAA">
    <button id="${id}Pick" class="field-control-button" type="button" title="Abrir calendário" aria-label="Abrir calendário">▣</button>
    <input id="${id}Native" class="native-date-picker" type="date" value="${iso||""}" tabindex="-1" aria-hidden="true">
  </div>`;
}
function bindDateControl(id){
  const text=document.getElementById(id+"Br");
  const native=document.getElementById(id+"Native");
  const pick=document.getElementById(id+"Pick");
  if(!text||!native||!pick)return;

  text.addEventListener("input",()=>{
    let d=text.value.replace(/\D/g,"").slice(0,8);
    if(d.length>4)d=d.slice(0,2)+"/"+d.slice(2,4)+"/"+d.slice(4);
    else if(d.length>2)d=d.slice(0,2)+"/"+d.slice(2);
    text.value=d;
  });

  text.addEventListener("blur",()=>{
    if(!text.value){native.value="";text.classList.remove("invalid-field");return}
    const iso=brDateToIso(text.value);
    if(iso){
      native.value=iso;
      text.value=fmtDate(iso);
      text.classList.remove("invalid-field");
    }else{
      text.classList.add("invalid-field");
    }
  });

  native.addEventListener("change",()=>{
    if(native.value){
      text.value=fmtDate(native.value);
      text.classList.remove("invalid-field");
    }
  });

  pick.addEventListener("click",()=>{
    try{
      if(typeof native.showPicker==="function")native.showPicker();
      else native.click();
    }catch(e){
      native.click();
    }
  });
}
function brDateToIso(raw){
  const m=String(raw||"").trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if(!m)return"";
  const d=Number(m[1]),mo=Number(m[2]),y=Number(m[3]);
  if(y<1900||y>2200||mo<1||mo>12||d<1||d>31)return"";
  const test=new Date(y,mo-1,d,12,0,0,0);
  if(test.getFullYear()!==y||test.getMonth()!==mo-1||test.getDate()!==d)return"";
  return `${y}-${pad2(mo)}-${pad2(d)}`;
}
function readDateControl(id,required=false){
  const text=document.getElementById(id+"Br");
  if(!text)return null;
  const raw=text.value.trim();
  if(!raw){
    if(required){
      alert("Informe a data no formato DD/MM/AAAA.");
      text.focus();
      return null;
    }
    return"";
  }
  const iso=brDateToIso(raw);
  if(!iso){
    alert("Data inválida. Use o formato brasileiro DD/MM/AAAA.");
    text.focus();
    text.classList.add("invalid-field");
    return null;
  }
  text.value=fmtDate(iso);
  text.classList.remove("invalid-field");
  const native=document.getElementById(id+"Native");
  if(native)native.value=iso;
  return iso;
}

function toMins(x){const[h,m]=x.split(":").map(Number);return h*60+m}
function minsText(n){return `${String(Math.floor(n/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`}
function fmtDate(x){if(!x)return"—";const[y,m,d]=x.split("-");return `${d}/${m}/${y}`}
function refText(r){return r.endDate?`${fmtDate(r.startDate)} a ${fmtDate(r.endDate)}`:fmtDate(r.startDate)}
function refSnap(s){return s.endDate?`${fmtDate(s.startDate)} a ${fmtDate(s.endDate)}`:fmtDate(s.startDate)}
function latest(r){if(r.status==="Devolvida ao servidor")return `<strong>${r.id}</strong> foi devolvida pela chefia. Motivo: ${esc(r.bossPublicReply||r.returnReason||"")}`;if(r.status==="Analisando inconsistência")return `<strong>${r.id}</strong> está em conferência. ${esc(r.rhPublicReply||"")}`;if(r.status==="Concluída")return `<strong>${r.id}</strong> foi concluída. ${esc(r.rhPublicReply||"")}`;return `<strong>${r.id}</strong> está em ${r.status.toLowerCase()}.`}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]))}
function storeFile(file){return new Promise((res,rej)=>{const rd=new FileReader();rd.onload=()=>res({name:file.name,type:file.type||"application/octet-stream",size:file.size,data:rd.result});rd.onerror=rej;rd.readAsDataURL(file)})}
function openFile(f){if(!f?.data){alert("Arquivo indisponível.");return}const w=window.open();if(!w){alert("O navegador bloqueou a abertura do anexo.");return}if(f.type.startsWith("image/"))w.document.write(`<title>${esc(f.name)}</title><body style="margin:0;background:#222;display:grid;place-items:center;min-height:100vh"><img src="${f.data}" style="max-width:96vw;max-height:96vh"></body>`);else w.location.href=f.data}

render();
