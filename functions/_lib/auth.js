const COOKIE = "session";
const TTL_MS = 12 * 60 * 60 * 1000;

/**
 * @typedef {{ ADMIN_EMAIL?: string, ADMIN_PASSWORD?: string, SESSION_SECRET?: string }} AuthEnv
 */

/** @param {AuthEnv} env */
export function authConfigured(env) {
  return Boolean(env.ADMIN_EMAIL && env.ADMIN_PASSWORD && env.SESSION_SECRET);
}

/** @param {string} secret @param {string} data */
async function hmac(secret, data) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return bufferToBase64Url(sig);
}

/** @param {ArrayBuffer} buf */
function bufferToBase64Url(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** @param {string} s */
function base64UrlEncode(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** @param {string} s */
function base64UrlDecode(s) {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** @param {string} a @param {string} b */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/**
 * @param {AuthEnv} env
 * @param {string} email
 * @param {string} password
 */
export function verifyCredentials(env, email, password) {
  if (!authConfigured(env)) return false;
  return (
    timingSafeEqual(email.trim().toLowerCase(), env.ADMIN_EMAIL.trim().toLowerCase()) &&
    timingSafeEqual(password, env.ADMIN_PASSWORD)
  );
}

/** @param {AuthEnv} env @param {string} email */
export async function createSessionToken(env, email) {
  const payload = JSON.stringify({
    email,
    exp: Date.now() + TTL_MS,
  });
  const body = base64UrlEncode(payload);
  const sig = await hmac(env.SESSION_SECRET, body);
  return `${body}.${sig}`;
}

/** @param {AuthEnv} env @param {string|null|undefined} token */
export async function verifySessionToken(env, token) {
  if (!token || !env.SESSION_SECRET) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = await hmac(env.SESSION_SECRET, body);
  if (!timingSafeEqual(sig, expected)) return null;
  try {
    const data = JSON.parse(base64UrlDecode(body));
    if (!data?.email || typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return { email: String(data.email) };
  } catch {
    return null;
  }
}

/** @param {Request} request */
export function readSessionCookie(request) {
  const header = request.headers.get("cookie") || "";
  const match = header.match(/(?:^|;\s*)session=([^;]+)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

/**
 * @param {AuthEnv} env
 * @param {Request} request
 */
export async function getSession(env, request) {
  return verifySessionToken(env, readSessionCookie(request));
}

/**
 * @param {string} token
 * @param {URL} url
 */
export function sessionCookieHeader(token, url) {
  const secure = url.protocol === "https:" ? "; Secure" : "";
  const maxAge = Math.floor(TTL_MS / 1000);
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

/** @param {URL} url */
export function clearSessionCookieHeader(url) {
  const secure = url.protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

/**
 * @param {AuthEnv} env
 * @param {Request} request
 * @param {string} loginPath
 */
export async function requireSession(env, request, loginPath = "/admin/login") {
  const session = await getSession(env, request);
  if (session) return { session, response: null };
  const next = new URL(request.url).pathname;
  const loc = `${loginPath}?next=${encodeURIComponent(next)}`;
  return {
    session: null,
    response: new Response(null, { status: 302, headers: { location: loc } }),
  };
}
