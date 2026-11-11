import http from 'node:http';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.CODEX_JWT_SECRET;
const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }
}) : null;
const ALLOWED_ORIGINS = (process.env.CODEX_ALLOWED_ORIGIN || '').split(',').map(x => x.trim()).filter(Boolean);
const buckets = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 25;
const MAX_BODY = 1024 * 1024;
const STARTER_CREDITS = 1000;
const MAX_OUTPUT_TOKENS = 1200;

function envModels() {
  try {
    const list = JSON.parse(process.env.CODEX_MODELS || '[]');
    if (!Array.isArray(list)) return [];
    return list.filter(m => m && typeof m.id === 'string' && typeof m.name === 'string'
      && typeof m.provider === 'string' && typeof m.model === 'string'
      && typeof m.apiBase === 'string' && typeof m.apiKeyEnv === 'string'
      && Number.isFinite(Number(m.inputCostPer1k)) && Number.isFinite(Number(m.outputCostPer1k)));
  } catch { return []; }
}
async function models() {
  if (pool) {
    try {
      const result = await pool.query('SELECT id,name,provider,model,api_base,api_key_env,input_cost_per_1k,output_cost_per_1k,free,description,enabled FROM codex_models ORDER BY name');
      if (result.rows.length) return result.rows.filter(m => m.enabled).map(m => ({
        id:m.id,name:m.name,provider:m.provider,model:m.model,apiBase:m.api_base,apiKeyEnv:m.api_key_env,
        inputCostPer1k:Number(m.input_cost_per_1k),outputCostPer1k:Number(m.output_cost_per_1k),free:m.free,description:m.description
      }));
    } catch (error) { if (error.code !== '42P01') throw error; }
  }
  return envModels();
}
async function publicModels() {
  return (await models()).map(m => ({
    id: m.id, name: m.name, provider: m.provider,
    description: String(m.description || '').slice(0, 180),
    free: Boolean(m.free),
    inputCostPer1k: Number(m.inputCostPer1k),
    outputCostPer1k: Number(m.outputCostPer1k)
  }));
}
function send(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}
async function body(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY) throw Object.assign(new Error('Pedido demasiado grande.'), { status: 413 });
  }
  try { return JSON.parse(raw || '{}'); }
  catch { throw Object.assign(new Error('JSON inválido.'), { status: 400 }); }
}
function rateAllowed(key) {
  const now = Date.now(), entry = buckets.get(key);
  if (!entry || now - entry.start > WINDOW_MS) { buckets.set(key, { start: now, count: 1 }); return true; }
  entry.count += 1;
  return entry.count <= MAX_REQUESTS;
}
function makeToken(user) {
  return jwt.sign({ sub: String(user.id), username: user.username }, JWT_SECRET, { expiresIn: '7d' });
}
function auth(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) throw Object.assign(new Error('Inicia sessão para continuar.'), { status: 401 });
  try { return jwt.verify(token, JWT_SECRET); }
  catch { throw Object.assign(new Error('Sessão expirada. Entra novamente.'), { status: 401 }); }
}
async function getUser(id) {
  const result = await pool.query('SELECT id, username, credits, is_admin FROM codex_users WHERE id=$1', [id]);
  return result.rows[0] || null;
}
async function reserveCredits(userId, amount, modelId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query('UPDATE codex_users SET credits=credits-$1 WHERE id=$2 AND credits >= $1 RETURNING credits', [amount, userId]);
    if (!result.rowCount) {
      await client.query('ROLLBACK');
      return null;
    }
    await client.query('INSERT INTO codex_credit_transactions(user_id, amount, reason, model_id) VALUES($1,$2,$3,$4)', [userId, -amount, 'reserva', modelId]);
    await client.query('COMMIT');
    return result.rows[0].credits;
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}
async function settleCredits(userId, reserved, actual, modelId) {
  const refund = Math.max(0, reserved - actual);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (refund) {
      await client.query('UPDATE codex_users SET credits=credits+$1 WHERE id=$2', [refund, userId]);
      await client.query('INSERT INTO codex_credit_transactions(user_id, amount, reason, model_id) VALUES($1,$2,$3,$4)', [userId, refund, 'ajuste de utilização', modelId]);
    }
    const result = await client.query('SELECT credits FROM codex_users WHERE id=$1', [userId]);
    await client.query('COMMIT');
    return result.rows[0]?.credits ?? 0;
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}
async function refundCredits(userId, amount, modelId) {
  if (!amount) return;
  await pool.query('UPDATE codex_users SET credits=credits+$1 WHERE id=$2', [amount, userId]);
  await pool.query('INSERT INTO codex_credit_transactions(user_id, amount, reason, model_id) VALUES($1,$2,$3,$4)', [userId, amount, 'reembolso de erro', modelId]);
}
function estimatedTokens(messages) {
  return Math.ceil(messages.reduce((sum, m) => sum + m.content.length, 0) / 4);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  const ip = req.socket.remoteAddress || 'unknown';
  if (!rateAllowed(ip)) return send(res, 429, { error: 'Muitos pedidos. Tenta novamente dentro de um minuto.' });
  if (req.method === 'GET' && url.pathname === '/api/health') {
    return send(res, 200, { ok: true, databaseConfigured: Boolean(pool), authConfigured: Boolean(JWT_SECRET), modelsConfigured: publicModels().length });
  }
  if (req.method === 'GET' && url.pathname === '/api/models') {
    return send(res, 200, { models: await publicModels() });
  }

  try {
    if (url.pathname.startsWith('/api/auth/')) {
      if (!pool || !JWT_SECRET) return send(res, 503, { error: 'O servidor ainda não tem base de dados e autenticação configuradas.' });
      const data = await body(req);
      if (req.method === 'POST' && url.pathname === '/api/auth/register') {
        const username = String(data.username || '').trim().toLowerCase();
        const password = String(data.password || '');
        if (!/^[a-z0-9_]{3,24}$/.test(username)) return send(res, 400, { error: 'O utilizador deve ter 3 a 24 caracteres: letras, números ou _.' });
        if (password.length < 10 || password.length > 128) return send(res, 400, { error: 'A palavra-passe deve ter entre 10 e 128 caracteres.' });
        const hash = await bcrypt.hash(password, 12);
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const created = await client.query('INSERT INTO codex_users(username,password_hash,credits) VALUES($1,$2,$3) RETURNING id,username,credits,is_admin', [username, hash, STARTER_CREDITS]);
          await client.query('INSERT INTO codex_credit_transactions(user_id,amount,reason) VALUES($1,$2,$3)', [created.rows[0].id, STARTER_CREDITS, 'bónus de boas-vindas']);
          await client.query('COMMIT');
          const user = created.rows[0];
          return send(res, 201, { token: makeToken(user), user: { id: user.id, username: user.username, credits: user.credits, is_admin: user.is_admin } });
        } catch (e) {
          await client.query('ROLLBACK');
          if (e.code === '23505') return send(res, 409, { error: 'Esse nome de utilizador já existe.' });
          throw e;
        } finally { client.release(); }
      }
      if (req.method === 'POST' && url.pathname === '/api/auth/login') {
        const username = String(data.username || '').trim().toLowerCase();
        const result = await pool.query('SELECT id,username,password_hash,credits,is_admin FROM codex_users WHERE username=$1', [username]);
        const user = result.rows[0];
        if (!user || !(await bcrypt.compare(String(data.password || ''), user.password_hash))) {
          return send(res, 401, { error: 'Utilizador ou palavra-passe incorretos.' });
        }
        return send(res, 200, { token: makeToken(user), user: { id: user.id, username: user.username, credits: user.credits, is_admin: user.is_admin } });
      }
      if (req.method === 'GET' && url.pathname === '/api/auth/me') {
        const claims = auth(req), user = await getUser(claims.sub);
        if (!user) return send(res, 401, { error: 'Conta não encontrada.' });
        return send(res, 200, { user });
      }
    }


    if (url.pathname.startsWith('/api/admin/')) {
      const claims = auth(req);
      const adminResult = await pool.query('SELECT is_admin FROM codex_users WHERE id=$1', [claims.sub]);
      if (!adminResult.rows[0]?.is_admin) return send(res, 403, { error: 'Apenas administradores podem aceder a esta área.' });
      if (url.pathname === '/api/admin/models' && req.method === 'GET') {
        const result = await pool.query('SELECT id,name,provider,model,api_base,api_key_env,input_cost_per_1k,output_cost_per_1k,free,enabled,description FROM codex_models ORDER BY name');
        return send(res, 200, { models: result.rows });
      }
      if (url.pathname === '/api/admin/models' && req.method === 'POST') {
        const data = await body(req);
        const id = String(data.id || '').trim().toLowerCase();
        const name = String(data.name || '').trim();
        const provider = String(data.provider || '').trim();
        const modelName = String(data.model || '').trim();
        const apiBase = String(data.apiBase || '').trim().replace(/\/$/, '');
        const apiKeyEnv = String(data.apiKeyEnv || '').trim();
        const inputCost = Number(data.inputCostPer1k);
        const outputCost = Number(data.outputCostPer1k);
        if (!/^[a-z0-9_-]{2,60}$/.test(id) || !name || !provider || !modelName || !/^https:\/\//.test(apiBase) || !/^[A-Z][A-Z0-9_]{2,60}$/.test(apiKeyEnv) || !Number.isFinite(inputCost) || inputCost < 0 || !Number.isFinite(outputCost) || outputCost < 0) {
          return send(res, 400, { error: 'Revê os campos do modelo, URL HTTPS e custos (valores não negativos).' });
        }
        if (data.free && (inputCost !== 0 || outputCost !== 0)) return send(res, 400, { error: 'Um modelo gratuito para o utilizador tem de ter custo zero em créditos.' });
        const result = await pool.query(
          'INSERT INTO codex_models(id,name,provider,model,api_base,api_key_env,input_cost_per_1k,output_cost_per_1k,free,enabled,description) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,provider=EXCLUDED.provider,model=EXCLUDED.model,api_base=EXCLUDED.api_base,api_key_env=EXCLUDED.api_key_env,input_cost_per_1k=EXCLUDED.input_cost_per_1k,output_cost_per_1k=EXCLUDED.output_cost_per_1k,free=EXCLUDED.free,enabled=EXCLUDED.enabled,description=EXCLUDED.description RETURNING id,name,provider,model,api_base,api_key_env,input_cost_per_1k,output_cost_per_1k,free,enabled,description',
          [id,name,provider,modelName,apiBase,apiKeyEnv,inputCost,outputCost,Boolean(data.free),data.enabled!==false,String(data.description||'').slice(0,180)]
        );
        return send(res, 200, { model: result.rows[0] });
      }
      return send(res, 404, { error: 'Rota administrativa não encontrada.' });
    }
\n    if (url.pathname === '/api/chat' && req.method === 'POST') {
      if (!pool || !JWT_SECRET) return send(res, 503, { error: 'Autenticação e base de dados ainda não configuradas.' });
      const claims = auth(req), data = await body(req);
      if (!Array.isArray(data.messages) || !data.messages.length || data.messages.length > 40) return send(res, 400, { error: 'Lista de mensagens inválida (máximo 40).' });
      const messages = data.messages.map(m => {
        if (!m || !['user','assistant'].includes(m.role) || typeof m.content !== 'string') throw Object.assign(new Error('Formato de mensagem inválido.'), { status: 400 });
        return { role: m.role, content: m.content.slice(0, 12000) };
      });
      const catalog = await models();
      const selected = data.modelId ? catalog.find(m => m.id === data.modelId) : catalog.find(m => m.free);
      if (!selected) return send(res, data.modelId ? 400 : 503, { error: data.modelId ? 'Modelo inválido ou indisponível.' : 'Nenhum modelo está configurado. Adiciona pelo menos um modelo gratuito no servidor.' });
      const key = process.env[selected.apiKeyEnv];
      if (!key) return send(res, 503, { error: 'O fornecedor deste modelo ainda não está configurado no servidor.' });
      const totalChars = messages.reduce((sum, item) => sum + item.content.length, 0);
      if (totalChars > 30000) return send(res, 413, { error: 'A conversa é demasiado longa. Começa uma nova conversa ou reduz o texto.' });
      const inputEstimate = Math.ceil(totalChars / 2) + 200;
      const reserve = selected.free ? 0 : Math.ceil(inputEstimate * Number(selected.inputCostPer1k) / 1000 + MAX_OUTPUT_TOKENS * Number(selected.outputCostPer1k) / 1000);
      const afterReserve = await reserveCredits(claims.sub, reserve, selected.id);
      if (afterReserve === null) {
        const user = await getUser(claims.sub);
        return send(res, 402, { error: 'Não tens tokens suficientes para este modelo.', credits: user?.credits ?? 0 });
      }
      try {
        const upstream = await fetch(selected.apiBase.replace(/\/$/, '') + '/chat/completions', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: selected.model,
            messages: [
              { role: 'system', content: 'És a IA CODEX, um assistente útil e responsável. Responde no idioma da última mensagem do utilizador.' },
              ...messages
            ],
            max_tokens: MAX_OUTPUT_TOKENS,
            temperature: 0.7
          })
        });
        const result = await upstream.json().catch(() => ({}));
        if (!upstream.ok) throw new Error('O fornecedor de IA não aceitou o pedido (HTTP ' + upstream.status + ').');
        const reply = result.choices?.[0]?.message?.content;
        if (typeof reply !== 'string' || !reply.trim()) throw new Error('O fornecedor não devolveu uma resposta de texto.');
        const usage = result.usage || {};
        const inputUsed = Number(usage.prompt_tokens) || inputEstimate;
        const outputUsed = Number(usage.completion_tokens) || Math.ceil(reply.length / 4);
        const actual = selected.free ? 0 : Math.min(reserve, Math.ceil(inputUsed * Number(selected.inputCostPer1k) / 1000 + outputUsed * Number(selected.outputCostPer1k) / 1000));
        const credits = await settleCredits(claims.sub, reserve, actual, selected.id);
        return send(res, 200, { reply, credits, usedCredits: actual, model: selected.id });
      } catch (e) {
        await refundCredits(claims.sub, reserve, selected.id);
        console.error('Erro no fornecedor:', e.message);
        return send(res, 502, { error: 'Não foi possível obter resposta do modelo. Os tokens reservados foram devolvidos.' });
      }
    }
    return send(res, 404, { error: 'Rota não encontrada.' });
  } catch (error) {
    return send(res, error.status || 500, { error: error.status ? error.message : 'Erro interno do servidor.' });
  }
});

if (!pool || !JWT_SECRET) console.warn('Configura DATABASE_URL e CODEX_JWT_SECRET antes de aceitar registos.');
server.listen(PORT, () => console.log('IA CODEX API disponível na porta ' + PORT));
