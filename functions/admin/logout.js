import { clearSessionCookieHeader } from "../_lib/auth.js";

/**
 * Logout só via POST (evita CSRF por link GET cross-site).
 * @param {{ request: Request }} context
 */
export async function onRequestPost(context) {
  const url = new URL(context.request.url);
  return new Response(null, {
    status: 302,
    headers: {
      location: "/admin/login",
      "set-cookie": clearSessionCookieHeader(url),
    },
  });
}

/** @param {{ request: Request }} context */
export async function onRequestGet(context) {
  return new Response(null, {
    status: 303,
    headers: { location: "/admin" },
  });
}
