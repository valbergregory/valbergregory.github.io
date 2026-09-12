# Arquitetura do site

## Decisão: migração de HTML único para Astro

O site anterior era um `index.html` com CSS e JavaScript embutidos, sem build, com dois blocos de idioma alternados por script (ver `docs/site-audit.md`). Essa arquitetura não comporta os requisitos da reformulação: múltiplas páginas, versão em inglês com URLs próprias e `hreflang`, quinze projetos de pesquisa com página individual e filtros, sincronização automática com o GitHub, sitemap, RSS, testes e verificação de links.

A migração para **Astro 7 (estável)** foi escolhida porque:

- gera HTML estático — o GitHub Pages não executa servidor, e o site não precisa de um;
- envia JavaScript ao navegador apenas onde há interação (menu móvel, tema, filtros): cerca de 3 KB no total;
- tem coleções de conteúdo tipadas (Zod), o que transforma o cadastro de pesquisas em dados validados no build;
- otimiza imagens no build (`astro:assets` + sharp) e permite fontes self-hosted;
- tem integrações oficiais de sitemap e RSS;
- é TypeScript de ponta a ponta e roda no Node 22 LTS.

Next.js e frameworks com dependência de servidor foram descartados: não há nada dinâmico no site.

## Versões

| Ferramenta | Versão              | Observação                                            |
| ---------- | ------------------- | ----------------------------------------------------- |
| Node       | ≥ 22.12 (usado: 24) | `.nvmrc` = 22                                         |
| Astro      | 7.3.x               | compilador Rust, Markdown nativo (Sätteri)            |
| TypeScript | 5.9                 | compatível com `@astrojs/check` e `typescript-eslint` |
| Vitest     | 4.1                 | testes de dados, sincronização e i18n                 |
| ESLint     | 10                  | flat config + `eslint-plugin-astro`                   |
| sharp      | 0.35                | imagens responsivas e geração das imagens sociais     |
| Pagefind   | 1.5                 | busca estática, índice gerado no build                |
| pdfkit     | 0.20                | currículo em PDF gerado no build                      |

## Estrutura

```
src/
  assets/            fotografia (otimizada no build)
  components/        componentes reutilizáveis (Header, Footer, Seo, ResearchCard…)
    pages/           "páginas-modelo" que recebem `lang` e são usadas pelas rotas pt-BR e EN
  content/
    pages/           textos longos em Markdown (Sobre, Ensino), um arquivo por idioma
    series/          apresentação das séries temáticas (seção "Conteúdos"), um arquivo por idioma
    conteudos/       publicações da seção "Conteúdos" (capas na mesma pasta), um arquivo por idioma
  content.config.ts  esquemas Zod das coleções (research, publications, outreach, series, contents, pages)
  data/
    research.yml     cadastro editorial das pesquisas (fonte de verdade)
    publications.yml publicações verificadas
    outreach.yml     extensão e projetos aplicados
    profile.yml      perfil, vínculos, formação, bio em cinco idiomas
    taxonomies.yml   vocabulários controlados (áreas, estágios, métodos…)
    github-whitelist.json  repositórios autorizados para consulta automática
    review-needed.yml      itens pendentes de confirmação humana (não publicados)
  generated/
    github-projects.json   metadados públicos gerados por scripts/sync-github.mjs
  i18n/              rotas traduzidas e strings de interface
  layouts/           BaseLayout (head, header, main, footer)
  lib/               carregamento de dados, JSON-LD, formatação de datas, utilitários dos conteúdos
  pages/             rotas pt-BR (raiz) e EN (/en/)
  styles/            tokens (cores, tipografia) e estilos globais
public/              arquivos estáticos (favicon, OG, robots, manifest); o currículo PDF é gerado no build
scripts/             sync-github, check-links, check-secrets, generate-og, generate-cv, set-portfolio-secret
tests/               Vitest
docs/                documentação e QA
.github/workflows/   deploy, CI de pull requests, lembrete do token, links externos
```

## Internacionalização

- pt-BR na raiz (`/sobre/`), inglês em `/en/` (`/en/about/`). Os slugs são traduzidos, por isso o mapa de rotas é explícito em `src/i18n/routes.ts`.
- Cada rota tem um componente-modelo em `src/components/pages/` que recebe `lang`; as rotas em `src/pages/` e `src/pages/en/` só o instanciam.
- `hreflang` e `x-default` são emitidos em `Seo.astro`; o seletor de idioma aponta para a página equivalente.
- Títulos originais dos artigos são preservados nos dois idiomas; traduções são apoio.
- A bio em francês, alemão e italiano fica guardada em `profile.yml`, com a seção da página Sobre desligada por enquanto (`SHOW_MULTILINGUAL_BIO`).
- As publicações da seção "Conteúdos" existem por idioma (slugs traduzidos no frontmatter); a versão pt-BR e a EN se ligam pela mesma série e ordem — ou pelo nome do arquivo, nos conteúdos avulsos — e apontam uma para a outra (`hreflang`).

## Conteúdo editorial × metadados automáticos

| Origem                               | Conteúdo                                                                            | Quem atualiza                                                                    |
| ------------------------------------ | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/data/research.yml`              | título, autoria, estágio, pergunta, métodos, achados autorizados, limitações, links | edição manual                                                                    |
| `src/generated/github-projects.json` | linguagem, tópicos, licença, release, data do último commit, descrição pública      | `scripts/sync-github.mjs` (CI a cada 6 h, `repository_dispatch`, ou manualmente) |

O script nunca altera o estágio científico, resultados, autoria ou título. Repositórios privados não são consultados nem linkados; o projeto `Port-Network-Resilience` aparece apenas pelo cadastro editorial, sem URL.

## Desempenho e privacidade

- CSS crítico inline por página (`inlineStylesheets: 'auto'`); fontes variáveis self-hosted com `font-display: swap`.
- Imagens em WebP com `srcset` e dimensões explícitas; a foto do hero é carregada com prioridade alta.
- Sem analytics, cookies ou requisições a terceiros. Não há banner de consentimento porque não há o que consentir.
- Tema escuro por preferência do sistema ou escolha do usuário (persistida em `localStorage`), aplicado antes da primeira pintura para evitar flash.

## Acessibilidade

Link de salto, landmarks, hierarquia de headings, foco visível com contraste, alvos ≥ 44 px, menu móvel com `aria-expanded`/Escape, estados que não dependem só de cor (badges de estágio sempre com texto), `prefers-reduced-motion`, tabelas com `caption` e `scope`, `lang` correto em cada trecho de outro idioma. A auditoria automatizada (axe-core, WCAG 2.2 AA) roda em `docs/qa/`.
