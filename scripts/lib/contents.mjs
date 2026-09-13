/**
 * Leitura das publicações da seção Conteúdos fora do Astro (relatório semestral,
 * ledger de datas): frontmatter em YAML, URL canônica e semana ISO.
 * Replica as regras de src/lib/contents.ts (slug, agrupamento por série/tipo).
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

export const CONTENTS_DIR = 'src/content/conteudos';
export const SERIES_DIR = 'src/content/series';

const TYPE_SLUGS = {
  serie: { 'pt-br': 'serie', en: 'series' },
  nota: { 'pt-br': 'notas', en: 'notes' },
  opiniao: { 'pt-br': 'opiniao', en: 'opinion' },
  leitura: { 'pt-br': 'leituras', en: 'reading' },
  aula: { 'pt-br': 'sala-de-aula', en: 'classroom' },
  evento: { 'pt-br': 'eventos', en: 'events' },
};
const CONTENTS_BASE = { 'pt-br': '/conteudos/', en: '/en/content/' };

export async function walkMarkdown(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walkMarkdown(full)));
    else if (entry.name.endsWith('.md') && !entry.name.startsWith('_')) out.push(full);
  }
  return out.sort();
}

export function parseFrontmatter(text, file) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) throw new Error(`${file}: sem frontmatter`);
  return parseYaml(m[1]);
}

function fileBase(file) {
  return path
    .basename(file)
    .replace(/\.md$/, '')
    .replace(/^\d{2,3}-/, '')
    .replace(/\.(pt-br|en)$/, '')
    .toLowerCase();
}

/** Data em YAML pode vir como Date ou string; devolve YYYY-MM-DD. */
export function isoDate(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

export function isoWeek(value) {
  const src = value instanceof Date ? value : new Date(String(value));
  const d = new Date(Date.UTC(src.getUTCFullYear(), src.getUTCMonth(), src.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Semana ISO seguinte (YYYY-Www). */
export function nextIsoWeek(week) {
  const [y, w] = week.split('-W').map(Number);
  // quinta-feira da semana ISO pedida → +7 dias → semana seguinte
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4.getTime() - (day - 1) * 86400000 + (w - 1) * 7 * 86400000);
  return isoWeek(new Date(monday.getTime() + 7 * 86400000 + 3 * 86400000));
}

/** Carrega séries (slug público por idioma) e publicações com URL canônica. */
export async function loadContents(root = process.cwd()) {
  const seriesFiles = await walkMarkdown(path.join(root, SERIES_DIR));
  const seriesSlug = new Map(); // `${series}/${lang}` → slug
  for (const f of seriesFiles) {
    const fm = parseFrontmatter(await readFile(f, 'utf8'), f);
    seriesSlug.set(`${fm.series}/${fm.lang}`, fm.slug);
  }
  const files = await walkMarkdown(path.join(root, CONTENTS_DIR));
  const items = [];
  for (const f of files) {
    const fm = parseFrontmatter(await readFile(f, 'utf8'), f);
    const lang = fm.lang;
    const type = fm.type ?? 'nota';
    const slug = fm.slug ?? fileBase(f);
    const group = fm.series
      ? (seriesSlug.get(`${fm.series}/${lang}`) ?? fm.series)
      : TYPE_SLUGS[type]?.[lang];
    items.push({
      file: path.relative(root, f).replace(/\\/g, '/'),
      lang,
      title: fm.title,
      type,
      series: fm.series ?? null,
      order: fm.order ?? null,
      path: `${CONTENTS_BASE[lang]}${group}/${slug}/`,
      date: isoDate(fm.date),
      firstPublishedAt: isoDate(fm.firstPublishedAt),
      updatedAt: isoDate(fm.updatedAt ?? fm.updated),
      semester: fm.semester ?? null,
      contentNature: fm.contentNature ?? 'scientific-outreach',
      knowledgeArea: fm.knowledgeArea ?? '',
      institutionalRelation: fm.institutionalRelation ?? 'none',
      reviewStatus: fm.reviewStatus ?? 'editorial',
      license: fm.license ?? 'all-rights-reserved',
      sources: fm.sources ?? [],
      doi: fm.doi ?? '',
      draft: Boolean(fm.draft),
    });
  }
  return items;
}
