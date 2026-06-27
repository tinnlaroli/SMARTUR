/**
 * capture-recordings.mjs
 * Captura screenshots en MODO CLARO + grabaciones WebM interactivas.
 * Usa request interception para que los JWTs nunca expiren en el browser.
 *
 * node scripts/capture-recordings.mjs
 */
import puppeteer from "puppeteer";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

// Inyecta ffmpeg-static en PATH para que page.screencast() lo encuentre
const require = createRequire(import.meta.url);
const ffmpegPath = require("ffmpeg-static");
process.env.PATH = dirname(ffmpegPath) + ";" + (process.env.PATH || "");

const __dirname = dirname(fileURLToPath(import.meta.url));
const SS_OUT  = join(__dirname, "../public/screenshots");
const REC_OUT = join(__dirname, "../public/recordings");
[SS_OUT, REC_OUT].forEach(d => !existsSync(d) && mkdirSync(d, { recursive: true }));

const BASE  = "http://localhost:5173";
const VP    = { width: 1440, height: 900, deviceScaleFactor: 2 };
const VP1X  = { width: 1440, height: 900, deviceScaleFactor: 1 }; // para recordings (archivos más pequeños)
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Sessions ─────────────────────────────────────────────────────────────────
const ADMIN_SESSION = {
  jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJtYXJ0aW5sYXJhb2xpdmFyZXNAZ21haWwuY29tIiwicm9sZV9pZCI6MSwiaWF0IjoxNzgyMjQxODc4LCJleHAiOjE3ODIyNDI3Nzh9.-T5uSleSpRRmqENBPsXy0xVNhTi01wojj7UcAWpQDPk",
  refreshToken: "6da055c2433d150a2745697eed70e08fdee1edb599030b8b6544b82e66d344978da24222f387d410",
  user: { id: 1, name: "Admin SMARTUR", email: "martinlaraolivares@gmail.com", role_id: 1, photo_url: null, avatar_icon_key: "admin", id_company: null },
};

const EMPRESA_SESSION = {
  jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsImVtYWlsIjoiY2FmZWNlbmNhbGxpQGdtYWlsLmNvbSIsInJvbGVfaWQiOjMsImlkX2NvbXBhbnkiOjIzLCJpYXQiOjE3ODIyNDE4NzgsImV4cCI6MTc4MjI0Mjc3OH0.cp8JmSwSpt1tNmD-LWxP0jyrJAH0naGk9agvXL4ie4Y",
  refreshToken: "0cdf09778cc528839a6e7cd707546d256a82a7afa3878832a8e2178f037702d873ff93ceca97fdd9",
  user: { id: 11, name: "janeth olivares huerta", email: "cafecencalli@gmail.com", role_id: 3, photo_url: null, avatar_icon_key: null, id_company: 23 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function mkPage(browser, session, use1x = false) {
  const page = await browser.newPage();
  await page.setViewport(use1x ? VP1X : VP);

  const expiry = String(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await page.evaluateOnNewDocument((s, exp) => {
    localStorage.setItem("refreshToken",             s.refreshToken);
    localStorage.setItem("welltur:remember",          "true");
    localStorage.setItem("welltur:session_expiry",    exp);
    localStorage.setItem("user",                      JSON.stringify(s.user));
    // MODO CLARO
    localStorage.setItem("welltur-preferences",       JSON.stringify({ theme: "light", lang: "es" }));
    localStorage.setItem("theme",                     "light");
    // Tours vistos
    localStorage.setItem("welltur_dashboard_tour_v2", "done");
    localStorage.setItem("welltur_empresa_tour_v1",   "done");
  }, session, expiry);

  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (req.url().includes("/auth/refresh")) {
      req.respond({ status: 200, contentType: "application/json",
        body: JSON.stringify({ token: session.jwt, refreshToken: session.refreshToken }) });
    } else {
      req.continue();
    }
  });

  return page;
}

async function waitReady(page) {
  await page.waitForFunction(
    () => !document.querySelector(".welltur-loader-overlay") && !document.querySelector(".animate-spin"),
    { timeout: 20000 }
  ).catch(() => {});
  await sleep(2000);
}

async function hideScrollbars(page) {
  await page.addStyleTag({ content: `::-webkit-scrollbar{display:none!important}*{scrollbar-width:none!important}` }).catch(() => {});
}

async function shot(page, id, fullPage = false) {
  await waitReady(page);
  await hideScrollbars(page);
  await page.screenshot({ path: join(SS_OUT, `${id}.png`), fullPage });
  console.log(`  📸  ${id}.png`);
}

async function nav(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: "load", timeout: 30000 });
}

// Smooth scroll via small steps
async function smoothScroll(page, fromY, toY, steps = 12) {
  const delta = (toY - fromY) / steps;
  for (let i = 0; i <= steps; i++) {
    await page.evaluate((y) => window.scrollTo({ top: y }), fromY + delta * i);
    await sleep(80);
  }
}

async function hover(page, x, y) {
  await page.mouse.move(x, y, { steps: 8 });
  await sleep(300);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--lang=es-MX"],
  });

  try {
    // ── Landing ────────────────────────────────────────────────────────────
    console.log("\n📸  landing-b2b...");
    {
      const p = await browser.newPage();
      await p.setViewport(VP);
      await p.goto(BASE, { waitUntil: "load" });
      await p.waitForSelector(".welltur-loader-overlay", { timeout: 12000 }).catch(() => {});
      await sleep(8000);
      await p.evaluate(() => document.querySelector(".welltur-loader-overlay")?.remove());
      await sleep(1500);
      await hideScrollbars(p);
      await p.screenshot({ path: join(SS_OUT, "landing-b2b.png") });
      console.log("  ✅  landing-b2b.png");
      await p.close();
    }

    // ── Admin screenshots (modo claro) ─────────────────────────────────────
    console.log("\n🔐  Admin – modo claro...");
    {
      const admin = await mkPage(browser, ADMIN_SESSION);

      // admin-home (full page para scroll animation)
      await nav(admin, "/dashboard");
      await shot(admin, "admin-home", false);

      // admin-aprobacion
      await nav(admin, "/dashboard/aprobacion");
      await shot(admin, "admin-aprobacion");

      // admin-cedulas (full page)
      await nav(admin, "/dashboard/verificaciones-empresa");
      await shot(admin, "admin-cedulas", false);

      await admin.close();
    }

    // ── Admin grabaciones ──────────────────────────────────────────────────
    console.log("\n🎥  Admin dashboard – grabando...");
    {
      const page = await mkPage(browser, ADMIN_SESSION, true); // 1x para video
      await nav(page, "/dashboard");
      await waitReady(page);
      await hideScrollbars(page);

      const rec = await page.screencast({ path: join(REC_OUT, "admin-dashboard.webm") });
      await sleep(600);
      await hover(page, 380, 130);   // hover KPI "Score promedio"
      await sleep(500);
      await hover(page, 640, 130);   // hover KPI "Evaluaciones"
      await sleep(500);
      await hover(page, 900, 130);   // hover KPI "Usuarios activos"
      await sleep(500);
      await smoothScroll(page, 0, 350);
      await sleep(1200);
      await smoothScroll(page, 350, 0);
      await sleep(600);
      await rec.stop();
      console.log("  ✅  admin-dashboard.webm");
      await page.close();
    }

    console.log("\n🎥  Admin cédulas – grabando...");
    {
      const page = await mkPage(browser, ADMIN_SESSION, true);
      await nav(page, "/dashboard/verificaciones-empresa");
      await waitReady(page);
      await hideScrollbars(page);

      const rec = await page.screencast({ path: join(REC_OUT, "admin-cedulas.webm") });
      await sleep(600);
      await hover(page, 720, 210);   // hover fila cencali
      await sleep(700);
      await hover(page, 1050, 210);  // hover estado "Activa"
      await sleep(800);
      await hover(page, 720, 240);   // hover fila tinn
      await sleep(600);
      await smoothScroll(page, 0, 200);
      await sleep(800);
      await rec.stop();
      console.log("  ✅  admin-cedulas.webm");
      await page.close();
    }

    // ── Empresa screenshots (modo claro) ───────────────────────────────────
    console.log("\n🔐  Empresa – modo claro...");
    {
      const emp = await mkPage(browser, EMPRESA_SESSION);

      await nav(emp, "/empresa/dashboard");
      await shot(emp, "empresa-dashboard");

      await nav(emp, "/empresa/calendario");
      await shot(emp, "empresa-agenda");

      await emp.close();
    }

    // ── Empresa grabaciones ────────────────────────────────────────────────
    console.log("\n🎥  Empresa dashboard – grabando...");
    {
      const page = await mkPage(browser, EMPRESA_SESSION, true);
      await nav(page, "/empresa/dashboard");
      await waitReady(page);
      await hideScrollbars(page);

      const rec = await page.screencast({ path: join(REC_OUT, "empresa-dashboard.webm") });
      await sleep(600);
      await hover(page, 240, 130);   // KPI Recomendaciones
      await sleep(600);
      await hover(page, 440, 130);   // KPI Favoritos
      await sleep(600);
      await hover(page, 640, 130);   // KPI Visitas
      await sleep(600);
      await hover(page, 840, 130);   // KPI Servicios activos
      await sleep(600);
      await smoothScroll(page, 0, 250);
      await sleep(900);
      await rec.stop();
      console.log("  ✅  empresa-dashboard.webm");
      await page.close();
    }

    console.log("\n🎥  Empresa agenda – grabando...");
    {
      const page = await mkPage(browser, EMPRESA_SESSION, true);
      await nav(page, "/empresa/calendario");
      await waitReady(page);
      await hideScrollbars(page);

      const rec = await page.screencast({ path: join(REC_OUT, "empresa-agenda.webm") });
      await sleep(700);
      await hover(page, 500, 280);   // hover día en el calendario
      await sleep(600);
      await hover(page, 580, 310);   // otro día
      await sleep(500);
      await hover(page, 620, 68);    // hover botón "Visita directa"
      await sleep(700);
      await page.mouse.click(620, 68);
      await sleep(600);
      await rec.stop();
      console.log("  ✅  empresa-agenda.webm");
      await page.close();
    }

  } finally {
    await browser.close();
  }

  console.log("\n✅  Todo listo.");
  console.log(`   Screenshots → ${SS_OUT}`);
  console.log(`   Recordings  → ${REC_OUT}`);
})();
