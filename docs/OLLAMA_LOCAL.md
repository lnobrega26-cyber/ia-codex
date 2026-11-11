# IA CODEX — integração local com Ollama

A aplicação inclui um módulo de interface para conversar com uma instalação local do Ollama. O modelo corre no computador do utilizador; não é executado no GitHub Pages nem no Render.

## Preparar o modelo

1. Instala o Ollama a partir de https://ollama.com/download.
2. Abre um terminal e executa:

```bash
ollama pull llama3
ollama list
```

Também podes usar um modelo mais pequeno, se o computador tiver recursos limitados, por exemplo `llama3.2` (desde que esteja disponível na biblioteca Ollama).

## Permitir a ligação do site

O módulo do navegador comunica com a API local em `http://localhost:11434`. Como o site e o Ollama têm origens diferentes, o Ollama tem de permitir a origem do site através de `OLLAMA_ORIGINS`.

Inclui apenas as origens que realmente utilizas. Exemplo para PowerShell no Windows:

```powershell
$env:OLLAMA_ORIGINS="https://lnobrega26-cyber.github.io,https://iagojo.com,http://localhost:5173"
ollama serve
```

Exemplo para macOS/Linux:

```bash
OLLAMA_ORIGINS="https://lnobrega26-cyber.github.io,https://iagojo.com,http://localhost:5173" ollama serve
```

Se o Ollama já estiver a correr como serviço ou aplicação de fundo, fecha/reinicia esse processo depois de definir a variável. A forma permanente de definir variáveis de ambiente depende do sistema operativo. Não exponhas a API do Ollama à internet pública.

## Usar na IA CODEX

1. Abre a IA CODEX e inicia sessão.
2. Abre o módulo **Ollama** na barra lateral.
3. Mantém o endereço `http://localhost:11434`.
4. Seleciona ou escreve o nome exato de um modelo listado por `ollama list`, por exemplo `llama3`.
5. Carrega em **Testar ligação e listar modelos** e depois envia uma mensagem.

## Limitações e segurança

- O computador que abre a IA CODEX tem de ter o Ollama instalado e em execução. `localhost` refere-se ao computador do próprio utilizador, não ao Render.
- O navegador pode bloquear pedidos por CORS se a origem do site não estiver em `OLLAMA_ORIGINS`.
- O módulo usa a API local `/api/tags` para listar modelos e `/api/chat` para conversar.
- O modelo tem de estar descarregado previamente com `ollama pull`.
- O módulo não instala software nem descarrega modelos automaticamente.
- Não configures encaminhamento de portas públicas para a API local do Ollama. Mantém o serviço acessível apenas no próprio computador ou numa rede privada de confiança.
- A disponibilidade e a velocidade dependem da memória, CPU/GPU e do tamanho do modelo.
- O Ollama local é independente do módulo Llama Local WebGPU; os dois podem coexistir.
