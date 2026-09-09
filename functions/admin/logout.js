import { clearSessionCookieHeader } from "../_lib/auth.js";
import { redirect } from "../_lib/html.js";

/**
 * @param {{ request: Request }} context
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  return new Response(null, {
    status: 302,
    headers: {
      location: "/admin/login",
      "set-cookie": clearSessionCookieHeader(url),
    },
  });
}
