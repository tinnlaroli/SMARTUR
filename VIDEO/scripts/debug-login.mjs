import puppeteer from "puppeteer";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(__dirname, "debug"), { recursive: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const snap  = async (page, name) => {
  await page.screenshot({ path: join(__dirname, `debug/${name}.png`) });
  console.log(`  📷  debug/${name}.png`);
};

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Intercepta TODAS las respuestas
  page.on("response", async (res) => {
    const url = res.url();
    const status = res.status();
    // Muestra TODOS los 4xx/5xx + cualquier /api/ call
    if (status >= 400 || url.includes("/api/") || url.includes("/auth") || url.includes("login")) {
      const body = await res.text().catch(() => "(no body)");
      console.log(`[${status}] ${res.request().method()} ${url}`);
      if (body && body.length < 1000 && !body.includes("sourceMappingURL")) {
        console.log(`    BODY: ${body.slice(0, 300)}`);
      }
    }
  });

  // Carga la landing y espera al loader
  await page.goto("http://localhost:5173", { waitUntil: "load", timeout: 30000 });
  await page.waitForFunction(() => !document.querySelector(".welltur-loader-overlay"), { timeout: 30000 });
  await page.waitForFunction(
    () => { const btn = document.querySelector(".btn-premium"); const r = btn?.getBoundingClientRect(); return r && r.width > 0; },
    { timeout: 15000 }
  );
  await sleep(500);
  await snap(page, "0-ready");

  // Login
  await page.evaluate(() => document.querySelector(".btn-premium")?.click());
  await sleep(3000);
  await snap(page, "1-modal");

  const hasModal = await page.evaluate(() => !!document.querySelector("#user-email"));
  console.log("¿Modal abierto?", hasModal);

  if (hasModal) {
    await page.type("#user-email", "martinlaraolivares@gmail.com", { delay: 40 });
    await page.type("#user-password", "Password1a", { delay: 40 });
    await snap(page, "2-filled");
    await page.click("button[type='submit']");
    await sleep(5000);
    await snap(page, "3-after-submit");
    console.log("URL después de login:", page.url());

    // Verifica localStorage / sessionStorage
    const storage = await page.evaluate(() => {
      const ls = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        ls[k] = localStorage.getItem(k)?.slice(0, 100);
      }
      return ls;
    });
    console.log("localStorage keys:", Object.keys(storage));
  } else {
    console.log("Modal NO abierto — el click no funcionó");
    await snap(page, "2-no-modal");
  }

  await browser.close();
})();
