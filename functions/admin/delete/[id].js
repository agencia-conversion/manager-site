import { requireSession } from "../../_lib/auth.js";
import { redirect } from "../../_lib/html.js";
import { deletePost } from "../../_lib/posts.js";

/**
 * @param {{ request: Request, env: Record<string, string> & { BLOG: KVNamespace }, params: { id: string } }} context
 */
export async function onRequestPost(context) {
  const gate = await requireSession(context.env, context.request);
  if (gate.response) return gate.response;

  await deletePost(context.env.BLOG, context.params.id);
  return redirect("/admin");
}

/** Block GET deletes */
export async function onRequestGet() {
  return redirect("/admin");
}
