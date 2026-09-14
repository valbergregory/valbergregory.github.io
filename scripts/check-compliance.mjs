#!/usr/bin/env node
/**
 * Verificações de conformidade no site GERADO (dist/), rodadas depois do build
 * (Etapa 9 da auditoria de 13/09/2026):
 *
 *  1. o aviso institucional aparece dentro de <main> nas páginas com afiliações e
 *     projetos, nas duas línguas;
 *  2. as páginas de avisos legais, privacidade e política editorial existem em pt e en
 *     e declaram hreflang uma para a outra;
 *  3. a página inicial não mistura cargo público com promoção de startups/legaltechs;
 *  4. a página de projetos independentes não convida a propostas pelo e-mail
 *     institucional e não usa linguagem comercial;
 *  5. a declaração de independência só aparece em cartões com nature="independent";
 *     na extensão registrada, item em revisão traz o aviso; na página de projetos
 *     independentes (cartão resumido, decisão do titular em 14/09/2026) não há
 *     aviso nem classificação institucional;
 *  6. nenhum script inline sem src (a CSP só permite script-src 'self');
 *  7. conteúdo jurídico e pesquisas em andamento têm avisos contextuais;
 *  8. nada do manifesto privado (data/private/) entrou no build.
 *
 * Uso: node scripts/check-compliance.mjs  (npm run check:compliance)
 */
import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const errors = [];
const fail = (msg) => errors.push(msg);

async function walk(dir, filter = () => true) {
  const out = [];
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, filter)));
    else if (filter(full)) out.push(full);
  }
  return out;
}

async function page(p) {
  const file = path.join(dist, p, 'index.html');
  try {
    return await readFile(file, 'utf8');
  } catch {
    fail(`página ausente: ${p}`);
    return '';
  }
}
const mainOf = (html) => html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? '';
const strip = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

const profile = parseYaml(await readFile(path.join(root, 'src/data/profile.yml'), 'utf8'));
const institutionalEmail = String(profile.email).toLowerCase();

// 1. aviso institucional próximo às afiliações/projetos (dentro de <main>)
const noticePages = [
  '',
  'sobre',
  'contato',
  'curriculo',
  'projetos-independentes',
  'extensao',
  'atuacao-academica',
  'divulgacao-cientifica',
  'en',
  'en/about',
  'en/contact',
  'en/cv',
  'en/independent-projects',
  'en/outreach',
  'en/academic-activity',
  'en/science-outreach',
];
for (const p of noticePages) {
  const html = await page(p);
  if (!html) continue;
  if (!mainOf(html).includes('data-notice="institutional"')) {
    fail(`aviso institucional ausente em <main> de /${p}`);
  }
}

// 2. páginas de conformidade nas duas línguas, com hreflang cruzado
const legalPairs = [
  ['avisos-legais', 'en/legal-notice'],
  ['privacidade', 'en/privacy'],
  ['politica-editorial', 'en/editorial-policy'],
];
for (const [pt, en] of legalPairs) {
  const a = await page(pt);
  const b = await page(en);
  if (a && !a.includes(`hreflang="en" href="https://valbergregory.github.io/${en}/"`)) {
    fail(`/${pt} sem hreflang para /${en}`);
  }
  if (b && !b.includes(`hreflang="pt-BR" href="https://valbergregory.github.io/${pt}/"`)) {
    fail(`/${en} sem hreflang para /${pt}`);
  }
  for (const [p, html] of [
    [pt, a],
    [en, b],
  ]) {
    if (html && !/data-legal-page="(legal|privacy|editorial)"/.test(html)) {
      fail(`/${p} não é uma página de conformidade renderizada`);
    }
  }
}

// 3. início sem promoção de startups/legaltechs junto ao cargo público
for (const p of ['', 'en']) {
  const text = strip(mainOf(await page(p))).toLowerCase();
  for (const word of ['startup', 'legaltech', 'fundador d', 'founder of']) {
    if (text.includes(word)) fail(`página inicial /${p} contém "${word}"`);
  }
}

// 4. projetos independentes: sem e-mail institucional e sem convite comercial em <main>
// Expressões de convite comercial (não palavras soltas: "orçamento" também é dado público
// municipal e "sem preços" é a própria ressalva da página).
const commercial = [
  /\benvie (uma )?proposta\b/i,
  /\bsolicite (um )?or[çc]amento\b/i,
  /\bpe[çc]a (um )?or[çc]amento\b/i,
  /\btabela de pre[çc]os\b/i,
  /\bplanos e pre[çc]os\b/i,
  /\bcontrate\b/i,
  /\binvista\b/i,
  /\bfale com (o )?comercial\b/i,
  /\bcommercial proposal\b/i,
  /\brequest a quote\b/i,
  /\bpricing plans?\b/i,
  /\bhire (us|me)\b/i,
  /\binvest in\b/i,
];
for (const p of ['projetos-independentes', 'en/independent-projects']) {
  const main = mainOf(await page(p));
  if (!main.includes('data-independent-projects'))
    fail(`/${p} sem marcador data-independent-projects`);
  if (main.toLowerCase().includes(institutionalEmail))
    fail(`/${p} exibe o e-mail institucional em <main>`);
  const text = strip(main);
  for (const re of commercial) {
    if (re.test(text)) fail(`/${p} contém linguagem comercial: ${re}`);
  }
}

// 5. declaração de independência só em cartões confirmados (variante completa);
//    na extensão registrada, item em revisão sempre com o aviso; nos projetos
//    independentes (cartão resumido) nem aviso nem classificação institucional.
const independentPhrase = [
  'Projeto independente, sem vínculo',
  'Independent project, with no affiliation',
];
const classificationLabels = ['Relação com a UFAL', 'Relationship with UFAL'];
const briefPages = new Set(['projetos-independentes', 'en/independent-projects']);
for (const p of ['projetos-independentes', 'en/independent-projects', 'extensao', 'en/outreach']) {
  const html = await page(p);
  const confirmed = (html.match(/data-project-nature="independent"/g) ?? []).length;
  const declared = independentPhrase.reduce((n, s) => n + (html.split(s).length - 1), 0);
  const reviewNotices = (html.match(/data-notice="under-review"/g) ?? []).length;
  if (briefPages.has(p)) {
    if (declared > 0) fail(`/${p}: cartão resumido não deve declarar independência`);
    if (reviewNotices > 0) fail(`/${p}: cartão resumido não deve exibir aviso "em revisão"`);
    for (const label of classificationLabels) {
      if (mainOf(html).includes(label))
        fail(`/${p}: classificação institucional ("${label}") no cartão resumido`);
    }
    continue;
  }
  if (declared !== confirmed) {
    fail(
      `/${p}: ${declared} declaração(ões) de independência para ${confirmed} projeto(s) confirmado(s)`,
    );
  }
  const underReview = (html.match(/data-project-nature="under-review"/g) ?? []).length;
  if (underReview !== reviewNotices) {
    fail(`/${p}: ${underReview} projeto(s) em revisão, ${reviewNotices} aviso(s) "em revisão"`);
  }
}

// 6. nenhum script inline (CSP: script-src 'self')
const htmlFiles = await walk(dist, (f) => f.endsWith('.html'));
for (const f of htmlFiles) {
  const html = await readFile(f, 'utf8');
  const inline = [...html.matchAll(/<script\b([^>]*)>/g)].filter(
    ([, attrs]) => !/\bsrc=/.test(attrs) && !/type="application\/ld\+json"/.test(attrs),
  );
  if (inline.length) fail(`${path.relative(root, f)}: ${inline.length} script(s) inline`);
  if (html.includes('data/private/')) fail(`${path.relative(root, f)} menciona data/private/`);
}

// 7. avisos contextuais: conteúdo jurídico e pesquisa em andamento
const contentsDir = path.join(root, 'src/content/conteudos');
const legalContents = (await walk(contentsDir, (f) => f.endsWith('.md'))).filter(async () => true);
let legalExpected = 0;
for (const f of legalContents) {
  const fm = (await readFile(f, 'utf8')).match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const data = parseYaml(fm);
  if ((data.areas ?? []).includes('direito') && !data.draft) legalExpected += 1;
}
let legalFound = 0;
for (const f of htmlFiles) {
  if (!/[\\/](conteudos|content)[\\/]/.test(f)) continue;
  const html = await readFile(f, 'utf8');
  if (html.includes('data-notice="legal"')) legalFound += 1;
}
if (legalFound < legalExpected) {
  fail(`aviso jurídico em ${legalFound} página(s) de conteúdo, esperado ≥ ${legalExpected}`);
}
const research = parseYaml(await readFile(path.join(root, 'src/data/research.yml'), 'utf8'));
for (const r of research.filter((r) => r.showPreliminaryFindings)) {
  for (const p of [`pesquisa/${r.slug}`, `en/research/${r.slug}`]) {
    const html = await page(p);
    if (html && !html.includes('data-notice="wip"'))
      fail(`/${p} sem aviso de trabalho em andamento`);
  }
}

// 8. manifesto privado fora do build (por hash de conteúdo)
const privateDir = path.join(root, 'data', 'private');
const privateFiles = await walk(privateDir);
if (privateFiles.length) {
  const hashes = new Set();
  for (const f of privateFiles)
    hashes.add(
      createHash('sha256')
        .update(await readFile(f))
        .digest('hex'),
    );
  for (const f of await walk(dist)) {
    const h = createHash('sha256')
      .update(await readFile(f))
      .digest('hex');
    if (hashes.has(h)) fail(`arquivo do manifesto privado empacotado: ${path.relative(root, f)}`);
  }
}

try {
  await stat(dist);
} catch {
  fail('dist/ não existe — rode npm run build antes');
}

if (errors.length) {
  for (const e of errors) console.error(`ERRO ${e}`);
  process.exit(1);
}
console.log(`Conformidade OK (${htmlFiles.length} páginas verificadas).`);
