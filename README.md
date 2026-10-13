# studio-vesta-site

Website von Stammbleibe (stammbleibe.de), gehostet auf Netlify. Statische Dateien im Root, Auto-Deploy bei Push auf `main`.

## Formular und Bestätigungsmail

- Das Formular `inserats-check` läuft über Netlify Forms.
- Bei jeder geprüften Anfrage startet `netlify/functions/submission-created.mjs` und schickt der Person eine Bestätigung über das IONOS-Postfach (smtp.ionos.de, Port 465).
- Benötigte Umgebungsvariablen in Netlify (Scope: Functions):
  - `SMTP_USER`: Adresse des Postfachs (aktuell hello@stammbleibe.de)
  - `SMTP_PASS`: Passwort dieses Postfachs (als Secret, Context Production)
- Nach einer Änderung der Variablen neu deployen.
- Fehler stehen in den Netlify-Logs unter Functions → submission-created.
