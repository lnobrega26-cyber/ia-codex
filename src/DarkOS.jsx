import React,{useState}from'react';
import{Terminal,ShieldCheck,HardDrive,Monitor,Wifi,FileText,PlayCircle}from'lucide-react';

const demoFiles=[
  {name:'README.txt',type:'Documento',size:'1 KB',description:'Notas de demonstração do DarkOS'},
  {name:'projeto-codex/',type:'Pasta',size:'—',description:'Espaço fictício do projeto'},
  {name:'config-demo.json',type:'Configuração de exemplo',size:'2 KB',description:'Configuração ilustrativa, sem segredos'},
  {name:'boas-praticas.md',type:'Documento',size:'3 KB',description:'Regras de utilização segura'}
];
const help='Comandos disponíveis: help, status, ls, whoami, clear';

export default function DarkOS(){
  const[command,setCommand]=useState('');
  const[lines,setLines]=useState(['DarkOS Terminal Demo v1.0','Terminal demonstrativo. Nenhum comando do sistema será executado.',help]);
  function run(e){
    e.preventDefault();
    const cmd=command.trim().toLowerCase();
    if(!cmd)return;
    let output='';
    if(cmd==='help')output=help;
    else if(cmd==='status')output='Estado: interface ativa · Rede: '+(navigator.onLine?'online':'offline')+' · WebGPU: '+(navigator.gpu?'disponível':'não detetado');
    else if(cmd==='ls')output=demoFiles.map(f=>f.name).join('    ');
    else if(cmd==='whoami')output='utilizador-demo (sessão fictícia, sem acesso ao sistema)';
    else if(cmd==='clear'){setLines([]);setCommand('');return}
    else output='Comando não reconhecido. Este terminal aceita apenas: help, status, ls, whoami, clear.';
    setLines(prev=>[...prev,'demo@darkos:~$ '+cmd,output]);
    setCommand('');
  }
  const status=[
    ['Aplicação','Ativa','A interface DarkOS está carregada'],
    ['Ligação à rede',navigator.onLine?'Online':'Offline','Estado reportado pelo navegador'],
    ['WebGPU',navigator.gpu?'Disponível':'Não detetado','Necessário para alguns modelos locais de IA'],
    ['Idioma',navigator.language||'Desconhecido','Preferência do navegador'],
    ['Ecrã',window.screen?window.screen.width+' × '+window.screen.height:'Indisponível','Dimensões do ecrã']
  ];
  return <section className="page darkos-page">
    <small>AMBIENTE DE DEMONSTRAÇÃO</small>
    <h1>DarkOS</h1>
    <p>Um painel seguro inspirado no pacote enviado, integrado na IA CODEX.</p>
    <div className="darkos-warning"><ShieldCheck/><span><b>Modo seguro ativo.</b> Este painel não instala componentes, não altera o sistema, não executa comandos reais e não envia ficheiros.</span></div>
    <div className="darkos-grid">
      <div className="card darkos-card"><h2><Monitor/> Estado do ambiente</h2>{status.map(([label,value,detail])=><div className="darkos-status"><span>{label}<small>{detail}</small></span><b>{value}</b></div>)}</div>
      <div className="card darkos-card"><h2><HardDrive/> Explorador demonstrativo</h2><p>Ficheiros fictícios para apresentar a interface. Não correspondem aos ficheiros do teu computador.</p>{demoFiles.map(f=><div className="darkos-file"><FileText/><span><b>{f.name}</b><small>{f.type} · {f.size}</small></span></div>)}</div>
    </div>
    <div className="card darkos-terminal"><h2><Terminal/> Terminal demonstrativo</h2><div className="darkos-console" aria-live="polite">{lines.map((line,i)=><p key={i}>{line}</p>)}</div><form onSubmit={run}><input value={command} onChange={e=>setCommand(e.target.value)} placeholder="Experimenta: help, status, ls..." aria-label="Comando demonstrativo"/><button><PlayCircle/> Executar demonstração</button></form><p className="hint">Apenas comandos de demonstração são aceites. Nenhuma instrução é enviada ao sistema operativo.</p></div>
  </section>
}
