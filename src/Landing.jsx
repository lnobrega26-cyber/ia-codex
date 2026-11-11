import React,{useEffect,useState} from 'react';
import {Sparkles,ArrowRight,MessageSquare,Clapperboard,Puzzle,Server,Globe2,ShieldCheck,Zap,Code2,Star,GitBranch,Clock3,ExternalLink} from 'lucide-react';
import './landing.css';

const REPO='lnobrega26-cyber/ia-codex';
export default function Landing(){
  const [github,setGithub]=useState(null);
  const [latest,setLatest]=useState(null);
  const [githubError,setGithubError]=useState(false);
  useEffect(()=>{
    let active=true;
    Promise.all([
      fetch('https://api.github.com/repos/'+REPO).then(r=>{if(!r.ok)throw new Error('GitHub indisponível');return r.json()}),
      fetch('https://api.github.com/repos/'+REPO+'/commits?per_page=1').then(r=>{if(!r.ok)throw new Error('Commits indisponíveis');return r.json()})
    ]).then(([repoData,commits])=>{
      if(!active)return;
      setGithub(repoData);
      setLatest(Array.isArray(commits)?commits[0]:null);
    }).catch(()=>{if(active)setGithubError(true)});
    return ()=>{active=false};
  },[]);
  const updated=github?.updated_at?new Date(github.updated_at).toLocaleDateString('pt-PT',{day:'2-digit',month:'short',year:'numeric'}):'';
  return <div className="landing">
    <nav><a className="logo" href="#"><Sparkles/> CODEX</a><div><a href="#recursos">Recursos</a><a className="navcta" href="#app">Abrir plataforma <ArrowRight size={15}/></a></div></nav>
    <section className="hero"><small>✦ UMA NOVA FORMA DE CRIAR</small><h1>As tuas ideias.<br/><em>Sem fronteiras.</em></h1><p>Conhece a IA CODEX: um espaço para conversar, criar projetos, explorar ferramentas e construir o que imaginas.</p><a className="cta" href="#app">Experimentar IA CODEX <ArrowRight size={16}/></a>
      <div className="mock"><div className="mockhead">● ● ● <b>IA CODEX · WORKSPACE</b></div><div className="mockbody"><aside><b>✦ CODEX</b><span>Nova conversa</span><span>Chat</span><span>Estúdio</span><span>Plugins</span><span>Minecraft</span></aside><article><Sparkles/><h2>O que vamos criar <em>hoje?</em></h2><p>Um espaço para pensar, explorar ideias e construir coisas incríveis.</p><div className="pills"><span><MessageSquare/> Conversar</span><span><Clapperboard/> Criar vídeo</span><span><Code2/> Construir</span></div><div className="fake">Escreve a tua próxima ideia... <b>↑</b></div></article></div></div>
    </section>
    <section id="recursos"><small>UM ESPAÇO, MUITAS POSSIBILIDADES</small><h2>Ferramentas para ir<br/>mais longe.</h2><div className="grid">{[[MessageSquare,'Chat inteligente','Conversa e apoio a diferentes tarefas.'],[Clapperboard,'Estúdio criativo','Organiza cenas e projetos de vídeo.'],[Puzzle,'Plugins','Amplia as capacidades com integrações.'],[Server,'Minecraft','Planeia servidores, versões e plugins.'],[Globe2,'Multilingue','Deteção automática de idioma.'],[ShieldCheck,'Segurança','Permissões e controlo nas integrações.']].map(([I,t,d])=><div key={t}><I/><h3>{t}</h3><p>{d}</p></div>)}</div></section>
    <section className="github-section"><small>DESENVOLVIMENTO ABERTO</small><h2>O projeto, diretamente<br/>do GitHub.</h2><p className="github-intro">Esta área consulta o repositório público em tempo real. Os dados são carregados diretamente dos servidores do GitHub.</p>
      <div className="github-card">
        <div className="github-card-top"><div className="github-mark">GH</div><div><b>lnobrega26 / ia-codex</b><span>Repositório público · código-fonte da IA CODEX</span></div><a href="https://github.com/lnobrega26-cyber/ia-codex" target="_blank" rel="noreferrer" aria-label="Abrir repositório no GitHub"><ExternalLink/></a></div>
        {githubError?<p className="github-state">Não foi possível carregar os dados agora. Visita o repositório no GitHub para consultar o estado atual.</p>:!github?<p className="github-state">A consultar o GitHub...</p>:<>
          <div className="github-stats"><div><Star/><b>{github.stargazers_count}</b><span>Estrelas</span></div><div><GitBranch/><b>{github.default_branch}</b><span>Branch principal</span></div><div><Clock3/><b>{updated}</b><span>Atualizado</span></div></div>
          <div className="github-latest"><small>ATIVIDADE RECENTE</small><p>{latest?.commit?.message?.split('\n')[0]||'Sem commits recentes disponíveis'}</p><span>{latest?.commit?.author?.date?new Date(latest.commit.author.date).toLocaleString('pt-PT',{dateStyle:'medium',timeStyle:'short'}):'Aguardando dados'}</span></div>
        </>}
        <a className="github-link" href="https://github.com/lnobrega26-cyber/ia-codex" target="_blank" rel="noreferrer">Ver código e histórico no GitHub <ArrowRight size={15}/></a>
      </div>
    </section>
    <section className="last"><Zap/><small>CONSTRUÍDA PARA EVOLUIR</small><h2>Não é só responder.<br/><em>É ajudar a construir.</em></h2><p>A IA CODEX está em desenvolvimento. Novas capacidades serão adicionadas à medida que os serviços reais forem integrados.</p><a className="cta" href="#app">Entrar na plataforma <ArrowRight size={16}/></a></section>
    <footer><b>✦ CODEX</b><span>© 2026 IA CODEX · Projeto em desenvolvimento</span><a href="#app">Abrir plataforma</a></footer>
  </div>
}