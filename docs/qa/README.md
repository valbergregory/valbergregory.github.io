# Verificação de qualidade — 11/09/2026

Build verificado: `npm run build` (49 páginas), servido com `astro preview` e testado com Playwright (Chromium 153), axe-core 4.13 e Lighthouse 13.4. Os scripts de QA vivem fora do repositório (pasta temporária), porque dependem de ~300 MB de navegadores; os resultados ficam aqui.

## Lighthouse (simulação padrão: móvel Moto G Power / 4G lento; desktop 10 Mbps)

| Página                               | Perf. móvel | Perf. desktop | Acessibilidade | Boas práticas | SEO | LCP móvel | CLS    |
| ------------------------------------ | ----------- | ------------- | -------------- | ------------- | --- | --------- | ------ |
| `/`                                  | 99          | 100           | 100            | 100           | 100 | 1,7 s     | 0      |
| `/pesquisa/`                         | 100         | 99            | 100            | 100           | 100 | 1,5 s     | 0–0,07 |
| `/pesquisa/fishing-closures-brazil/` | 100         | 100           | 100            | 100           | 100 | 1,5 s     | 0,02   |
| `/publicacoes/`                      | 100         | 100           | 100            | 100           | 100 | 1,5 s     | 0      |
| `/en/`                               | 99          | 100           | 100            | 100           | 100 | 1,7 s     | 0      |
| `/en/about/`                         | 99          | 100           | 100            | 100           | 100 | 1,6 s     | 0,02   |

Metas do briefing (≥ 90 / ≥ 95 / ≥ 95 / ≥ 95) atendidas. TBT = 0 ms em todas as páginas.

## Acessibilidade (axe-core, WCAG 2.0/2.1/2.2 A e AA + boas práticas)

- 18 páginas analisadas em desktop e 4 em celular: **0 violações** após correções (contraste do badge "Em estruturação" e do texto sutil foi elevado para ≥ 5:1).
- Navegação por teclado: o primeiro Tab foca o link "Ir para o conteúdo"; o terceiro alcança "Início" no menu.
- Menu móvel: `aria-expanded` alterna corretamente, Escape fecha e devolve o foco ao botão.
- Tema escuro: persiste em `localStorage` e sobrevive ao recarregamento; sem flash na primeira pintura.
- Hierarquia de headings, landmarks, `lang` por bloco (fr/de/it na página Sobre), tabela com `caption`/`scope`, alvos ≥ 44 px, `prefers-reduced-motion`.

## Responsividade

Viewports testados: 1920×1080, 1366×768, 768×1024, 375×812, nos temas claro e escuro. Nenhum overflow horizontal em 60 capturas (a tabela de working papers rola dentro do próprio contêiner no celular).

## Comportamento

- Filtros da página de pesquisa: `?area=economia-pesqueira` exibe 2 projetos; "Em redação" exibe 4; "Em redação" + "Dados públicos" exibe 3; "Limpar filtros" volta a 15. A contagem `aria-live` acompanha.
- Falha da API do GitHub: `tests/github-sync.test.ts` cobre a manutenção do cache (`stale: true`) e a exclusão de repositórios privados/fora da whitelist.
- Imagem ausente: a página inicial e a de Sobre usam `astro:assets`; um arquivo ausente falha no build (nunca chega à produção). O currículo é um link para arquivo estático.
- Links: 1661 referências internas em 49 páginas, todas válidas (`npm run check:links`). Links externos verificados manualmente em 11/09/2026 (REPD, EDUFAL, Extensão em Debate, governancadeterras, ORCID, Lattes, PataCidadã, SmartMap; LinkedIn responde 999 a robôs).
- Segredos: `npm run check:secrets` — nenhum token, chave ou referência ao repositório privado no código ou no build.
- Console do navegador: nenhum erro em nenhuma página/viewport.

## Capturas (versões leves)

- `desktop-home.jpg`, `desktop-home-dark.jpg` — página inicial em 1920 px (claro e escuro)
- `mobile-home.jpg` — página inicial em 375 px
- `mobile-menu-open.jpg` — menu móvel aberto
- `desktop-research-detail.jpg` — página de projeto

As capturas completas (60 PNGs) ficam em `docs/qa/shots/`, ignoradas pelo Git.

## Navegadores

- **Chromium 153** e **WebKit 26.6** (Playwright): seis páginas em 1366 px e 375 px, sem erros de console, sem overflow; menu móvel, filtros e alternância de tema funcionam nos dois.
- **Firefox**: o binário foi baixado, mas o ambiente de execução desta sessão bloqueou o processo (`spawn UNKNOWN`), então não foi testado automaticamente. O site usa apenas CSS e JS amplamente suportados (grid, `color-mix`, `text-wrap: balance` com degradação graciosa); recomenda-se uma conferência manual no Firefox após o deploy.

## Rodada de 12/09/2026 (seção Textos, busca e currículo em PDF)

- Páginas `/textos/`, `/textos/<slug>/`, `/en/writing/…`, `/busca/`, `/ensino/` e `/curriculo/` em 1440 px e 375 px: axe 0 violações, sem overflow, sem erros de console.
- Busca (Pagefind): índice com 63 páginas em 2 idiomas; consulta "defeso" retorna 7 resultados com trechos destacados.
- Filtro por categoria dos textos (`?categoria=publicacao`): 1 de 5 visível; redirecionamento `/atualizacoes/` → `/textos/` funcionando.
- Currículo em PDF gerado no build (6 páginas, pt e en), sem telefone.

## Rodada de 12/09/2026 (seção Conteúdos e Séries Temáticas)

- Páginas `/conteudos/`, `/conteudos/<série>/`, `/conteudos/<série>/<slug>/`, `/en/content/…` e `/` em 1366 px e 375 px (Chromium/Playwright): axe 0 violações (WCAG 2.2 AA + best-practice), sem overflow horizontal (corrigido o formulário de filtros no celular), sem erros de console.
- Filtros (série, tema, área, tipo) com estado na query string; botões de compartilhamento (LinkedIn, Facebook, WhatsApp, X, copiar link, compartilhamento nativo); imagens sociais 1200 × 630 geradas a partir das capas.
- Links externos das referências verificados com `node scripts/check-links.mjs --external` (337 URLs); corrigidos os que estavam errados; `www.oecd.org` e `www.marinha.mil.br` entram na lista de hosts que bloqueiam robôs (aviso, não erro).
- Redirecionamentos `/textos/`, `/textos/<slug>/`, `/en/writing/`, `/atualizacoes/` → seção Conteúdos.
