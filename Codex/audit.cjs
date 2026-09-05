const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const http = require("node:http");
const puppeteer = require("puppeteer");
const { AxePuppeteer } = require("@axe-core/puppeteer");
const { normalize, fetchSnapshot, refresh } = require("./repositories.cjs");

const root = path.resolve(__dirname, "..");
const artifact = path.join(root, "_site");
const posts = JSON.parse(
  fs.readFileSync(path.join(root, "Blog/posts.json"), "utf8"),
);
const routes = [
  "index",
  "about",
  "experience",
  "projects",
  "skills",
  "leadership",
  "contact",
  "blog",
  "article",
]
  .map((p) => `/Codex/${p}.html`)
  .concat(
    ["/Codex/projects/risc-v-openlane.html", "/Codex/projects/4-bit-alu.html"],
    posts.map((p) => `/Codex/articles/${p.id}.html`),
  );
const mime = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
  ".md": "text/plain",
};

function server() {
  return http.createServer((req, res) => {
    let file;
    try {
      file = path.resolve(
        artifact,
        "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
      );
    } catch {
      res.writeHead(400).end();
      return;
    }
    if (file === artifact) file = path.join(artifact, "index.html");
    if (
      !file.startsWith(artifact + path.sep) ||
      !fs.existsSync(file) ||
      !fs.statSync(file).isFile()
    ) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      "Content-Type": mime[path.extname(file)] || "application/octet-stream",
    });
    fs.createReadStream(file).pipe(res);
  });
}

async function repositoryTests() {
  const repo = (n) => ({
    name: `project-${n}`,
    owner: { login: "krutideepanpanda" },
    private: false,
    html_url: "javascript:alert(1)",
    description: null,
    language: null,
    pushed_at: "invalid",
  });
  assert.equal(normalize({ ...repo(1), owner: { login: "attacker" } }), null);
  assert.equal(normalize({ ...repo(1), private: true }), null);
  assert.equal(normalize({ ...repo(1), name: "../escape" }), null);
  assert.equal(
    normalize({ ...repo(1), name: "krutideepanpanda.github.io" }),
    null,
  );
  assert.equal(
    normalize(repo(1)).url,
    "https://github.com/krutideepanpanda/project-1",
  );
  const calls = [];
  const snapshot = await fetchSnapshot(async (url) => {
    calls.push(url);
    return {
      ok: true,
      json: async () =>
        calls.length === 1
          ? Array.from({ length: 100 }, (_, i) => repo(i))
          : [repo(100)],
    };
  });
  assert.equal(calls.length, 2);
  assert.equal(snapshot.repositories.length, 101);
  assert.match(calls[1], /page=2$/);
  assert.equal(
    (await fetchSnapshot(async () => ({ ok: true, json: async () => [] })))
      .repositories.length,
    0,
  );
  await assert.rejects(
    fetchSnapshot(async () => ({
      ok: true,
      json: async () => ({ message: "invalid" }),
    })),
  );
  const folder = fs.mkdtempSync(
    path.join(os.tmpdir(), "portfolio-refresh-test-"),
  );
  const destination = path.join(folder, "snapshot.json");
  try {
    fs.writeFileSync(destination, "previous snapshot");
    let count = 0;
    await assert.rejects(
      refresh(destination, async () =>
        ++count === 1
          ? {
              ok: true,
              json: async () => Array.from({ length: 100 }, (_, i) => repo(i)),
            }
          : { ok: false, status: 503 },
      ),
    );
    assert.equal(fs.readFileSync(destination, "utf8"), "previous snapshot");
    const stable = await refresh(destination, async () => ({
      ok: true,
      json: async () => [repo(1)],
    }));
    const bytes = fs.readFileSync(destination, "utf8");
    await refresh(destination, async () => ({
      ok: true,
      json: async () => [repo(1)],
    }));
    assert.equal(
      fs.readFileSync(destination, "utf8"),
      bytes,
      "Unchanged repository data rewrites snapshot",
    );
    assert.equal(stable.repositories.length, 1);
  } finally {
    fs.unlinkSync(destination);
    fs.rmdirSync(folder);
  }
}

async function main() {
  assert(
    fs.existsSync(path.join(artifact, "Codex/index.html")),
    "Build the deployment artifact before running this audit",
  );
  await repositoryTests();
  const listener = server();
  await new Promise((resolve) => listener.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${listener.address().port}`;
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    const errors = [];
    const badResponses = [];
    const links = new Set();
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400) badResponses.push(`${r.status()} ${r.url()}`);
    });
    for (const route of routes) {
      for (const width of [320, 390, 768, 1024, 1440]) {
        await page.setViewport({ width, height: 1000 });
        const response = await page.goto(base + route, {
          waitUntil: "networkidle0",
        });
        assert.equal(response.status(), 200, route);
        const result = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          h1: document.querySelectorAll("h1").length,
          main: document.querySelectorAll("main").length,
          title: document.title,
          hiddenMain:
            getComputedStyle(document.querySelector("main")).visibility ===
              "hidden" ||
            getComputedStyle(document.querySelector("main")).opacity === "0",
          unsafe: [...document.querySelectorAll('a[target="_blank"]')].filter(
            (a) =>
              !a.rel.split(/\s+/).includes("noopener") ||
              !a.rel.split(/\s+/).includes("noreferrer"),
          ).length,
          links: [
            ...document.querySelectorAll(
              "a[href],img[src],script[src],link[href]",
            ),
          ].map((e) => e.href || e.src),
          canonical: document.querySelector('link[rel="canonical"]')?.href,
          description: document.querySelector('meta[name="description"]')
            ?.content,
        }));
        assert(!result.overflow, `${route}: overflow at ${width}px`);
        assert.equal(result.h1, 1, `${route}: one H1 required`);
        assert.equal(result.main, 1, `${route}: one main required`);
        assert(
          result.title && result.description && result.canonical,
          `${route}: missing metadata`,
        );
        assert(!result.hiddenMain, `${route}: main hidden`);
        assert.equal(result.unsafe, 0, `${route}: unsafe new-tab link`);
        for (const link of result.links)
          if (link.startsWith(base)) links.add(link);
      }
      const axe = await new AxePuppeteer(page).analyze();
      const violations = axe.violations.filter((v) =>
        ["serious", "critical"].includes(v.impact),
      );
      assert.equal(
        violations.length,
        0,
        `${route}: accessibility violations ${violations.map((v) => `${v.id} (${v.nodes.map((n) => n.target).join(",")})`).join("; ")}`,
      );
    }
    for (const link of links) {
      const url = new URL(link);
      url.hash = "";
      const response = await fetch(url);
      assert.equal(response.status, 200, `Broken artifact link: ${link}`);
    }
    assert.deepEqual(badResponses, [], "Failed page resources");
    assert.deepEqual(errors, [], "Browser console/runtime errors");

    await page.setViewport({ width: 320, height: 900 });
    await page.goto(base + "/Codex/index.html");
    const menu = await page.$("[data-menu]");
    assert(menu, "Mobile menu control missing");
    await menu.click();
    assert(
      await page.$eval("#site-nav", (e) => e.classList.contains("open")),
      "Mobile menu did not open",
    );
    await page.keyboard.press("Escape");
    assert(
      await page.$eval("[data-menu]", (e) => document.activeElement === e),
      "Escape did not return focus",
    );
    assert(
      await page.$eval("#site-nav", (e) => !e.classList.contains("open")),
      "Escape did not close menu",
    );
    assert(
      await page.$eval("[data-menu]", (e) => {
        const s = getComputedStyle(e);
        return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0;
      }),
      "Keyboard focus lacks a visible outline",
    );

    await page.goto(base + "/Codex/projects.html");
    const total = await page.$$eval("[data-repository]", (els) => els.length);
    assert(total > 0, "Repository snapshot is unexpectedly empty");
    await page.type("[data-repo-search]", "no-repository-can-match-this-12345");
    assert.equal(
      await page.$$eval(
        "[data-repository]",
        (els) =>
          els.filter((e) => !e.hidden && getComputedStyle(e).display !== "none")
            .length,
      ),
      0,
      "Search fails to filter",
    );
    await page.$eval("[data-repo-search]", (e) => {
      e.value = "";
      e.dispatchEvent(new Event("input", { bubbles: true }));
    });
    assert.equal(
      await page.$$eval(
        "[data-repository]",
        (els) =>
          els.filter((e) => !e.hidden && getComputedStyle(e).display !== "none")
            .length,
      ),
      total,
      "Clearing search fails to restore entries",
    );
    const topic = await page.$$eval("[data-repository]", (els) =>
      els.flatMap((e) => (e.dataset.topics || "").split(" ")).find(Boolean),
    );
    assert(topic, "Snapshot lacks topic search coverage");
    await page.type("[data-repo-search]", topic);
    assert(
      await page.$$eval("[data-repository]", (els) =>
        els.some((e) => !e.hidden),
      ),
      "Topic search returned no matches",
    );
    await page.$eval("[data-repo-search]", (e) => {
      e.value = "";
      e.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const language = await page.$eval(
      "[data-repo-language]",
      (e) => [...e.options].find((o) => o.value)?.value,
    );
    assert(language, "Language filter has no choices");
    await page.select("[data-repo-language]", language);
    assert(
      await page.$$eval(
        "[data-repository]",
        (els, language) => {
          const visible = els.filter(
            (e) => !e.hidden && getComputedStyle(e).display !== "none",
          );
          return (
            visible.length > 0 &&
            visible.every((e) => e.dataset.language === language)
          );
        },
        language,
      ),
      "Language filter returns incorrect entries",
    );

    await page.goto(base + "/Codex/contact.html");
    const contacts = await page.$$eval(
      'a[href^="mailto:"],a[href^="tel:"]',
      (els) => els.map((e) => e.getAttribute("href")),
    );
    assert(
      contacts.length > 0 &&
        contacts.every((h) => h === "mailto:krutideepan123@gmail.com"),
      "Unapproved or missing contact email",
    );
    await page.goto(base + `/Codex/article.html?id=${posts[0].id}`, {
      waitUntil: "networkidle0",
    });
    assert(
      new URL(page.url()).pathname === `/Codex/articles/${posts[0].id}.html`,
      "Legacy article route fails",
    );
    await page.goto(base + "/Codex/article.html?id=..%2F..%2Fpackage", {
      waitUntil: "networkidle0",
    });
    assert(
      new URL(page.url()).pathname === "/Codex/article.html",
      "Invalid ID navigates outside article resolver",
    );
    assert.match(
      await page.$eval("main", (e) => e.textContent),
      /not found|unavailable|could not|choose|select|article/i,
    );

    await page.setJavaScriptEnabled(false);
    for (const route of routes) {
      await page.goto(base + route, { waitUntil: "networkidle0" });
      assert(
        await page.$eval("#site-nav", (e) => {
          const s = getComputedStyle(e);
          return (
            s.display !== "none" &&
            s.visibility !== "hidden" &&
            e.getBoundingClientRect().height > 0
          );
        }),
        `${route}: navigation hidden without JavaScript`,
      );
      assert(
        await page.$eval("main", (e) => e.innerText.trim().length > 40),
        `${route}: missing static content`,
      );
    }
    await page.setJavaScriptEnabled(true);
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
    await page.goto(base + "/Codex/index.html");
    assert(
      await page.$$eval("main h1, main h2, main p", (els) =>
        els.every(
          (e) =>
            getComputedStyle(e).opacity !== "0" &&
            getComputedStyle(e).visibility !== "hidden",
        ),
      ),
      "Reduced motion hides content",
    );
    await page.setViewport({ width: 1440, height: 1000 });
    for (const route of [
      "/Codex/index.html",
      "/Codex/projects.html",
      `/Codex/articles/${posts[0].id}.html`,
    ]) {
      await page.goto(base + route);
      await page.evaluate(() => {
        document.documentElement.style.zoom = "2";
      });
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${route}: overflow at 200% zoom`,
      );
    }

    const { renderMarkdown } = require("./blog-build.cjs");
    const rendered = renderMarkdown(
      '## Engineering\n\n> Quote\n\n- Parent\n  - Child\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n```verilog\nassign a = b;\n```\n\n<script>alert(1)</script><img src=x onerror=alert(1)><iframe src="https://evil.test"></iframe>\n\n[bad](javascript:alert(1))\n\n[good](https://example.com)\n\n![escape](../../secret.png)',
      { root, id: posts[0].id },
    );
    assert.equal(typeof rendered.html, "string");
    assert(Array.isArray(rendered.headings));
    await page.setContent(rendered.html);
    const safe = await page.evaluate(() => ({
      danger: document.querySelectorAll(
        "script,iframe,form,svg,math,[onerror],[onclick]",
      ).length,
      bad: [...document.querySelectorAll("[href],[src]")].some((e) =>
        /^\s*(javascript|vbscript|data):/i.test(
          e.getAttribute("href") || e.getAttribute("src"),
        ),
      ),
      table: !!document.querySelector("table"),
      code: !!document.querySelector("pre code"),
      nested: !!document.querySelector("ul ul"),
      quote: !!document.querySelector("blockquote"),
    }));
    assert.equal(safe.danger, 0);
    assert(!safe.bad);
    assert(
      safe.table && safe.code && safe.nested && safe.quote,
      "Engineering Markdown structure lost",
    );
    assert.equal(rendered.assets.length, 0, "Unsafe article image allowed");
    await page.goto(base + "/");
    const portalLinks = await page.$$eval("a[href]", (els) =>
      els.map((e) => new URL(e.href).pathname),
    );
    for (const target of [
      "/Codex/index.html",
      "/Codex/blog.html",
      "/Antigravity/index.html",
      "/Antigravity/blog.html",
    ])
      assert(portalLinks.includes(target), `Comparison link absent: ${target}`);
    const sitemap = await (await fetch(base + "/sitemap.xml")).text();
    assert(
      await page.evaluate(
        (xml) =>
          !new DOMParser()
            .parseFromString(xml, "application/xml")
            .querySelector("parsererror"),
        sitemap,
      ),
      "Invalid sitemap XML",
    );
    for (const post of posts)
      assert(
        sitemap.includes(`/Codex/articles/${post.id}.html`),
        `Missing article sitemap entry ${post.id}`,
      );
    assert(
      !fs.existsSync(path.join(artifact, "Codex/audit.cjs")),
      "Audit source leaked into public artifact",
    );
    console.log(
      `Artifact audit passed: ${routes.length} routes × 5 widths, accessibility, no-JS, navigation, repository failure handling, and hostile Markdown.`,
    );
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => listener.close(resolve));
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
