const fs = require("node:fs");
const path = require("node:path");
const owner = "krutideepanpanda";
const excluded = new Set(["krutideepanpanda.github.io"]);
function normalize(repo) {
  if (
    !repo ||
    repo.private !== false ||
    repo.owner?.login !== owner ||
    typeof repo.name !== "string" ||
    !/^[a-z0-9._-]+$/i.test(repo.name) ||
    excluded.has(repo.name.toLowerCase())
  )
    return null;
  const date = Date.parse(repo.pushed_at || repo.updated_at);
  return {
    name: repo.name,
    description:
      typeof repo.description === "string"
        ? repo.description.slice(0, 1000)
        : "",
    language: typeof repo.language === "string" ? repo.language : "",
    topics: Array.isArray(repo.topics)
      ? repo.topics.filter((t) => typeof t === "string").slice(0, 6)
      : [],
    updated: Number.isFinite(date) ? new Date(date).toISOString() : null,
    fork: repo.fork === true,
    archived: repo.archived === true,
    url: `https://github.com/${owner}/${encodeURIComponent(repo.name)}`,
  };
}
async function fetchSnapshot(fetcher = fetch) {
  const repos = new Map();
  for (let page = 1; page <= 100; page++) {
    const response = await fetcher(
      `https://api.github.com/users/${owner}/repos?type=owner&sort=updated&per_page=100&page=${page}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "KDP-Portfolio",
        },
        signal: AbortSignal.timeout(20000),
      },
    );
    if (!response.ok)
      throw new Error(`GitHub refresh failed: ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Invalid GitHub response");
    for (const item of data) {
      const repo = normalize(item);
      if (repo) repos.set(repo.name, repo);
    }
    if (data.length < 100)
      return {
        updatedAt: new Date().toISOString(),
        repositories: [...repos.values()].sort((a, b) =>
          (b.updated || "").localeCompare(a.updated || ""),
        ),
      };
  }
  throw new Error("Repository pagination limit exceeded");
}
async function refresh(destination, fetcher = fetch) {
  const snapshot = await fetchSnapshot(fetcher);
  if (fs.existsSync(destination)) {
    try {
      const previous = JSON.parse(fs.readFileSync(destination, "utf8"));
      if (
        JSON.stringify(previous.repositories) ===
        JSON.stringify(snapshot.repositories)
      )
        return previous;
    } catch {
      /* Replace an invalid snapshot only after a successful fetch. */
    }
  }
  // No writes occur until every API page has succeeded.
  fs.writeFileSync(destination, JSON.stringify(snapshot, null, 2) + "\n");
  return snapshot;
}
if (require.main === module)
  refresh(path.join(__dirname, "repositories.json"))
    .then((s) =>
      console.log(`Saved ${s.repositories.length} public repositories`),
    )
    .catch((e) => {
      console.error(e.message + "; previous snapshot retained.");
      process.exitCode = 1;
    });
module.exports = { normalize, fetchSnapshot, refresh };
