// Läuft automatisch bei jeder geprüften Netlify-Formularanfrage (Event "submission-created")
// und schickt der Person eine Bestätigung über das IONOS-Postfach.
// Benötigte Umgebungsvariablen in Netlify: SMTP_USER (Postfach-Adresse), SMTP_PASS (Postfach-Passwort).
// Optional: SMTP_HOST (Standard smtp.ionos.de), SMTP_PORT (Standard 465).
import nodemailer from 'nodemailer';

const FORM = 'inserats-check';
const CAL_URL = 'https://cal.com/thilo-erward/30min';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = (s) => String(s ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, 500);

export function buildMail(data, siteUrl) {
  const name = clean(data.vorname);
  const link = clean(data.inserat_link);
  const offline = !link || link === 'noch nicht online';
  const site = (clean(siteUrl) || 'https://stammbleibe.de').replace(/\/$/, '');

  const rows = [
    ['Ort', clean(data.ort)],
    ['Inserat', offline ? 'noch nicht online' : link],
    ['Was besser laufen soll', clean(data.ziele)],
    ['Gäste, die du öfter hättest', clean(data.zielgruppe)],
    ['Start', clean(data.start)],
  ].filter(([, v]) => v);

  const intro = offline
    ? 'Wir melden uns innerhalb von 48 Stunden und besprechen mit dir, wie deine Wohnung von Anfang an gut läuft.'
    : 'Wir schauen uns dein Inserat in Ruhe an und melden uns innerhalb von 48 Stunden mit unserer Einschätzung.';

  const footer = [
    'Stammbleibe ist ein Angebot der Hillward GmbH',
    'Ahnfeldstraße 45, 40239 Düsseldorf',
    'Geschäftsführer: Thilo Erward, Marvin Hillebrand',
    'Amtsgericht Düsseldorf, HRB 105796',
  ];

  const text = [
    name ? `Hallo ${name},` : 'Hallo,',
    '',
    'danke für deine Anfrage, sie ist bei uns angekommen.',
    '',
    intro,
    '',
    'Das hast du uns geschickt:',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    'Wenn du lieber direkt mit uns sprichst, such dir hier einen Termin aus:',
    CAL_URL,
    '',
    'Und falls dir noch etwas einfällt, antworte einfach auf diese Mail.',
    '',
    'Viele Grüße',
    'Thilo',
    '',
    '-- ',
    ...footer,
    `Impressum: ${site}/impressum.html`,
    `Datenschutz: ${site}/datenschutz.html`,
  ].join('\n');

  // Farben aus der Website
  const C = { bg: '#EFE6D8', card: '#F7F2EA', ink: '#22201D', muted: '#6B6358', line: '#D8C9B1', accent: '#B34D27', deep: '#3D4A3E' };
  const sans = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
  const serif = "'Cormorant Garamond',Georgia,'Times New Roman',serif";
  // Nullbreite Leerzeichen verhindern, dass Gmail die Adresse automatisch blau verlinkt
  const noLink = (s) => esc(s).replace(/(\d)(?=\d)/g, '$1&#8203;').replace(/stra/g, 'stra&#8203;');
  const p = `margin:0 0 16px;font-family:${sans};font-size:16px;line-height:1.6;color:${C.ink}`;
  const valueCell = (k, v) => k === 'Inserat' && /^https?:\/\//.test(v)
    ? `<a href="${esc(v)}" style="color:${C.accent};text-decoration:underline;word-break:break-all">${esc(v.replace(/^https?:\/\/(www\.)?/, ''))}</a>`
    : esc(v);

  const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc('Deine Anfrage bei Stammbleibe')}</title></head>
<body style="margin:0;padding:0;background:${C.bg}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(intro)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}" style="background:${C.bg}">
<tr><td align="center" style="padding:32px 14px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
    <tr><td bgcolor="${C.deep}" style="background:${C.deep};border-radius:14px 14px 0 0;padding:26px 32px">
      <img src="${esc(site)}/mail/logo.png" width="190" height="40" alt="Stammbleibe" style="display:block;border:0;width:190px;height:auto;color:${C.bg};font-family:${serif};font-size:22px;letter-spacing:2px">
    </td></tr>
    <tr><td bgcolor="${C.card}" style="background:${C.card};border:1px solid ${C.line};border-top:0;border-radius:0 0 14px 14px;padding:34px 32px 30px">
      <h1 style="margin:0 0 18px;font-family:${serif};font-weight:500;font-size:32px;line-height:1.15;color:${C.ink}">${name ? 'Danke, ' + esc(name) + '.' : 'Danke für deine Anfrage.'}</h1>
      <p style="${p}">Deine Anfrage ist bei uns angekommen. ${esc(intro)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 26px;border-top:1px solid ${C.line}">
${rows.map(([k, v]) => `        <tr><td style="padding:11px 16px 11px 0;border-bottom:1px solid ${C.line};font-family:${sans};font-size:14px;line-height:1.4;color:${C.muted};vertical-align:top;width:38%">${esc(k)}</td><td style="padding:11px 0;border-bottom:1px solid ${C.line};font-family:${sans};font-size:15px;line-height:1.4;color:${C.ink};vertical-align:top">${valueCell(k, v)}</td></tr>`).join('\n')}
      </table>
      <p style="${p}">Lieber gleich sprechen? Such dir einen Termin für ein kurzes Gespräch aus.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px"><tr><td bgcolor="${C.accent}" style="background:${C.accent};border-radius:999px">
        <a href="${CAL_URL}" style="display:inline-block;padding:14px 28px;font-family:${sans};font-size:15px;font-weight:600;line-height:1;color:#FFFFFF;text-decoration:none;border-radius:999px">Termin aussuchen</a>
      </td></tr></table>
      <p style="${p}">Und falls dir noch etwas einfällt, antworte einfach auf diese Mail.</p>
      <p style="margin:24px 0 0;font-family:${sans};font-size:16px;line-height:1.5;color:${C.ink}">Viele Grüße<br><span style="font-family:${serif};font-size:24px;line-height:1.4">Thilo</span><br><span style="font-size:13px;color:${C.muted}">Thilo Erward · Stammbleibe</span></p>
    </td></tr>
    <tr><td style="padding:22px 6px 0;font-family:${sans};font-size:12px;line-height:1.6;color:${C.muted}">
      ${footer.map(noLink).join('<br>')}<br><a href="${esc(site)}/impressum.html" style="color:${C.muted};text-decoration:underline">Impressum</a> · <a href="${esc(site)}/datenschutz.html" style="color:${C.muted};text-decoration:underline">Datenschutz</a>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;

  return { subject: 'Deine Anfrage bei Stammbleibe', text, html };
}

export const handler = async (event) => {
  let payload;
  try { ({ payload } = JSON.parse(event.body || '{}')); } catch { return { statusCode: 400, body: 'bad payload' }; }
  if (!payload || payload.form_name !== FORM) return { statusCode: 200, body: 'ignored' };

  const data = payload.data || {};
  const to = clean(data.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { statusCode: 200, body: 'no valid email' };

  const { SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) {
    console.error('Bestätigungsmail nicht gesendet: SMTP_USER oder SMTP_PASS fehlt.');
    return { statusCode: 200, body: 'not configured' };
  }
  const port = Number(process.env.SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ionos.de',
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const mail = buildMail(data, payload.site_url);
  try {
    await transporter.sendMail({
      from: { name: 'Thilo von Stammbleibe', address: SMTP_USER },
      replyTo: SMTP_USER,
      to,
      ...mail,
    });
    return { statusCode: 200, body: 'sent' };
  } catch (err) {
    console.error('Bestätigungsmail fehlgeschlagen:', err && err.message);
    return { statusCode: 500, body: 'send failed' };
  }
};
