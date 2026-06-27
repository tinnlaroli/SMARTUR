/**
 * Captura screenshots reales del PLATAFORMA.
 * node scripts/capture-screens.mjs
 *
 * Estrategia:
 * 1. evaluateOnNewDocument → inyecta refreshToken + user en localStorage ANTES de React
 * 2. setRequestInterception → intercepta /auth/refresh y devuelve el JWT real sin consumir el token
 *    Esto hace que SessionGate.initSession() obtenga un accessToken válido en memoria
 *    sin rotar jamás el refreshToken de localStorage.
 */
import puppeteer from "puppeteer";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../public/screenshots");
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const BASE  = "http://localhost:5173";
const VP    = { width: 1440, height: 900, deviceScaleFactor: 2 };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Sesiones con JWT real + refreshToken ─────────────────────────────────────
const ADMIN_SESSION = {
  jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJtYXJ0aW5sYXJhb2xpdmFyZXNAZ21haWwuY29tIiwicm9sZV9pZCI6MSwiaWF0IjoxNzgyMjQwMjA5LCJleHAiOjE3ODIyNDExMDl9.zYG3wry9SjGWnKdAsdrr72p80qfDLT1ImdiIiYa0Bjw",
  refreshToken: "ff823a8994ee424068d82d02f4234a1ea41876c70946a50f24e03c5aa2bf029edfb43b41557c4eb4",
  user: { id: 1, name: "Admin SMARTUR", email: "martinlaraolivares@gmail.com", role_id: 1, photo_url: null, avatar_icon_key: "admin", id_company: null },
};

const EMPRESA_SESSION = {
  jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsImVtYWlsIjoiY2FmZWNlbmNhbGxpQGdtYWlsLmNvbSIsInJvbGVfaWQiOjMsImlkX2NvbXBhbnkiOjIzLCJpYXQiOjE3ODIyNDAyMDksImV4cCI6MTc4MjI0MTEwOX0.Yu1u35vsE3BEr-LF-Yh4jVXmM6XpjttSpu5JFKyRe74",
  refreshToken: "f45048c0b4c6679e48b34bda641151fbcd6baf9c4f0f7952b483c2a67bbcf7d3417d152d8f9bfe1b",
  user: { id: 11, name: "janeth olivares huerta", email: "cafecencalli@gmail.com", role_id: 3, photo_url: null, avatar_icon_key: null, id_company: 23 },
};

// ─── Crea página autenticada con intercepción de /auth/refresh ────────────────
async function authPage(browser, session) {
  const page = await browser.newPage();
  await page.setViewport(VP);

  const expiry = String(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Inyecta auth + tours vistos en localStorage ANTES de que React arranque
  await page.evaluateOnNewDocument((s, exp) => {
    localStorage.setItem("refreshToken",             s.refreshToken);
    localStorage.setItem("welltur:remember",          "true");
    localStorage.setItem("welltur:session_expiry",    exp);
    localStorage.setItem("user",                      JSON.stringify(s.user));
    // Marca los tours como vistos para evitar el overlay de bienvenida
    localStorage.setItem("welltur_dashboard_tour_v2", "done");
    localStorage.setItem("welltur_empresa_tour_v1",   "done");
  }, session, expiry);

  // Intercepta /auth/refresh → devuelve JWT real sin consumir el refreshToken
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (req.url().includes("/auth/refresh")) {
      req.respond({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          token:        session.jwt,
          refreshToken: session.refreshToken,
        }),
      });
    } else {
      req.continue();
    }
  });

  return page;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function hideScrollbars(page) {
  await page.addStyleTag({
    content: `::-webkit-scrollbar{display:none!important}*{scrollbar-width:none!important}`,
  }).catch(() => {});
}

async function waitForAppReady(page) {
  // Espera que desaparezca el loader overlay, el tour y cualquier spinner
  await page.waitForFunction(
    () =>
      !document.querySelector(".welltur-loader-overlay") &&
      !document.querySelector(".driver-overlay") &&
      !document.querySelector(".animate-spin"),
    { timeout: 20000 }
  ).catch(() => {});
  await sleep(2500);
}

async function shot(page, id) {
  await waitForAppReady(page);
  await hideScrollbars(page);
  const path = join(OUT, `${id}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log(`  ✅  ${id}.png → ${path}`);
}

async function nav(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: "load", timeout: 30000 });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log("\n🚀  Iniciando Puppeteer...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--lang=es-MX"],
  });

  try {
    // ── 1. Landing pública ─────────────────────────────────────────────────
    {
      console.log("\n📸  landing-b2b (sin auth)...");
      const p = await browser.newPage();
      await p.setViewport(VP);
      await p.goto(BASE, { waitUntil: "load" });
      // Espera que el loader exista en el DOM (indica que React montó)
      await p.waitForSelector(".welltur-loader-overlay", { timeout: 15000 }).catch(() => {});
      // Da tiempo para que la landing hydrate y cargue sus secciones en segundo plano
      await sleep(8000);
      // El SmartURLoader puede quedarse bloqueado en headless porque bootReady
      // depende de APIs externas. Lo eliminamos forzosamente del DOM.
      await p.evaluate(() => {
        document.querySelector(".welltur-loader-overlay")?.remove();
      });
      await sleep(1500);
      await hideScrollbars(p);
      await p.screenshot({ path: join(OUT, "landing-b2b.png") });
      console.log("  ✅  landing-b2b.png");
      await p.close();
    }

    // ── 2. Admin ───────────────────────────────────────────────────────────
    {
      console.log("\n🔐  Abriendo sesión admin (request interception activa)...");
      const admin = await authPage(browser, ADMIN_SESSION);

      for (const [id, path] of [
        ["admin-home",       "/dashboard"],
        ["admin-aprobacion", "/dashboard/aprobacion"],
        ["admin-cedulas",    "/dashboard/verificaciones-empresa"],
      ]) {
        console.log(`\n📸  ${id}...`);
        await nav(admin, path);
        await shot(admin, id);
      }
      await admin.close();
    }

    // ── 3. Empresa ─────────────────────────────────────────────────────────
    {
      console.log("\n🔐  Abriendo sesión empresa (request interception activa)...");
      const emp = await authPage(browser, EMPRESA_SESSION);

      for (const [id, path] of [
        ["empresa-dashboard", "/empresa/dashboard"],
        ["empresa-agenda",    "/empresa/calendario"],
      ]) {
        console.log(`\n📸  ${id}...`);
        await nav(emp, path);
        await shot(emp, id);
      }
      await emp.close();
    }

  } finally {
    await browser.close();
  }

  console.log("\n✅  Listo. Screenshots en public/screenshots/");
})();
