# IA CODEX — Llama local

A IA CODEX inclui um modo de conversa local com **Meta Llama 3.2 1B Instruct**, executado no navegador através de WebLLM.

## Como funciona

- O modelo corre no dispositivo do utilizador; as mensagens do modo local não são enviadas ao endpoint `/api/chat`.
- Não é necessária uma chave de API nem uma conta num fornecedor de modelos para inferência local. A aplicação ainda exige sessão iniciada para aceder à área de chat.
- Na primeira utilização, o navegador descarrega os ficheiros do modelo. É necessária ligação à internet durante esse carregamento.
- O WebLLM guarda os recursos em cache no navegador para reutilização, sujeito às políticas de armazenamento do browser.
- É necessário um navegador atualizado com suporte WebGPU e memória suficiente. Equipamentos sem WebGPU não conseguem executar este modo.
- A inferência local não consome créditos internos da IA CODEX nem tokens de API de terceiros. O modelo pode ser mais lento e menos capaz do que modelos maiores.

## Modelo configurado

`Llama-3.2-1B-Instruct-q4f16_1-MLC`

O identificador é fornecido ao `CreateMLCEngine` do pacote `@mlc-ai/web-llm`.

## Teste

1. Abre a página de chat da IA CODEX num navegador compatível com WebGPU.
2. Inicia sessão na aplicação.
3. Seleciona **Llama 3.2 1B · IA local gratuita (sem chave)**.
4. Envia uma mensagem curta e aguarda o primeiro descarregamento do modelo.
5. Depois de inicializado, envia outra mensagem para confirmar que o modelo responde sem passar pelo fornecedor externo.

## Limitações conhecidas

- O modelo 1B é compacto; pode cometer erros e tem capacidade inferior a modelos maiores.
- O descarregamento inicial pode ser demorado e consumir espaço de armazenamento.
- Fechar o separador durante o primeiro carregamento pode obrigar a repetir parte do processo.
- A compatibilidade depende do browser, GPU, drivers e memória do dispositivo.
- O modo local não transforma automaticamente os módulos de vídeo, imagem, áudio, plugins ou Minecraft em funcionalidades operacionais.
