# studio-vesta-site

Website von Stammbleibe (stammbleibe.de), gehostet auf Netlify. Auto-Deploy bei Push auf `main`.

## Build

- `npm run build` erzeugt `dist/` (das veröffentlicht Netlify): kopiert die Seiten, legt die Schriften aus den @fontsource-Paketen nach `/fonts` und erzeugt `/og-image.jpg` aus Logo und Teamfoto.
- Neue statische Dateien im Root werden automatisch mitkopiert, wenn sie eine der Endungen in `build.mjs` haben.

## Formular und Bestätigungsmail

- Das Formular `inserats-check` läuft über Netlify Forms.
- Bei jeder geprüften Anfrage startet `netlify/functions/submission-created.mjs` und schickt der Person eine Bestätigung über das IONOS-Postfach (smtp.ionos.de, Port 465).
- Das Logo der Mail liefert `netlify/functions/mail-logo.mjs` unter `/mail/logo.png` aus.
- Benötigte Umgebungsvariablen in Netlify (Scope: Functions):
  - `SMTP_USER`: Adresse des Postfachs (aktuell hello@stammbleibe.de)
  - `SMTP_PASS`: Passwort dieses Postfachs (als Secret, Context Production)
- Nach einer Änderung der Variablen neu deployen.
- Fehler stehen in den Netlify-Logs unter Functions → submission-created.

## SEO

- `sitemap.xml` und `robots.txt` im Root, strukturierte Daten und Open-Graph-Tags im `<head>` von `index.html`.
- Impressum, Datenschutz, AGB, Widerruf und Garantie stehen auf `noindex`.

## Rechtstexte

- Die Datenschutzerklärung ist eine eigene Seite (`datenschutz.html`), nicht mehr iubenda. Neue Dienste (Tracking, Einbettungen, weitere Formulare) dort ergänzen, bevor sie live gehen.
- Preise, Anfahrt und Garantie stehen auf der Startseite, in `agb.html` und `garantie.html`; bei Änderungen alle Stellen gleich halten.
