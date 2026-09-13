# Guia de conteúdo

Todo o conteúdo do site vive em arquivos de texto versionados. Nenhuma alteração exige mexer em componentes. Depois de editar, rode `npm run build` (ou `npm run dev` para ver ao vivo) e faça commit; o GitHub Actions publica.

Regra geral: **não invente**. Estágios, títulos, autores e resultados só entram quando confirmados. O que estiver pendente vai para `src/data/review-needed.yml` (conteúdo) ou `src/data/legal-review-needed.yml` (fatos funcionais, vínculos, propriedade intelectual, imagens — auditoria de 13/09/2026); nenhum dos dois é publicado.

Regras transversais da auditoria preventiva (13/09/2026):

- o site é pessoal e acadêmico: nunca use logomarca, brasão ou identidade visual da UFAL/TJAL, nem apresente algo como "oficial";
- **extensão universitária** só entra em `src/data/extension.yml` com registro público (PROEX/SIGAA); o resto vai para `src/data/independent-projects.yml`;
- **projetos independentes** ficam em `nature: under-review` até haver documentação de vínculo, recursos e titularidade; o site então mostra "classificação institucional em revisão" e nunca afirma independência;
- o e-mail institucional serve a ensino, pesquisa e extensão; propostas sobre projetos independentes só por `profile.yml › independentProjectEmail` (vazio = nada é exibido);
- nunca afirme que algo "gera pontos": use "possível enquadramento", "sujeito à avaliação da CIADD/CPPD";
- `firstPublishedAt` de uma publicação nunca muda (ledger `src/data/first-published.json`); datas não são redistribuídas para simular continuidade;
- fotografias com terceiros exigem `consentVerified: true` em `src/data/images.yml` (com o id do termo no manifesto privado, ver `data/README.md`).

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

## Extensão universitária e projetos independentes

Dois arquivos com o mesmo esquema (`src/content.config.ts › projectSchema`):

- `src/data/extension.yml` — **somente** ações de extensão registradas/aprovadas na UFAL. Exige `nature: institutional-extension`, `relationshipToUfal: extension` e `institutionalRegistration` com `publicId`, `issuer` e `date` (o build falha sem isso). Página: `/extensao/`.
- `src/data/independent-projects.yml` — iniciativas privadas ou ainda não classificadas. Página secundária `/projetos-independentes/`, fora do menu principal.

Campos de cada projeto: `slug`, `name`, `kind`, `status`, `summary`, `role`, `period` (opcional), `url`, `repository`, `links`, `research` (opcional), `tracks`, `nature` (`institutional-research | institutional-extension | teaching | independent | under-review`), `relationshipToUfal` e `relationshipToTjal` (`none | teaching | research | extension | under-review`), `institutionalRegistration` (`publicId`, `issuer`, `date`, `publicUrl`) ou `null`, `resourcesUsed` (`under-review | none-declared | declared`), `ipStatus` (`institutional | shared | independent | under-review`), `commercialStatus` (`none | precommercial | commercial | unknown`), `disclaimer` (`{pt, en}` ou `null`), `evidencePublic` (lista de `{label, url}`).

Regras:

- faltando prova, use `nature: under-review`, `ipStatus: under-review`, `resourcesUsed: under-review`, `commercialStatus: unknown` — a interface mostra "classificação institucional em revisão" e o aviso de que não é sistema oficial;
- `nature: independent` só passa no esquema com todos os campos definitivos e `evidencePublic` não vazio; só então aparece a declaração "Projeto independente, sem vínculo…";
- item em revisão não pode ter `disclaimer` próprio;
- sem preços, projeções comerciais, convite a propostas ou e-mail institucional (`tests/projects.test.ts` e `scripts/check-compliance.mjs`).

Produto esperado de uma pesquisa (painel, base, boletim): continue em `extensionProducts` do projeto em `research.yml` — o rótulo público é "produtos aplicados previstos (possível extensão, sujeita a registro)".

## Destacar um projeto

Defina `featured: true` e um `featuredOrder` único (1 = primeiro). A página inicial mostra entre seis e oito destaques; o teste `research-data.test.ts` impede sair dessa faixa.

## Ocultar achados preliminares

Defina `showPreliminaryFindings: false`. A lista `preliminaryFindings` pode permanecer no arquivo sem ser publicada. Quando autorizar, mude para `true`; a seção aparece com o aviso de que os resultados podem mudar.

## Seção "Conteúdos e Séries Temáticas"

A seção **Conteúdos** (`/conteudos/`, em inglês `/en/content/`) reúne as séries temáticas e as publicações avulsas (notas de pesquisa, opiniões, leituras, sala de aula, eventos). Duas coleções alimentam a seção:

- `src/content/series/<série>.<idioma>.md` — apresentação de cada série (frontmatter com título, chamada, descrição, banner/capa, temas, áreas e pesquisas relacionadas; o corpo é o texto de apresentação, que pode conter imagens).
- `src/content/conteudos/<série>/NN-slug.<idioma>.md` — cada publicação. Conteúdos sem série ficam em outra pasta (por exemplo `src/content/conteudos/avulsos/`) com `type` diferente de `serie`.

Modelo de publicação:

```markdown
---
title: Efeitos de rede
subtitle: Mais usuários. Mais conexões. Mais valor. # opcional
summary: Uma ou duas frases — aparecem no cartão, na listagem, no RSS e no compartilhamento.
lang: pt-br
type: serie # serie | nota | opiniao | leitura | aula | evento
series: economia-da-informacao-e-redes # obrigatório quando type = serie
order: 4 # posição na série (liga pt-BR e EN: mesma série + mesma ordem)
slug: network-effects # opcional; padrão = nome do arquivo sem o número e o idioma
cover: ./efeitos-de-rede.webp # imagem na mesma pasta; exige coverAlt
coverAlt: Descrição da imagem para leitores de tela.
tags: [Economia de Redes, Efeitos de Rede] # filtro "Tema"
areas: [economia, sistemas-de-informacao] # filtro "Área" (ver taxonomies.yml › contentAreas)
project: slug-da-pesquisa # opcional: liga a uma página de pesquisa
date: 2026-09-12 # data futura = publicação agendada (entra no ar no deploy seguinte à data)
linkedin: https://www.linkedin.com/posts/... # opcional: post correspondente no LinkedIn
draft: false
# --- rastreabilidade editorial (obrigatória; auditoria de 13/09/2026) ---
firstPublishedAt: 2026-09-12 # imutável depois de lançada (ledger src/data/first-published.json)
updatedAt: 2026-10-01 # opcional: última atualização substantiva
semester: '2026.2' # YYYY.1 (jan–jun) | YYYY.2 (jul–dez), pela data de primeira publicação
contentNature: scientific-outreach # scientific-outreach | academic | teaching | opinion | work-in-progress
knowledgeArea: Economia Digital, Economia da Informação e Sistemas de Informação
institutionalRelation: none # none | teaching | research | extension | under-review
reviewStatus: editorial # editorial | peer-reviewed | preprint | not-peer-reviewed
sources: [] # fontes principais; vazio = "ver seção Para aprofundar"
license: all-rights-reserved
# doi, issn, studentCoauthors, dataEthics, conflictDisclosure: opcionais
---

Texto em Markdown. Ao final, as seções `## Para aprofundar` (referências) e `## Sites para acesso`.
```

- URL: `/conteudos/<série>/<slug>/`; em inglês `/en/content/<série-en>/<slug-en>/`. Conteúdos avulsos: `/conteudos/<tipo>/<slug>/` (`notas`, `opiniao`, `leituras`, `sala-de-aula`, `eventos`). Música, poemas, crítica de livros e cinema ficam no site pessoal de cultura (repositório `economia-da-cultura`)..
- O tempo de leitura é calculado a partir do texto; `updated:` marca revisões.
- Imagens: qualquer formato (WebP é o mais leve); o build gera as versões responsivas e a imagem de compartilhamento (1200 × 630) a partir da capa. Para trocar uma capa gerada por uma imagem própria, basta gravar o arquivo com o mesmo nome na pasta da série (`scripts/generate-series-covers.mjs` regenera as capas vetoriais da série marítima).
- Nova série: acrescentar o slug em `SERIES` (`src/content.config.ts`), criar os dois arquivos em `src/content/series/` e a pasta em `src/content/conteudos/`.
- Agendamento: o deploy roda a cada 6 h; uma publicação com `date` futura fica fora do site até a data.
- A página inicial mostra as séries; o RSS (`/rss.xml`) inclui as publicações em português.
- Fluxo sugerido para o LinkedIn: publicar aqui, compartilhar com o botão do LinkedIn e preencher `linkedin:` com o link do post.
- Depois de criar uma publicação, rode `npm run ledger:sync` para registrar a data de primeira publicação no ledger (o teste `dates.test.ts` avisa quando falta e **falha** se `firstPublishedAt` de um texto já registrado mudar).
- `contentNature: work-in-progress` mostra o aviso "Trabalho em andamento, versão de <data>"; `areas` com `direito` mostra o aviso de conteúdo educacional/não consultoria.

## Divulgação científica (sítio especializado) e relatório semestral

- `/divulgacao-cientifica/` (EN `/en/science-outreach/`) é o arquivo editorial: escopo declarado em `/politica-editorial/`, séries e um arquivo por semestre (`/divulgacao-cientifica/2026-2/`) com só o que foi efetivamente publicado, URL canônica, data real e semana ISO.
- `src/data/editorial-calendar.yml` guarda as semanas letivas oficiais (vazio por padrão; nunca invente datas). Sem calendário, as semanas são contadas como semanas ISO.
- `npm run report:semester -- 2026.2` gera `dist/relatorios/2026-2.{csv,json,html}` com título, URL, datas, commit SHA, natureza, área, relação institucional, licença, fontes, semanas cobertas e lacunas — sem pontuação e sem dados pessoais.
- `/atuacao-academica/` lê `src/data/academic-activity.yml` (cinco grupos do Anexo 5 da Resolução 119/2025). Cada item precisa de `fit` com "possível enquadramento", `evidence` e `evidenceStatus`; provas privadas ficam no manifesto (`data/README.md`) e são referenciadas por `privateEvidenceId`.

## Páginas de conformidade

`src/content/pages/legal|privacy|editorial.<idioma>.md` (avisos legais, privacidade, política editorial), com `lastReviewed` obrigatório. O aviso curto "Site pessoal de natureza acadêmica…" (`InstitutionalNotice.astro`) aparece perto das afiliações e dos projetos; `scripts/check-compliance.mjs` falha se ele sumir de alguma dessas páginas.

## Imagens com pessoas

Toda fotografia em `src/assets/` e `public/images/` precisa de registro em `src/data/images.yml` (`creator`, `source`, `license`, `peopleIdentifiable`, `subjects`, `consentVerified`, `consentRecordPrivateId`, `officialSource`). Foto com terceiros identificáveis e `consentVerified: false` não pode ser referenciada por nada que entre no build (`tests/images.test.ts`).

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
