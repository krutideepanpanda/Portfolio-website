const id = new URLSearchParams(location.search).get("id") || "";
const known = [...document.querySelectorAll("[data-article-id]")].find(
  (a) => a.dataset.articleId === id,
);
if (/^[a-z0-9_-]+$/i.test(id) && known) {
  location.replace(known.href + location.hash);
} else {
  document.querySelector("#article-message").textContent =
    "Article unavailable. Choose a published article below.";
}
