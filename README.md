# IA CODEX

Projeto em desenvolvimento: interface React + Vite e API Node.js para contas, carteira de tokens e vários modelos de IA.

## Funcionalidades preparadas

- Registo e login com palavra-passe protegida por bcrypt.
- Bónus de 1.000 tokens internos na criação de cada conta.
- Saldo e histórico de movimentos guardados em PostgreSQL.
- Catálogo de modelos configurável no servidor, com fornecedor, preço de entrada/saída e opção gratuita.
- Reserva e acerto de créditos com transação na base de dados.
- Chat autenticado; chaves dos fornecedores nunca são enviadas ao navegador.

## Configuração obrigatória do backend

Requer Node.js 20+ e PostgreSQL.

1. Cria uma base de dados PostgreSQL num fornecedor de confiança.
2. Executa o SQL de `database/schema.sql` nessa base de dados.
3. Define as variáveis do ficheiro `.env.example` no ambiente do servidor (não publiques segredos).
4. Instala dependências com `npm install`.
5. Inicia o backend com `npm start`.
6. Em desenvolvimento, inicia também `npm run dev`; o Vite encaminha `/api` para a porta 3000.

### Variáveis

- `DATABASE_URL`: ligação PostgreSQL.
- `CODEX_JWT_SECRET`: segredo longo e aleatório para assinar sessões.
- `CODEX_MODELS`: JSON com o catálogo de modelos.
- `OPENAI_API_KEY` ou outras chaves com o nome indicado em cada modelo.
- `PORT`: porta HTTP (predefinição 3000).

Exemplo de modelo (configurado no servidor):

```json
{
  "id": "codex-free",
  "name": "CODEX Free",
  "provider": "OpenAI",
  "model": "gpt-4o-mini",
  "apiBase": "https://api.openai.com/v1",
  "apiKeyEnv": "OPENAI_API_KEY",
  "inputCostPer1k": 0,
  "outputCostPer1k": 0,
  "free": true
}
```

Adiciona outros objetos ao array `CODEX_MODELS` para ligar modelos e fornecedores que aceitem a API de chat compatível com OpenAI. Cada modelo pago define `inputCostPer1k` e `outputCostPer1k` em créditos internos por 1.000 tokens. O primeiro modelo com `free: true` é o modelo gratuito por omissão.

## Importante sobre os tokens

Os 1.000 tokens são créditos internos da CODEX, não tokens oficiais dos fornecedores. O custo de cada modelo é uma regra configurada pelo operador. O modelo marcado gratuito não desconta créditos ao utilizador, mas o fornecedor pode continuar a cobrar a utilização à pessoa que administra a chave API. Define preços que cubram esses custos.

O bónus é atribuído uma vez por conta criada. Esta primeira versão não tem verificação de email, recuperação de palavra-passe, proteção anti-contas múltiplas nem pagamentos. Não recolhas dados pessoais desnecessários e não publiques a aplicação para utilizadores reais antes de adicionares essas proteções e testares o sistema.

## Publicação

GitHub Pages só serve a interface estática. A API e a base de dados precisam de alojamento próprio. Publica o backend num serviço Node.js e configura nele as variáveis de ambiente e o domínio/origem da aplicação. Nunca coloques chaves secretas em React, no repositório ou em variáveis `VITE_*`.

## O que ainda não está implementado

Geração real de vídeos, execução segura de plugins e criação/alojamento de servidores Minecraft continuam a precisar de fornecedores e integrações próprias.
