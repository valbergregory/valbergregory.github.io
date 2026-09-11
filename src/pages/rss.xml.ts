import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { route } from '@/i18n/routes';

/** RSS das atualizações em português (idioma principal do site). */
export async function GET(context: APIContext) {
  const entries = (await getCollection('updates'))
    .filter((u) => u.data.lang === 'pt-br' && !u.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: 'Valber Gregory — atualizações de pesquisa',
    description:
      'Diário de pesquisa de Valber Gregory Barbosa Costa Bezerra Santos: notas sobre o andamento dos projetos em Economia Aplicada, Jurimetria, IA no setor público, turismo e economia marítima e pesqueira.',
    site: context.site ?? 'https://valbergregory.github.io',
    items: entries.map((e) => ({
      title: e.data.title,
      description: e.data.summary,
      pubDate: e.data.date,
      link: e.data.link ?? `${route('updates', 'pt-br')}#${e.id}`,
      categories: [e.data.category],
    })),
    customData: '<language>pt-BR</language>',
  });
}
