// Gera capas vetoriais (SVG → WebP) para publicações que ainda não têm imagem
// própria. Hoje: a série "Economia Marítima e Pesqueira" (10 capas + banner).
// As capas ficam commitadas; rode `node scripts/generate-series-covers.mjs`
// só quando quiser regenerá-las. Para substituir por uma imagem própria, basta
// gravar o arquivo com o mesmo nome na pasta da série.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const W = 1122;
const H = 1402;
const OUT = 'src/content/conteudos/economia-maritima-e-pesqueira/';
const SERIES_OUT = 'src/content/series/';

const C = {
  navy: '#0f2b46',
  ocean: '#0b5d8c',
  petrol: '#145c5a',
  turquoise: '#2bb3a3',
  turquoiseSoft: '#8fd8cf',
  sand: '#e9d8b4',
  coral: '#e8735a',
  white: '#ffffff',
};
const FONT = "'Segoe UI', 'Source Sans 3', Arial, sans-serif";

/* ------------------------------------------------------------------ */
/* Glifos (traço branco, arredondado)                                   */
/* ------------------------------------------------------------------ */
const g = (body, x, y, s = 1, extra = '', transform = `translate(${x} ${y}) scale(${s})`) => {
  const width = /stroke-width/.test(extra) ? '' : 'stroke-width="9"';
  return `<g transform="${transform}" fill="none" stroke="${C.white}" ${width} stroke-linecap="round" stroke-linejoin="round" ${extra}>${body}</g>`;
};

const ship = (x, y, s = 1) =>
  g(
    `<path d="M-90 20 L-70 60 L70 60 L100 20 Z" fill="${C.white}" fill-opacity="0.15"/>
     <path d="M-90 20 H100"/>
     <path d="M-40 20 V-20 H30 V20"/>
     <path d="M-10 -20 V-50 H15 V-20"/>
     <path d="M40 -5 H70"/>`,
    x,
    y,
    s,
  );

const crane = (x, y, s = 1) =>
  g(
    `<path d="M-60 80 V-70 H70"/>
     <path d="M-60 -70 L-95 -30"/>
     <path d="M35 -70 V-20"/>
     <rect x="15" y="-20" width="40" height="28" rx="4" fill="${C.coral}" stroke="none"/>
     <path d="M-80 80 H80"/>`,
    x,
    y,
    s,
  );

const fish = (x, y, s = 1, flip = false) =>
  g(
    `<path d="M-60 0 C-30 -40 30 -40 60 0 C30 40 -30 40 -60 0 Z" fill="${C.white}" fill-opacity="0.12"/>
     <path d="M60 0 L95 -28 V28 Z"/>
     <circle cx="-30" cy="-6" r="5" fill="${C.white}" stroke="none"/>`,
    x,
    y,
    s,
    '',
    `translate(${x} ${y}) scale(${flip ? -s : s} ${s})`,
  );

const smallFish = (x, y, s = 0.5) => fish(x, y, s);

const wave = (x, y, w = 200, s = 1) =>
  g(`<path d="M0 0 Q${w / 8} -24 ${w / 4} 0 T${w / 2} 0 T${(3 * w) / 4} 0 T${w} 0"/>`, x, y, s);

const turbine = (x, y, s = 1) =>
  g(
    `<path d="M0 90 V0"/>
     <path d="M0 0 L0 -70"/><path d="M0 0 L60 35"/><path d="M0 0 L-60 35"/>
     <circle cx="0" cy="0" r="9" fill="${C.white}" stroke="none"/>
     <path d="M-30 90 H30"/>`,
    x,
    y,
    s,
  );

const antenna = (x, y, s = 1) =>
  g(
    `<path d="M0 80 V10"/><path d="M-25 80 H25"/>
     <circle cx="0" cy="0" r="10" fill="${C.white}" stroke="none"/>
     <path d="M-32 -28 A46 46 0 0 1 32 -28"/><path d="M-55 -50 A80 80 0 0 1 55 -50"/>`,
    x,
    y,
    s,
  );

const gear = (x, y, s = 1) =>
  g(
    `<circle cx="0" cy="0" r="34"/><circle cx="0" cy="0" r="12"/>
     ${[0, 45, 90, 135, 180, 225, 270, 315]
       .map((a) => `<path d="M0 -46 V-60" transform="rotate(${a})"/>`)
       .join('')}`,
    x,
    y,
    s,
  );

const pin = (x, y, s = 1, color = C.coral) =>
  g(
    `<path d="M0 60 C-40 10 -40 -20 -40 -25 A40 40 0 0 1 40 -25 C40 -20 40 10 0 60 Z" fill="${color}" stroke="${C.white}"/>
     <circle cx="0" cy="-22" r="12" fill="${C.white}" stroke="none"/>`,
    x,
    y,
    s,
  );

const leaf = (x, y, s = 1) =>
  g(
    `<path d="M-50 50 C-50 -20 10 -60 60 -60 C60 0 20 50 -50 50 Z" fill="${C.turquoise}" fill-opacity="0.35"/>
     <path d="M-50 50 C-20 20 10 -10 45 -45"/>`,
    x,
    y,
    s,
  );

const coin = (x, y, s = 1) =>
  g(
    `<circle cx="0" cy="0" r="46" fill="${C.sand}" fill-opacity="0.25"/>
     <path d="M0 -26 V26"/><path d="M14 -14 H-6 A10 10 0 0 0 -6 6 H6 A10 10 0 0 1 6 26 H-14"/>`,
    x,
    y,
    s,
  );

const sun = (x, y, s = 1) =>
  g(
    `<circle cx="0" cy="0" r="30" fill="${C.sand}" stroke="${C.sand}"/>
     ${[0, 45, 90, 135, 180, 225, 270, 315]
       .map((a) => `<path d="M0 -44 V-58" stroke="${C.sand}" transform="rotate(${a})"/>`)
       .join('')}`,
    x,
    y,
    s,
  );

const boat = (x, y, s = 1) =>
  g(
    `<path d="M-60 10 L-40 40 H40 L60 10 Z" fill="${C.white}" fill-opacity="0.15"/>
     <path d="M0 10 V-60"/><path d="M0 -60 L45 -5 H0"/>
     <circle cx="-25" cy="-8" r="10"/><path d="M-25 2 V18"/>`,
    x,
    y,
    s,
  );

const trawler = (x, y, s = 1) =>
  g(
    `<path d="M-120 20 L-95 65 H95 L130 20 Z" fill="${C.white}" fill-opacity="0.15"/>
     <path d="M-120 20 H130"/>
     <path d="M-60 20 V-25 H20 V20"/><path d="M-30 -25 V-55 H0 V-25"/>
     <path d="M60 20 V-70"/><path d="M60 -70 L110 -20"/>
     <path d="M110 -20 V15" stroke-dasharray="4 10"/>
     <path d="M95 30 Q120 60 150 40" stroke-dasharray="3 8"/>`,
    x,
    y,
    s,
  );

const person = (x, y, s = 1) =>
  g(
    `<circle cx="0" cy="-30" r="18"/><path d="M-30 40 C-30 0 30 0 30 40 Z" fill="${C.white}" fill-opacity="0.2"/>`,
    x,
    y,
    s,
  );

const net = (x, y, w, h, s = 1) =>
  g(
    `${Array.from({ length: 5 }, (_, i) => `<path d="M${(i * w) / 4} 0 V${h}"/>`).join('')}
     ${Array.from({ length: 4 }, (_, i) => `<path d="M0 ${(i * h) / 3} H${w}"/>`).join('')}`,
    x,
    y,
    s,
    'stroke-width="5" opacity="0.7"',
  );

const calendar = (x, y, s = 1) =>
  g(
    `<rect x="-50" y="-40" width="100" height="90" rx="10"/><path d="M-50 -10 H50"/>
     <path d="M-25 -55 V-30"/><path d="M25 -55 V-30"/>
     <rect x="-30" y="5" width="60" height="30" rx="4" fill="${C.coral}" stroke="none"/>`,
    x,
    y,
    s,
  );

const shield = (x, y, s = 1) =>
  g(
    `<path d="M0 -60 L55 -40 V0 C55 35 30 60 0 70 C-30 60 -55 35 -55 0 V-40 Z" fill="${C.turquoise}" fill-opacity="0.3"/>
     <path d="M-22 5 L-6 22 L26 -14"/>`,
    x,
    y,
    s,
  );

const snowflake = (x, y, s = 1) =>
  g(
    `${[0, 60, 120].map((a) => `<path d="M0 -45 V45" transform="rotate(${a})"/><path d="M-12 -30 L0 -42 L12 -30" transform="rotate(${a})"/><path d="M-12 30 L0 42 L12 30" transform="rotate(${a})"/>`).join('')}`,
    x,
    y,
    s,
  );

const truck = (x, y, s = 1) =>
  g(
    `<rect x="-70" y="-40" width="90" height="60" rx="6" fill="${C.white}" fill-opacity="0.15"/>
     <path d="M20 -20 H55 L75 5 V20 H20 Z"/>
     <circle cx="-40" cy="30" r="12" fill="${C.navy}"/><circle cx="50" cy="30" r="12" fill="${C.navy}"/>`,
    x,
    y,
    s,
  );

const factory = (x, y, s = 1) =>
  g(
    `<path d="M-70 40 V-20 L-30 5 V-20 L10 5 V-20 L50 5 V40 Z" fill="${C.white}" fill-opacity="0.15"/>
     <path d="M-60 -20 V-55 H-40 V-30"/>`,
    x,
    y,
    s,
  );

const store = (x, y, s = 1) =>
  g(
    `<path d="M-60 -10 V40 H60 V-10"/><path d="M-70 -10 L-55 -45 H55 L70 -10 Z" fill="${C.coral}" fill-opacity="0.8"/>
     <path d="M-15 40 V5 H15 V40"/>`,
    x,
    y,
    s,
  );

const db = (x, y, s = 1) =>
  g(
    `<ellipse cx="0" cy="-40" rx="50" ry="16"/><path d="M-50 -40 V40 A50 16 0 0 0 50 40 V-40"/>
     <path d="M-50 0 A50 16 0 0 0 50 0"/>`,
    x,
    y,
    s,
  );

const satellite = (x, y, s = 1) =>
  g(
    `<rect x="-22" y="-22" width="44" height="44" rx="8" fill="${C.white}" fill-opacity="0.2"/>
     <path d="M-22 0 H-40"/><rect x="-100" y="-16" width="60" height="32" rx="4" fill="${C.turquoise}"/>
     <path d="M22 0 H40"/><rect x="40" y="-16" width="60" height="32" rx="4" fill="${C.turquoise}"/>
     <path d="M-30 -50 A44 44 0 0 1 30 -50" stroke="${C.sand}"/><path d="M-50 -76 A72 72 0 0 1 50 -76" stroke="${C.sand}"/>`,
    x,
    y,
    s,
  );

const arrow = (x, y, len = 60, s = 1, rot = 0) =>
  g(
    `<path d="M0 0 H${len}"/><path d="M${len - 16} -14 L${len} 0 L${len - 16} 14"/>`,
    x,
    y,
    s,
    '',
    `translate(${x} ${y}) rotate(${rot}) scale(${s})`,
  );

const chartAxes = (x, y, w, h) =>
  g(
    `<path d="M0 0 V${h} H${w}"/><path d="M-12 14 L0 0 L12 14"/><path d="M${w - 14} ${h - 12} L${w} ${h} L${w - 14} ${h + 12}"/>`,
    x,
    y,
    1,
    'stroke-width="6"',
  );

const label = (x, y, text, size = 26, color = C.white, anchor = 'start', weight = 600) =>
  `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${esc(text)}</text>`;

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/* ------------------------------------------------------------------ */
/* Moldura comum                                                        */
/* ------------------------------------------------------------------ */
function frame({
  title,
  subtitle,
  message,
  art,
  series = 'SÉRIE · ECONOMIA MARÍTIMA E PESQUEIRA',
}) {
  const lines = Array.isArray(title) ? title : [title];
  const three = lines.length >= 3;
  const titleSize = three ? 84 : lines.some((l) => l.length > 14) ? 92 : 104;
  const titleY = 300;
  const artCy = three ? 900 : 840;
  const artR = three ? 300 : 330;
  const dots = [];
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < 9; c++)
      dots.push(
        `<circle cx="${820 + c * 30}" cy="${70 + r * 30}" r="${3 + (r + c) / 6}" fill="${C.turquoiseSoft}" opacity="${0.25 + (r + c) / 30}"/>`,
      );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.navy}"/><stop offset="0.55" stop-color="${C.ocean}"/><stop offset="1" stop-color="${C.petrol}"/>
    </linearGradient>
    <linearGradient id="sandg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.sand}" stop-opacity="0"/><stop offset="1" stop-color="${C.sand}" stop-opacity="0.9"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${dots.join('')}
  <path d="M-40 140 Q120 40 260 -40" stroke="${C.sand}" stroke-width="4" fill="none" opacity="0.8"/>
  <circle cx="122" cy="88" r="10" fill="${C.sand}"/>
  <path d="M${W + 40} ${H - 140} Q${W - 120} ${H - 40} ${W - 260} ${H + 40}" stroke="${C.sand}" stroke-width="4" fill="none" opacity="0.8"/>
  <circle cx="${W - 122}" cy="${H - 88}" r="10" fill="${C.sand}"/>
  ${label(70, 130, series, 24, C.turquoiseSoft, 'start', 700)}
  ${lines.map((l, i) => label(70, titleY + i * (titleSize + 8), l.toUpperCase(), titleSize, C.white, 'start', 800)).join('')}
  ${label(70, titleY + lines.length * (titleSize + 8) + 26, subtitle, 40, C.sand, 'start', 600)}
  <circle cx="${W / 2}" cy="${artCy}" r="${artR}" fill="${C.white}" fill-opacity="0.06"/>
  <circle cx="${W / 2}" cy="${artCy}" r="${artR}" fill="none" stroke="${C.turquoiseSoft}" stroke-opacity="0.35" stroke-width="3"/>
  <g transform="translate(0 ${artCy - 840})">${art}</g>
  <path d="M0 1120 Q140 1070 280 1120 T560 1120 T840 1120 T1122 1120 V${H} H0 Z" fill="${C.turquoise}" fill-opacity="0.25"/>
  <path d="M0 1180 Q140 1130 280 1180 T560 1180 T840 1180 T1122 1180 V${H} H0 Z" fill="${C.turquoise}" fill-opacity="0.35"/>
  <rect x="0" y="1290" width="${W}" height="${H - 1290}" fill="url(#sandg)"/>
  <rect x="70" y="1215" width="${W - 140}" height="96" rx="48" fill="${C.navy}" fill-opacity="0.75" stroke="${C.turquoiseSoft}" stroke-opacity="0.5" stroke-width="2"/>
  <circle cx="130" cy="1263" r="26" fill="none" stroke="${C.coral}" stroke-width="6"/><circle cx="130" cy="1263" r="9" fill="${C.coral}"/>
  ${label(180, 1276, message, 34, C.white, 'start', 700)}
</svg>`;
}

/* ------------------------------------------------------------------ */
/* Capas                                                                */
/* ------------------------------------------------------------------ */
const cx = W / 2;
const cards = [
  {
    file: 'economia-maritima-pesqueira-capa',
    title: ['Economia', 'Marítima', 'e Pesqueira'],
    subtitle: 'O mar conecta produção, trabalho e território.',
    message: 'Eficiência, inclusão, ciência e sustentabilidade',
    art: `${ship(cx - 120, 760, 1.4)}${crane(cx + 190, 700, 1)}${fish(cx - 200, 960, 0.9)}${fish(cx + 150, 990, 0.7, true)}${wave(cx - 260, 1060, 520)}`,
  },
  {
    file: 'economia-maritima-muito-alem-dos-navios',
    title: ['Economia', 'Marítima'],
    subtitle: 'Muito além dos navios.',
    message: 'Portos, pesca, energia, logística e tecnologia',
    art: `${ship(cx, 830, 1.1)}${crane(cx - 250, 640, 0.75)}${turbine(cx + 240, 620, 0.9)}${fish(cx - 250, 1000, 0.7)}${antenna(cx + 250, 950, 0.8)}${gear(cx, 600, 0.8)}`,
  },
  {
    file: 'rotas-maritimas',
    title: ['Rotas', 'marítimas'],
    subtitle: 'O mar organiza cadeias globais.',
    message: 'Distâncias, gargalos e custos globais',
    art: `<g fill="none" stroke="${C.turquoiseSoft}" stroke-width="4" stroke-dasharray="10 14" opacity="0.9">
      <path d="M${cx - 260} 900 C${cx - 120} 700 ${cx + 60} 720 ${cx + 250} 640"/>
      <path d="M${cx - 240} 720 C${cx - 60} 900 ${cx + 80} 980 ${cx + 260} 900"/></g>
      ${pin(cx - 260, 900, 0.8)}${pin(cx + 250, 640, 0.8)}${pin(cx - 240, 720, 0.8, C.turquoise)}${pin(cx + 260, 900, 0.8, C.turquoise)}${ship(cx - 20, 830, 1)}`,
  },
  {
    file: 'portos-e-desenvolvimento',
    title: ['Portos e', 'desenvolvimento'],
    subtitle: 'Infraestrutura que conecta territórios.',
    message: 'Rodovias, ferrovias, dados e planejamento',
    art: `${crane(cx - 40, 760, 1.3)}${ship(cx + 200, 960, 0.9)}
      <g fill="none" stroke="${C.white}" stroke-width="8" stroke-linecap="round"><path d="M${cx - 330} 1000 H${cx - 120}"/><path d="M${cx - 330} 1030 H${cx - 120}"/><path d="M${cx - 300} 990 V1040" stroke-width="5"/><path d="M${cx - 240} 990 V1040" stroke-width="5"/><path d="M${cx - 180} 990 V1040" stroke-width="5"/></g>
      <g fill="${C.white}" fill-opacity="0.2" stroke="${C.white}" stroke-width="6"><rect x="${cx - 330}" y="700" width="70" height="140" rx="6"/><rect x="${cx - 250}" y="640" width="70" height="200" rx="6"/></g>`,
  },
  {
    file: 'economia-azul',
    title: ['Economia', 'azul'],
    subtitle: 'Crescer sem degradar.',
    message: 'Sustentabilidade é condição para a renda',
    art: `${sun(cx + 200, 620, 1)}${leaf(cx - 180, 720, 1.1)}${coin(cx + 190, 940, 1)}${fish(cx - 150, 960, 0.8)}${wave(cx - 260, 850, 520)}`,
  },
  {
    file: 'pesca-artesanal-e-industrial',
    title: ['Pesca artesanal', 'e industrial'],
    subtitle: 'Escalas diferentes. Políticas diferentes.',
    message: 'Uma só regra produz efeitos desiguais',
    art: `${boat(cx - 200, 820, 1)}${person(cx - 200, 690, 0.8)}${trawler(cx + 190, 830, 0.85)}
      <path d="M${cx} 620 V1060" stroke="${C.turquoiseSoft}" stroke-width="3" stroke-dasharray="8 12" opacity="0.8"/>`,
  },
  {
    file: 'pesca-recurso-comum',
    title: ['Pesca:', 'recurso comum'],
    subtitle: 'Rival no uso. Difícil exclusão.',
    message: 'Defeso, cotas, licenças e gestão compartilhada',
    art: `${net(cx - 150, 640, 300, 210)}${smallFish(cx - 90, 700, 0.5)}${smallFish(cx + 60, 740, 0.5)}${smallFish(cx - 30, 800, 0.5)}${smallFish(cx + 100, 820, 0.45)}${calendar(cx - 200, 990, 0.9)}${shield(cx + 200, 980, 0.9)}`,
  },
  {
    file: 'bioeconomia-da-pesca',
    title: ['Bioeconomia', 'da pesca'],
    subtitle: 'Pescar mais nem sempre gera mais valor.',
    message: 'Esforço, estoque, custos e renda',
    art: `${chartAxes(cx - 260, 620, 520, 380)}
      <path d="M${cx - 260} 1000 Q${cx} 560 ${cx + 260} 1000" fill="none" stroke="${C.turquoiseSoft}" stroke-width="10" stroke-linecap="round"/>
      <path d="M${cx - 260} 1000 L${cx + 260} 700" fill="none" stroke="${C.coral}" stroke-width="8" stroke-dasharray="14 12" stroke-linecap="round"/>
      <circle cx="${cx}" cy="780" r="14" fill="${C.sand}"/>
      ${label(cx, 745, 'RMS', 26, C.sand, 'middle', 700)}
      ${label(cx - 250, 640, 'captura / receita', 24, C.turquoiseSoft)}
      ${label(cx + 250, 1040, 'esforço de pesca', 24, C.turquoiseSoft, 'end')}
      ${label(cx + 250, 690, 'custo', 24, C.coral, 'end')}`,
  },
  {
    file: 'do-mar-ao-mercado',
    title: ['Do mar', 'ao mercado'],
    subtitle: 'Qualidade em toda a cadeia. Peixe de valor no prato.',
    message: 'O valor se perde quando a cadeia se rompe',
    art: `${fish(cx - 260, 700, 0.6)}${arrow(cx - 190, 700, 50)}${snowflake(cx - 90, 700, 0.8)}${arrow(cx - 30, 700, 50)}${truck(cx + 90, 705, 0.75)}
      ${arrow(cx + 250, 760, 60, 1, 90)}
      ${factory(cx + 230, 900, 0.9)}${arrow(cx + 150, 900, 50, 1, 180)}${store(cx + 10, 900, 0.85)}${arrow(cx - 70, 900, 50, 1, 180)}${coin(cx - 200, 900, 0.8)}`,
  },
  {
    file: 'dados-para-pesca-sustentavel',
    title: ['Dados para', 'uma pesca', 'sustentável'],
    subtitle: 'Tecnologia, governança e conhecimento local.',
    message: 'Monitorar, fiscalizar, planejar e adaptar',
    art: `${satellite(cx + 200, 640, 0.8)}${boat(cx - 200, 760, 0.9)}
      <path d="M${cx - 190} 690 C${cx - 100} 600 ${cx + 60} 600 ${cx + 150} 660" fill="none" stroke="${C.sand}" stroke-width="4" stroke-dasharray="6 10"/>
      ${db(cx, 940, 1)}${chartAxes(cx + 150, 900, 200, 120)}
      <path d="M${cx + 150} 1000 L${cx + 200} 960 L${cx + 240} 985 L${cx + 290} 930 L${cx + 340} 950" fill="none" stroke="${C.coral}" stroke-width="7" stroke-linecap="round"/>
      ${person(cx - 230, 960, 0.9)}${person(cx - 300, 980, 0.7)}`,
  },
];

/* Banner largo da série (2000 × 850) */
function banner() {
  const BW = 2000;
  const BH = 850;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}" viewBox="0 0 ${BW} ${BH}">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.navy}"/><stop offset="0.6" stop-color="${C.ocean}"/><stop offset="1" stop-color="${C.petrol}"/></linearGradient>
  <linearGradient id="sandg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.sand}" stop-opacity="0"/><stop offset="1" stop-color="${C.sand}" stop-opacity="0.85"/></linearGradient></defs>
  <rect width="${BW}" height="${BH}" fill="url(#bg)"/>
  ${label(100, 150, 'SÉRIE TEMÁTICA', 30, C.turquoiseSoft, 'start', 700)}
  ${label(100, 290, 'ECONOMIA MARÍTIMA', 120, C.white, 'start', 800)}
  ${label(100, 420, 'E PESQUEIRA', 120, C.white, 'start', 800)}
  ${label(100, 500, 'O mar conecta produção, trabalho e território.', 46, C.sand, 'start', 600)}
  <circle cx="1560" cy="420" r="300" fill="${C.white}" fill-opacity="0.06"/>
  <circle cx="1560" cy="420" r="300" fill="none" stroke="${C.turquoiseSoft}" stroke-opacity="0.35" stroke-width="3"/>
  ${ship(1470, 400, 1.5)}${crane(1760, 330, 1)}${fish(1330, 560, 0.9)}${fish(1720, 600, 0.7, true)}${wave(1250, 680, 620)}
  <path d="M0 700 Q160 640 320 700 T640 700 T960 700 T1280 700 T1600 700 T1920 700 T2240 700 V${BH} H0 Z" fill="${C.turquoise}" fill-opacity="0.3"/>
  <rect x="0" y="780" width="${BW}" height="70" fill="url(#sandg)"/>
  <circle cx="1880" cy="120" r="12" fill="${C.coral}"/>
</svg>`;
}

/* Capa da série para os cartões (1122 × 1402, mesma moldura) */
const seriesCover = {
  file: 'economia-maritima-e-pesqueira-cover',
  title: ['Economia', 'Marítima', 'e Pesqueira'],
  subtitle: 'Série temática',
  message: 'Dez publicações: do porto ao prato',
  series: 'SÉRIE TEMÁTICA',
  art: cards[0].art,
};

async function write(svg, out, width) {
  const info = await sharp(Buffer.from(svg)).resize({ width }).webp({ quality: 86 }).toFile(out);
  console.log(out, `${info.width}x${info.height}`, `${Math.round(info.size / 1024)} KB`);
}

mkdirSync(OUT, { recursive: true });
mkdirSync(SERIES_OUT, { recursive: true });
for (const card of cards) await write(frame(card), `${OUT}${card.file}.webp`, W);
await write(frame(seriesCover), `${SERIES_OUT}economia-maritima-e-pesqueira-cover.webp`, W);
await write(banner(), `${SERIES_OUT}economia-maritima-e-pesqueira-banner.webp`, 2000);
