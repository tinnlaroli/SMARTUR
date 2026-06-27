/**
 * Captura screenshots automáticos de páginas públicas de SMARTUR.
 * Para páginas autenticadas, ver la lista al final del archivo.
 *
 * Uso:
 *   node scripts/capture.mjs
 *
 * Requiere que las apps estén corriendo:
 *   LANDING  → npm run dev  (en LANDING/, puerto 4321)
 *   PLATAFORMA → npm run dev (en PLATAFORMA/, puerto 5173)
 */

import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../public/images/screens");

// Viewport para desktop (browser mockup)
const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 2 };
// Viewport para mobile (phone mockup) — simula Pixel 6
const MOBILE  = { width: 390,  height: 844, deviceScaleFactor: 3 };

async function shot(page, file, selector = null) {
  const outPath = path.join(OUT, file);
  if (selector) {
    const el = await page.$(selector);
    if (el) {
      await el.screenshot({ path: outPath, type: "png" });
      console.log(`  ✅ ${file} (element)`);
      return;
    }
  }
  await page.screenshot({ path: outPath, type: "png", fullPage: false });
  console.log(`  ✅ ${file}`);
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    // ── 1. LANDING — página principal (turista) ─────────────────────────────
    console.log("\n📸 LANDING");
    const landing = await browser.newPage();
    await landing.setViewport(DESKTOP);
    await landing.goto("http://localhost:4321", { waitUntil: "networkidle0", timeout: 30000 });
    await wait(1500);
    await shot(landing, "b2c-01-landing.png");

    // Scroll a sección de beneficios
    await landing.evaluate(() => window.scrollTo(0, 500));
    await wait(600);
    await shot(landing, "b2c-01-landing-beneficios.png");

    // ── 2. LANDING — sección empresa (B2B) ─────────────────────────────────
    await landing.goto("http://localhost:4321#empresa", { waitUntil: "networkidle0", timeout: 15000 });
    await wait(1000);
    await landing.evaluate(() => {
      const el = document.querySelector("#empresa") || document.querySelector("[data-section='empresa']");
      if (el) el.scrollIntoView({ behavior: "instant" });
    });
    await wait(800);
    await shot(landing, "b2b-01-landing-empresa.png");

    await landing.close();

    // ── 3. PLATAFORMA — login ───────────────────────────────────────────────
    console.log("\n📸 PLATAFORMA — páginas públicas");
    const plat = await browser.newPage();
    await plat.setViewport(DESKTOP);
    await plat.goto("http://localhost:5173", { waitUntil: "networkidle0", timeout: 30000 });
    await wait(1500);
    await shot(plat, "b2c-02-plataforma-login.png");

    await plat.close();

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Screenshots automáticos listos en:
    VIDEO/public/images/screens/

⚠️  SCREENSHOTS MANUALES REQUERIDOS
    (páginas que requieren login — tómalas tú mismo)

    Nombra cada archivo exactamente así y guárdalo en:
    VIDEO/public/images/screens/

    B2B — Prestador:
    ┌─ b2b-02-registro.png        → Modal de registro empresa abierto
    ├─ b2b-03-otp.png             → Pantalla verificación OTP (6 dígitos)
    ├─ b2b-04-portal-bloqueado.png → Portal empresa con acceso limitado
    ├─ b2b-05-admin-aprobacion.png → Panel admin en /dashboard/verificaciones-empresa
    ├─ b2b-06-portal-activo.png   → Portal empresa completo desbloqueado
    ├─ b2b-07-nuevo-servicio.png  → Formulario de nuevo servicio abierto
    ├─ b2b-08-servicio-aprobado.png → Servicio visible en tabla de servicios
    └─ b2b-09-agenda.png          → Módulo agenda /empresa/calendario

    B2C — Turista (app móvil — screenshot del teléfono o emulador):
    ┌─ b2c-03-preferencias.png    → Pantalla de selección de preferencias
    ├─ b2c-04-home.png            → Home con recomendaciones IA
    ├─ b2c-05-lugar-detalle.png   → Detalle de un lugar (fotos, precio, info)
    ├─ b2c-06-ruta.png            → Pantalla de itinerario/ruta creada
    ├─ b2c-07-booking.png         → Pantalla de reserva de visita
    ├─ b2c-08-chat.png            → Chat con prestador
    └─ b2c-09-compartir.png       → Modal de exportar / compartir ruta

    Tip para app: activa la grabación de pantalla en el emulador
    o usa adb para Android: adb exec-out screencap -p > screen.png
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
