import { getCollection, type CollectionEntry } from 'astro:content';
import { route, type Lang } from '@/i18n/routes';
import { CONTENT_TYPES, SERIES } from '@/content.config';

export type Content = CollectionEntry<'contents'>;
export type Series = CollectionEntry<'series'>;
export type ContentType = (typeof CONTENT_TYPES)[number];
export type SeriesKey = (typeof SERIES)[number];

/** Segmento de URL dos conteúdos avulsos (sem série), por tipo e idioma. */
export const TYPE_SLUGS: Record<ContentType, Record<Lang, string>> = {
  serie: { 'pt-br': 'serie', en: 'series' },
  nota: { 'pt-br': 'notas', en: 'notes' },
  opiniao: { 'pt-br': 'opiniao', en: 'opinion' },
  leitura: { 'pt-br': 'leituras', en: 'reading' },
  aula: { 'pt-br': 'sala-de-aula', en: 'classroom' },
  evento: { 'pt-br': 'eventos', en: 'events' },
};

/** Nome do arquivo sem extensão, sem o número de ordem e sem o sufixo de idioma. */
function fileBase(entry: { filePath?: string; id: string }): string {
  const file = (entry.filePath ?? entry.id).split(/[\\/]/).pop() ?? entry.id;
  return file
    .replace(/\.md$/, '')
    .replace(/^\d{2,3}-/, '')
    .replace(/\.(pt-br|en)$/, '')
    .toLowerCase();
}

/** Slug público de uma publicação no seu idioma. */
export function contentSlug(c: Content): string {
  return c.data.slug ?? fileBase(c);
}

/**
 * Chave independente do idioma, usada para ligar as versões pt-BR e EN:
 * série + ordem para cartões de série; tipo + nome do arquivo para os demais.
 */
export function contentKey(c: Content): string {
  if (c.data.series && c.data.order) return `${c.data.series}/${c.data.order}`;
  return `${c.data.type}/${fileBase(c)}`;
}

/** Publicado = não rascunho e com data já alcançada (permite agendar pela data). */
function isLive(d: { draft: boolean; date: Date }): boolean {
  return !d.draft && d.date.getTime() <= Date.now();
}

/** Séries de um idioma, na ordem editorial definida em SERIES. */
export async function getSeries(lang: Lang): Promise<Series[]> {
  const all = await getCollection('series');
  return all
    .filter((s) => s.data.lang === lang && isLive(s.data))
    .sort((a, b) => SERIES.indexOf(a.data.series) - SERIES.indexOf(b.data.series));
}

export async function getSeriesByKey(lang: Lang, key: SeriesKey): Promise<Series | undefined> {
  return (await getSeries(lang)).find((s) => s.data.series === key);
}

/**
 * Publicações de um idioma: por data (mais recente primeiro); na mesma data,
 * pela ordem editorial das séries e, dentro da série, pela ordem de leitura.
 */
export async function getContents(lang: Lang): Promise<Content[]> {
  const all = await getCollection('contents');
  const seriesRank = (c: Content) =>
    c.data.series ? SERIES.indexOf(c.data.series) : SERIES.length;
  return all
    .filter((c) => c.data.lang === lang && isLive(c.data))
    .sort((a, b) => {
      const byDate = b.data.date.getTime() - a.data.date.getTime();
      if (byDate !== 0) return byDate;
      const bySeries = seriesRank(a) - seriesRank(b);
      if (bySeries !== 0) return bySeries;
      return (a.data.order ?? 0) - (b.data.order ?? 0);
    });
}

/** Publicações de uma série, na ordem de leitura. */
export async function getSeriesContents(lang: Lang, key: SeriesKey): Promise<Content[]> {
  return (await getContents(lang))
    .filter((c) => c.data.series === key)
    .sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));
}

/** A mesma publicação no outro idioma, se existir. */
export async function getCounterpart(c: Content): Promise<Content | undefined> {
  const other: Lang = c.data.lang === 'en' ? 'pt-br' : 'en';
  const key = contentKey(c);
  return (await getContents(other)).find((p) => contentKey(p) === key);
}

export function seriesPath(s: Series): string {
  return route('contentsSeries', s.data.lang, s.data.slug);
}

/** Caminho de uma publicação: /conteudos/<série>/<slug>/ ou /conteudos/<tipo>/<slug>/. */
export function contentPath(c: Content, series?: Series): string {
  const group = c.data.series
    ? (series?.data.slug ?? c.data.series)
    : TYPE_SLUGS[c.data.type][c.data.lang];
  return route('contentsItem', c.data.lang, `${group}/${contentSlug(c)}`);
}

export function dateIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Tempo de leitura estimado (200 palavras por minuto), mínimo 1. */
export function readingTime(body: string | undefined): number {
  const words = (body ?? '')
    .replace(/[#>*_`\-|]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
