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

## Publicar uma notícia (diário de pesquisa)

Crie `src/content/updates/AAAA-MM-DD-assunto.pt-br.md` (e, se quiser, a versão `.en.md`):

```markdown
---
title: Título curto
date: 2026-09-11
lang: pt-br
category: codigo # codigo | versao | documentacao | dados | painel | texto | evento | site | publicacao
project: slug-da-pesquisa # opcional
summary: Uma frase para a lista e o RSS.
link: https://... # opcional
draft: false
---

Texto em Markdown.
```

Mensagens de commit não viram notícia; a atividade automática dos repositórios aparece em uma caixa separada na página de atualizações. O RSS (`/rss.xml`) inclui as entradas em português.

## Adicionar tradução

- Strings de interface: `src/i18n/ui.ts` (as chaves precisam existir em `pt-br` e `en`; há teste para isso).
- Textos longos: `src/content/pages/<chave>.<idioma>.md`.
- Dados: todo campo `{pt, en}`.
- Bio em outros idiomas: `profile.yml › bio` (fr, de, it). Para acrescentar um idioma, adicione um bloco com `lang`, `label` e `paragraphs`; a página Sobre o exibe automaticamente com o atributo `lang` correto.
- Novo idioma completo do site: exige novas rotas em `src/i18n/routes.ts`, pasta em `src/pages/` e strings em `ui.ts` — não está previsto.

## Atualizar fotografia e currículo

- Fotografia: substitua `src/assets/valber-portrait.jpg` (retrato 3:4, pelo menos 900 × 1200 px) e `public/images/valber-portrait-square.jpg` (quadrada, para redes sociais). Rode `npm run og:generate` para regenerar as imagens sociais e os ícones, e commite os arquivos gerados em `public/`.
- Currículo em PDF: substitua `public/valber-cv.pdf` (a URL `/valber-cv.pdf` é a mesma do site antigo) e atualize `cvPdfDate` em `profile.yml`. Não inclua telefone pessoal, endereço residencial ou documentos.

## Perfil, vínculos e formação

Tudo em `src/data/profile.yml`: nome, posicionamento, e-mail institucional, links (GitHub, LinkedIn, Lattes, ORCID, Google Scholar), vínculos (`roles`), formação (`education`), linhas de pesquisa (`researchLines`), ferramentas (`tools`) e aprovações em concursos públicos (`publicExams`, com `place`, `role` bilíngue, `institution` e `notice`; o texto introdutório fica em `publicExamsIntro`). A lista aparece na página inicial e no currículo, ordenada pela colocação.

## Alinhamento dos textos

No celular (até 56rem de largura) os textos são centralizados por regra global em `src/styles/global.css` (bloco "Celular: textos centralizados"); listas com marcadores, tabelas, formulários e fichas continuam à esquerda. No desktop, a página inicial centraliza os cabeçalhos de seção, a atuação atual e as linhas de pesquisa (`HomePage.astro`).

## Vocabulários

Áreas, estágios, métodos, linguagens e tipos de resultado ficam em `src/data/taxonomies.yml`. Ao criar uma chave nova, adicione o rótulo em português e em inglês; os filtros da página de pesquisa são gerados a partir dali.
