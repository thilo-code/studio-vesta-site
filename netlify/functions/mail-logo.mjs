// Liefert das Logo für die Bestätigungsmail aus (erreichbar unter /mail/logo.png, siehe _redirects).
import { LOGO_PNG_BASE64 } from '../shared/mail-logo.mjs';

export const handler = async () => ({
  statusCode: 200,
  headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' },
  body: LOGO_PNG_BASE64,
  isBase64Encoded: true,
});
