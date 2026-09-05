const fs = require("node:fs");
const path = require("node:path");
const { pages, caseStudies } = require("./content.cjs");
const { buildBlog } = require("./blog-build.cjs");
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const origin = "https://krutideepanpanda.com";
const sections = [
  "about",
  "experience",
  "projects",
  "skills",
  "leadership",
  "blog",
  "contact",
];
const labels = {
  about: "About",
  experience: "Experience",
  projects: "Projects",
  skills: "Skills",
  leadership: "Leadership",
  blog: "Blog",
  contact: "Contact",
};
const schemaJSON = (value) => JSON.stringify(value).replace(/</g, "\\u003c");
const diagram = (alu = false) =>
  alu
    ? `<svg viewBox="0 0 420 130" role="img" aria-label="Four-bit ALU: two inputs feed arithmetic and logic operations"><g fill="none" stroke="#1748ba" stroke-width="2"><path d="M20 36h92m-92 58h92m192-29h96"/><path d="M112 15h80l32 24 32-24h48v100h-48l-32-24-32 24h-80z"/></g><g font-family="Arial,sans-serif" fill="#202724" font-size="16"><text x="25" y="26">A [3:0]</text><text x="25" y="84">B [3:0]</text><text x="160" y="71">ADD · AND · OR</text><text x="333" y="54">OUT</text></g></svg>`
    : `<svg viewBox="0 0 420 130" role="img" aria-label="PicoRV32 processor connected to an OpenLane implementation flow"><g fill="none" stroke="#1748ba" stroke-width="2"><rect x="8" y="25" width="155" height="80" rx="3"/><path d="M164 65h70"/><rect x="235" y="25" width="175" height="80" rx="3"/></g><g fill="#202724" font-family="Arial,sans-serif" text-anchor="middle"><text x="86" y="61" font-size="21">PicoRV32</text><text x="86" y="83" font-size="13">RTL configuration</text><text x="322" y="61" font-size="21">OpenLane</text><text x="322" y="83" font-size="13">Physical implementation</text></g></svg>`;
const selected = () =>
  `<div class="cards"><article class="card"><div class="project-visual">${diagram()}</div><span class="eyebrow">Academic · NITK</span><h3>RISC-V, from RTL to layout.</h3><p>Exploring PicoRV32 configurations and physical-design tradeoffs through OpenLane.</p><a class="text-link" href="/Codex/projects/risc-v-openlane.html">Read the case study →</a></article><article class="card"><div class="project-visual blue">${diagram(true)}</div><span class="eyebrow">Academic · NITK</span><h3>Four bits. From layout to verification.</h3><p>A standard-cell ALU in Magic VLSI, checked through an automated simulation workflow.</p><a class="text-link" href="/Codex/projects/4-bit-alu.html">Read the case study →</a></article></div>`;
function buildCodex(root, output) {
  const codex = path.join(output, "Codex");
  fs.mkdirSync(codex, { recursive: true });
  const manifest = [];
  const writePage = (route, html) => {
    if (!/^[a-z0-9/_-]+\.html$/.test(route)) throw Error("Unsafe output route");
    const file = path.join(codex, route);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, html);
    manifest.push(route);
  };
  const renderPage = ({
    title,
    description,
    body,
    route,
    section,
    article,
  }) => {
    const url = `${origin}/Codex/${route}`;
    const og = `${origin}/Codex/social/${route.replace(/\.html$/, "").replaceAll("/", "-")}.png`;
    const schema = article
      ? {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: title,
          description,
          datePublished: article.date,
          author: {
            "@type": "Person",
            name: "Kruti Deepan Panda",
            url: origin + "/Codex/index.html",
          },
          mainEntityOfPage: url,
          image: og,
        }
      : {
          "@context": "https://schema.org",
          "@type": route === "index.html" ? "ProfilePage" : "WebPage",
          name: title,
          url,
          description,
          ...(route === "index.html"
            ? {
                mainEntity: {
                  "@type": "Person",
                  name: "Kruti Deepan Panda",
                  jobTitle: "Silicon Design Engineer 2",
                  worksFor: { "@type": "Organization", name: "AMD" },
                  sameAs: [
                    "https://github.com/krutideepanpanda",
                    "https://www.linkedin.com/in/kruti-deepan-panda-0a93081a5/",
                  ],
                },
              }
            : {}),
        };
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'none'; object-src 'none'; form-action 'none'; frame-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; media-src 'none'; worker-src 'none'; upgrade-insecure-requests"><meta name="referrer" content="strict-origin-when-cross-origin"><meta name="theme-color" content="#f5f2eb"><title>${escape(title)} — Kruti Deepan Panda</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${url}"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="alternate" type="application/rss+xml" title="Kruti Deepan Panda Blog" href="/Blog/rss.xml"><meta property="og:type" content="${article ? "article" : "website"}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${og}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${og}"><link rel="preload" href="/Codex/fonts/source-sans-3-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/Codex/portfolio.css"><script type="application/ld+json">${schemaJSON(schema)}</script><script src="/Codex/enhance.js" defer></script>${route === "article.html" ? '<script src="/Codex/legacy-article.js" defer></script>' : ""}</head><body><a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="shell header-inner"><a class="brand" href="/Codex/index.html"><span class="brand-mark" aria-hidden="true">KDP</span><span>Kruti Deepan Panda</span></a><button class="menu-button" data-menu aria-controls="site-nav" aria-expanded="false" hidden>Menu</button><nav class="site-nav" id="site-nav" aria-label="Primary"><a class="nav-portal" href="/index.html">All builds ↗</a>${sections.map((s) => `<a href="/Codex/${s}.html"${s === section ? ' aria-current="page"' : ""}${s === "contact" ? ' class="nav-contact"' : ""}>${labels[s]}</a>`).join("")}</nav></div></header><main class="shell${article ? " reading-page" : ""}" id="main">${body}</main><footer class="site-footer"><div class="shell footer-inner"><p>© ${new Date().getUTCFullYear()} Kruti Deepan Panda<br>Silicon, systems, and software.</p><nav class="footer-links" aria-label="Footer"><a href="/index.html">All builds</a><a href="/Codex/contact.html">Contact</a><a href="https://github.com/krutideepanpanda" target="_blank" rel="noopener noreferrer">GitHub ↗</a></nav></div></footer></body></html>`;
  };
  const header = (label, title, description) =>
    `<header class="page-header"><p class="eyebrow">${escape(label)}</p><h1>${escape(title)}</h1><p>${escape(description)}</p></header>`;
  for (const [section, page] of Object.entries(pages))
    writePage(
      `${section}.html`,
      renderPage({
        ...page,
        route: `${section}.html`,
        section,
        body: header(labels[section], page.title, page.description) + page.body,
      }),
    );
  for (const [id, page] of Object.entries(caseStudies))
    writePage(
      `projects/${id}.html`,
      renderPage({
        ...page,
        route: `projects/${id}.html`,
        section: "projects",
        body: header("Case study", page.title, page.description) + page.body,
      }),
    );
  const blog = buildBlog({ root, renderPage, writePage });
  const snapshot = JSON.parse(
    fs.readFileSync(path.join(__dirname, "repositories.json"), "utf8"),
  );
  const repos = snapshot.repositories;
  if (!Array.isArray(repos)) throw Error("Invalid repository snapshot");
  const safeRepos = repos.map((r) => {
    if (
      !r ||
      typeof r.name !== "string" ||
      !/^[a-z0-9._-]+$/i.test(r.name) ||
      r.name.toLowerCase() === "krutideepanpanda.github.io"
    )
      throw Error("Invalid snapshot repository");
    return {
      ...r,
      url: `https://github.com/krutideepanpanda/${encodeURIComponent(r.name)}`,
    };
  });
  const academic = [
    [
      "Configurable CNN hardware framework",
      "Scalable FPGA memory architecture for convolution pixel reuse across changing kernel and stride sizes.",
      "FPGA · CNN · Verilog",
    ],
    [
      "MIT Beta-ISA pipelined processor",
      "A five-stage CPU paired with a custom Python GUI assembler.",
      "Computer architecture · Python",
    ],
    [
      "Security module for a microprocessor",
      "A 32-bit RISC processor with a 128-bit AES block and assembler-side encryption.",
      "RISC · AES",
    ],
    [
      "Raspberry Pi object detection",
      "An embedded object-detection pipeline using MobileNet-SSD V2.",
      "Edge AI · Python",
    ],
  ];
  const projectsBody =
    header(
      "Projects",
      "Engineering, made tangible.",
      "Models, automation, and hardware systems—from professional verification flows to academic implementations.",
    ) +
    `<nav class="jump-links" aria-label="Project categories"><a href="#industry">Industry</a><a href="#academic">Academic</a><a href="#repositories">Public repositories</a></nav><section id="industry" class="project-section"><h2>Industry</h2><div class="cards"><article class="card"><span class="eyebrow">AMD</span><h3>Analog CAD automation</h3><p>Python and TCL tooling for circuit sizing, verification workflows, and repeatable regressions.</p><a class="text-link" href="experience.html#amd">Related experience →</a></article><article class="card"><span class="eyebrow">AMD</span><h3>Mixed-signal modeling and verification</h3><p>Behavioral models with XMODEL and MODELZEN, alongside formal verification and equivalence checks.</p><a class="text-link" href="experience.html#amd">Related experience →</a></article></div></section><section id="academic" class="project-section"><h2>Academic</h2>${selected()}<div class="cards academic-more">${academic.map(([title, desc, tools]) => `<article class="card"><h3>${title}</h3><p>${desc}</p><span class="tag">${tools}</span></article>`).join("")}</div></section><section id="repositories" class="project-section"><h2>Public repositories</h2><p class="muted">More code and experiments on <a href="https://github.com/krutideepanpanda" target="_blank" rel="noopener noreferrer">GitHub ↗</a></p><div class="repo-controls" data-repo-controls hidden><label>Find a repository<input data-repo-search type="search" placeholder="Search name, topic, or description"></label><label>Language<select data-repo-language><option value="">All languages</option>${[
      ...new Set(safeRepos.map((r) => r.language).filter(Boolean)),
    ]
      .sort()
      .map((l) => `<option value="${escape(l)}">${escape(l)}</option>`)
      .join(
        "",
      )}</select></label></div><p data-repo-count aria-live="polite" class="muted">${safeRepos.length} repositories</p><div class="repo-list">${safeRepos.map((r) => `<article class="repo-row" data-repository data-language="${escape(r.language)}" data-topics="${escape((r.topics || []).join(" "))}"><div><h3>${escape(r.name.replace(/[-_]+/g, " "))}</h3><div class="repo-meta"><small>${escape(r.language || "Source code")}</small>${r.fork ? "<small>Fork</small>" : ""}${r.archived ? "<small>Archived</small>" : ""}</div></div><p>${escape(r.description || "Source and project history on GitHub.")}</p><a href="${r.url}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escape(r.name)} repository">Open repo ↗</a></article>`).join("")}</div><p data-repo-empty hidden>No repositories match. Try a different search or language.</p></section>`;
  writePage(
    "projects.html",
    renderPage({
      title: "Projects",
      description:
        "Industry work, academic case studies, and public repositories by Kruti Deepan Panda.",
      route: "projects.html",
      section: "projects",
      body: projectsBody,
    }),
  );
  const heroArt = `<div class="hero-art"><svg viewBox="0 0 430 285" role="img" aria-label="Engineering workflow: model, automate, verify"><g fill="none" stroke="#bac5b6" stroke-width="1"><path d="M0 40h430M0 100h430M0 160h430M0 220h430M50 0v285M130 0v285M210 0v285M290 0v285M370 0v285"/></g><g fill="#fffdf8" stroke="#1748ba" stroke-width="1.5"><rect x="34" y="27" width="225" height="62" rx="3"/><rect x="105" y="112" width="225" height="62" rx="3"/><rect x="175" y="197" width="225" height="62" rx="3"/></g><g stroke="#1748ba" fill="none" stroke-width="2"><path d="M259 58h29v54m42 31h29v54"/></g><g fill="#202724" font-family="Arial,sans-serif" font-size="22"><text x="57" y="66">01   Model</text><text x="129" y="151">02   Automate</text><text x="200" y="236">03   Verify</text></g></svg><p>Analog mixed-signal · CAD automation · Formal verification</p></div>`;
  const home = `<section class="home-hero"><div><p class="eyebrow">Silicon / Systems / Software</p><h1>Kruti Deepan Panda.</h1><p class="hero-role">Silicon Design Engineer 2 at AMD.</p><p class="hero-intro">I build mixed-signal models, automate engineering workflows, and verify the systems behind complex silicon.</p><div class="actions"><a class="button" href="projects.html">Explore my work <span aria-hidden="true">↗</span></a><a class="button secondary" href="contact.html">Get in touch</a></div></div>${heroArt}</section><nav class="career-strip" aria-label="Career overview"><a href="experience.html#amd"><strong>AMD</strong><span>Silicon design · Full-time</span></a><a href="experience.html#intel"><strong>Intel</strong><span>Structural design · Internship</span></a><a href="experience.html#ti"><strong>Texas Instruments</strong><span>Analog VLSI · Internship</span></a></nav><section class="section"><div class="section-heading"><h2>Selected work</h2><a href="projects.html">All projects →</a></div>${selected()}</section><section class="section"><div class="section-heading"><h2>A little more about me</h2></div><nav class="directory" aria-label="Portfolio sections">${sections
    .filter((s) => s !== "projects")
    .map(
      (s) =>
        `<a href="${s}.html">${labels[s]} <span aria-hidden="true">↗</span></a>`,
    )
    .join("")}</nav></section>${blog.latestHtml}`;
  writePage(
    "index.html",
    renderPage({
      title: "Silicon design, models, and automation",
      description:
        "Kruti Deepan Panda, Silicon Design Engineer 2 at AMD. Explore mixed-signal modeling, CAD automation, and hardware projects.",
      body: home,
      route: "index.html",
    }),
  );
  for (const name of ["portfolio.css", "enhance.js", "legacy-article.js"])
    fs.copyFileSync(path.join(__dirname, name), path.join(codex, name));
  fs.mkdirSync(path.join(codex, "fonts"), { recursive: true });
  for (const weight of [400, 600, 700]) {
    const name = `source-sans-3-latin-${weight}-normal.woff2`;
    fs.copyFileSync(
      path.join(root, "node_modules/@fontsource/source-sans-3/files", name),
      path.join(codex, "fonts", name),
    );
  }
  fs.copyFileSync(
    path.join(root, "node_modules/@fontsource/source-sans-3/LICENSE"),
    path.join(codex, "fonts/LICENSE.txt"),
  );
  for (const asset of blog.assets) {
    const dest = path.join(codex, asset.route);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(asset.source, dest);
  }
  const old = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
  const retained = old.replace(
    /<url>\s*<loc>https:\/\/krutideepanpanda\.com\/Codex\/[\s\S]*?<\/url>/g,
    "",
  );
  fs.writeFileSync(
    path.join(output, "sitemap.xml"),
    retained.replace(
      "</urlset>",
      manifest
        .filter((r) => r !== "article.html")
        .map((r) => `<url><loc>${origin}/Codex/${r}</loc></url>`)
        .join("\n") + "\n</urlset>",
    ),
  );
  return { manifest, renderPage };
}
module.exports = { buildCodex };
