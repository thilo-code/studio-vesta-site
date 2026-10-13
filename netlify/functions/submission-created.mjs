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
  ].join('\n');

  const p = 'margin:0 0 16px';
  const html = `<!doctype html><html lang="de"><body style="margin:0;padding:24px;background:#ffffff;color:#22201D;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55">
<div style="max-width:560px">
<p style="${p}">${name ? 'Hallo ' + esc(name) + ',' : 'Hallo,'}</p>
<p style="${p}">danke für deine Anfrage, sie ist bei uns angekommen.</p>
<p style="${p}">${esc(intro)}</p>
<p style="margin:0 0 6px">Das hast du uns geschickt:</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border-collapse:collapse">
${rows.map(([k, v]) => `<tr><td style="padding:3px 16px 3px 0;color:#5E574E;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:3px 0;vertical-align:top;word-break:break-word">${esc(v)}</td></tr>`).join('\n')}
</table>
<p style="${p}">Wenn du lieber direkt mit uns sprichst, <a href="${CAL_URL}" style="color:#B34D27">such dir hier einen Termin aus</a>.</p>
<p style="${p}">Und falls dir noch etwas einfällt, antworte einfach auf diese Mail.</p>
<p style="margin:0 0 32px">Viele Grüße<br>Thilo</p>
<p style="margin:0;padding-top:16px;border-top:1px solid #D8C9B1;font-size:12px;line-height:1.5;color:#5E574E">${footer.map(esc).join('<br>')}<br><a href="${esc(site)}/impressum.html" style="color:#5E574E">Impressum</a></p>
</div></body></html>`;

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
