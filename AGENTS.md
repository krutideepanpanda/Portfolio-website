# Portfolio Project Instructions

## Product boundaries

- `/` is the comparison portal for AI-built portfolio versions.
- `/Antigravity/` is a frozen experiment. Do not edit it unless the user explicitly asks for an Antigravity change.
- `/Codex/` is the independent Codex portfolio. Keep its light editorial engineering direction independent of Antigravity code and styling.
- Every major portfolio section has its own HTML page; keep the Codex landing page concise and navigational.

## Source authority

- Use `Neutral_folder` for biography, experience, projects, skills, leadership, and contact copy.
- Use `Blog/posts.json` and `Blog/<id>/article.md` for blog content.
- Link a project repository only after verifying it on `https://github.com/krutideepanpanda`.
- Do not invent professional claims, project metrics, dates, blog posts, or repositories.
- The Codex contact page may expose only `krutideepan123@gmail.com`, the approved LinkedIn profile, and GitHub. Do not expose the private phone number.

## Quality gates

- Run `npm test` for Codex changes.
- Confirm JavaScript syntax, `git diff --check`, valid sitemap XML, and no unexpected console errors.
- For release work, require an empty `git diff --name-only -- Antigravity` unless Antigravity edits were explicitly authorized.
- Verify the root comparison buttons, all Codex section links, five shared blog posts, one valid article, and one invalid article ID.
- Distinguish inherited Antigravity failures from defects introduced by the current change.

Use the personal `$portfolio-quality-gate` skill for substantial UI, content, blog, or release reviews. Local specialist role briefs are available under `agents/portfolio-*` when present.
