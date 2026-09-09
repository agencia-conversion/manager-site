const WINDOW_SEC = 15 * 60;
const MAX_ATTEMPTS = 10;

/**
 * @param {KVNamespace} kv
 * @param {string} ip
 * @returns {Promise<{ allowed: boolean, remaining: number }>}
 */
export async function checkLoginRate(kv, ip) {
  const key = `rate:login:${ip || "unknown"}`;
  const raw = await kv.get(key);
  const count = raw ? Number(raw) || 0 : 0;
  if (count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: MAX_ATTEMPTS - count };
}

/**
 * @param {KVNamespace} kv
 * @param {string} ip
 */
export async function hitLoginRate(kv, ip) {
  const key = `rate:login:${ip || "unknown"}`;
  const raw = await kv.get(key);
  const count = (raw ? Number(raw) || 0 : 0) + 1;
  await kv.put(key, String(count), { expirationTtl: WINDOW_SEC });
  return count;
}

/** @param {Request} request */
export function clientIp(request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}
