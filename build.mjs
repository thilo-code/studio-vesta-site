// Baut den Ordner dist/ für Netlify:
// 1. kopiert die statischen Seiten und Bilder
// 2. kopiert die Schriften lokal nach /fonts-v2 (kein Google Fonts, DSGVO).
//    Neuer Pfad, weil Browser alte 404-Antworten unter /fonts/ ein Jahr lang gecacht haben.
// 3. erzeugt das Vorschaubild für geteilte Links (/og-image.jpg)
import { mkdir, copyFile, readdir, rm, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import sharp from 'sharp';
import { LOGO_PNG_BASE64 } from './netlify/shared/mail-logo.mjs';

const require = createRequire(import.meta.url);
const OUT = 'dist';
const FONT_DIR = 'fonts-v2';

await rm(OUT, { recursive: true, force: true });
await mkdir(path.join(OUT, FONT_DIR), { recursive: true });

// 1. Statische Dateien
const STATIC = /\.(html|png|ico|svg|webp|jpg|xml|txt)$|^_headers$|^_redirects$/;
for (const f of await readdir('.')) {
  if (!STATIC.test(f)) continue;
  if (f.endsWith('.html')) {
    const html = (await readFile(f, 'utf8')).replaceAll('/fonts/', `/${FONT_DIR}/`);
    await writeFile(path.join(OUT, f), html);
  } else {
    await copyFile(f, path.join(OUT, f));
  }
}

// 2. Schriften
const pkgDir = (p) => path.dirname(require.resolve(`${p}/package.json`));
const FONTS = [
  ['@fontsource/dm-sans', 'dm-sans-latin-400-normal.woff2', 'dm-sans-400.woff2'],
  ['@fontsource/dm-sans', 'dm-sans-latin-500-normal.woff2', 'dm-sans-500.woff2'],
  ['@fontsource/dm-sans', 'dm-sans-latin-700-normal.woff2', 'dm-sans-700.woff2'],
  ['@fontsource/cormorant-garamond', 'cormorant-garamond-latin-500-normal.woff2', 'cormorant-garamond-500.woff2'],
  ['@fontsource/cormorant-garamond', 'cormorant-garamond-latin-600-normal.woff2', 'cormorant-garamond-600.woff2'],
  ['@fontsource/cormorant-garamond', 'cormorant-garamond-latin-500-italic.woff2', 'cormorant-garamond-500-italic.woff2'],
  ['@fontsource/marcellus', 'marcellus-latin-400-normal.woff2', 'marcellus-400.woff2'],
];
for (const [pkg, file, target] of FONTS) {
  await copyFile(path.join(pkgDir(pkg), 'files', file), path.join(OUT, FONT_DIR, target));
}
for (const pkg of new Set(FONTS.map(([p]) => p))) {
  await copyFile(path.join(pkgDir(pkg), 'LICENSE'), path.join(OUT, FONT_DIR, `LICENSE-${pkg.split('/')[1]}.txt`));
}

// 3. Vorschaubild 1200x630: Zypresse-Grün, Logo links, Teamfoto rechts
const logo = await sharp(Buffer.from(LOGO_PNG_BASE64, 'base64')).resize({ width: 456 }).png().toBuffer();
const photo = await sharp('team.webp').resize(630, 630, { fit: 'cover' }).toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#3D4A3E' } })
  .composite([
    { input: photo, left: 570, top: 0 },
    { input: logo, left: 57, top: 267 },
  ])
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(path.join(OUT, 'og-image.jpg'));

console.log('dist/ fertig:', (await readdir(OUT)).join(', '));
