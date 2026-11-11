import React,{useEffect,useState}from'react';
import{createRoot}from'react-dom/client';
import{Sparkles,MessageSquare,Clapperboard,Puzzle,Server,Plus,ArrowUp,Globe2,Languages,Code2,Compass,Settings2,ShieldCheck,Terminal,MonitorPlay,Check,LogOut,Coins,Lock,User,BrainCircuit}from'lucide-react';
import'./style.css';
import Landing from './Landing.jsx';

const lang={pt:'Português',en:'English',es:'Español',fr:'Français',de:'Deutsch',it:'Italiano',ja:'日本語',zh:'中文',ar:'العربية'};
function detect(s){
  s=s.toLowerCase();
  if(/[ãõçáéíóúâêô]/.test(s)||/\b(que|não|para|olá|como|quero)\b/.test(s))return'Português';
  if(/[¿¡ñ]/.test(s)||/\b(hola|quiero|gracias|cómo)\b/.test(s))return'Español';
  if(/\b(the|and|what|how|hello|please)\b/.test(s))return'English';
  return lang[navigator.language?.slice(0,2)]||'Idioma automático';
}
const API=(import.meta.env.VITE_API_BASE||'/api').replace(/\/$/,'');
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
function App(){
  const[t,T]=useState('Chat'),[m,M]=useState(''),[msgs,C]=useState([]),[busy,B]=useState(false),[toast,N]=useState(''),[plugins,G]=useState([['Pesquisa Web',true],['Tradutor Multilingue',true],['Gerador de Código',false],['Conector de Vídeo',false]]),[video,V]=useState('60'),[server,S]=useState('Meu servidor'),[session,SS]=useState(()=>localStorage.getItem('codex_session')), [user,U]=useState(null),[catalog,MC]=useState([]),[model,SM]=useState(''),[loading,L]=useState(true);
  function pop(s){N(s);setTimeout(()=>N(''),3500)}
  function saveAuth(data){localStorage.setItem('codex_session',data.token);SS(data.token);U(data.user)}
  function logout(){localStorage.removeItem('codex_session');SS(null);U(null);C([])}
  useEffect(()=>{fetch(API+'/models').then(r=>r.json()).then(d=>{MC(d.models||[]);const free=(d.models||[]).find(x=>x.free);if(free)SM(free.id);else if(d.models?.[0])SM(d.models[0].id)}).catch(()=>{});},[]);
  useEffect(()=>{if(!session){L(false);return}fetch(API+'/auth/me',{headers:{Authorization:'Bearer '+session}}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error);U(d.user)}).catch(()=>logout()).finally(()=>L(false))},[session]);
  async function send(){
    if(!m.trim()||busy||!user)return;
    const prompt=m.trim(),language=detect(prompt),next=[...msgs,{role:'user',content:prompt,language}];C(next);M('');B(true);
    try{
      const response=await fetch(API+'/chat',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session},body:JSON.stringify({messages:next.map(x=>({role:x.role,content:x.content})),language,modelId:model})});
      const data=await response.json();if(!response.ok){if(response.status===401)logout();if(data.credits!==undefined)U(u=>({...u,credits:data.credits}));throw new Error(data.error||'Não foi possível obter resposta.')}
      C(current=>[...current,{role:'assistant',content:data.reply,language,model:data.model,usedCredits:data.usedCredits}]);U(u=>({...u,credits:data.credits}));
    }catch(e){C(current=>[...current,{role:'assistant',content:e.message,language:language,error:true}])}finally{B(false)}
  }
  const nav=[['Chat',MessageSquare],['Estúdio',Clapperboard],['Plugins',Puzzle],['Minecraft',Server]];
  if(loading)return <div className="auth-screen">A carregar a IA CODEX...</div>;
  if(!user)return <AuthScreen onAuth={saveAuth}/>;
  return <div className="app"><aside><h2><Sparkles/> IA CODEX</h2><p className="sub">O teu espaço inteligente</p><div className="wallet-mini"><Coins/><b>{user.credits.toLocaleString('pt-PT')}</b><small>TOKENS</small></div><button className="new" onClick={()=>{T('Chat');C([])}}><Plus/> Nova conversa</button><small>ESPAÇO DE TRABALHO</small>{nav.map(([n,I])=><button className={'nav '+(t===n?'sel':'')} onClick={()=>T(n)}><I/>{n}</button>)}<div className="sidebottom">● Conta ativa<br/><small>@{user.username}</small><button className="logout" onClick={logout}><LogOut/> Terminar sessão</button></div></aside><main><header>{t}<span><Coins/> {user.credits.toLocaleString('pt-PT')} tokens <Settings2/></span></header>
  {t==='Chat'&&<section className="chat">{!msgs.length?<div className="welcome"><Sparkles/><small>INTELIGÊNCIA SEM FRONTEIRAS</small><h1>O que vamos criar<br/><em>hoje?</em></h1><p>Escolhe um modelo e começa uma conversa.</p><div className="ideas">{[[Code2,'Escrever código'],[Clapperboard,'Criar um vídeo'],[Compass,'Explorar o mundo']].map(([I,n])=><button onClick={()=>M(n)}><I/>{n}</button>)}</div></div>:<div className="messages">{msgs.map((x,i)=><article className={x.error?'message-error':''}><b>{x.role==='user'?'Tu':'IA CODEX'} · {x.language}</b><p>{x.content}</p>{x.role==='assistant'&&x.usedCredits>0&&<small>−{x.usedCredits} tokens · {x.model}</small>}</article>)}</div>}<div className="composer"><div className="model-picker"><BrainCircuit/><select value={model} onChange={e=>SM(e.target.value)}>{catalog.map(x=><option value={x.id}>{x.name} · {x.free?'GRÁTIS':x.inputCostPer1k+'/'+x.outputCostPer1k+' tokens por 1k'}</option>)}</select></div><textarea value={m} onChange={e=>M(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}} placeholder="Escreve em qualquer idioma..."/><div><span><Languages/> {m?detect(m):'Deteção automática'}{busy?' · A IA está a responder...':''}</span><button disabled={!m.trim()||busy} onClick={send}><ArrowUp/></button></div></div><footer>O modelo gratuito não desconta tokens. Modelos premium descontam conforme a utilização.</footer></section>}
  {t==='Estúdio'&&<section className="page"><small>LABORATÓRIO CRIATIVO</small><h1>Estúdio de criação</h1><p>Cria projetos multimédia através de cenas e segmentos.</p><div className="card"><Clapperboard/><h2>Gerador de vídeos</h2><label>Nome do projeto</label><input placeholder="Novo projeto"/><label>Duração do projeto</label><select value={video} onChange={e=>V(e.target.value)}>{['1','5','15','30','60'].map(x=><option value={x}>Até {x} minutos</option>)}</select><button onClick={()=>pop('O gerador de vídeo ainda precisa de um fornecedor real.')}>Preparar projeto</button><p className="hint">A duração é o limite do projeto, não uma promessa de geração gratuita ilimitada.</p></div><div className="card"><MonitorPlay/><h2>Biblioteca multimédia</h2><p>Organiza cenas, áudio e exportações. Editor em desenvolvimento.</p></div></section>}
  {t==='Plugins'&&<section className="page"><small>EXPANDE AS CAPACIDADES</small><h1>Central de plugins</h1><p>Ativa ferramentas para a IA.</p><button onClick={()=>pop('Plugins externos precisam de integrações e permissões seguras.')}>＋ Adicionar plugin</button><div className="pluginlist">{plugins.map(([n,on],i)=><div className="plugin"><b>{n}</b><button className={on?'on':''} onClick={()=>G(plugins.map((p,j)=>j===i?[p[0],!p[1]]:p))}>{on?'Ativo':'Inativo'}</button></div>)}</div><p className="hint"><ShieldCheck/> Plugins externos devem ter permissões explícitas e execução isolada.</p></section>}
  {t==='Minecraft'&&<section className="page"><small>GAME SERVER LAB</small><h1>Servidor Minecraft</h1><p>Prepara a configuração do teu servidor.</p><div className="card"><Server/><h2>Configuração</h2><label>Nome</label><input value={server} onChange={e=>S(e.target.value)}/><label>Versão</label><select><option>1.21.4</option><option>1.21.1</option><option>1.20.6</option></select><label>Tipo</label><select><option>Vanilla</option><option>Paper (plugins)</option><option>Fabric (mods)</option><option>Forge (mods)</option></select><button onClick={()=>pop('A gestão real precisa de integração com um fornecedor de alojamento.')}>Preparar servidor</button></div><div className="card"><Terminal/><h2>Publicação</h2><p>Para manter o servidor online precisas de um serviço de alojamento. A integração ainda está em desenvolvimento.</p></div></section>}
  </main>{toast&&<div className="toast"><Check/>{toast}</div>}</div>
}
createRoot(document.getElementById('root')).render(window.location.hash==='#app'?<App/>:<Landing/>);
