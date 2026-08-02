import http.server
import socketserver
import json
import os
import datetime
import sys

# Crucial for pythonw: redirect stdout/stderr so nothing crashes when trying to print
sys.stdout = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend.log'), 'w')
sys.stderr = sys.stdout
import urllib.parse

PORT = 8000
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BLOG_DIR = os.path.dirname(SCRIPT_DIR)
POSTS_JSON_PATH = os.path.join(BLOG_DIR, "posts.json")

class EditorHandler(http.server.SimpleHTTPRequestHandler):
    # Disable logging to avoid crashing in pythonw where sys.stderr is None
    def log_message(self, format, *args):
        pass

    def do_POST(self):
        if self.path == '/api/save_post':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                
                post_id = data.get('id', '').strip()
                title = data.get('title', '').strip()
                content = data.get('content', '').strip()
                
                if not post_id or not title:
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(b'{"error": "Title and Post ID are required"}')
                    return
                
                post_dir = os.path.join(BLOG_DIR, post_id)
                if os.path.exists(post_dir):
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(b'{"error": "A post with this ID already exists"}')
                    return
                    
                # 1. Create Directory
                os.makedirs(post_dir)
                
                # 2. Save Markdown Content
                article_path = os.path.join(post_dir, "article.md")
                with open(article_path, "w", encoding="utf-8") as f:
                    f.write(content)
                    
                # 3. Update posts.json
                with open(POSTS_JSON_PATH, "r", encoding="utf-8") as f:
                    posts = json.load(f)
                    
                tags_raw = data.get('tags', '').strip()
                tags_list = [t.strip() for t in tags_raw.split(',')] if tags_raw else []
                
                current_date = datetime.datetime.now().strftime("%B %d, %Y")
                
                new_post = {
                    "id": post_id,
                    "title": title,
                    "date": current_date,
                    "readTime": data.get('readTime', '5 min read').strip() or "5 min read",
                    "category": data.get('category', 'Uncategorized').strip() or "Uncategorized",
                    "summary": data.get('summary', '').strip(),
                    "url": f"article.html?id={post_id}",
                    "tags": tags_list,
                    "featured": False
                }
                
                # Add Series Fields
                if data.get('is_series'):
                    new_post["series"] = data.get('series_id', '').strip()
                    new_post["seriesTitle"] = data.get('series_title', '').strip()
                    chapter_val = data.get('chapter', '').strip()
                    if chapter_val.isdigit():
                        new_post["chapter"] = int(chapter_val)
                    else:
                        new_post["chapter"] = 1
                        
                posts.insert(0, new_post)
                
                with open(POSTS_JSON_PATH, "w", encoding="utf-8") as f:
                    json.dump(posts, f, indent=2)
                    
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"success": true}')
                
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

import urllib.request
import os
import time
import sys
import threading

def launch_browser():
    # Wait a moment for server to start
    time.sleep(0.5)
    # Using 'start' works via cmd shell to find msedge in registry
    res = os.system('start msedge --app="http://127.0.0.1:8000/editor_ui.html"')
    if res != 0:
        os.system('start chrome --app="http://127.0.0.1:8000/editor_ui.html"')

# Check if already running
try:
    if urllib.request.urlopen("http://127.0.0.1:8000/editor_ui.html").getcode() == 200:
        launch_browser()
        sys.exit(0)
except Exception:
    pass

import functools

import traceback

try:
    Handler = functools.partial(EditorHandler, directory=SCRIPT_DIR)
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        # Launch browser in a separate thread so it doesn't block the server
        threading.Thread(target=launch_browser, daemon=True).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
except Exception as e:
    with open(os.path.join(SCRIPT_DIR, "CRASH.txt"), "w") as f:
        f.write(traceback.format_exc())
