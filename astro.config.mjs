// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Página pessoal estática publicada no GitHub Pages (raiz do domínio do usuário).
export default defineConfig({
  site: 'https://valbergregory.github.io',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  // URLs antigas das seções "Atualizações" e "Textos", substituídas por "Conteúdos" (12/09/2026).
  redirects: {
    '/atualizacoes/': '/conteudos/',
    '/en/updates/': '/en/content/',
    '/textos/': '/conteudos/',
    '/en/writing/': '/en/content/',
    '/textos/site-reformulado/': '/conteudos/',
    '/textos/compendios-publicos/': '/conteudos/',
    '/textos/dados-replicacao-aisecdev/': '/conteudos/',
    '/textos/artigo-extensao-em-debate/': '/conteudos/',
    '/textos/tres-repositorios/': '/conteudos/',
  },
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
  vite: {
    build: {
      // Nunca embutir scripts pequenos como <script type="module"> inline: a CSP
      // (BaseLayout.astro) só permite script-src 'self'. Imagens pequenas viram arquivos.
      assetsInlineLimit: 0,
    },
  },
});
