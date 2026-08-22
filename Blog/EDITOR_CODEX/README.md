# Codex Blog Studio

A Windows-native Markdown editor and publisher for the shared portfolio blog. It uses Python's built-in Tkinter UI rather than a browser shell or local web server.

## Launch

Double-click `Launch_Editor.bat`.

## What it does

- Writes Markdown with a live rendered preview and formatting toolbar.
- Opens and updates existing posts from `Blog/posts.json`.
- Defaults new writing to the **Codex chapter** and continues existing chapter numbering.
- Saves private working drafts inside `EDITOR_CODEX/drafts/`.
- Publishes `Blog/<slug>/article.md`, updates `posts.json`, RSS feeds, and the sitemap.
- Offers separate **Publish locally** and confirmed **Publish & push** actions.

The Antigravity editor and `/Antigravity/` portfolio are not modified by this app.
