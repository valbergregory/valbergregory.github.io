# Auditoria do site anterior — valbergregory.github.io

Data: 11/09/2026. Diagnóstico feito antes de qualquer alteração.

## 1. Estado do repositório

| Item | Resultado |
|---|---|
| Diretório | `D:\Claude code - projetos\valbergregory.github.io` (clone novo; não havia cópia local) |
| `git status --short` | limpo |
| Remoto | `origin https://github.com/valbergregory/valbergregory.github.io.git` |
| Branch | `main` (única); HEAD `3b1e31e chore(license): add MIT license` |
| Histórico | 12 commits, todos feitos pela interface web ("Update index.html", "Add files via upload") |
| Arquivos | `index.html` (5,7 KB), `valber-cv.pdf` (62 KB), `LICENSE` (MIT) |
| GitHub Pages | `build_type: legacy`, fonte = branch `main`, raiz `/`; HTTPS forçado; sem domínio próprio; sem 404 personalizada |
| Workflows | apenas o `pages-build-deployment` automático do GitHub; nenhum workflow em `.github/workflows/` |
| Tópicos | `github-pages`, `personal-website`, `portfolio` |

Nenhum estado inconsistente. Nenhuma alteração local preexistente a preservar.

## 2. Tecnologia e estrutura

- Uma única página HTML estática com CSS e JavaScript embutidos.
- Nenhum sistema de build, nenhum gerenciador de pacotes, nenhum teste.
- Dependência externa: Font Awesome 6.5.0 via CDN (cdnjs) — única requisição de terceiros.
- "Internacionalização" simulada por JavaScript: os blocos `#pt` e `#en` coexistem no mesmo documento e um par de botões alterna `display`. Não há URLs distintas, `hreflang` nem metadados por idioma; o `<html lang="pt-BR">` vale para os dois idiomas.
- Fonte tipográfica: `Segoe UI, sans-serif` (dependente do sistema).

## 3. Conteúdo existente (preservar)

| Conteúdo | Onde está | Decisão |
|---|---|---|
| Nome curto "Valber Gregory" e subtítulo "Economista • Professor Universitário • Analista Judiciário" | `<header>` | substituído pelo nome completo e pelo posicionamento definido no briefing |
| Sobre mim (PT/EN), 1 parágrafo | seções | reescrito, mantendo os fatos |
| Formação: Doutor em Economia (UFPB), Mestre em Economia Aplicada (UFAL), Bacharel em Economia (UFAL), Bacharel em Direito (CESMAC) | seções | preservada e ampliada (MBA FGV; pós Direito 4.0 PUC-Campinas/PUC-PR concluída em 28/07/2026, documentada no inventário local) |
| Competências (4 itens) | seções | absorvidas na página de currículo |
| Links: LinkedIn `linkedin.com/in/valber-gregory-49013744`, GitHub `github.com/valbergregory`, Lattes `lattes.cnpq.br/9400489411252847`, ORCID `0000-0003-1504-8923` | ícones sociais | preservados e verificados (ORCID 200, Lattes 200, LinkedIn responde 999 a robôs — normal) |
| `valber-cv.pdf` | raiz | preservado e oferecido para download (ver risco abaixo) |
| Licença MIT | `LICENSE` | preservada |

Não existe Google Scholar nem e-mail público no site atual. O e-mail institucional `valber.santos@penedo.ufal.br` consta como público na página do curso (inventário de 08/09/2026) e é o adotado.

## 4. Problemas encontrados

### Acessibilidade
- Botões de idioma sem `aria-pressed`/`lang` no controle; troca de idioma não anunciada.
- Ícones sociais dependem de `title` (não é nome acessível confiável); sem texto visível.
- Links externos com `target="_blank"` sem `rel="noopener"` e sem aviso.
- Sem link de salto para o conteúdo, sem `<main>`, sem `<nav>`; landmarks ausentes.
- Hierarquia de headings: `h1` seguido de vários `h2` repetidos entre os dois idiomas (conteúdo duplicado para leitores de tela, já que o bloco oculto usa `display:none` mas o DOM permanece dobrado).
- Foco visível padrão do navegador, sem estilo próprio; alvos dos ícones pequenos.
- Transformações `scale()` em hover sem `prefers-reduced-motion`.

### SEO
- `<title>` genérico ("Valber Gregory | Página Pessoal"); sem `meta description`, canonical, Open Graph, Twitter cards, favicon, sitemap, robots.txt, JSON-LD.
- Conteúdo em inglês invisível para mecanismos de busca como página própria.

### Desempenho
- Página leve (5,7 KB), mas carrega o CSS completo do Font Awesome (~100 KB) para 5 ícones.
- Sem cache-control controlável (Pages), sem preload de fontes (não há fontes próprias).

### Responsividade
- Funciona em telas pequenas por ser uma coluna única; `padding: 2rem` no `body` reduz demais a área útil em celulares.
- Nenhum teste em tablets/desktops largos; sem largura máxima de leitura (linhas muito longas em telas grandes).

### Segurança e privacidade
- `valber-cv.pdf` é uma exportação do LinkedIn (fev/2025) e **contém o número de celular pessoal** e o e-mail pessoal. O arquivo é preservado por instrução, mas recomenda-se substituí-lo por um currículo sem telefone (ver pendências no relatório final).
- Nenhum segredo no repositório nem no histórico (12 commits inspecionados).

### Manutenção
- Todo o conteúdo está no HTML; qualquer atualização exige editar a página pela interface web.
- Sem separação entre dados (pesquisas, publicações) e apresentação.

## 5. Justificativa para migração

A arquitetura atual (HTML único, sem build) não comporta: múltiplas páginas, i18n com URLs próprias, 15 projetos de pesquisa com páginas individuais e filtros, sincronização automática com o GitHub, sitemap/RSS, testes e verificação de links. A migração para Astro (geração estática, TypeScript, coleções de conteúdo) está justificada em `docs/architecture.md`.

## 6. Fatos verificados para o novo conteúdo

- Artigos publicados na Revista Economia Política do Desenvolvimento (UFAL), verificados em 11/09/2026 por acesso direto:
  - Regime de metas (v. 6, n. 19, 2014) — https://periodicos.ufal.br/repd/article/view/8663 — DOI 10.28998/repd.v6i19.8663
  - Ciclos econômicos e o papel do Estado (v. 6, n. 18, 2014) — https://periodicos.ufal.br/repd/article/view/8634 — DOI 10.28998/repd.v6i18.8634
  - Um escorço da racionalidade limitada… (v. 6, n. 20, 2015) — https://periodicos.ufal.br/repd/article/view/8706 — DOI 10.28998/repd.v6i20.8706
  - Análise do protecionismo brasileiro pós-crise de 2008 (v. 6, n. 21, 2015) — https://periodicos.ufal.br/repd/article/view/8713 — DOI 10.28998/repd.v6i21.8713
- Capítulo de livro: *Desenvolvimento e economia regional: evidências do Nordeste e de Alagoas* (org. Thierry Molnar Prates e Maria Cecília Junqueira Lustosa), EDUFAL, ISBN 978-85-5913-114-7 — https://www.edufal.com.br/Produtos/Detalhes/511524
- Artigo de extensão: Grupo Reparo Tecnológico… *Revista Eletrônica Extensão em Debate*, v. 14, n. 23, 2025 — https://periodicos.ufal.br/extensaoemdebate/article/view/18725
- Trabalho sobre a "municipalização" do ITR (Santos & Lages), PDF hospedado em governancadeterras.com.br — apresentado no Seminário de Desenvolvimento Econômico & Governança Fundiária (2015, conforme Lattes).
- O link do Academia.edu (cloudfront) fornecido para "Regime de metas" é uma URL assinada com prazo de validade; substituído pelo link permanente da revista.
- Repositórios da whitelist: 11 públicos confirmados via API; `Port-Network-Resilience` confirmado privado (não será consultado nem linkado).
