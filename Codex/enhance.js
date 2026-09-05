const menu = document.querySelector("[data-menu]");
const nav = document.querySelector("#site-nav");
if (menu && nav) {
  menu.hidden = false;
  document.documentElement.classList.add("enhanced");
  const close = () => {
    menu.setAttribute("aria-expanded", "false");
    nav.classList.remove("open");
  };
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("open", open);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
      close();
      menu.focus();
    }
  });
  matchMedia("(min-width: 1100px)").addEventListener("change", close);
}
const search = document.querySelector("[data-repo-search]");
const language = document.querySelector("[data-repo-language]");
if (search && language) {
  document.querySelector("[data-repo-controls]").hidden = false;
  const cards = [...document.querySelectorAll("[data-repository]")];
  const filter = () => {
    let count = 0;
    for (const card of cards) {
      const visible =
        (card.textContent + " " + card.dataset.topics)
          .toLowerCase()
          .includes(search.value.trim().toLowerCase()) &&
        (!language.value || card.dataset.language === language.value);
      card.hidden = !visible;
      if (visible) count++;
    }
    document.querySelector("[data-repo-count]").textContent =
      `${count} ${count === 1 ? "repository" : "repositories"}`;
    document.querySelector("[data-repo-empty]").hidden = count !== 0;
  };
  search.addEventListener("input", filter);
  language.addEventListener("change", filter);
}
const copy = document.querySelector("[data-copy-email]");
if (copy && navigator.clipboard) {
  copy.hidden = false;
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("krutideepan123@gmail.com");
      document.querySelector("[data-copy-status]").textContent =
        "Email address copied.";
    } catch {
      document.querySelector("[data-copy-status]").textContent =
        "Please select the email address to copy it.";
    }
  });
}
