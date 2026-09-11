#!/usr/bin/env node
/**
 * Gera as imagens sociais (Open Graph) e os ícones a partir de SVG, usando sharp.
 * Executar localmente e commitar o resultado (o CI não regenera imagens):
 *   node scripts/generate-og.mjs
 *
 * Saídas: public/og/default.png, public/og/en.png, public/apple-touch-icon.png,
 * public/icon-192.png, public/icon-512.png, public/favicon.ico
 */
import sharp from 'sharp';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = path.join(root, 'public');

const NAVY = '#14284b';
const TEAL = '#1c6b73';
const OCHRE = '#a8782a';
const BG = '#faf8f4';

function escape(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Rede abstrata discreta (nós + linhas) para o canto direito. */
function network() {
  const nodes = [
    [760, 60],
    [840, 40],
    [920, 70],
    [1010, 40],
    [1120, 60],
    [1170, 130],
    [1160, 250],
    [1175, 380],
    [800, 470],
  ];
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [0, 8],
    [2, 8],
  ];
  const lines = edges
    .map(
      ([a, b]) =>
        `<line x1="${nodes[a][0]}" y1="${nodes[a][1]}" x2="${nodes[b][0]}" y2="${nodes[b][1]}" stroke="${NAVY}" stroke-opacity="0.28" stroke-width="1.5"/>`,
    )
    .join('');
  const dots = nodes
    .map(
      ([x, y], i) =>
        `<circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? 6 : 4}" fill="${i === 4 ? OCHRE : NAVY}" fill-opacity="${i === 4 ? 0.9 : 0.6}"/>`,
    )
    .join('');
  const coast = `<path d="M700 560 C 800 520, 880 600, 980 560 S 1120 500, 1240 540" fill="none" stroke="${TEAL}" stroke-opacity="0.45" stroke-width="2"/>
  <path d="M720 600 C 820 560, 900 640, 1000 600 S 1140 540, 1240 580" fill="none" stroke="${TEAL}" stroke-opacity="0.25" stroke-width="1.5"/>`;
  return `${lines}${dots}${coast}`;
}

async function ogImage({ name, tagline, lines, file, portraitBase64 }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.4" fill="${NAVY}" fill-opacity="0.12"/>
    </pattern>
    <clipPath id="photo"><rect x="880" y="96" width="250" height="333" rx="16"/></clipPath>
  </defs>
  <rect width="1200" height="630" fill="${BG}"/>
  <rect width="1200" height="630" fill="url(#dots)"/>
  <rect x="0" y="0" width="14" height="630" fill="${NAVY}"/>
  <rect x="14" y="0" width="4" height="630" fill="${OCHRE}"/>
  ${network()}
  ${
    portraitBase64
      ? `<image href="data:image/jpeg;base64,${portraitBase64}" x="880" y="96" width="250" height="333" clip-path="url(#photo)" preserveAspectRatio="xMidYMid slice"/>
  <rect x="880" y="96" width="250" height="333" rx="16" fill="none" stroke="${NAVY}" stroke-opacity="0.25" stroke-width="2"/>`
      : ''
  }
  ${name.map((n, i) => `<text x="80" y="${128 + i * 62}" font-family="Georgia, 'Times New Roman', serif" font-size="56" font-weight="600" fill="${NAVY}">${escape(n)}</text>`).join('')}
  ${tagline.map((tl, i) => `<text x="80" y="${128 + name.length * 62 + 8 + i * 36}" font-family="Georgia, 'Times New Roman', serif" font-size="29" font-style="italic" fill="${TEAL}">${escape(tl)}</text>`).join('')}
  ${lines.map((l, i) => `<text x="80" y="${128 + name.length * 62 + 8 + tagline.length * 36 + 30 + i * 38}" font-family="'Segoe UI', Arial, Helvetica, sans-serif" font-size="24" fill="#3a4354">${escape(l)}</text>`).join('')}
  <text x="80" y="570" font-family="'Segoe UI', Arial, Helvetica, sans-serif" font-size="22" font-weight="700" letter-spacing="2" fill="${OCHRE}">VALBERGREGORY.GITHUB.IO</text>
</svg>`;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(file);
  console.log(`✓ ${path.relative(root, file)}`);
}

async function icons() {
  const svg = await readFile(path.join(pub, 'favicon.svg'));
  const sizes = [
    { size: 180, file: 'apple-touch-icon.png' },
    { size: 192, file: 'icon-192.png' },
    { size: 512, file: 'icon-512.png' },
  ];
  for (const { size, file } of sizes) {
    await sharp(svg, { density: 384 }).resize(size, size).png().toFile(path.join(pub, file));
    console.log(`✓ public/${file}`);
  }
  // favicon.ico: contêiner ICO com um PNG de 32×32 (formato aceito desde o Windows Vista).
  const png32 = await sharp(svg, { density: 384 }).resize(32, 32).png().toBuffer();
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reservado
  header.writeUInt16LE(1, 2); // tipo: ícone
  header.writeUInt16LE(1, 4); // quantidade de imagens
  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0); // largura
  entry.writeUInt8(32, 1); // altura
  entry.writeUInt8(0, 2); // paleta
  entry.writeUInt8(0, 3); // reservado
  entry.writeUInt16LE(1, 4); // planos
  entry.writeUInt16LE(32, 6); // bits por pixel
  entry.writeUInt32LE(png32.length, 8); // tamanho
  entry.writeUInt32LE(22, 12); // offset
  await writeFile(path.join(pub, 'favicon.ico'), Buffer.concat([header, entry, png32]));
  console.log('✓ public/favicon.ico');
}

await mkdir(path.join(pub, 'og'), { recursive: true });
const portrait = await sharp(path.join(root, 'src/assets/valber-portrait.jpg'))
  .resize(440, 586)
  .jpeg({ quality: 82 })
  .toBuffer();
const portraitBase64 = portrait.toString('base64');

await ogImage({
  name: ['Valber Gregory', 'Barbosa Costa', 'Bezerra Santos'],
  tagline: ['Pesquisa, ensino e tecnologia', 'aplicados a problemas públicos.'],
  lines: [
    'Professor da UFAL · Economista · Analista Judiciário no TJAL',
    'Economia aplicada, Jurimetria, IA no setor público,',
    'turismo, economia marítima e pesqueira',
  ],
  file: path.join(pub, 'og/default.png'),
  portraitBase64,
});
await ogImage({
  name: ['Valber Gregory', 'Barbosa Costa', 'Bezerra Santos'],
  tagline: ['Research, teaching and technology', 'applied to public problems.'],
  lines: [
    'Professor at UFAL · Economist · Judicial Analyst at TJAL',
    'Applied economics, jurimetrics, AI in the public sector,',
    'tourism, maritime and fisheries economics',
  ],
  file: path.join(pub, 'og/en.png'),
  portraitBase64,
});
await icons();
