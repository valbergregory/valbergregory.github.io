import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { contentPath, getContents, getSeries } from '@/lib/contents';

/** RSS das publicações em português (idioma principal do site). */
export async function GET(context: APIContext) {
  const site = context.site ?? new URL('https://valbergregory.github.io');
  const series = await getSeries('pt-br');
  const contents = await getContents('pt-br');
  return rss({
    title: 'Valber Gregory — Conteúdos e Séries Temáticas',
    description:
      'Publicações de Valber Gregory Barbosa Costa Bezerra Santos sobre Economia, Direito, dados e tecnologia: séries temáticas (Economia da Informação e de Redes; Economia Marítima e Pesqueira), notas de pesquisa, opiniões e leituras.',
    site,
    items: contents.map((c) => ({
      title: c.data.subtitle ? `${c.data.title} — ${c.data.subtitle}` : c.data.title,
      description: c.data.summary,
      pubDate: c.data.date,
      link: contentPath(
        c,
        series.find((s) => s.data.series === c.data.series),
      ),
      categories: [c.data.type, ...c.data.tags],
    })),
    customData: '<language>pt-BR</language>',
  });
}
