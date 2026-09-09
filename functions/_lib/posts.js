/**
 * @typedef {{
 *   id: string,
 *   slug: string,
 *   title: string,
 *   excerpt: string,
 *   body: string,
 *   published: boolean,
 *   createdAt: string,
 *   updatedAt: string,
 * }} Post
 */

const INDEX_KEY = "index:posts";

/** @param {string} title */
export function slugify(title) {
  return String(title)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "post";
}

/**
 * Reserva um slug escrevendo o id e confirmando a posse (reduz colisão em paralelo).
 * @param {KVNamespace} kv
 * @param {string} base
 * @param {string} id
 */
export async function claimSlug(kv, base, id) {
  let slug = base;
  let n = 2;
  for (;;) {
    const existing = await kv.get(`slug:${slug}`);
    if (!existing) {
      await kv.put(`slug:${slug}`, id);
      const claimed = await kv.get(`slug:${slug}`);
      if (claimed === id) return slug;
    } else if (existing === id) {
      return slug;
    }
    slug = `${base}-${n}`;
    n++;
    if (n > 1000) throw new Error("slug collision");
  }
}

/** @param {KVNamespace} kv @returns {Promise<string[]>} */
async function readIndex(kv) {
  const raw = await kv.get(INDEX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** @param {KVNamespace} kv @param {string[]} ids */
async function writeIndex(kv, ids) {
  await kv.put(INDEX_KEY, JSON.stringify(ids));
}

/** @param {KVNamespace} kv @param {string} id @returns {Promise<Post|null>} */
export async function getPost(kv, id) {
  const raw = await kv.get(`post:${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** @param {KVNamespace} kv @param {string} slug @returns {Promise<Post|null>} */
export async function getPostBySlug(kv, slug) {
  const id = await kv.get(`slug:${slug}`);
  if (!id) return null;
  return getPost(kv, id);
}

/** @param {KVNamespace} kv @returns {Promise<Post[]>} */
export async function listPosts(kv) {
  const ids = await readIndex(kv);
  const posts = [];
  for (const id of ids) {
    const post = await getPost(kv, id);
    if (post) posts.push(post);
  }
  posts.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return posts;
}

/** @param {KVNamespace} kv @returns {Promise<Post[]>} */
export async function listPublished(kv) {
  const all = await listPosts(kv);
  return all.filter((p) => p.published);
}

/**
 * @param {KVNamespace} kv
 * @param {{ title: string, excerpt?: string, body: string, published?: boolean }} input
 * @param {{ id?: string }} [opts]
 * @returns {Promise<Post>}
 */
export async function createPost(kv, input, opts = {}) {
  const id = opts.id || crypto.randomUUID();
  const base = slugify(input.title);
  const slug = await claimSlug(kv, base, id);
  const now = new Date().toISOString();
  /** @type {Post} */
  const post = {
    id,
    slug,
    title: input.title.trim(),
    excerpt: (input.excerpt || "").trim() || excerptFromBody(input.body),
    body: input.body,
    published: Boolean(input.published),
    createdAt: now,
    updatedAt: now,
  };
  await kv.put(`post:${id}`, JSON.stringify(post));
  const ids = await readIndex(kv);
  if (!ids.includes(id)) {
    ids.unshift(id);
    await writeIndex(kv, ids);
  }
  return post;
}

/**
 * @param {KVNamespace} kv
 * @param {string} id
 * @param {{ title?: string, excerpt?: string, body?: string, published?: boolean }} input
 * @returns {Promise<Post|null>}
 */
export async function updatePost(kv, id, input) {
  const existing = await getPost(kv, id);
  if (!existing) return null;

  const nextTitle = input.title !== undefined ? input.title.trim() : existing.title;
  let nextSlug = existing.slug;
  if (nextTitle !== existing.title) {
    await kv.delete(`slug:${existing.slug}`);
    nextSlug = await claimSlug(kv, slugify(nextTitle), id);
  }

  const body = input.body !== undefined ? input.body : existing.body;
  /** @type {Post} */
  const post = {
    ...existing,
    title: nextTitle,
    slug: nextSlug,
    excerpt:
      input.excerpt !== undefined
        ? input.excerpt.trim() || excerptFromBody(body)
        : existing.excerpt,
    body,
    published: input.published !== undefined ? Boolean(input.published) : existing.published,
    updatedAt: new Date().toISOString(),
  };
  await kv.put(`post:${id}`, JSON.stringify(post));
  return post;
}

/** @param {KVNamespace} kv @param {string} id */
export async function deletePost(kv, id) {
  const existing = await getPost(kv, id);
  if (!existing) return false;
  await kv.delete(`post:${id}`);
  await kv.delete(`slug:${existing.slug}`);
  const ids = (await readIndex(kv)).filter((x) => x !== id);
  await writeIndex(kv, ids);
  return true;
}

/** @param {string} body */
function excerptFromBody(body) {
  const plain = String(body || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`\[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.slice(0, 160);
}

/** @param {string} iso */
export function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "medium",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}
