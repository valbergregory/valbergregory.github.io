# Atualização automática a partir do GitHub

O site mistura conteúdo editorial controlado (o que é dito sobre cada pesquisa) com metadados técnicos públicos (o que os repositórios informam). Este documento explica a parte automática.

## O que é atualizado automaticamente

`scripts/sync-github.mjs` consulta a API pública do GitHub **somente** para os repositórios listados em `src/data/github-whitelist.json` e grava `src/generated/github-projects.json` com:

- data do commit público mais recente na branch padrão;
- data do último push;
- linguagem principal;
- tópicos;
- URL e homepage;
- licença (SPDX);
- release mais recente (tag e data), se houver;
- descrição pública;
- data de criação;
- se o repositório está arquivado.

Nunca são atualizados automaticamente: estágio científico, resultados, conclusões, autoria, situação de submissão, título — tudo isso vem de `src/data/research.yml`. Repositórios privados são descartados mesmo que apareçam na whitelist; o projeto `Port-Network-Resilience` não é consultado nem linkado.

Se a API estiver indisponível ou o limite de requisições for atingido, o script mantém o último JSON válido e marca as entradas como `stale`; o site exibe o aviso "metadados do cache". Nenhuma chamada à API é feita pelo navegador: o JSON é embutido no build.

## Whitelist de repositórios

```
valbergregory/artigo-dsge-educacao
valbergregory/transmissao-precos-leite-brasil
valbergregory/Port-Digitalization-Observatory
valbergregory/marine-fisheries-data-cube
valbergregory/fisheries-closures-brazil
valbergregory/Pricing-Non-Pecuniary-Harm
valbergregory/STJ-Moral-Damages-Jurimetrics
valbergregory/Geography-of-Judicial-Delay
valbergregory/binding-precedents-brazil
valbergregory/abusive-litigation-jurimetrics
valbergregory/aisecdev-tjs-2026
```

Para adicionar um repositório: inclua `owner/repo` no JSON e defina `allowAutomaticMetadata: true` no projeto correspondente em `research.yml`. Nunca liste todos os repositórios da conta.

## Quando o site é reconstruído

O workflow `.github/workflows/deploy-pages.yml` roda em quatro situações:

| Gatilho | Quando |
|---|---|
| `push` em `main` | qualquer alteração de conteúdo ou código do site |
| `workflow_dispatch` | manualmente, na aba Actions |
| `repository_dispatch` (`portfolio-update`) | disparo imediato enviado por um repositório de pesquisa (opcional, ver abaixo) |
| `schedule` (`17 */6 * * *`) | a cada seis horas, como fallback |

Em cada execução: `npm ci` → sincronização (com `secrets.GITHUB_TOKEN`, automático do Actions, para elevar o limite de requisições) → lint → typecheck → testes → build → verificação de links → verificação de segredos → upload → deploy. O JSON de metadados é guardado com `actions/cache` entre execuções, para que uma falha da API não deixe o site sem dados.

## Disparo imediato (opcional)

Para que um push em um repositório de pesquisa reconstrua o site em minutos, em vez de esperar o agendamento:

1. Crie um **fine-grained personal access token** em GitHub → Settings → Developer settings → Fine-grained tokens:
   - *Repository access*: **Only select repositories** → `valbergregory/valbergregory.github.io` (apenas este);
   - *Permissions* → *Repository permissions* → **Contents: Read and write** (é a permissão que autoriza `repository_dispatch`); nada mais;
   - prazo de expiração curto (por exemplo, 1 ano) e lembrete para renovar.
2. Em **cada** repositório de pesquisa que deve disparar o rebuild: Settings → Secrets and variables → Actions → *New repository secret* → nome `PORTFOLIO_SYNC_TOKEN`, valor = o token.
3. Copie `docs/examples/notify-portfolio.yml` para `.github/workflows/notify-portfolio.yml` no repositório de pesquisa e faça commit.

O workflow de exemplo envia um `POST /repos/valbergregory/valbergregory.github.io/dispatches` com `event_type: portfolio-update` após push em `main` ou publicação de release. Se o secret não existir, ele termina sem erro e o agendamento periódico cuida da atualização.

Regras de segurança:

- o token nunca deve ser gravado em arquivo, mostrado em log, incluído no front-end ou commitado;
- não use tokens clássicos com escopo `repo` amplo;
- o site continua funcionando sem o disparo imediato.

Os repositórios de pesquisa **não foram alterados** por esta reformulação; a ativação é uma decisão do proprietário.

## Executar a sincronização localmente

```bash
npm run sync:github
```

Sem token funciona (limite de 60 requisições/hora por IP). Para elevar o limite, exporte `GITHUB_TOKEN` na sessão (por exemplo, `GITHUB_TOKEN=$(gh auth token) npm run sync:github`) — nunca o coloque em `.env` commitado. O arquivo gerado pode ser commitado: ele serve de cache de fallback para o primeiro build.
