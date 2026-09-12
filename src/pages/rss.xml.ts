import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { route } from '@/i18n/routes';
import { getPosts, postSlug } from '@/lib/writing';

/** RSS dos textos em português (idioma principal do site). */
export async function GET(context: APIContext) {
  const site = context.site ?? new URL('https://valbergregory.github.io');
  const posts = await getPosts('pt-br');
  return rss({
    title: 'Valber Gregory — Textos',
    description:
      'Textos semanais de Valber Gregory Barbosa Costa Bezerra Santos sobre economia aplicada, Jurimetria, inteligência artificial no setor público, turismo, portos e pesca, além de notas sobre o andamento das pesquisas.',
    site,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.summary,
      pubDate: p.data.date,
      link: route('writingItem', 'pt-br', postSlug(p)),
      categories: [p.data.category, ...p.data.tags],
    })),
    customData: '<language>pt-BR</language>',
  });
}
