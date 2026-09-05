const puppeteer = require("puppeteer");
(async () => {
  const { default: lighthouse } = await import("lighthouse");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  try {
    const port = Number(new URL(browser.wsEndpoint()).port);
    for (const route of [
      "index.html",
      "projects.html",
      "articles/google-antigravity-initial-impressions.html",
    ]) {
      const result = await lighthouse(`http://127.0.0.1:4174/Codex/${route}`, {
        port,
        onlyCategories: ["performance", "accessibility"],
        logLevel: "error",
        output: "json",
      });
      const scores = Object.fromEntries(
        Object.entries(result.lhr.categories).map(([key, value]) => [
          key,
          Math.round(value.score * 100),
        ]),
      );
      console.log(JSON.stringify({ route, ...scores }));
      if (scores.performance < 95 || scores.accessibility < 95) {
        console.log(
          JSON.stringify(
            Object.values(result.lhr.audits)
              .filter((a) => a.score !== null && a.score < 0.9)
              .map((a) => ({
                id: a.id,
                title: a.title,
                displayValue: a.displayValue,
              })),
          ),
        );
        process.exitCode = 1;
      }
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
