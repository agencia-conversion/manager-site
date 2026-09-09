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

  const flushList = () => {
    if (!listType) return;
    const tag = listType;
    out.push(`<${tag}>${listBuf.join("")}</${tag}>`);
    listType = null;
    listBuf = [];
  };

  const flushCode = () => {
    out.push(
      `<pre><code${codeLang ? ` class="language-${escapeHtml(codeLang)}"` : ""}>${escapeHtml(codeBuf.join("\n"))}</code></pre>`,
    );
    codeBuf = [];
    codeLang = "";
    inCode = false;
  };

  const inline = (s) => {
    let t = escapeHtml(s);
    t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    t = t.replace(
      /\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
      '<a href="$2" rel="noopener noreferrer">$1</a>',
    );
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
      listType = "ol";
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
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith("#") && !lines[i].startsWith("```") && !/^[-*]\s+/.test(lines[i]) && !/^\d+\.\s+/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }

  flushList();
  if (inCode) flushCode();
  return out.join("\n");
}
