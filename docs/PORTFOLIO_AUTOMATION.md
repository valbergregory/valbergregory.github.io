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

| Gatilho                                    | Quando                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| `push` em `main`                           | qualquer alteração de conteúdo ou código do site                               |
| `workflow_dispatch`                        | manualmente, na aba Actions                                                    |
| `repository_dispatch` (`portfolio-update`) | disparo imediato enviado por um repositório de pesquisa (opcional, ver abaixo) |
| `schedule` (`17 */6 * * *`)                | a cada seis horas, como fallback                                               |

Em cada execução: `npm ci` → sincronização (com `secrets.GITHUB_TOKEN`, automático do Actions, para elevar o limite de requisições) → lint → typecheck → testes → build → verificação de links → verificação de segredos → upload → deploy. O JSON de metadados é guardado com `actions/cache` entre execuções, para que uma falha da API não deixe o site sem dados.

## Disparo imediato

**Estado em 11/09/2026:** o workflow `notify-portfolio.yml` está **instalado nos 11 repositórios rastreados** (commit direto na branch padrão de cada um, via API; os clones locais precisam de `git pull` para receber o arquivo). Sem o secret ele termina sem erro com a mensagem "PORTFOLIO_SYNC_TOKEN não configurado", e o agendamento de seis horas segue cobrindo a atualização. O evento `repository_dispatch` já foi testado no repositório do site e reconstrói a página normalmente.

Para ativar o disparo, falta apenas o token — um passo que só o proprietário pode fazer:

1. Crie um **fine-grained personal access token** em GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens:
   - _Repository access_: **Only select repositories** → `valbergregory/valbergregory.github.io` (apenas este);
   - _Permissions_ → _Repository permissions_ → **Contents: Read and write** (é a permissão que autoriza `repository_dispatch`); nada mais;
   - prazo de expiração (por exemplo, 1 ano) e lembrete para renovar.
2. Grave o token como secret `PORTFOLIO_SYNC_TOKEN` em todos os repositórios da whitelist de uma vez, com o `gh` já autenticado:

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/set-portfolio-secret.ps1
   ```

   (ou `bash scripts/set-portfolio-secret.sh`). O script pede o token uma única vez, com digitação oculta, e o envia ao GitHub por stdin; ele nunca é gravado em disco nem impresso. Alternativa manual: Settings → Secrets and variables → Actions → _New repository secret_ em cada repositório.

3. Faça um push em qualquer repositório rastreado e confira, na aba Actions do site, uma execução com gatilho `repository_dispatch`.

O workflow instalado envia um `POST /repos/valbergregory/valbergregory.github.io/dispatches` com `event_type: portfolio-update` após push na branch padrão (`main` ou `master`) ou publicação de release. A cópia de referência está em `docs/examples/notify-portfolio.yml`.

Regras de segurança:

- o token nunca deve ser gravado em arquivo, mostrado em log, incluído no front-end ou commitado;
- não use tokens clássicos com escopo `repo` amplo;
- o site continua funcionando sem o disparo imediato.

## Executar a sincronização localmente

```bash
npm run sync:github
```

Sem token funciona (limite de 60 requisições/hora por IP). Para elevar o limite, exporte `GITHUB_TOKEN` na sessão (por exemplo, `GITHUB_TOKEN=$(gh auth token) npm run sync:github`) — nunca o coloque em `.env` commitado. O arquivo gerado pode ser commitado: ele serve de cache de fallback para o primeiro build.
