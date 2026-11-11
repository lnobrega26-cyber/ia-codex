import http from 'node:http';

const PORT = Number(process.env.PORT || 3000);
const API_BASE = (process.env.CODEX_API_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const API_KEY = process.env.CODEX_API_KEY;
const MODEL = process.env.CODEX_MODEL;
const ALLOWED_ORIGIN = process.env.CODEX_ALLOWED_ORIGIN;
const buckets = new Map();
const MAX_BODY = 1024 * 1024;
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

function send(res, status, payload, origin) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...(origin ? { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN || origin, Vary: 'Origin' } : {})
  });
  res.end(JSON.stringify(payload));
}

function rateAllowed(ip) {
  const now = Date.now();
  const entry = buckets.get(ip);
  if (!entry || now - entry.start > WINDOW_MS) {
    buckets.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_REQUESTS;
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGIN && origin && origin !== ALLOWED_ORIGIN) {
    return send(res, 403, { error: 'Origem não permitida.' });
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      ...(origin ? { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN || origin, Vary: 'Origin' } : {})
    });
    return res.end();
  }

  const url = new URL(req.url || '/', 'http://localhost');
  if (url.pathname === '/api/health' && req.method === 'GET') {
    return send(res, 200, { ok: true, configured: Boolean(API_KEY && MODEL) }, origin);
  }
  if (url.pathname !== '/api/chat' || req.method !== 'POST') {
    return send(res, 404, { error: 'Rota não encontrada.' }, origin);
  }

  const ip = req.socket.remoteAddress || 'unknown';
  if (!rateAllowed(ip)) return send(res, 429, { error: 'Demasiados pedidos. Tenta novamente dentro de um minuto.' }, origin);
  if (!API_KEY || !MODEL) {
    return send(res, 503, { error: 'Configura CODEX_API_KEY e CODEX_MODEL no ambiente do servidor.' }, origin);
  }

  try {
    let raw = '';
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > MAX_BODY) return send(res, 413, { error: 'Pedido demasiado grande.' }, origin);
    }
    const body = JSON.parse(raw || '{}');
    if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 40) {
      return send(res, 400, { error: 'Envia uma lista válida de mensagens (máximo 40).' }, origin);
    }
    const messages = body.messages.map((message) => {
      if (!message || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string') {
        throw new Error('Formato de mensagem inválido.');
      }
      return { role: message.role, content: message.content.slice(0, 12000) };
    });
    const language = typeof body.language === 'string' ? body.language.slice(0, 40) : 'detetado automaticamente';
    const upstream = await fetch(API_BASE + '/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: 'És a IA CODEX, um assistente útil, claro e responsável. Responde no idioma da última mensagem do utilizador. Idioma detetado pela interface: ' + language + '.' },
          ...messages
        ],
        temperature: 0.7
      })
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error('Fornecedor de IA respondeu com HTTP', upstream.status);
      return send(res, 502, { error: 'O fornecedor de IA não aceitou o pedido. Verifica modelo, chave e limites da conta.' }, origin);
    }
    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== 'string' || !reply.trim()) {
      return send(res, 502, { error: 'O fornecedor não devolveu uma resposta de texto.' }, origin);
    }
    return send(res, 200, { reply }, origin);
  } catch (error) {
    return send(res, 400, { error: error.message || 'Pedido inválido.' }, origin);
  }
});

server.listen(PORT, () => console.log('IA CODEX API disponível na porta ' + PORT));
