import { escapeHtml } from "./html.js";

/** Minimal Markdown → HTML (headings, lists, code, links, paragraphs). */
export function renderMarkdown(src) {
  const text = String(src || "").replace(/\r\n/g, "\n");
  const lines = text.split("\n");
  const out = [];
  let i = 0;
  let inCode = false;
  let codeLang = "";
  let codeBuf = [];
  let listType = null;
  let listBuf = [];
  let listStart = null;

  const flushList = () => {
    if (!listType) return;
    if (listType === "ol" && listStart !== null && listStart !== 1) {
      out.push(`<ol start="${listStart}">${listBuf.join("")}</ol>`);
    } else {
      out.push(`<${listType}>${listBuf.join("")}</${listType}>`);
    }
    listType = null;
    listBuf = [];
    listStart = null;
  };

  const flushCode = () => {
    out.push(
      `<pre><code${codeLang ? ` class="language-${escapeHtml(codeLang)}"` : ""}>${escapeHtml(codeBuf.join("\n"))}</code></pre>`,
    );
    codeBuf = [];
    codeLang = "";
    inCode = false;
  };

  /** Ênfase sem tocar em placeholders de slots. */
  const applyEmphasis = (s) =>
    s
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");

  const inline = (s) => {
    let t = escapeHtml(s);
    /** @type {string[]} */
    const slots = [];
    const park = (html) => {
      const idx = slots.length;
      slots.push(html);
      return `\u0000${idx}\u0000`;
    };
    // Code spans antes de tudo — conteúdo protegido.
    t = t.replace(/`([^`]+)`/g, (_, code) => park(`<code>${code}</code>`));
    // Links: ênfase só no label; URL permanece intacta.
    t = t.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, (_, label, href) =>
      park(`<a href="${href}" rel="noopener noreferrer">${applyEmphasis(label)}</a>`),
    );
    t = applyEmphasis(t);
    t = t.replace(/\u0000(\d+)\u0000/g, (_, idx) => slots[Number(idx)]);
    return t;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      flushList();
      if (inCode) {
        flushCode();
      } else {
        inCode = true;
        codeLang = line.slice(3).trim();
      }
      i++;
      continue;
    }

    if (inCode) {
      codeBuf.push(line);
      i++;
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushList();
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    const ul = /^[-*]\s+(.+)$/.exec(line);
    if (ul) {
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listBuf.push(`<li>${inline(ul[1])}</li>`);
      i++;
      continue;
    }

    const ol = /^(\d+)\.\s+(.+)$/.exec(line);
    if (ol) {
      if (listType && listType !== "ol") flushList();
      if (!listType) {
        listType = "ol";
        listStart = Number(ol[1]);
      }
      listBuf.push(`<li>${inline(ol[2])}</li>`);
      i++;
      continue;
    }

    if (!line.trim()) {
      flushList();
      i++;
      continue;
    }

    flushList();
    const para = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("```") &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }

  flushList();
  if (inCode) flushCode();
  return out.join("\n");
}
