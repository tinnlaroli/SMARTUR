import nodemailer from 'nodemailer';

const PRIMARY = '#FC478E';
const PRIMARY_LIGHT = '#FFF5F9';
const TEXT = '#1a1a1a';
const MUTED = '#6b7280';
const BORDER = '#e5e7eb';

function createTransporter() {
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
}

const FROM_NAME = `"SMARTUR" <${process.env.EMAIL_USER || 'noreply@smartur.online'}>`;

function logoAttachment() {
    return [
        {
            filename: 'logo.png',
            path: './assets/logo.png',
            cid: 'smartur-logo',
        },
    ];
}

const heading = (text) =>
    `<h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:${TEXT};line-height:1.3;">${text}</h1>`;

const paragraph = (text) =>
    `<p style="margin:0 0 16px;color:${MUTED};font-size:15px;line-height:1.6;">${text}</p>`;

const codeBlock = (code) => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr>
      <td align="center" style="background:${PRIMARY_LIGHT};border:1px solid ${BORDER};border-radius:8px;padding:20px 24px;">
        <span style="font-size:28px;font-weight:600;letter-spacing:6px;color:${PRIMARY};font-family:Consolas,Monaco,monospace;">
          ${code}
        </span>
      </td>
    </tr>
  </table>`;

const ctaButton = (url, label) => `
  <table cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
    <tr>
      <td align="center" style="border-radius:6px;background:${PRIMARY};">
        <a href="${url}" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;

const BASE_HTML = (content, title) => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="520" cellpadding="0" cellspacing="0" border="0"
               style="background:#ffffff;border-radius:8px;border:1px solid ${BORDER};">
          <tr>
            <td style="padding:28px 32px 20px;text-align:center;border-bottom:3px solid ${PRIMARY};">
              <img src="cid:smartur-logo" alt="SMARTUR" width="88" style="display:inline-block;"/>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:${TEXT};">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;text-align:center;color:#9ca3af;font-size:12px;line-height:1.5;border-top:1px solid ${BORDER};">
              SMARTUR · Las Altas Montañas, Veracruz<br/>
              Si no solicitaste este correo, puedes ignorarlo.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

async function deliver({ to, subject, text, html, title, bulk = true }) {
    const transporter = createTransporter();
    const headers = { 'X-Mailer': 'SMARTUR Mailer' };
    if (bulk) {
        headers['X-Priority'] = '3';
        headers.Precedence = 'bulk';
    }

    await transporter.sendMail({
        from: FROM_NAME,
        to,
        subject,
        text,
        html: BASE_HTML(html, title),
        attachments: logoAttachment(),
        headers,
    });
}

// Los tres correos de OTP (login, reset de contraseña, registro de empresa)
// comparten exactamente la misma estructura visual — solo cambian el título,
// la intro y cuánto dura el código. Un solo helper evita que se desalineen
// con el tiempo (ya pasó con sendRegistrationConfirmation, que tenía su
// propio bloque de código con otro estilo).
async function sendOtpEmail({ to, subject, title, introText, code, validityMinutes, note, bulk = true }) {
    const content = `
      ${heading(title)}
      ${paragraph(introText)}
      ${codeBlock(code)}
      ${paragraph(`Válido por <strong style="color:${TEXT};">${validityMinutes} minutos</strong>. ${note}`)}`;

    await deliver({
        to,
        subject: `${subject} — SMARTUR`,
        title,
        text: `${title}\n\nCódigo: ${code}\n\nVálido ${validityMinutes} minutos.\n\nSMARTUR`,
        html: content,
        bulk,
    });
}

export async function sendEmail(to, code) {
    await sendOtpEmail({
        to,
        code,
        subject: 'Código de recuperación',
        title: 'Recuperación de contraseña',
        introText: 'Usa este código para restablecer tu contraseña.',
        validityMinutes: 15,
        note: 'Si no lo solicitaste, ignora este correo.',
    });
}

export async function sendEmailVerification(to, code) {
    await sendOtpEmail({
        to,
        code,
        subject: 'Código de verificación',
        title: 'Verificación de acceso',
        introText: 'Introduce este código para completar el inicio de sesión.',
        validityMinutes: 5,
        note: 'Si no reconoces esta actividad, ignora este correo.',
    });
}

export async function sendContactNotification(toAdmin, { email, reason, message, source }) {
    const reasonText = reason || 'No especificado';
    const messageText = message || '(sin mensaje)';
    const sourceText = source || 'desconocida';

    const content = `
      ${heading('Nuevo mensaje de contacto')}
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;font-size:14px;">
        <tr>
          <td style="padding:8px 0;color:${MUTED};width:90px;vertical-align:top;">Correo</td>
          <td style="padding:8px 0;color:${TEXT};">${email}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:${MUTED};vertical-align:top;">Motivo</td>
          <td style="padding:8px 0;color:${TEXT};">${reasonText}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:${MUTED};vertical-align:top;">Fuente</td>
          <td style="padding:8px 0;color:${TEXT};">${sourceText}</td>
        </tr>
      </table>
      <div style="background:#f9fafb;padding:16px;border-radius:6px;border-left:3px solid ${PRIMARY};">
        <p style="margin:0;color:${TEXT};white-space:pre-wrap;font-size:14px;line-height:1.6;">${messageText}</p>
      </div>`;

    await deliver({
        to: toAdmin,
        subject: `[SMARTUR] Contacto: ${reasonText}`,
        title: 'Nuevo contacto',
        text: `Contacto\n\nCorreo: ${email}\nMotivo: ${reasonText}\nFuente: ${sourceText}\n\n${messageText}`,
        html: content,
        bulk: false,
    });
}

export async function sendWelcomeEmail(to) {
    const platformUrl = process.env.FRONTEND_URL?.split(',')[0]?.trim() ?? 'https://app.smartur.online';

    const content = `
      ${heading('Bienvenido a SMARTUR')}
      ${paragraph('Gracias por registrarte. Explora rutas, gastronomía y cultura de Las Altas Montañas desde un solo lugar.')}
      ${ctaButton(platformUrl, 'Ir a la plataforma')}`;

    await deliver({
        to,
        subject: 'Bienvenido a SMARTUR',
        title: 'Bienvenido a SMARTUR',
        text: `Bienvenido a SMARTUR\n\nVisita ${platformUrl} para comenzar.\n\nSMARTUR`,
        html: content,
    });
}

export async function sendEmpresaApprovedEmail(to, { companyName }) {
    const platformUrl = process.env.FRONTEND_URL?.split(',')[0]?.trim() ?? 'https://app.smartur.online';

    const content = `
      ${heading('¡Tu empresa fue aprobada!')}
      ${paragraph(`Buenas noticias: <strong style="color:${TEXT};">${companyName}</strong> ha sido verificada por el equipo SMARTUR y ya está activa en la plataforma.`)}
      ${paragraph('Ahora puedes iniciar sesión y comenzar a gestionar tus servicios turísticos desde tu dashboard.')}
      ${ctaButton(`${platformUrl}/empresa/dashboard`, 'Ir a mi dashboard')}`;

    await deliver({
        to,
        subject: '¡Tu empresa fue aprobada! — SMARTUR',
        title: 'Empresa aprobada',
        text: `¡Tu empresa fue aprobada!\n\n${companyName} ya está activa en SMARTUR.\nVisita ${platformUrl}/empresa/dashboard para comenzar.\n\nSMARTUR`,
        html: content,
        bulk: false,
    });
}

export async function sendEmpresaSuspendedEmail(to, { companyName }) {
    const content = `
      ${heading('Tu empresa ha sido suspendida')}
      ${paragraph(`La cuenta de <strong style="color:${TEXT};">${companyName}</strong> en SMARTUR ha sido suspendida por el equipo administrativo.`)}
      ${paragraph('Si crees que esto es un error o quieres más información, por favor responde este correo o contáctanos desde la plataforma.')}`;

    await deliver({
        to,
        subject: 'Tu empresa ha sido suspendida — SMARTUR',
        title: 'Empresa suspendida',
        text: `Tu empresa ha sido suspendida\n\nLa cuenta de ${companyName} en SMARTUR ha sido suspendida.\n\nSi crees que es un error, contáctanos.\n\nSMARTUR`,
        html: content,
        bulk: false,
    });
}

export async function sendExistingAccountNotification(to) {
    const platformUrl = process.env.FRONTEND_URL?.split(',')[0]?.trim() ?? 'https://app.smartur.online';

    const content = `
      ${heading('Intento de registro con tu correo')}
      ${paragraph('Alguien intentó crear una cuenta empresa en SMARTUR usando esta dirección de correo.')}
      ${paragraph('Si fuiste tú y ya tienes cuenta, puedes iniciar sesión directamente.')}
      ${ctaButton(`${platformUrl}/login`, 'Iniciar sesión')}
      ${paragraph(`Si no reconoces esta actividad, ignora este mensaje. Nadie más tiene acceso a tu cuenta.`)}`;

    await deliver({
        to,
        subject: 'Intento de registro — SMARTUR',
        title: 'Intento de registro',
        text: `Alguien intentó registrarse con tu correo en SMARTUR.\nSi ya tienes cuenta, inicia sesión en ${platformUrl}/login\nSi no reconoces esto, ignora este mensaje.\n\nSMARTUR`,
        html: content,
        bulk: false,
    });
}

export async function sendRegistrationConfirmation(to, { name, otp }) {
    await sendOtpEmail({
        to,
        code: otp,
        subject: 'Confirma tu correo',
        title: `Hola ${name}, confirma tu correo`,
        introText: 'Gracias por registrar tu empresa en SMARTUR. Usa el siguiente código para verificar tu correo electrónico:',
        validityMinutes: 10,
        note: 'Si no registraste una empresa en SMARTUR, ignora este mensaje.',
        bulk: false,
    });
}
