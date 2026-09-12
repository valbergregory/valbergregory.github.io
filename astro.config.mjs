// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Página pessoal estática publicada no GitHub Pages (raiz do domínio do usuário).
export default defineConfig({
  site: 'https://valbergregory.github.io',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  // pt-BR é o idioma principal e vive na raiz; o inglês vive em /en/.
  i18n: {
    defaultLocale: 'pt-br',
    locales: ['pt-br', 'en'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      // hreflang é emitido no <head> de cada página (rotas traduzidas têm slugs distintos).
      filter: (page) => !page.includes('/404'),
      changefreq: 'weekly',
    }),
  ],
  image: {
    responsiveStyles: true,
  },
  compressHTML: 'jsx',
});
