#!/usr/bin/env node
/**
 * Verifica links do site gerado em dist/.
 *
 *  - Links internos (href/src que começam com "/" ou relativos): precisam
 *    apontar para um arquivo existente em dist/ (ou diretório com index.html).
 *    Âncoras (#id) internas são verificadas quando o alvo é a mesma página.
 *  - Links externos: verificados com HEAD/GET quando --external é passado.
 *    Falhas externas são avisos, a menos que --strict-external seja usado,
 *    porque sites de terceiros (LinkedIn, Lattes) bloqueiam robôs.
 *
 * Uso: node scripts/check-links.mjs [--external] [--strict-external]
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const checkExternal = process.argv.includes('--external');
const strictExternal = process.argv.includes('--strict-external');

/** Hosts que bloqueiam robôs por padrão (LinkedIn, Lattes, Google Scholar): só avisamos. */
/** Sites irmãos publicados no mesmo domínio, mas em outro repositório. */
const SIBLING_SITES = ['https://valbergregory.github.io/economia-da-cultura/'];

const SOFT_HOSTS = new Set([
  'www.linkedin.com',
  'linkedin.com',
  'lattes.cnpq.br',
  'scholar.google.com',
  'scholar.google.com.br',
  // Bloqueiam robôs (403) mas abrem no navegador.
  'www.oecd.org',
  'www.marinha.mil.br',
]);

/** Desfaz as entidades HTML de um atributo href/src. */
function unescapeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

async function exists(file) {
  try {
    const s = await stat(file);
    return s.isFile() || s.isDirectory();
  } catch {
    return false;
  }
}

async function resolveInternal(target) {
  const clean = decodeURIComponent(target.split('#')[0].split('?')[0]);
  if (!clean || clean === '/') return exists(path.join(dist, 'index.html'));
  const candidate = path.join(dist, clean);
  if (await exists(candidate)) {
    const s = await stat(candidate);
    if (s.isDirectory()) return exists(path.join(candidate, 'index.html'));
    return true;
  }
  return exists(`${candidate}.html`);
}

const attrRe =
  /<(?:a|link|img|script|source|iframe)\b[^>]*?\s(?:href|src|srcset)=["']([^"']+)["']/gi;
const idRe = /\sid=["']([^"']+)["']/g;

const htmlFiles = await walk(dist);
const errors = [];
const warnings = [];
const externalTargets = new Map();
let internalCount = 0;

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const ids = new Set([...html.matchAll(idRe)].map((m) => m[1]));
  const rel = path.relative(dist, file).replace(/\\/g, '/');

  for (const match of html.matchAll(attrRe)) {
    const raw = unescapeHtml(match[1].trim());
    // srcset: pega cada URL
    const targets =
      raw.includes(',') && /\s\d+[wx]/.test(raw)
        ? raw.split(',').map((s) => s.trim().split(/\s+/)[0])
        : [raw];

    for (const target of targets) {
      if (
        !target ||
        target.startsWith('mailto:') ||
        target.startsWith('tel:') ||
        target.startsWith('data:')
      )
        continue;
      if (/^https?:\/\//i.test(target)) {
        // Outros "project sites" do mesmo usuário (ex.: /economia-da-cultura/) não
        // fazem parte deste build: são tratados como links externos.
        const sibling = SIBLING_SITES.some((prefix) => target.startsWith(prefix));
        if (target.startsWith('https://valbergregory.github.io') && !sibling) {
          const local = target.replace('https://valbergregory.github.io', '') || '/';
          internalCount += 1;
          if (!(await resolveInternal(local)))
            errors.push(`${rel}: link interno absoluto quebrado → ${target}`);
        } else if (!externalTargets.has(target)) {
          externalTargets.set(target, rel);
        }
        continue;
      }
      if (target.startsWith('#')) {
        const id = target.slice(1);
        if (id && !ids.has(id)) errors.push(`${rel}: âncora inexistente → ${target}`);
        continue;
      }
      internalCount += 1;
      const abs = target.startsWith('/')
        ? target
        : `/${path.posix.join(path.posix.dirname(rel), target)}`;
      if (!(await resolveInternal(abs))) errors.push(`${rel}: link interno quebrado → ${target}`);
    }
  }
}

console.log(`${htmlFiles.length} páginas, ${internalCount} referências internas verificadas.`);

if (checkExternal) {
  console.log(`Verificando ${externalTargets.size} URLs externas…`);
  const check = async (url) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      // DOI: basta o resolvedor responder com redirecionamento; o destino
      // (site da revista) é responsabilidade do editor e pode ter TLS inválido.
      if (new URL(url).hostname === 'doi.org') {
        const r = await fetch(url, {
          method: 'HEAD',
          redirect: 'manual',
          signal: controller.signal,
        });
        return r.status >= 300 && r.status < 400 ? 200 : r.status;
      }
      let res = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (link checker; valbergregory.github.io)' },
      });
      if (res.status === 405 || res.status === 403 || res.status >= 500) {
        res = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (link checker; valbergregory.github.io)' },
        });
      }
      return res.status;
    } catch (e) {
      return `erro: ${e instanceof Error ? e.message : e}`;
    } finally {
      clearTimeout(timer);
    }
  };

  const entries = [...externalTargets.entries()];
  const concurrency = 6;
  let index = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (index < entries.length) {
        const [url, from] = entries[index++];
        const status = await check(url);
        const ok = typeof status === 'number' && status >= 200 && status < 400;
        if (ok) continue;
        const host = new URL(url).hostname;
        const msg = `${from}: externo ${url} → ${status}`;
        if (SOFT_HOSTS.has(host) || !strictExternal) warnings.push(msg);
        else errors.push(msg);
      }
    }),
  );
}

for (const w of warnings) console.warn(`AVISO ${w}`);
for (const e of errors) console.error(`ERRO ${e}`);

if (errors.length > 0) {
  console.error(`\n${errors.length} erro(s) de link.`);
  process.exit(1);
}
console.log(`Links OK${warnings.length ? ` (${warnings.length} aviso(s) externo(s))` : ''}.`);
