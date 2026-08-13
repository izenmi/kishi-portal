// public/icons/*.png を public/favicon.svg と同じ意匠から書き出す一回限りのツール。
// ビルドには組み込んでいない。マークや配色を変えたときだけ手で再実行する:
//   PATH=~/.local/node22/bin:$PATH node scripts/generate-icons.mjs
//
// playwright はこのプロジェクトの依存に入れたくないので(依存は astro のみに保つ)、
// 姉妹プロジェクトの node_modules から借りている。
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire('/workspaces/example/manga-db/');
const { chromium } = require('playwright');

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const iconsDir = path.join(rootDir, 'public', 'icons');
mkdirSync(iconsDir, { recursive: true });

const BG = '#1a1d24';

// favicon.svg の 64px viewBox をそのまま使う。maskable はセーフゾーン確保のため中身を縮める。
function svg({ inset = 0, rounded = true }) {
  const s = 64;
  const k = 1 - inset * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">
  <rect x="0" y="0" width="${s}" height="${s}" ${rounded ? 'rx="14"' : ''} fill="${BG}"/>
  <g transform="translate(${s * inset} ${s * inset}) scale(${k})">
    <rect x="13" y="15" width="7" height="34" rx="2" fill="#e8e6df"/>
    <rect x="22" y="15" width="7" height="34" rx="2" fill="#9c2b2b"/>
    <rect x="31" y="18" width="7" height="31" rx="2" fill="#8b909b"/>
    <rect x="40" y="15" width="11" height="34" rx="2" fill="#e8e6df" transform="rotate(9 45 32)"/>
    <rect x="10" y="49" width="44" height="4" rx="2" fill="#5f6672"/>
  </g>
</svg>`;
}

const targets = [
  { file: 'icon-192.png', size: 192, opts: {} },
  { file: 'icon-512.png', size: 512, opts: {} },
  { file: 'apple-touch-icon.png', size: 180, opts: { rounded: false } },
  { file: 'icon-maskable-512.png', size: 512, opts: { inset: 0.11, rounded: false } },
];

const browser = await chromium.launch();
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: t.size, height: t.size } });
  await page.setContent(
    `<!doctype html><style>html,body{margin:0;padding:0;background:${BG}}svg{display:block;width:${t.size}px;height:${t.size}px}</style>${svg(t.opts)}`
  );
  const buf = await page.screenshot({ omitBackground: false });
  writeFileSync(path.join(iconsDir, t.file), buf);
  await page.close();
  console.log(`wrote icons/${t.file} (${t.size}px)`);
}
await browser.close();
