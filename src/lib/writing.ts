import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '@/i18n/routes';

export type Post = CollectionEntry<'updates'>;

/**
 * Slug público de um texto: o campo `slug` do frontmatter ou o nome do arquivo
 * sem a data inicial (AAAA-MM-DD-) e sem o sufixo de idioma (.pt-br / .en).
 *   2026-09-11-site-reformulado.pt-br  →  site-reformulado
 */
export function postSlug(post: Post): string {
  if (post.data.slug) return post.data.slug;
  // O id do loader glob é "slugificado" (perde os pontos); o nome do arquivo não.
  const file = (post.filePath ?? post.id).split(/[\\/]/).pop() ?? post.id;
  return file
    .replace(/\.md$/, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .replace(/\.(pt-br|en)$/, '')
    .toLowerCase();
}

/** Textos publicados em um idioma, do mais recente para o mais antigo. */
export async function getPosts(lang: Lang): Promise<Post[]> {
  const all = await getCollection('updates');
  return all
    .filter((p) => p.data.lang === lang && !p.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** O mesmo texto no outro idioma, se existir. */
export async function getCounterpart(post: Post): Promise<Post | undefined> {
  const other: Lang = post.data.lang === 'en' ? 'pt-br' : 'en';
  const slug = postSlug(post);
  return (await getPosts(other)).find((p) => postSlug(p) === slug);
}

export function postDateIso(post: Post): string {
  return post.data.date.toISOString().slice(0, 10);
}
