"use strict";

const fs = require("node:fs");
const path = require("node:path");
const MarkdownIt = require("markdown-it");
const sanitizeHtml = require("sanitize-html");

const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const validId = (id) =>
  typeof id === "string" && /^[a-z0-9_-]+$/i.test(id) && id.length <= 120;
const inlineText = (token) =>
  (token.children || [])
    .filter((child) => child.type !== "html_inline")
    .map((child) => child.content || "")
    .join("");

function checkedArticleFile(root, id, relative) {
  const directory = path.resolve(root, "Blog", id);
  const file = path.resolve(directory, relative);
  if (!file.startsWith(directory + path.sep))
    throw new Error(`Unsafe article path: ${id}`);
  let current = path.resolve(root, "Blog");
  for (const part of [id, ...relative.split("/")]) {
    current = path.join(current, part);
    if (fs.lstatSync(current).isSymbolicLink())
      throw new Error(`Article symlinks are not allowed: ${id}`);
  }
  if (!fs.statSync(file).isFile())
    throw new Error(`Article asset is not a file: ${id}`);
  return file;
}

function renderMarkdown(source, options = {}) {
  const { title = "", root, id } = options;
  const md = new MarkdownIt({
    html: false,
    linkify: false,
    typographer: false,
  });
  const assets = [];
  const headings = [];
  const counts = new Map();
  const body = String(source)
    .replace(/^\uFEFF/, "")
    .replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "");
  const tokens = md.parse(body, {});
  if (
    tokens[0]?.type === "heading_open" &&
    tokens[0].tag === "h1" &&
    inlineText(tokens[1]).trim() === title.trim()
  )
    tokens.splice(0, 3);
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === "heading_open") {
      if (token.tag === "h1") {
        token.tag = "h2";
        tokens[i + 2].tag = "h2";
      }
      const label = inlineText(tokens[i + 1]);
      const base = `section-${
        label
          .toLowerCase()
          .normalize("NFKD")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || "heading"
      }`;
      const count = (counts.get(base) || 0) + 1;
      counts.set(base, count);
      const headingId = count === 1 ? base : `${base}-${count}`;
      token.attrSet("id", headingId);
      headings.push({
        id: headingId,
        title: label,
        level: Number(token.tag.slice(1)),
      });
    }
    for (const child of token.children || []) {
      if (child.type === "link_open") {
        const href = child.attrGet("href") || "";
        if (/^https:\/\//i.test(href)) {
          child.attrSet("target", "_blank");
          child.attrSet("rel", "noopener noreferrer");
          child.attrSet("referrerpolicy", "no-referrer");
        } else if (!/^#[a-zA-Z0-9_-]+$/.test(href)) child.attrSet("href", "");
      }
      if (child.type === "image") {
        const original = child.attrGet("src") || "";
        let decoded;
        try {
          decoded = decodeURIComponent(original);
        } catch {
          decoded = "";
        }
        // Only local raster images below this article's source directory can be published.
        const safe =
          root &&
          validId(id) &&
          decoded &&
          !/[\\?#:%\u0000-\u001f]/.test(decoded) &&
          !decoded.startsWith("/") &&
          decoded
            .split("/")
            .every(
              (part) =>
                /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(part) && part !== "..",
            ) &&
          /\.(png|jpe?g|webp|gif|avif)$/i.test(decoded);
        if (!safe) {
          child.type = "text";
          child.content = child.content || "Image unavailable";
          continue;
        }
        const realSource = checkedArticleFile(root, id, decoded);
        const route = `article-assets/${id}/${decoded}`;
        assets.push({ source: realSource, route });
        child.attrSet(
          "src",
          `/Codex/${route.split("/").map(encodeURIComponent).join("/")}`,
        );
        child.attrSet("loading", "lazy");
        child.attrSet("decoding", "async");
      }
    }
  }
  const html = sanitizeHtml(md.renderer.render(tokens, md.options, {}), {
    allowedTags: [
      "p",
      "br",
      "hr",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "a",
      "strong",
      "em",
      "s",
      "blockquote",
      "ul",
      "ol",
      "li",
      "pre",
      "code",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "img",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "referrerpolicy", "title"],
      h2: ["id"],
      h3: ["id"],
      h4: ["id"],
      h5: ["id"],
      h6: ["id"],
      code: ["class"],
      ol: ["start"],
      img: ["src", "alt", "title", "loading", "decoding"],
    },
    allowedClasses: { code: [/^language-[a-zA-Z0-9_-]+$/] },
    allowedSchemes: ["https"],
    allowProtocolRelative: false,
  });
  return { html, headings, assets };
}

function buildBlog({ root, renderPage, writePage }) {
  const source = JSON.parse(
    fs.readFileSync(path.join(root, "Blog", "posts.json"), "utf8"),
  );
  if (!Array.isArray(source)) throw new Error("Blog index must be an array");
  const ids = new Set();
  const posts = source
    .map((post) => {
      if (
        !post ||
        !validId(post.id) ||
        ids.has(post.id) ||
        typeof post.title !== "string" ||
        !post.title.trim()
      )
        throw new Error("Invalid or duplicate blog entry");
      ids.add(post.id);
      const timestamp = Date.parse(post.date);
      if (!Number.isFinite(timestamp))
        throw new Error(`Invalid publication date: ${post.id}`);
      const tags = Array.isArray(post.tags)
        ? post.tags.filter((tag) => typeof tag === "string")
        : [];
      const chapterName =
        tags.some((tag) => /codex/i.test(tag)) || /codex/i.test(post.id)
          ? "Codex"
          : tags.some((tag) => /antigravity/i.test(tag)) ||
              /antigravity/i.test(post.id)
            ? "Antigravity"
            : String(post.seriesTitle || post.category || "Notes");
      return {
        ...post,
        tags,
        summary: String(post.summary || ""),
        date: String(post.date),
        isoDate: new Date(timestamp).toISOString().slice(0, 10),
        chapterName,
        route: `articles/${post.id}.html`,
      };
    })
    .sort(
      (a, b) =>
        b.isoDate.localeCompare(a.isoDate) ||
        Number(b.chapter || 0) - Number(a.chapter || 0),
    );
  const routes = [];
  const assets = [];
  const emit = (route, info) => {
    writePage(route, renderPage({ ...info, route, section: "blog" }));
    routes.push(route);
  };
  const entry = (post) =>
    `<li class="blog-entry"><div class="entry-meta"><time datetime="${post.isoDate}">${escape(post.date)}</time>${post.readTime ? ` <span>${escape(post.readTime)}</span>` : ""}</div><h3><a href="/Codex/${post.route}">${escape(post.title)}</a></h3><p>${escape(post.summary)}</p></li>`;
  const chapters = [...new Set(posts.map((post) => post.chapterName))];
  const groups = chapters
    .map(
      (chapter, index) =>
        `<section class="chapter" aria-labelledby="chapter-${index}"><div class="section-heading"><h2 id="chapter-${index}">${escape(chapter)}</h2><span>${posts.filter((post) => post.chapterName === chapter).length} entries</span></div><ol class="blog-list">${posts
          .filter((post) => post.chapterName === chapter)
          .map(entry)
          .join("")}</ol></section>`,
    )
    .join("");
  emit("blog.html", {
    title: "Blog",
    description:
      "Kruti Deepan Panda’s notes on engineering and hands-on experiments with AI coding assistants.",
    body: `<header class="page-intro"><p class="eyebrow">Blog</p><h1>Notes from the workbench.</h1><p class="lead">Hands-on experiments, engineering decisions, and the lessons that stay with me.</p><a class="text-link" href="/Blog/rss.xml">Subscribe via RSS ↗</a></header>${groups}${!chapters.includes("Codex") ? '<aside class="chapter-placeholder"><h2>Codex</h2><p>No published entries yet.</p></aside>' : ""}`,
  });
  for (const post of posts) {
    const markdown = fs.readFileSync(
      checkedArticleFile(root, post.id, "article.md"),
      "utf8",
    );
    const rendered = renderMarkdown(markdown, {
      title: post.title,
      root,
      id: post.id,
    });
    assets.push(...rendered.assets);
    const chapterPosts = posts
      .filter((item) => item.chapterName === post.chapterName)
      .slice()
      .reverse();
    const position = chapterPosts.findIndex((item) => item.id === post.id);
    const previous = chapterPosts[position - 1];
    const next = chapterPosts[position + 1];
    const contents =
      rendered.headings.length >= 4
        ? `<nav class="article-contents" aria-label="On this page"><h2>On this page</h2><ul>${rendered.headings.map((item) => `<li><a href="#${item.id}">${escape(item.title)}</a></li>`).join("")}</ul></nav>`
        : "";
    const adjacent = (item, label) =>
      item
        ? `<a href="/Codex/${item.route}"><span>${label}</span><strong>${escape(item.title)}</strong></a>`
        : "";
    emit(post.route, {
      title: post.title,
      description: post.summary,
      article: {
        date: post.isoDate,
        title: post.title,
        description: post.summary,
      },
      body: `<article><header class="article-header"><a class="text-link" href="/Codex/blog.html">← Blog</a><p class="eyebrow">${escape(post.chapterName)}</p><h1>${escape(post.title)}</h1><div class="entry-meta"><span>Kruti Deepan Panda</span><time datetime="${post.isoDate}">${escape(post.date)}</time>${post.readTime ? `<span>${escape(post.readTime)}</span>` : ""}${post.experimentResult ? `<span class="experiment-result">Experiment result: ${escape(post.experimentResult)}</span>` : ""}</div></header>${contents}<div class="prose">${rendered.html}</div><nav class="article-navigation" aria-label="More in ${escape(post.chapterName)}">${adjacent(previous, "Previous entry")}${adjacent(next, "Next entry")}</nav></article>`,
    });
  }
  emit("article.html", {
    title: "Article archive",
    description: "Find an article in Kruti Deepan Panda’s blog.",
    body: `<header class="page-intro"><p class="eyebrow">Blog</p><h1 id="article-status">Find an article.</h1><p id="article-message">Choose an entry from the archive.</p></header><nav data-article-index aria-label="Article archive"><ul class="blog-list">${posts.map((post) => `<li><a data-article-id="${post.id}" href="/Codex/${post.route}">${escape(post.title)}</a></li>`).join("")}</ul></nav>`,
  });
  return {
    posts,
    routes,
    latestHtml: posts.length
      ? `<section class="latest-note"><div class="section-heading"><h2>Latest from the blog</h2><a href="/Codex/blog.html">All entries →</a></div><ul class="blog-list">${entry(posts[0])}</ul></section>`
      : "",
    articleIds: [...ids],
    assets,
  };
}

module.exports = { buildBlog, renderMarkdown, validId };
