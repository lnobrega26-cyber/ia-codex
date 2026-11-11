import React,{useEffect,useState}from'react';
import{createRoot}from'react-dom/client';
import{Sparkles,MessageSquare,Clapperboard,Puzzle,Server,Plus,ArrowUp,Globe2,Languages,Code2,Compass,Settings2,ShieldCheck,Terminal,MonitorPlay,Check,LogOut,Coins,Lock,User,BrainCircuit,Users,HardDrive}from'lucide-react';
import'./style.css';
import Landing from './Landing.jsx';
import DarkOS from './DarkOS.jsx';

const lang={pt:'Português',en:'English',es:'Español',fr:'Français',de:'Deutsch',it:'Italiano',ja:'日本語',zh:'中文',ar:'العربية'};
function detect(s){
  s=s.toLowerCase();
  if(/[ãõçáéíóúâêô]/.test(s)||/\b(que|não|para|olá|como|quero)\b/.test(s))return'Português';
  if(/[¿¡ñ]/.test(s)||/\b(hola|quiero|gracias|cómo)\b/.test(s))return'Español';
  if(/\b(the|and|what|how|hello|please)\b/.test(s))return'English';
  return lang[navigator.language?.slice(0,2)]||'Idioma automático';
}
const API=(import.meta.env.VITE_API_BASE||'https://ia-codex-api-wee5.onrender.com/api').replace(/\/$/,'');
const PROVIDER_CATALOG=['OpenAI','Claude','Gemini','Grok','DeepSeek','Mistral','Qwen','Kimi','Llama','GLM','MiniMax'];
let localEnginePromise=null;
async function getLocalEngine(onProgress){
  if(!localEnginePromise){
    localEnginePromise=(async()=>{
      const {CreateMLCEngine}=await import('@mlc-ai/web-llm');
      return CreateMLCEngine('Llama-3.2-1B-Instruct-q4f16_1-MLC',{initProgressCallback:report=>onProgress?.(report.text||'A preparar o modelo local...')});
    })().catch(error=>{localEnginePromise=null;throw error});
  }
  return localEnginePromise;
}
function AuthScreen({onAuth}){
  const[mode,setMode]=useState('register'),[username,setUsername]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function submit(e){
    e.preventDefault();setError('');setBusy(true);
    try{
      const r=await fetch(API+'/auth/'+mode,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
      const d=await r.json();if(!r.ok)throw new Error(d.error||'Não foi possível entrar.');
      onAuth(d);
    }catch(e){setError(e.message)}finally{setBusy(false)}
  }
  return <div className="auth-screen"><div className="auth-card"><div className="auth-brand"><Sparkles/><b>IA CODEX</b></div><small>O TEU ESPAÇO DE INTELIGÊNCIA</small><h1>{mode==='register'?'Cria a tua conta':'Bem-vindo de volta'}</h1><p>{mode==='register'?'Regista-te e recebe 1.000 tokens de boas-vindas.':'Entra para aceder aos teus modelos e tokens.'}</p><form onSubmit={submit}><label>Nome de utilizador</label><input autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="ex.: codex_user" minLength={3} maxLength={24} required/><label>Palavra-passe</label><input type="password" autoComplete={mode==='register'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 10 caracteres" minLength={mode==='register'?10:1} maxLength={128} required/>{error&&<p className="auth-error">{error}</p>}<button className="auth-submit" disabled={busy}>{busy?'A processar...':mode==='register'?'Criar conta e receber 1.000 tokens':'Entrar'}</button></form><button className="auth-switch" onClick={()=>{setMode(mode==='register'?'login':'register');setError('')}}>{mode==='register'?'Já tens conta? Entrar':'Ainda não tens conta? Criar conta'}</button><p className="auth-note"><Lock/> A palavra-passe é protegida no servidor. Não uses uma palavra-passe que já utilizes noutro serviço.</p></div></div>
}

function AdminPanel({session,pop}){
  const [items,setItems]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [form,setForm]=useState({id:'',name:'',provider:'OpenAI',model:'',apiBase:'https://api.openai.com/v1',apiKeyEnv:'OPENAI_API_KEY',inputCostPer1k:'',outputCostPer1k:'',free:false,enabled:true,description:''});
  const headers={'Content-Type':'application/json',Authorization:'Bearer '+session};
  async function load(){const r=await fetch(API+'/admin/models',{headers});const d=await r.json();if(!r.ok)throw new Error(d.error||'Falha ao carregar modelos.');setItems(d.models||[])}
  useEffect(()=>{load().catch(e=>setError(e.message))},[]);
  function edit(m){setForm({id:m.id,name:m.name,provider:m.provider,model:m.model,apiBase:m.api_base,apiKeyEnv:m.api_key_env,inputCostPer1k:String(m.input_cost_per_1k),outputCostPer1k:String(m.output_cost_per_1k),free:m.free,enabled:m.enabled,description:m.description||''})}
  async function save(e){e.preventDefault();setBusy(true);setError('');try{const r=await fetch(API+'/admin/models',{method:'POST',headers,body:JSON.stringify({...form,inputCostPer1k:Number(form.inputCostPer1k),outputCostPer1k:Number(form.outputCostPer1k)})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Falha ao guardar.');await load();pop('Modelo guardado no catálogo.')}catch(e){setError(e.message)}finally{setBusy(false)}}
  return <section className="page"><small>CONTROLO DA PLATAFORMA</small><h1>Painel de administração</h1><p>Configura modelos, disponibilidade e custo em créditos por cada 1.000 tokens.</p><div className="card"><h2>Catálogo de modelos</h2>{items.map(m=><div className="plugin"><div><b>{m.name}</b><p>{m.provider} · {m.model} · {m.free?'Grátis':m.input_cost_per_1k+'/'+m.output_cost_per_1k+' créditos/1k'}</p><small>{m.enabled?'Disponível':'Desativado'} · chave: {m.api_key_env}</small></div><button onClick={()=>edit(m)}>Editar</button></div>)}{!items.length&&<p className="hint">Ainda não há modelos na base de dados. Adiciona o primeiro abaixo.</p>}</div><form className="card admin-form" onSubmit={save}><h2>{form.id?'Editar modelo':'Adicionar modelo'}</h2><label>ID único</label><input required value={form.id} onChange={e=>setForm({...form,id:e.target.value})} placeholder="ex.: modelo-pro"/><label>Nome apresentado</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><label>Fornecedor</label><input required value={form.provider} onChange={e=>setForm({...form,provider:e.target.value})} placeholder="Ex.: OpenRouter, Groq, DeepSeek, Mistral..."/><label>Identificador do modelo no fornecedor</label><input required value={form.model} onChange={e=>setForm({...form,model:e.target.value})}/><label>URL base da API compatível com OpenAI (HTTPS)</label><input required value={form.apiBase} onChange={e=>setForm({...form,apiBase:e.target.value})} placeholder="https://.../v1"/><p className="hint">Aceita fornecedores que implementem o formato /chat/completions da OpenAI. Alguns serviços, como APIs nativas Anthropic, exigem um adaptador próprio e ainda não são suportados diretamente.</p><label>Nome da variável de ambiente da chave</label><input required value={form.apiKeyEnv} onChange={e=>setForm({...form,apiKeyEnv:e.target.value.toUpperCase()})}/><label>Custo de entrada por 1.000 tokens</label><input required type="number" min="0" step="0.0001" value={form.inputCostPer1k} onChange={e=>setForm({...form,inputCostPer1k:e.target.value})}/><label>Custo de saída por 1.000 tokens</label><input required type="number" min="0" step="0.0001" value={form.outputCostPer1k} onChange={e=>setForm({...form,outputCostPer1k:e.target.value})}/><label>Descrição</label><input value={form.description} maxLength={180} onChange={e=>setForm({...form,description:e.target.value})}/><label className="checkline"><input type="checkbox" checked={form.free} onChange={e=>setForm({...form,free:e.target.checked,inputCostPer1k:e.target.checked?'0':form.inputCostPer1k,outputCostPer1k:e.target.checked?'0':form.outputCostPer1k})}/> Modelo gratuito em créditos</label><label className="checkline"><input type="checkbox" checked={form.enabled} onChange={e=>setForm({...form,enabled:e.target.checked})}/> Disponibilizar aos utilizadores</label>{error&&<p className="auth-error">{error}</p>}<button className="auth-submit" disabled={busy}>{busy?'A guardar...':'Guardar modelo'}</button><p className="hint">As chaves secretas não são inseridas aqui. Configura a variável de ambiente indicada no servidor. O backend usa um formato compatível com OpenAI; confirma a documentação e os limites/preços do fornecedor antes de ligar.</p></form></section>
}

function MinecraftPanel({pop}){
  const [tab,setTab]=useState('Visão geral');
  const [config,setConfig]=useState(()=>{try{return JSON.parse(localStorage.getItem('codex_mc_config'))||{name:'Meu servidor',version:'1.21.4',type:'Paper',players:'20',memory:'4',motd:'Bem-vindo ao servidor!'}}catch{return {name:'Meu servidor',version:'1.21.4',type:'Paper',players:'20',memory:'4',motd:'Bem-vindo ao servidor!'}}});
  const [player,setPlayer]=useState('');
  const [players,setPlayers]=useState(()=>{try{return JSON.parse(localStorage.getItem('codex_mc_players'))||[]}catch{return []}});
  const [command,setCommand]=useState('');
  const [consoleLines]=useState(['A consola ficará disponível quando ligares um fornecedor de alojamento.']);
  function save(){localStorage.setItem('codex_mc_config',JSON.stringify(config));pop('Configuração guardada neste navegador. Ainda não foi enviada para um servidor real.')}
  function addPlayer(e){e.preventDefault();const name=player.trim();if(!/^[A-Za-z0-9_]{3,16}$/.test(name)){pop('Usa um nome Minecraft válido (3–16 caracteres).');return}if(players.some(p=>p.toLowerCase()===name.toLowerCase())){pop('Esse jogador já está na lista.');return}const next=[...players,name];setPlayers(next);localStorage.setItem('codex_mc_players',JSON.stringify(next));setPlayer('')}
  function removePlayer(name){const next=players.filter(p=>p!==name);setPlayers(next);localStorage.setItem('codex_mc_players',JSON.stringify(next))}
  const tabs=['Visão geral','Consola','Jogadores','Configurações','Backups'];
  return <section className="page mc-page"><small>GAME SERVER LAB</small><h1>Gestor de Minecraft</h1><p>Centraliza configuração, operação e manutenção do teu servidor.</p>
    <div className="mc-status"><span><i/> Sem servidor ligado</span><b>Integração de alojamento pendente</b></div>
    <div className="mc-tabs">{tabs.map(x=><button className={tab===x?'active':''} onClick={()=>setTab(x)}>{x}</button>)}</div>
    {tab==='Visão geral'&&<><div className="mc-stats"><div><small>ESTADO</small><b>Offline</b><span>Sem ligação ao alojamento</span></div><div><small>JOGADORES</small><b>— / {config.players}</b><span>Disponível após ligação</span></div><div><small>MEMÓRIA</small><b>{config.memory} GB</b><span>Limite pretendido</span></div></div><div className="card mc-card"><h2><Server/> Controlos do servidor</h2><p>Os controlos ficam bloqueados até ligares um painel de alojamento compatível.</p><div className="mc-actions"><button disabled title="Liga primeiro um fornecedor">Iniciar</button><button disabled title="Liga primeiro um fornecedor">Parar</button><button disabled title="Liga primeiro um fornecedor">Reiniciar</button></div></div><div className="card mc-card"><h2>Preparação rápida</h2><p>Define o nome, a versão e o tipo de servidor na secção Configurações. As alterações ficam guardadas localmente como rascunho.</p><button onClick={()=>setTab('Configurações')}>Editar configuração</button></div></>}
    {tab==='Consola'&&<div className="card mc-card"><h2><Terminal/> Consola</h2><div className="mc-console">{consoleLines.map(x=><p>{x}</p>)}</div><form className="mc-command" onSubmit={e=>{e.preventDefault();pop('A consola real só funciona depois de ligares o alojamento.');setCommand('')}}><input value={command} onChange={e=>setCommand(e.target.value)} placeholder="Comando Minecraft (ex.: list)" disabled/><button disabled>Enviar</button></form><p className="hint">Execução de comandos desativada enquanto não existir uma ligação segura ao servidor.</p></div>}
    {tab==='Jogadores'&&<div className="card mc-card"><h2><Users/> Lista de jogadores</h2><p>Rascunho local de jogadores a permitir. Ainda não sincroniza a whitelist real.</p><form className="mc-player-form" onSubmit={addPlayer}><input value={player} onChange={e=>setPlayer(e.target.value)} placeholder="Nome Minecraft" maxLength="16"/><button>Adicionar</button></form>{players.length?players.map(p=><div className="mc-player"><span>{p}</span><button onClick={()=>removePlayer(p)}>Remover</button></div>):<p className="hint">Ainda não adicionaste jogadores.</p>}</div>}
    {tab==='Configurações'&&<div className="card mc-card mc-settings"><h2><Settings2/> Configuração do servidor</h2><label>Nome do servidor</label><input value={config.name} maxLength="40" onChange={e=>setConfig({...config,name:e.target.value})}/><label>Versão Minecraft</label><select value={config.version} onChange={e=>setConfig({...config,version:e.target.value})}>{['1.21.4','1.21.1','1.20.6','1.20.4','1.19.4'].map(x=><option>{x}</option>)}</select><label>Software</label><select value={config.type} onChange={e=>setConfig({...config,type:e.target.value})}>{['Vanilla','Paper','Purpur','Fabric','Forge','NeoForge'].map(x=><option>{x}</option>)}</select><label>Máximo de jogadores</label><input type="number" min="1" max="500" value={config.players} onChange={e=>setConfig({...config,players:e.target.value})}/><label>Memória pretendida (GB)</label><select value={config.memory} onChange={e=>setConfig({...config,memory:e.target.value})}>{['2','4','6','8','12','16'].map(x=><option>{x}</option>)}</select><label>Mensagem do servidor (MOTD)</label><input value={config.motd} maxLength="100" onChange={e=>setConfig({...config,motd:e.target.value})}/><button onClick={save}>Guardar rascunho</button></div>}
    {tab==='Backups'&&<div className="card mc-card"><h2><HardDrive/> Backups e restauro</h2><p>Quando o alojamento estiver ligado, poderás criar cópias de segurança, consultar datas e restaurar uma cópia.</p><div className="mc-backup"><b>Nenhum backup disponível</b><span>É necessário configurar o fornecedor primeiro.</span></div><button disabled>Criar backup</button><button disabled>Restaurar backup</button></div>}
    <div className="mc-note"><ShieldCheck/><span><b>Integração ainda não ligada.</b> Esta versão disponibiliza a interface e rascunhos locais. Para criar, iniciar, parar, reiniciar, executar comandos, gerir ficheiros e backups reais, é necessário ligar um painel de alojamento (por exemplo, Pterodactyl) e configurar credenciais secretas apenas no backend. Não introduzas chaves aqui.</span></div>
  </section>
}

function App(){
  const[t,T]=useState('Chat'),[m,M]=useState(''),[msgs,C]=useState([]),[busy,B]=useState(false),[localStatus,LS]=useState(''),[toast,N]=useState(''),[plugins,G]=useState([['Pesquisa Web',true],['Tradutor Multilingue',true],['Gerador de Código',false],['Conector de Vídeo',false]]),[video,V]=useState('60'),[server,S]=useState('Meu servidor'),[session,SS]=useState(()=>localStorage.getItem('codex_session')), [user,U]=useState(null),[catalog,MC]=useState([]),[model,SM]=useState(''),[loading,L]=useState(true),[apiStatus,AS]=useState('checking');
  function pop(s){N(s);setTimeout(()=>N(''),3500)}
  function saveAuth(data){localStorage.setItem('codex_session',data.token);SS(data.token);U(data.user)}
  function logout(){localStorage.removeItem('codex_session');SS(null);U(null);C([])}
  useEffect(()=>{fetch(API+'/models').then(r=>r.json()).then(d=>{MC(d.models||[]);SM('local-llama')}).catch(()=>{MC([]);SM('local-llama')});},[]);
  useEffect(()=>{let active=true;fetch(API+'/health').then(r=>{if(!r.ok)throw new Error('API indisponível');return r.json()}).then(()=>{if(active)AS('online')}).catch(()=>{if(active)AS('offline')});return()=>{active=false}},[]);
  useEffect(()=>{if(!session){L(false);return}fetch(API+'/auth/me',{headers:{Authorization:'Bearer '+session}}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error);U(d.user)}).catch(()=>logout()).finally(()=>L(false))},[session]);
  async function send(){
    if(!m.trim()||busy||!user)return;
    const prompt=m.trim(),language=detect(prompt),next=[...msgs,{role:'user',content:prompt,language}];C(next);M('');B(true);
    try{
      if(!catalog.length||model==='local-llama'){
        if(!navigator.gpu)throw new Error('Este navegador/dispositivo não suporta WebGPU para executar a IA local. Experimenta abrir o site no Chrome ou Edge atualizado num computador compatível.');
        LS('A descarregar e preparar a IA local (primeira utilização)...');
        const engine=await getLocalEngine(LS);
        LS('A gerar resposta...');
        const result=await engine.chat.completions.create({messages:[{role:'system',content:'És a IA CODEX, um assistente útil, claro e honesto. Responde no idioma da mensagem mais recente. Se não souberes algo, diz isso; não inventes capacidades, fontes ou resultados.'},...next.map(x=>({role:x.role,content:x.content}))],temperature:0.65,max_tokens:768});
        const reply=result.choices?.[0]?.message?.content;
        if(!reply)throw new Error('A IA local não devolveu uma resposta. Tenta novamente.');
        C(current=>[...current,{role:'assistant',content:reply,language,model:'Llama 3.2 1B · local',usedCredits:0}]);
      }else{
        const response=await fetch(API+'/chat',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session},body:JSON.stringify({messages:next.map(x=>({role:x.role,content:x.content})),language,modelId:model})});
        const data=await response.json();if(!response.ok){if(response.status===401)logout();if(data.credits!==undefined)U(u=>({...u,credits:data.credits}));throw new Error(data.error||'Não foi possível obter resposta.')}
        C(current=>[...current,{role:'assistant',content:data.reply,language,model:data.model,usedCredits:data.usedCredits}]);U(u=>({...u,credits:data.credits}));
      }
    }catch(e){C(current=>[...current,{role:'assistant',content:e.message,language:language,error:true}])}finally{LS('');B(false)}
  }
  const nav=[['Chat',MessageSquare],['Estúdio',Clapperboard],['Plugins',Puzzle],['Minecraft',Server],['DarkOS',Terminal],...(user.is_admin?[['Admin',Settings2]]:[])];
  if(loading)return <div className="auth-screen">A carregar a IA CODEX...</div>;
  if(!user)return <AuthScreen onAuth={saveAuth}/>;
  return <div className="app"><aside><h2><Sparkles/> IA CODEX</h2><p className="sub">O teu espaço inteligente</p><div className="wallet-mini"><Coins/><b>{user.credits.toLocaleString('pt-PT')}</b><small>TOKENS</small></div><button className="new" onClick={()=>{T('Chat');C([])}}><Plus/> Nova conversa</button><small>ESPAÇO DE TRABALHO</small>{nav.map(([n,I])=><button className={'nav '+(t===n?'sel':'')} onClick={()=>T(n)}><I/>{n}</button>)}<div className="sidebottom">● Conta ativa<br/><small>@{user.username}</small><button className="logout" onClick={logout}><LogOut/> Terminar sessão</button></div></aside><main><header>{t}<span className="header-status"><i className={'api-dot '+apiStatus}/>{apiStatus==='checking'?'A verificar API':apiStatus==='online'?'API ligada':'API indisponível'} <Coins/> {user.credits.toLocaleString('pt-PT')} tokens <Settings2/></span></header>
  {t==='Chat'&&<section className="chat">{!msgs.length?<div className="welcome"><Sparkles/><small>INTELIGÊNCIA SEM FRONTEIRAS</small><h1>O que vamos criar<br/><em>hoje?</em></h1><p>Escolhe um modelo e começa uma conversa.</p><div className="ideas">{[[Code2,'Escrever código'],[Clapperboard,'Criar um vídeo'],[Compass,'Explorar o mundo']].map(([I,n])=><button onClick={()=>M(n)}><I/>{n}</button>)}</div></div>:<div className="messages">{msgs.map((x,i)=><article className={x.error?'message-error':''}><b>{x.role==='user'?'Tu':'IA CODEX'} · {x.language}</b><p>{x.content}</p>{x.role==='assistant'&&x.usedCredits>0&&<small>−{x.usedCredits} tokens · {x.model}</small>}</article>)}</div>}<div className="composer"><div className="model-picker"><BrainCircuit/><select value={model} onChange={e=>SM(e.target.value)}><option value="local-llama">Llama 3.2 1B · IA local gratuita (sem chave)</option><option value="" disabled>{catalog.length?"Seleciona um modelo ligado":"IA local no teu dispositivo"}</option>{PROVIDER_CATALOG.map(provider=><option key={provider} value={'unavailable-'+provider} disabled>{provider} — Integração pendente</option>)}<optgroup label="Modelos ligados">{catalog.map(x=><option key={x.id} value={x.id}>{x.name} · {x.free?'GRÁTIS':x.inputCostPer1k+'/'+x.outputCostPer1k+' tokens por 1k'}</option>)}</optgroup></select></div><textarea value={m} onChange={e=>M(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}} placeholder="Escreve em qualquer idioma..."/><div><span><Languages/> {m?detect(m):'Deteção automática'}{busy?' · '+(localStatus||'A IA está a responder...'):''}</span><button disabled={!m.trim()||busy} onClick={send}><ArrowUp/></button></div></div><footer>{model==='local-llama'?"Llama 3.2 1B local: sem chave e sem custo por token. O primeiro uso descarrega o modelo para este dispositivo; depois fica guardado no navegador. Requer WebGPU, ligação à internet no primeiro carregamento e memória/disco suficientes.":"Modelos externos usam o fornecedor configurado e podem ter limites ou custos. Consulta sempre as condições do fornecedor."}</footer></section>}
  {t==='Estúdio'&&<section className="page"><small>LABORATÓRIO CRIATIVO</small><h1>Estúdio de criação</h1><p>Cria projetos multimédia através de cenas e segmentos.</p><div className="card"><Clapperboard/><h2>Gerador de vídeos</h2><label>Nome do projeto</label><input placeholder="Novo projeto"/><label>Duração do projeto</label><select value={video} onChange={e=>V(e.target.value)}>{['1','5','15','30','60'].map(x=><option value={x}>Até {x} minutos</option>)}</select><button onClick={()=>pop('O gerador de vídeo ainda precisa de um fornecedor real.')}>Preparar projeto</button><p className="hint">A duração é o limite do projeto, não uma promessa de geração gratuita ilimitada.</p></div><div className="card"><MonitorPlay/><h2>Biblioteca multimédia</h2><p>Organiza cenas, áudio e exportações. Editor em desenvolvimento.</p></div></section>}
  {t==='Plugins'&&<section className="page"><small>EXPANDE AS CAPACIDADES</small><h1>Central de plugins</h1><p>Ativa ferramentas para a IA.</p><button onClick={()=>pop('Plugins externos precisam de integrações e permissões seguras.')}>＋ Adicionar plugin</button><div className="pluginlist">{plugins.map(([n,on],i)=><div className="plugin"><b>{n}</b><button className={on?'on':''} onClick={()=>G(plugins.map((p,j)=>j===i?[p[0],!p[1]]:p))}>{on?'Ativo':'Inativo'}</button></div>)}</div><p className="hint"><ShieldCheck/> Plugins externos devem ter permissões explícitas e execução isolada.</p></section>}
  {t==='Admin'&&<AdminPanel session={session} pop={pop}/>}{t==='Minecraft'&&<MinecraftPanel pop={pop}/>}{t==='DarkOS'&&<DarkOS/>}
  </main>{toast&&<div className="toast"><Check/>{toast}</div>}</div>
}
const root=createRoot(document.getElementById('root'));
function renderPage(){root.render(window.location.hash==='#app'?<App/>:<Landing/>);}
window.addEventListener('hashchange',renderPage);
renderPage();
