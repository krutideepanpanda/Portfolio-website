const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");
const escape = (s) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
async function buildSocial(output, routes) {
  const directory = path.join(output, "Codex", "social");
  fs.mkdirSync(directory, { recursive: true });
  for (const route of routes) {
    const html = fs.readFileSync(path.join(output, "Codex", route), "utf8");
    const raw = html
      .match(/<title>(.*?)<\/title>/)[1]
      .replace(/ — Kruti Deepan Panda$/, "")
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"');
    const lines = [];
    let line = "";
    for (const word of raw.split(" ")) {
      if ((line + " " + word).trim().length > 29 && line) {
        lines.push(line);
        line = word;
      } else line = (line + " " + word).trim();
    }
    if (line) lines.push(line);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#f5f2eb"/><rect x="64" y="64" width="62" height="62" fill="#202724"/><text x="95" y="101" text-anchor="middle" fill="#fffdf8" font-family="sans-serif" font-size="18">KDP</text><text x="149" y="103" fill="#202724" font-size="27" font-family="sans-serif">KRUTI DEEPAN PANDA</text><path d="M64 160H1136" stroke="#d5d9d0"/>${lines
      .slice(0, 4)
      .map(
        (l, i) =>
          `<text x="64" y="${246 + i * 66}" fill="#202724" font-family="sans-serif" font-size="52" font-weight="600">${escape(l)}</text>`,
      )
      .join(
        "",
      )}<path d="M64 534H1136" stroke="#1748ba" stroke-width="5"/><text x="64" y="581" fill="#57605a" font-size="22" font-family="sans-serif">SILICON / SYSTEMS / SOFTWARE</text><text x="1136" y="581" text-anchor="end" fill="#1748ba" font-size="22" font-family="sans-serif">krutideepanpanda.com</text></svg>`;
    await sharp(Buffer.from(svg))
      .png()
      .toFile(
        path.join(
          directory,
          route.replace(/\.html$/, "").replaceAll("/", "-") + ".png",
        ),
      );
  }
}
module.exports = { buildSocial };
