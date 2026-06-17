import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const exportDir = path.join(projectRoot, 'exports');
const baseUrl = process.env.MES_URL || 'http://127.0.0.1:8765/line-mobile-preview.html';
const bundledNodeModules = process.env.CODEX_NODE_MODULES
  || 'C:\\Users\\chokepisit\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules';
const require = createRequire(path.join(bundledNodeModules, '.pnpm', 'playwright@1.60.0', 'node_modules', 'playwright', 'package.json'));
const { chromium } = require('playwright');
const sharpRequire = createRequire(path.join(bundledNodeModules, '.pnpm', 'sharp@0.34.5', 'node_modules', 'sharp', 'package.json'));
const sharp = sharpRequire('sharp');
const browserExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function stampNow() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

await fs.mkdir(exportDir, { recursive: true });

const stamp = stampNow();
const pngPath = path.join(exportDir, `line-mobile-preview-phone-${stamp}.png`);
const jpgPath = path.join(exportDir, `line-mobile-preview-phone-${stamp}.jpg`);

const browser = await chromium.launch({
  executablePath: browserExecutable,
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 520, height: 900 },
    deviceScaleFactor: 2,
  });

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.phone-frame', { state: 'visible', timeout: 15000 });

  const phoneFrame = page.locator('.phone-frame');
  await phoneFrame.screenshot({ path: pngPath });
  await sharp(pngPath).jpeg({ quality: 92 }).toFile(jpgPath);
} finally {
  await browser.close();
}

console.log(JSON.stringify({
  png: pngPath,
  jpg: jpgPath,
  pngUrl: `/exports/${path.basename(pngPath)}`,
  jpgUrl: `/exports/${path.basename(jpgPath)}`,
}, null, 2));
