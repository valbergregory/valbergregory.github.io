# valbergregory.github.io

Página pessoal acadêmica de **Valber Gregory Barbosa Costa Bezerra Santos** — professor da UFAL (Unidade Educacional Penedo), economista e Analista Judiciário no TJAL. Pesquisa em Economia Aplicada, Jurimetria, IA no setor público, turismo, economia marítima e pesqueira.

Site: https://valbergregory.github.io (pt-BR) · https://valbergregory.github.io/en/ (English)

## Como funciona

- **Astro 7** (geração estática, TypeScript), publicado no **GitHub Pages** via GitHub Actions.
- Conteúdo em arquivos de dados e Markdown (`src/data`, `src/content`); nenhum texto científico é inferido de commits.
- Metadados públicos dos repositórios de pesquisa (linguagem, último commit, licença, release) são sincronizados automaticamente a cada seis horas ou por `repository_dispatch`, somente para a whitelist em `src/data/github-whitelist.json`.
- Sem cookies, sem analytics, sem requisições a terceiros.

## Scripts

| Comando                                    | Função                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `npm run dev`                              | servidor de desenvolvimento em http://localhost:4321                                             |
| `npm run sync:github`                      | atualiza `src/generated/github-projects.json` (usa `GITHUB_TOKEN` se existir)                    |
| `npm run lint`                             | ESLint                                                                                           |
| `npm run typecheck`                        | `astro check`                                                                                    |
| `npm test`                                 | Vitest (dados, sincronização, i18n)                                                              |
| `npm run build`                            | gera `dist/`                                                                                     |
| `npm run check:links`                      | verifica links internos do build (`-- --external` inclui externos)                               |
| `npm run check:secrets`                    | garante que nenhum token ou dado privado entrou no código ou no build                            |
| `npm run og:generate`                      | regenera imagens sociais e ícones                                                                |
| `scripts/set-portfolio-secret.ps1` / `.sh` | grava o secret `PORTFOLIO_SYNC_TOKEN` nos repositórios rastreados (pede o token de forma oculta) |
| `npm run preview`                          | serve `dist/` localmente                                                                         |

Requisitos: Node 22+ e npm 9+.

## Editar conteúdo

Leia `docs/CONTENT_GUIDE.md`. Em resumo:

- pesquisas → `src/data/research.yml`
- publicações → `src/data/publications.yml`
- extensão e projetos → `src/data/outreach.yml`
- perfil, vínculos, formação e bio (pt, en, fr, de, it) → `src/data/profile.yml`
- textos das páginas Sobre e Ensino → `src/content/pages/`
- diário de pesquisa → `src/content/updates/`
- itens pendentes de confirmação (não publicados) → `src/data/review-needed.yml`

## Documentação

- `docs/site-audit.md` — diagnóstico do site anterior
- `docs/architecture.md` — decisões técnicas
- `docs/CONTENT_GUIDE.md` — como atualizar o conteúdo
- `docs/PORTFOLIO_AUTOMATION.md` — sincronização com o GitHub e disparo imediato
- `docs/DEPLOYMENT.md` — publicação
- `docs/examples/notify-portfolio.yml` — workflow para os repositórios rastreados
- `docs/qa/` — relatório de verificação (acessibilidade, desempenho, capturas)

## Licença

Código sob [MIT](LICENSE). Textos do site sob [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), salvo indicação. Fotografia e currículo: todos os direitos reservados.
