/**
 * Captura screenshots con navegador VISIBLE.
 * 1. Abre Chrome (visible)
 * 2. Navega a localhost:5173
 * 3. TÚ inicias sesión en el navegador (30 segundos)
 * 4. El script toma los screenshots automáticamente
 *
 * Uso: node scripts/capture-visible.mjs
 */
import puppeteer from "puppeteer";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../public/screenshots");
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const BASE = "http://localhost:5173";
const VP   = { width: 1440, height: 900, deviceScaleFactor: 2 };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, id) {
  await page.addStyleTag({ content: `::-webkit-scrollbar { display: none !important; } * { scrollbar-width: none !important; }` });
  await wait(1200);
  await page.screenshot({ path: join(OUT, `${id}.png`), fullPage: false });
  console.log(`  ✅  ${id}.png`);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,                      // ← navegador VISIBLE
    defaultViewport: VP,
    args: ["--start-maximized", "--lang=es-MX"],
  });

  const page = await browser.newPage();
  await page.setViewport(VP);

  // ── Landing pública ───────────────────────────────────────────────────────
  console.log("\n📸  Landing B2B...");
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
  await shot(page, "landing-b2b");

  console.log("📸  Landing Turista...");
  await page.goto(`${BASE}/turista`, { waitUntil: "networkidle2" });
  await shot(page, "landing-turista");

  // ── Login manual ──────────────────────────────────────────────────────────
  console.log("\n🔐  Navega a la plataforma. Tienes 35 segundos para iniciar sesión...");
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
  console.log("    (El navegador está abierto — inicia sesión ahora)");
  await wait(35000);   // ← tiempo para que el usuario haga login

  // ── Admin screenshots ─────────────────────────────────────────────────────
  const adminRoutes = [
    { id: "admin-home",         path: "/dashboard" },
    { id: "admin-aprobacion",   path: "/dashboard/aprobacion-contenido" },
    { id: "admin-cedulas",      path: "/dashboard/verificaciones-empresa" },
  ];

  for (const r of adminRoutes) {
    console.log(`\n📸  ${r.id}...`);
    await page.goto(`${BASE}${r.path}`, { waitUntil: "networkidle2" });
    try { await page.waitForSelector("main", { timeout: 6000 }); } catch {}
    await shot(page, r.id);
  }

  // ── Empresa screenshots ───────────────────────────────────────────────────
  console.log("\n🔐  Ahora inicia sesión como empresa (si es diferente). 25 segundos...");
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
  await wait(25000);

  const empresaRoutes = [
    { id: "empresa-dashboard", path: "/empresa/inicio" },
    { id: "empresa-agenda",    path: "/empresa/calendario" },
  ];

  for (const r of empresaRoutes) {
    console.log(`\n📸  ${r.id}...`);
    await page.goto(`${BASE}${r.path}`, { waitUntil: "networkidle2" });
    try { await page.waitForSelector("main", { timeout: 6000 }); } catch {}
    await shot(page, r.id);
  }

  await browser.close();
  console.log("\n✅  Screenshots guardados en public/screenshots/");
  console.log("    Ahora ejecuta: npm run dev  para verlos en el video.");
})();
