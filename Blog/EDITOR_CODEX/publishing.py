"""Shared-blog storage and publishing helpers for the Codex desktop editor."""

from __future__ import annotations

import datetime as dt
import html
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile

EDITOR_DIR = Path(__file__).resolve().parent
BLOG_DIR = EDITOR_DIR.parent
REPO_ROOT = BLOG_DIR.parent
POSTS_PATH = BLOG_DIR / "posts.json"
DRAFTS_DIR = EDITOR_DIR / "drafts"
ARTICLE_BASE_URL = "https://krutideepanpanda.com/Codex/article.html?id="


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9\s_-]", "", value)
    return re.sub(r"[-\s_]+", "-", value).strip("-")


def atomic_write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", newline="\n", delete=False, dir=path.parent
    ) as handle:
        handle.write(content)
        temp_path = Path(handle.name)
    os.replace(temp_path, path)


def load_posts() -> list[dict]:
    if not POSTS_PATH.exists():
        return []
    with POSTS_PATH.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    return data if isinstance(data, list) else []


def metadata_options() -> dict:
    posts = load_posts()
    categories = sorted({str(post.get("category", "")).strip() for post in posts if post.get("category")})
    tags = sorted({str(tag).strip() for post in posts for tag in post.get("tags", []) if tag})
    series: dict[str, dict] = {}
    for post in posts:
        series_id = str(post.get("series", "")).strip()
        if not series_id:
            continue
        chapter = int(post.get("chapter", 0) or 0)
        entry = series.setdefault(series_id, {
            "id": series_id,
            "title": str(post.get("seriesTitle", series_id)),
            "latestChapter": 0,
        })
        entry["latestChapter"] = max(entry["latestChapter"], chapter)
    return {"categories": categories, "tags": tags, "series": list(series.values())}


def estimate_read_time(markdown: str) -> str:
    words = len(re.findall(r"\b[\w'-]+\b", markdown))
    return f"{max(1, round(words / 220))} min read"


def parse_article(post_id: str) -> dict:
    safe_id = slugify(post_id)
    if not safe_id or safe_id != post_id:
        raise ValueError("Invalid post ID")
    article_path = BLOG_DIR / safe_id / "article.md"
    raw = article_path.read_text(encoding="utf-8")
    frontmatter: dict = {}
    body = raw
    match = re.match(r"^---\r?\n([\s\S]*?)\r?\n---\r?\n?", raw)
    if match:
        body = raw[match.end():]
        for line in match.group(1).splitlines():
            if ":" not in line:
                continue
            key, value = line.split(":", 1)
            try:
                frontmatter[key.strip()] = json.loads(value.strip())
            except json.JSONDecodeError:
                frontmatter[key.strip()] = value.strip()
    if body.startswith("# "):
        body = body.split("\n", 1)[1].lstrip() if "\n" in body else ""
    frontmatter["content"] = body
    frontmatter["id"] = safe_id
    return frontmatter


def compose_markdown(payload: dict, date_display: str) -> str:
    title = payload["title"].strip()
    body = re.sub(r"^---\r?\n[\s\S]*?\r?\n---\r?\n", "", payload["content"].strip()).strip()
    if body.startswith("# "):
        body = body.split("\n", 1)[1].lstrip() if "\n" in body else ""
    frontmatter = {
        "title": title,
        "author": "Kruti Deepan Panda",
        "date": date_display,
        "category": payload.get("category") or "AI Exploration",
        "readTime": payload.get("readTime") or estimate_read_time(body),
        "tags": payload.get("tags") or ["Codex"],
    }
    if payload.get("series"):
        frontmatter["series"] = payload["series"]
        frontmatter["seriesTitle"] = payload.get("seriesTitle") or payload["series"]
        frontmatter["chapter"] = int(payload.get("chapter") or 1)
    if payload.get("experimentResult"):
        frontmatter["experimentResult"] = payload["experimentResult"]
    frontmatter["summary"] = payload.get("summary", "")
    yaml_lines = [f"{key}: {json.dumps(value, ensure_ascii=False)}" for key, value in frontmatter.items()]
    yaml_text = "\n".join(yaml_lines)
    return f"---\n{yaml_text}\n---\n\n# {title}\n\n{body}\n"


def save_draft(payload: dict) -> Path:
    slug = slugify(payload.get("id", "") or payload.get("title", ""))
    if not slug:
        raise ValueError("Add a title or slug before saving a draft")
    path = DRAFTS_DIR / f"{slug}.draft.md"
    header = {key: payload.get(key) for key in (
        "title", "id", "category", "tags", "summary", "readTime",
        "series", "seriesTitle", "chapter", "experimentResult"
    )}
    atomic_write(path, f"<!-- CODEX-DRAFT {json.dumps(header, ensure_ascii=False)} -->\n\n{payload.get('content', '')}")
    return path


def update_sitemap(post_id: str, date_iso: str) -> None:
    path = REPO_ROOT / "sitemap.xml"
    if not path.exists():
        return
    content = path.read_text(encoding="utf-8")
    target = f"{ARTICLE_BASE_URL}{post_id}"
    if target in content:
        pattern = rf"(<loc>{re.escape(target)}</loc>\s*<lastmod>)[^<]*(</lastmod>)"
        content = re.sub(pattern, rf"\g<1>{date_iso}\g<2>", content)
    else:
        block = (
            "  <url>\n"
            f"    <loc>{target}</loc>\n"
            f"    <lastmod>{date_iso}</lastmod>\n"
            "    <changefreq>monthly</changefreq>\n"
            "    <priority>0.8</priority>\n"
            "  </url>\n"
        )
        content = content.replace("</urlset>", block + "</urlset>")
    atomic_write(path, content)


def update_feed(path: Path, post: dict, date_rfc822: str, atom_style: bool = False) -> None:
    if not path.exists():
        return
    content = path.read_text(encoding="utf-8")
    url = f"{ARTICLE_BASE_URL}{post['id']}"
    content = re.sub(
        rf"\s*<item>[\s\S]*?id={re.escape(post['id'])}[\s\S]*?</item>", "", content
    )
    title = html.escape(post["title"])
    summary = html.escape(post.get("summary", ""))
    category = html.escape(post.get("category", "Blog"))
    guid = f"<guid>{url}</guid>" if atom_style else f'<guid isPermaLink="true">{url}</guid>'
    indent = "    " if atom_style else "  "
    item = (
        f"\n{indent}<item>\n"
        f"{indent}  <title>{title}</title>\n"
        f"{indent}  <link>{url}</link>\n"
        f"{indent}  {guid}\n"
        f"{indent}  <pubDate>{date_rfc822}</pubDate>\n"
        + ("" if atom_style else f"{indent}  <category>{category}</category>\n")
        + f"{indent}  <description>{summary}</description>\n"
        f"{indent}</item>"
    )
    content = re.sub(r"<lastBuildDate>.*?</lastBuildDate>", f"<lastBuildDate>{date_rfc822}</lastBuildDate>", content)
    if "<atom:link" in content:
        content = re.sub(r"(<atom:link[^>]*/>)", r"\1" + item, content, count=1)
    elif "<language>" in content:
        content = re.sub(r"(<language>[^<]*</language>)", r"\1" + item, content, count=1)
    else:
        content = content.replace("<channel>", "<channel>" + item)
    atomic_write(path, content)


def publish_post(payload: dict) -> dict:
    title = str(payload.get("title", "")).strip()
    post_id = slugify(str(payload.get("id", "")))
    if not title or not post_id:
        raise ValueError("Title and slug are required")
    if post_id != str(payload.get("id", "")).strip():
        raise ValueError("Slug may contain lowercase letters, numbers, and hyphens only")

    now = dt.datetime.now()
    date_display = now.strftime("%B %d, %Y")
    markdown = compose_markdown(payload, date_display)
    article_path = BLOG_DIR / post_id / "article.md"
    atomic_write(article_path, markdown)

    post = {
        "id": post_id,
        "title": title,
        "date": date_display,
        "readTime": payload.get("readTime") or estimate_read_time(payload.get("content", "")),
        "category": payload.get("category") or "AI Exploration",
        "summary": payload.get("summary", ""),
        "url": f"article.html?id={post_id}",
        "tags": payload.get("tags") or ["Codex"],
        "featured": bool(payload.get("featured", False)),
    }
    if payload.get("series"):
        post.update({
            "series": payload["series"],
            "seriesTitle": payload.get("seriesTitle") or payload["series"],
            "chapter": int(payload.get("chapter") or 1),
        })
    if payload.get("experimentResult"):
        post["experimentResult"] = payload["experimentResult"]

    posts = [item for item in load_posts() if item.get("id") != post_id]
    posts.insert(0, post)
    atomic_write(POSTS_PATH, json.dumps(posts, indent=2, ensure_ascii=False) + "\n")

    date_rfc822 = now.strftime("%a, %d %b %Y 12:00:00 GMT")
    update_feed(REPO_ROOT / "rss.xml", post, date_rfc822)
    update_feed(REPO_ROOT / "feed.xml", post, date_rfc822, atom_style=True)
    update_feed(BLOG_DIR / "rss.xml", post, date_rfc822)
    update_sitemap(post_id, now.strftime("%Y-%m-%d"))
    return {"post": post, "path": article_path, "url": f"{ARTICLE_BASE_URL}{post_id}"}


def git_publish(title: str) -> tuple[bool, str]:
    commands = [
        ["git", "add", "Blog/", "rss.xml", "feed.xml", "sitemap.xml"],
        ["git", "commit", "-m", f"feat(blog): publish {title}"],
        ["git", "push", "origin", "main"],
    ]
    for index, command in enumerate(commands):
        result = subprocess.run(command, cwd=REPO_ROOT, capture_output=True, text=True)
        if index == 1 and result.returncode == 1 and "nothing to commit" in (result.stdout + result.stderr).lower():
            continue
        if result.returncode:
            return False, (result.stderr or result.stdout).strip()
    return True, "Published to origin/main"
