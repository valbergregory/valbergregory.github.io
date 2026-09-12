# Guia de conteúdo

Todo o conteúdo do site vive em arquivos de texto versionados. Nenhuma alteração exige mexer em componentes. Depois de editar, rode `npm run build` (ou `npm run dev` para ver ao vivo) e faça commit; o GitHub Actions publica.

Regra geral: **não invente**. Estágios, títulos, autores e resultados só entram quando confirmados. O que estiver pendente vai para `src/data/review-needed.yml`, que não é publicado.

## Adicionar uma pesquisa

1. Abra `src/data/research.yml` e copie um bloco existente.
2. Preencha os campos (todos validados no build por `src/content.config.ts`):

| Campo                                                                        | O que é                                                                                      |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `slug`                                                                       | identificador estável em minúsculas e hífens; vira a URL `/pesquisa/<slug>/`                 |
| `title`                                                                      | título original do trabalho (não traduza)                                                    |
| `alternativeTitle` + `titlePending: true`                                    | segundo título candidato, quando a escolha não foi feita                                     |
| `titleProvisional: true`                                                     | mostra o aviso "título provisório"                                                           |
| `authors`                                                                    | lista de nomes completos, na ordem de autoria                                                |
| `track`                                                                      | uma das áreas de `taxonomies.yml`                                                            |
| `subtrack`                                                                   | opcional, `{pt, en}`                                                                         |
| `status`                                                                     | `estruturacao`, `em-desenvolvimento`, `redacao`, `pre-submissao`, `submetido` ou `publicado` |
| `summary`, `researchQuestion`, `motivation`                                  | textos `{pt, en}`                                                                            |
| `dataSources`, `methods`, `limitations`, `implications`, `extensionProducts` | listas `{pt: [...], en: [...]}`                                                              |
| `methodTags`                                                                 | chaves de `taxonomies.yml › methods` (alimentam o filtro)                                    |
| `showPreliminaryFindings` + `preliminaryFindings`                            | ver "Ocultar achados preliminares"                                                           |
| `repository` / `repositoryVisibility`                                        | URL do GitHub só quando `public`; `private` ou `none` exigem `repository: null`              |
| `languages`, `outputTypes`, `codeAvailable`, `dataAvailable`                 | alimentam os filtros                                                                         |
| `featured` + `featuredOrder`                                                 | ver "Destacar um projeto"                                                                    |
| `allowAutomaticMetadata`                                                     | `true` só para repositórios públicos que estejam na whitelist                                |
| `lastEditorialReview`                                                        | data `AAAA-MM-DD` da última revisão do texto                                                 |
| `materials`                                                                  | lista opcional de `{label: {pt, en}, url}`                                                   |

3. Se o repositório for público e você quiser metadados automáticos, adicione `owner/repo` em `src/data/github-whitelist.json`.
4. `npm test` verifica as regras (whitelist, repositório privado sem URL, etc.).

## Atualizar o estágio de uma pesquisa

Altere `status` em `research.yml` e atualize `lastEditorialReview`. Use `submetido` apenas com submissão efetiva e `publicado` apenas quando o trabalho estiver publicado — nesse caso, cadastre também a publicação em `publications.yml` e mantenha a página do projeto com o link.

## Inserir um artigo publicado

Adicione um bloco em `src/data/publications.yml`:

```yaml
- id: identificador-unico
  type: article # article | chapter | presented | abstract
  title: 'Título exato'
  authors: [Nome Completo 1, Nome Completo 2]
  venue: Nome do periódico
  volume: 'v. 6, n. 19'
  pages: 49–61
  year: 2014
  doi: 10.28998/...
  url: https://...
  pdf: https://...
  language: pt
  track: economia-politicas-publicas
```

Para capítulos use `bookTitle`, `editors`, `publisher`, `place`, `isbn`. Só cadastre links verificados.

## Cadastrar autores

Em `research.yml` e `publications.yml`, `authors` é uma lista de nomes completos na ordem de autoria. Não use abreviações nem "et al." quando os nomes forem conhecidos.

## Adicionar um produto de extensão

- Produto esperado de uma pesquisa: acrescente em `extensionProducts` do projeto.
- Projeto ou observatório com existência própria: adicione um bloco em `src/data/outreach.yml` (`slug`, `name`, `kind`, `status`, `summary`, `role`, `links`, `research` opcional, `tracks`). Apresentação institucional: sem preços nem linguagem comercial.

## Destacar um projeto

Defina `featured: true` e um `featuredOrder` único (1 = primeiro). A página inicial mostra entre seis e oito destaques; o teste `research-data.test.ts` impede sair dessa faixa.

## Ocultar achados preliminares

Defina `showPreliminaryFindings: false`. A lista `preliminaryFindings` pode permanecer no arquivo sem ser publicada. Quando autorizar, mude para `true`; a seção aparece com o aviso de que os resultados podem mudar.

## Publicar um texto (seção "Textos")

A seção **Textos** (`/textos/`, em inglês `/en/writing/`) é o espaço de escrita semanal: opiniões, comentários sobre eventos, notas de pesquisa, leituras e relatos de sala de aula. Cada texto é um arquivo Markdown em `src/content/updates/`, com o nome `AAAA-MM-DD-slug.pt-br.md` (e, opcionalmente, `AAAA-MM-DD-slug.en.md` para a versão em inglês — o mesmo `slug` liga as duas versões):

```markdown
---
title: Título curto e específico
date: 2026-09-19
lang: pt-br
category: opiniao # opiniao | nota | leitura | aula | evento | codigo | versao | documentacao | dados | painel | texto | site | publicacao
summary: Uma ou duas frases — aparecem na lista, na página inicial e no RSS.
project: slug-da-pesquisa # opcional: liga o texto a uma página de pesquisa
tags: [pix, pagamentos] # opcional
linkedin: https://www.linkedin.com/posts/... # opcional: link do mesmo texto no LinkedIn
link: https://... # opcional: fonte ou material externo
draft: false # true = não publica
---

Texto em Markdown. Títulos internos com `##`. Citações com `>`.
```

- A URL fica `/textos/<slug>/`; a data do nome do arquivo só ordena.
- `updated:` (data) marca revisões posteriores; aparece na página do texto.
- A página inicial mostra os três textos mais recentes; o RSS (`/rss.xml`) inclui os textos em português.
- Sugestão de fluxo semanal: escrever aqui primeiro, publicar, depois copiar para o LinkedIn com o link de volta e preencher `linkedin:`.
- A atividade automática dos repositórios (último commit, release) aparece ao lado, mas não é texto editorial.

## Adicionar tradução

- Strings de interface: `src/i18n/ui.ts` (as chaves precisam existir em `pt-br` e `en`; há teste para isso).
- Textos longos: `src/content/pages/<chave>.<idioma>.md`.
- Dados: todo campo `{pt, en}`.
- Bio em outros idiomas: `profile.yml › bio` (pt, en, fr, de, it) continua no arquivo, mas a seção está **desligada** na página Sobre desde 12/09/2026 (`SHOW_MULTILINGUAL_BIO = false` em `src/components/pages/AboutPage.astro`). Para reativar, mude para `true`; para acrescentar um idioma, adicione um bloco com `lang`, `label` e `paragraphs`.
- Novo idioma completo do site: exige novas rotas em `src/i18n/routes.ts`, pasta em `src/pages/` e strings em `ui.ts` — não está previsto.

## Atualizar fotografia e currículo

- Fotografia: substitua `src/assets/valber-portrait.jpg` (retrato 3:4, pelo menos 900 × 1200 px) e `public/images/valber-portrait-square.jpg` (quadrada, para redes sociais). Rode `npm run og:generate` para regenerar as imagens sociais e os ícones, e commite os arquivos gerados em `public/`.
- Currículo em PDF: **gerado automaticamente** a cada build por `scripts/generate-cv.mjs` (`/valber-cv.pdf` e `/valber-cv-en.pdf`) a partir de `profile.yml`, `research.yml`, `publications.yml` e `outreach.yml`. Para mudar o currículo, edite esses dados; para ver o resultado, `npm run cv:generate`. Nunca inclua telefone pessoal, endereço residencial ou documentos nos dados.

## Busca

A busca (`/busca/`) usa o Pagefind: o índice é gerado no build a partir do conteúdo de `<main>` de cada página e roda no navegador. Nada a manter; conteúdo novo entra no índice na próxima publicação.

## Perfil, vínculos e formação

Tudo em `src/data/profile.yml`: nome, posicionamento, e-mail institucional, links (GitHub, LinkedIn, Lattes, ORCID, Google Scholar), vínculos (`roles`), formação (`education`), linhas de pesquisa (`researchLines`), ferramentas (`tools`) e aprovações em concursos públicos (`publicExams`, com `place`, `role` bilíngue, `institution` e `notice`; o texto introdutório fica em `publicExamsIntro`). A lista aparece na página inicial e no currículo, ordenada pela colocação.

## Destaque de fundador (hero) e startups

O bloco "Fundador das startups …" do hero vem de `profile.yml › founder` (`lead` bilíngue e `items` com `name`, `url` e `note`). As startups também estão em `outreach.yml` (PataCidadã e SmartMap Educação). Não cadastre observatórios ou produtos que ainda não existem: produtos futuros só aparecem como "produtos de extensão esperados" dentro de cada pesquisa.

## Alinhamento dos textos

No celular (até 56rem de largura) os textos são centralizados por regra global em `src/styles/global.css` (bloco "Celular: textos centralizados"); listas com marcadores, tabelas, formulários e fichas continuam à esquerda. No desktop, a página inicial centraliza os cabeçalhos de seção, a atuação atual e as linhas de pesquisa (`HomePage.astro`).

## Vocabulários

Áreas, estágios, métodos, linguagens e tipos de resultado ficam em `src/data/taxonomies.yml`. Ao criar uma chave nova, adicione o rótulo em português e em inglês; os filtros da página de pesquisa são gerados a partir dali.
