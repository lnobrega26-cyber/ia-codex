# IA CODEX

Interface React + Vite e backend independente para conversar com um modelo compatível com a API OpenAI.

## Estado atual

- Chat ligado à rota `/api/chat`.
- Backend Node.js sem dependências adicionais; a chave do fornecedor fica no servidor.
- Estúdio de vídeo, plugins e gestão de Minecraft continuam protótipos de interface e precisam de integrações reais.

## Executar localmente

Requer Node.js 20 ou superior.

```bash
npm install
npm run dev
npm start
```

Define no ambiente do backend:
- `CODEX_API_KEY`: chave privada do fornecedor.
- `CODEX_MODEL`: modelo disponível na tua conta.
- `CODEX_API_URL`: opcional; base de API compatível com OpenAI (predefinição: `https://api.openai.com/v1`).
- `PORT`: opcional; porta (predefinição: 3000).
- `CODEX_ALLOWED_ORIGIN`: opcional; origem permitida para pedidos do browser.

Para desenvolvimento, configura o proxy `/api` do Vite para `http://localhost:3000` ou serve interface e backend pela mesma origem.

## Publicação

GitHub Pages publica apenas a interface estática. Para respostas reais, publica também o servidor Node num serviço que execute Node.js e configura as variáveis de ambiente nesse serviço. Nunca coloques a chave em React, no repositório ou em variáveis `VITE_*`.

## Segurança e limitações

O backend valida mensagens, limita o tamanho do pedido e aplica um limite simples por endereço IP. Antes de produção, adiciona autenticação, limites por utilizador e monitorização.

A integração atual cobre chat de texto. Geração real de vídeos até 60 minutos, execução de plugins e criação/alojamento de servidores Minecraft ainda não estão implementadas.
