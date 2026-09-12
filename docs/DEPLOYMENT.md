# Publicação (GitHub Pages)

## Configuração do repositório

- Repositório: `valbergregory/valbergregory.github.io` (público, branch `main`).
- **GitHub Pages → Build and deployment → Source: GitHub Actions.** O modo antigo ("Deploy from a branch") foi substituído: o site agora é gerado pelo workflow e publicado a partir do artefato `dist/`.
- Domínio: `https://valbergregory.github.io` (sem domínio próprio; `astro.config.mjs › site` precisa ser alterado se um dia houver CNAME).
- Ambiente `github-pages` é criado automaticamente pelo `actions/deploy-pages`.

Se a fonte do Pages ainda estiver em "Deploy from a branch", o workflow falha no passo de deploy com erro de configuração. Corrija em Settings → Pages → Source → **GitHub Actions**. Via API: `gh api -X PUT repos/valbergregory/valbergregory.github.io/pages -f build_type=workflow`.

## Fluxo

1. `git push origin main` (ou os outros gatilhos descritos em `PORTFOLIO_AUTOMATION.md`).
2. Job `build`: instala, sincroniza metadados, lint, typecheck, testes, build (gera o currículo em PDF, o site e o índice de busca do Pagefind), verificação de links e de segredos, upload do artefato.
3. Job `deploy`: publica o artefato no Pages e expõe a URL.
4. Acompanhe em https://github.com/valbergregory/valbergregory.github.io/actions.

Duração típica: 2–3 minutos.

## Outros workflows

- `ci.yml` — mesmas verificações em pull requests (inclusive os do Dependabot), sem deploy.
- `token-expiry-reminder.yml` — toda segunda-feira compara a data com `EXPIRES_ON` (11/09/2027) e abre uma issue com rótulo `token` quando faltam 30 dias. Ao renovar o token, atualize `EXPIRES_ON`.
- `external-links.yml` — no dia 3 de cada mês constrói o site e testa os links externos; falhas viram uma issue com rótulo `links`.
- `.github/dependabot.yml` — atualizações de npm (semanal, agrupadas) e de actions (mensal).

## Secrets

Nenhum secret é necessário no repositório do site. `GITHUB_TOKEN` é fornecido automaticamente pelo Actions (permissões `contents: read`, `pages: write`, `id-token: write`).

Opcional, nos repositórios de pesquisa: `PORTFOLIO_SYNC_TOKEN` (ver `PORTFOLIO_AUTOMATION.md`).

## Executar localmente

```bash
npm ci
npm run sync:github   # opcional; usa o cache commitado se falhar
npm run dev           # http://localhost:4321
npm run build && npm run preview
```

Verificações: `npm run lint`, `npm run typecheck`, `npm test`, `npm run check:links` (após o build; `-- --external` para testar links externos), `npm run check:secrets`.

## Regenerar imagens sociais e ícones

`npm run og:generate` cria `public/og/*.png`, `public/favicon.ico`, `public/apple-touch-icon.png` e `public/icon-*.png` a partir da foto e do `favicon.svg`. O CI não regenera; commite os arquivos.

## Reverter

Como o deploy vem do workflow, reverter o site é reverter o commit (`git revert <sha>` + push). Não use force push.

## Verificação pós-deploy

- Abrir `https://valbergregory.github.io/` e `/en/`.
- Conferir `/sitemap-index.xml`, `/rss.xml`, `/robots.txt`, `/404.html`.
- Testar uma página de projeto e o seletor de idioma.
