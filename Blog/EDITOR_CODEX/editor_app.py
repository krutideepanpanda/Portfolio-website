"""Codex Blog Studio — a Windows-native Markdown writing and publishing app."""

from __future__ import annotations

import re
import threading
import tkinter as tk
from tkinter import messagebox, ttk
import webbrowser

from publishing import (
    estimate_read_time,
    git_publish,
    load_posts,
    metadata_options,
    parse_article,
    publish_post,
    save_draft,
    slugify,
)


PAPER = "#f3efe6"
CREAM = "#fffaf0"
INK = "#171714"
MUTED = "#67645d"
BLUE = "#1746d1"
ORANGE = "#e0572f"
LINE = "#c9c1b4"


class CodexBlogStudio(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("Codex Blog Studio")
        self.geometry("1480x900")
        self.minsize(1080, 700)
        self.configure(bg=PAPER)
        self.option_add("*Font", "{Segoe UI} 10")
        self.protocol("WM_DELETE_WINDOW", self.on_close)
        self.slug_is_manual = False
        self.preview_job: str | None = None
        self.post_lookup: dict[str, str] = {}
        self.series_lookup: dict[str, dict] = {}
        self._configure_theme()
        self._build_ui()
        self._bind_shortcuts()
        self.refresh_library()
        self.new_post()

    def _configure_theme(self) -> None:
        style = ttk.Style(self)
        if "vista" in style.theme_names():
            style.theme_use("vista")
        style.configure("Studio.TFrame", background=PAPER)
        style.configure("Panel.TFrame", background=CREAM)
        style.configure("Top.TFrame", background=INK)
        style.configure("Top.TLabel", background=INK, foreground="#ffffff", font=("Segoe UI Semibold", 10))
        style.configure("Meta.TLabel", background=CREAM, foreground=MUTED, font=("Segoe UI Semibold", 9))
        style.configure("Title.TLabel", background=PAPER, foreground=INK, font=("Segoe UI Semibold", 15))
        style.configure("Accent.TButton", font=("Segoe UI Semibold", 10))
        style.configure("Status.TLabel", background=PAPER, foreground=MUTED, font=("Consolas", 9))

    def _build_ui(self) -> None:
        top = ttk.Frame(self, style="Top.TFrame", padding=(18, 12))
        top.pack(fill="x")
        ttk.Label(top, text="KDP / CODEX BLOG STUDIO", style="Top.TLabel").pack(side="left")
        ttk.Label(top, text="Native Markdown workspace", style="Top.TLabel").pack(side="left", padx=(20, 0))

        self.open_var = tk.StringVar()
        self.open_combo = ttk.Combobox(top, textvariable=self.open_var, state="readonly", width=34)
        self.open_combo.pack(side="left", padx=(35, 8))
        self.open_combo.bind("<<ComboboxSelected>>", self.open_selected)
        ttk.Button(top, text="New", command=self.new_post).pack(side="left", padx=4)
        ttk.Button(top, text="Save draft", command=self.save_current_draft).pack(side="right", padx=4)
        ttk.Button(top, text="Publish & push", command=lambda: self.publish(push=True), style="Accent.TButton").pack(side="right", padx=4)
        ttk.Button(top, text="Publish locally", command=lambda: self.publish(push=False)).pack(side="right", padx=4)

        body = ttk.Frame(self, style="Studio.TFrame", padding=16)
        body.pack(fill="both", expand=True)
        body.columnconfigure(0, weight=1)
        body.rowconfigure(0, weight=1)

        work = ttk.Frame(body, style="Studio.TFrame")
        work.grid(row=0, column=0, sticky="nsew", padx=(0, 14))
        work.columnconfigure(0, weight=1)
        work.rowconfigure(4, weight=1)

        self.title_var = tk.StringVar()
        self.title_entry = tk.Entry(work, textvariable=self.title_var, bg=PAPER, fg=INK, bd=0,
                                    insertbackground=INK, font=("Segoe UI Semibold", 28))
        self.title_entry.grid(row=0, column=0, sticky="ew", pady=(4, 2))
        self.title_entry.bind("<KeyRelease>", self.on_title_change)

        slug_row = ttk.Frame(work, style="Studio.TFrame")
        slug_row.grid(row=1, column=0, sticky="ew", pady=(0, 12))
        ttk.Label(slug_row, text="krutideepanpanda.com/Codex/article.html?id=", style="Status.TLabel").pack(side="left")
        self.slug_var = tk.StringVar()
        self.slug_entry = tk.Entry(slug_row, textvariable=self.slug_var, bg=PAPER, fg=BLUE, bd=0,
                                   insertbackground=INK, font=("Consolas", 9))
        self.slug_entry.pack(side="left", fill="x", expand=True)
        self.slug_entry.bind("<KeyRelease>", lambda _event: setattr(self, "slug_is_manual", True))

        toolbar = ttk.Frame(work, style="Studio.TFrame")
        toolbar.grid(row=2, column=0, sticky="ew", pady=(0, 8))
        tools = [
            ("H2", lambda: self.prefix_lines("## ")), ("H3", lambda: self.prefix_lines("### ")),
            ("Bold", lambda: self.wrap_selection("**", "**")), ("Italic", lambda: self.wrap_selection("*", "*")),
            ("Link", lambda: self.wrap_selection("[", "](https://)")), ("Code", lambda: self.wrap_selection("`", "`")),
            ("Quote", lambda: self.prefix_lines("> ")), ("List", lambda: self.prefix_lines("- ")),
            ("Rule", lambda: self.insert_text("\n---\n")),
        ]
        for label, command in tools:
            ttk.Button(toolbar, text=label, command=command).pack(side="left", padx=(0, 5))
        self.read_time_live = ttk.Label(toolbar, text="1 min read", style="Status.TLabel")
        self.read_time_live.pack(side="right")

        labels = ttk.Frame(work, style="Studio.TFrame")
        labels.grid(row=3, column=0, sticky="ew")
        labels.columnconfigure((0, 1), weight=1)
        ttk.Label(labels, text="MARKDOWN", style="Meta.TLabel").grid(row=0, column=0, sticky="w")
        ttk.Label(labels, text="RENDERED PREVIEW", style="Meta.TLabel").grid(row=0, column=1, sticky="w", padx=(10, 0))

        panes = ttk.Panedwindow(work, orient="horizontal")
        panes.grid(row=4, column=0, sticky="nsew")
        editor_frame = ttk.Frame(panes, style="Panel.TFrame")
        preview_frame = ttk.Frame(panes, style="Panel.TFrame")
        panes.add(editor_frame, weight=1)
        panes.add(preview_frame, weight=1)

        self.editor = tk.Text(editor_frame, wrap="word", undo=True, maxundo=-1, width=1, bg=CREAM, fg=INK,
                              insertbackground=INK, relief="solid", bd=1, padx=22, pady=20,
                              font=("Cascadia Mono", 11), selectbackground=BLUE, selectforeground="#ffffff")
        editor_scroll = ttk.Scrollbar(editor_frame, command=self.editor.yview)
        self.editor.configure(yscrollcommand=editor_scroll.set)
        editor_scroll.pack(side="right", fill="y")
        self.editor.pack(fill="both", expand=True)
        self.editor.bind("<<Modified>>", self.on_editor_modified)

        self.preview = tk.Text(preview_frame, wrap="word", state="disabled", width=1, bg=CREAM, fg=INK,
                               relief="solid", bd=1, padx=28, pady=24, cursor="arrow")
        preview_scroll = ttk.Scrollbar(preview_frame, command=self.preview.yview)
        self.preview.configure(yscrollcommand=preview_scroll.set)
        preview_scroll.pack(side="right", fill="y")
        self.preview.pack(fill="both", expand=True)
        self._configure_preview_tags()

        inspector = ttk.Frame(body, style="Panel.TFrame", padding=18, width=330)
        inspector.grid(row=0, column=1, sticky="nsew")
        inspector.grid_propagate(False)
        inspector.columnconfigure(0, weight=1)
        ttk.Label(inspector, text="ARTICLE DETAILS", style="Title.TLabel").grid(row=0, column=0, sticky="w", pady=(0, 18))

        self.category_var = tk.StringVar(value="AI Exploration")
        self.tags_var = tk.StringVar(value="Codex, AI Exploration")
        self.summary_var = tk.StringVar()
        self.read_time_var = tk.StringVar(value="Auto")
        self.result_var = tk.StringVar(value="")
        self.series_var = tk.StringVar(value="codex-chapter")
        self.series_title_var = tk.StringVar(value="Codex chapter")
        self.chapter_var = tk.StringVar(value="1")

        row = 1
        self.category_combo = self.field(inspector, row, "Category", self.category_var, combo=True); row += 2
        self.field(inspector, row, "Tags — comma separated", self.tags_var); row += 2
        self.field(inspector, row, "Summary", self.summary_var); row += 2
        self.field(inspector, row, "Read time — Auto or custom", self.read_time_var); row += 2
        self.result_combo = self.field(inspector, row, "Experiment result", self.result_var, combo=True,
                                       values=("", "PASS", "FAIL")); row += 2
        ttk.Separator(inspector).grid(row=row, column=0, sticky="ew", pady=14); row += 1
        ttk.Label(inspector, text="CHAPTER", style="Title.TLabel").grid(row=row, column=0, sticky="w", pady=(0, 10)); row += 1
        self.series_combo = self.field(inspector, row, "Chapter ID", self.series_var, combo=True); row += 2
        self.field(inspector, row, "Chapter title", self.series_title_var); row += 2
        self.field(inspector, row, "Entry number", self.chapter_var); row += 2
        ttk.Label(inspector, text="Posts created here default to the Codex chapter. Select an existing chapter to continue its numbering.",
                  style="Meta.TLabel", wraplength=285, justify="left").grid(row=row, column=0, sticky="ew", pady=(8, 0))
        self.series_combo.bind("<<ComboboxSelected>>", self.on_series_selected)

        self.status_var = tk.StringVar(value="Ready")
        status = ttk.Label(self, textvariable=self.status_var, style="Status.TLabel", anchor="w", padding=(16, 8))
        status.pack(fill="x")

    def field(self, parent, row, label, variable, combo=False, values=()):
        ttk.Label(parent, text=label.upper(), style="Meta.TLabel").grid(row=row, column=0, sticky="w", pady=(7, 4))
        if combo:
            widget = ttk.Combobox(parent, textvariable=variable, values=values)
        else:
            widget = ttk.Entry(parent, textvariable=variable)
        widget.grid(row=row + 1, column=0, sticky="ew", ipady=4)
        return widget

    def _configure_preview_tags(self) -> None:
        self.preview.tag_configure("h1", font=("Segoe UI Semibold", 26), spacing1=18, spacing3=12)
        self.preview.tag_configure("h2", font=("Segoe UI Semibold", 20), foreground=BLUE, spacing1=18, spacing3=8)
        self.preview.tag_configure("h3", font=("Segoe UI Semibold", 15), spacing1=14, spacing3=6)
        self.preview.tag_configure("body", font=("Segoe UI", 11), spacing3=8)
        self.preview.tag_configure("quote", font=("Georgia", 12, "italic"), foreground=MUTED, lmargin1=22, lmargin2=22, spacing3=10)
        self.preview.tag_configure("code", font=("Cascadia Mono", 10), background="#ece6da", lmargin1=14, lmargin2=14, spacing1=6, spacing3=6)
        self.preview.tag_configure("list", font=("Segoe UI", 11), lmargin1=20, lmargin2=38, spacing3=4)
        self.preview.tag_configure("rule", foreground=LINE, justify="center", spacing1=10, spacing3=10)

    def _bind_shortcuts(self) -> None:
        self.bind_all("<Control-s>", lambda _event: self.save_current_draft())
        self.bind_all("<Control-Shift-P>", lambda _event: self.publish(push=False))
        self.bind_all("<Control-b>", lambda _event: self.wrap_selection("**", "**"))
        self.bind_all("<Control-i>", lambda _event: self.wrap_selection("*", "*"))

    def refresh_library(self) -> None:
        posts = load_posts()
        self.post_lookup = {f"{post.get('title', 'Untitled')}  ·  {post.get('id', '')}": post.get("id", "") for post in posts}
        self.open_combo["values"] = list(self.post_lookup)
        options = metadata_options()
        self.category_combo["values"] = options["categories"]
        self.series_lookup = {item["id"]: item for item in options["series"]}
        series_ids = list(self.series_lookup)
        if "codex-chapter" not in series_ids:
            series_ids.insert(0, "codex-chapter")
        self.series_combo["values"] = series_ids

    def new_post(self) -> None:
        self.title_var.set("")
        self.slug_var.set("")
        self.slug_is_manual = False
        self.editor.delete("1.0", "end")
        self.editor.insert("1.0", "Begin with the part worth remembering.\n")
        self.category_var.set("AI Exploration")
        self.tags_var.set("Codex, AI Exploration")
        self.summary_var.set("")
        self.read_time_var.set("Auto")
        self.result_var.set("")
        self.series_var.set("codex-chapter")
        self.series_title_var.set("Codex chapter")
        existing = self.series_lookup.get("codex-chapter", {})
        self.chapter_var.set(str(int(existing.get("latestChapter", 0)) + 1))
        self.status_var.set("New Codex chapter draft")
        self.title_entry.focus_set()
        self.schedule_preview()

    def open_selected(self, _event=None) -> None:
        post_id = self.post_lookup.get(self.open_var.get())
        if not post_id:
            return
        try:
            post = parse_article(post_id)
        except Exception as error:
            messagebox.showerror("Could not open post", str(error), parent=self)
            return
        self.title_var.set(post.get("title", ""))
        self.slug_var.set(post_id)
        self.slug_is_manual = True
        self.editor.delete("1.0", "end")
        self.editor.insert("1.0", post.get("content", ""))
        self.category_var.set(post.get("category", "AI Exploration"))
        self.tags_var.set(", ".join(post.get("tags", [])))
        self.summary_var.set(post.get("summary", ""))
        self.read_time_var.set(post.get("readTime", "Auto"))
        self.result_var.set(post.get("experimentResult", ""))
        self.series_var.set(post.get("series", ""))
        self.series_title_var.set(post.get("seriesTitle", ""))
        self.chapter_var.set(str(post.get("chapter", "")))
        self.status_var.set(f"Opened {post_id}")
        self.schedule_preview()

    def on_title_change(self, _event=None) -> None:
        if not self.slug_is_manual:
            self.slug_var.set(slugify(self.title_var.get()))

    def on_series_selected(self, _event=None) -> None:
        found = self.series_lookup.get(self.series_var.get())
        if found:
            self.series_title_var.set(found["title"])
            self.chapter_var.set(str(int(found["latestChapter"]) + 1))
        elif self.series_var.get() == "codex-chapter":
            self.series_title_var.set("Codex chapter")

    def on_editor_modified(self, _event=None) -> None:
        if not self.editor.edit_modified():
            return
        self.editor.edit_modified(False)
        markdown = self.editor.get("1.0", "end-1c")
        self.read_time_live.configure(text=estimate_read_time(markdown))
        self.status_var.set("Editing · draft not saved")
        self.schedule_preview()

    def schedule_preview(self) -> None:
        if self.preview_job:
            self.after_cancel(self.preview_job)
        self.preview_job = self.after(180, self.render_preview)

    def render_preview(self) -> None:
        self.preview_job = None
        markdown = self.editor.get("1.0", "end-1c")
        self.preview.configure(state="normal")
        self.preview.delete("1.0", "end")
        in_code = False
        for line in markdown.splitlines():
            stripped = line.strip()
            if stripped.startswith("```"):
                in_code = not in_code
                continue
            if in_code:
                self.preview.insert("end", line + "\n", "code")
            elif line.startswith("### "):
                self.preview.insert("end", self.inline_text(line[4:]) + "\n", "h3")
            elif line.startswith("## "):
                self.preview.insert("end", self.inline_text(line[3:]) + "\n", "h2")
            elif line.startswith("# "):
                self.preview.insert("end", self.inline_text(line[2:]) + "\n", "h1")
            elif line.startswith("> "):
                self.preview.insert("end", self.inline_text(line[2:]) + "\n", "quote")
            elif re.match(r"^\s*[-*+]\s+", line):
                self.preview.insert("end", "• " + self.inline_text(re.sub(r"^\s*[-*+]\s+", "", line)) + "\n", "list")
            elif re.match(r"^\s*\d+\.\s+", line):
                self.preview.insert("end", self.inline_text(line) + "\n", "list")
            elif stripped == "---":
                self.preview.insert("end", "────────────────────────\n", "rule")
            else:
                self.preview.insert("end", self.inline_text(line) + "\n", "body")
        self.preview.configure(state="disabled")

    @staticmethod
    def inline_text(text: str) -> str:
        text = re.sub(r"!\[([^]]*)\]\([^)]*\)", r"[Image: \1]", text)
        text = re.sub(r"\[([^]]+)\]\([^)]+\)", r"\1 ↗", text)
        return re.sub(r"[*_`~]", "", text)

    def selected_range(self):
        try:
            return self.editor.index("sel.first"), self.editor.index("sel.last")
        except tk.TclError:
            return self.editor.index("insert"), self.editor.index("insert")

    def wrap_selection(self, before: str, after: str) -> None:
        start, end = self.selected_range()
        selected = self.editor.get(start, end)
        self.editor.delete(start, end)
        self.editor.insert(start, before + selected + after)
        self.editor.mark_set("insert", f"{start}+{len(before) + len(selected)}c")
        self.editor.focus_set()

    def prefix_lines(self, prefix: str) -> None:
        start, end = self.selected_range()
        start_line = int(start.split(".")[0])
        end_line = int(end.split(".")[0])
        for line in range(start_line, end_line + 1):
            self.editor.insert(f"{line}.0", prefix)
        self.editor.focus_set()

    def insert_text(self, text: str) -> None:
        self.editor.insert("insert", text)
        self.editor.focus_set()

    def payload(self) -> dict:
        read_time = self.read_time_var.get().strip()
        content = self.editor.get("1.0", "end-1c")
        tags = [tag.strip() for tag in self.tags_var.get().split(",") if tag.strip()]
        return {
            "id": self.slug_var.get().strip(), "title": self.title_var.get().strip(), "content": content,
            "category": self.category_var.get().strip(), "tags": tags,
            "summary": self.summary_var.get().strip(),
            "readTime": estimate_read_time(content) if not read_time or read_time.lower() == "auto" else read_time,
            "series": self.series_var.get().strip(), "seriesTitle": self.series_title_var.get().strip(),
            "chapter": self.chapter_var.get().strip() or "1", "experimentResult": self.result_var.get().strip(),
        }

    def save_current_draft(self) -> None:
        try:
            path = save_draft(self.payload())
            self.status_var.set(f"Draft saved · {path.name}")
        except Exception as error:
            messagebox.showerror("Draft not saved", str(error), parent=self)

    def publish(self, push: bool) -> None:
        payload = self.payload()
        if not payload["title"] or not payload["id"]:
            messagebox.showwarning("Missing details", "Add a title and slug before publishing.", parent=self)
            return
        action = "publish this article and push it to origin/main" if push else "publish this article to the local shared blog"
        if not messagebox.askyesno("Confirm publish", f"Ready to {action}?\n\n{payload['title']}", parent=self):
            return
        self.status_var.set("Publishing…")
        self.config(cursor="wait")

        def worker():
            try:
                result = publish_post(payload)
                if push:
                    ok, message = git_publish(payload["title"])
                    if not ok:
                        raise RuntimeError(f"Saved locally, but Git publish failed:\n{message}")
                self.after(0, lambda: self.publish_complete(result, push))
            except Exception as error:
                self.after(0, lambda caught=error: self.publish_failed(caught))

        threading.Thread(target=worker, daemon=True).start()

    def publish_complete(self, result: dict, pushed: bool) -> None:
        self.config(cursor="")
        self.status_var.set("Published to origin/main" if pushed else f"Published locally · {result['path'].name}")
        self.refresh_library()
        if messagebox.askyesno("Article published", "Open the article in your browser?", parent=self):
            webbrowser.open(result["url"])

    def publish_failed(self, error: Exception) -> None:
        self.config(cursor="")
        self.status_var.set("Publish stopped")
        messagebox.showerror("Could not publish", str(error), parent=self)

    def on_close(self) -> None:
        if messagebox.askyesno("Close Codex Blog Studio", "Close the editor? Save a draft first if you want to keep unpublished changes.", parent=self):
            self.destroy()


if __name__ == "__main__":
    app = CodexBlogStudio()
    app.mainloop()
