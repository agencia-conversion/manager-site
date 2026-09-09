const WINDOW_SEC = 15 * 60;
const MAX_ATTEMPTS = 10;

/** @param {string} ip */
function ratePrefix(ip) {
  const safe = String(ip || "unknown")
    .replace(/[^a-zA-Z0-9.:_-]/g, "_")
    .slice(0, 64);
  return `rate:login:${safe}:`;
}

/**
 * Consome um slot antes de validar a senha. Cada tentativa grava uma chave própria;
 * o limite é a contagem pós-escrita — requisições em paralelo não compartilham o
 * mesmo read-modify-write e não bypassam o teto.
 *
 * @param {KVNamespace} kv
 * @param {string} ip
 * @returns {Promise<{ allowed: boolean, remaining: number }>}
 */
export async function consumeLoginAttempt(kv, ip) {
  const prefix = ratePrefix(ip);
  const attemptKey = `${prefix}${Date.now()}-${crypto.randomUUID()}`;
  await kv.put(attemptKey, "1", { expirationTtl: WINDOW_SEC });

  const listed = await kv.list({ prefix, limit: MAX_ATTEMPTS + 50 });
  const count = listed.keys.length;
  if (count > MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: MAX_ATTEMPTS - count };
}

/**
 * Limpa tentativas do IP após login bem-sucedido.
 * @param {KVNamespace} kv
 * @param {string} ip
 */
export async function clearLoginRate(kv, ip) {
  const prefix = ratePrefix(ip);
  const listed = await kv.list({ prefix, limit: 100 });
  await Promise.all(listed.keys.map((k) => kv.delete(k.name)));
}

/** @param {Request} request */
export function clientIp(request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}
