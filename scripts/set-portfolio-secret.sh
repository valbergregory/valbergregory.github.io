#!/usr/bin/env bash
# Equivalente em Bash de set-portfolio-secret.ps1: valida um fine-grained token
# (formato, GET /user e um POST /dispatches real no repositório do site) e só
# então grava o secret PORTFOLIO_SYNC_TOKEN em todos os repositórios da
# whitelist com o gh. O token é lido de forma oculta e enviado por stdin;
# nunca é gravado nem impresso.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
site_repo='valbergregory/valbergregory.github.io'
mapfile -t repos < <(node -e "console.log(require('$here/../src/data/github-whitelist.json').repositories.join('\n'))")

echo "Repositórios que receberão o secret PORTFOLIO_SYNC_TOKEN:"
printf '  - %s\n' "${repos[@]}"
echo
echo 'Antes de colar: copie o token na página do GitHub (botão de copiar ao lado do valor github_pat_...).'
read -r -s -p 'Cole o fine-grained token (a digitação fica oculta): ' token
echo
token="${token//[$'\r\n\t ']/}"
[ -n "$token" ] || { echo 'Token vazio. Nada foi gravado.' >&2; exit 1; }
if ! [[ "$token" =~ ^(github_pat_|ghp_)[A-Za-z0-9_]{20,}$ ]]; then
  echo 'O valor colado não tem o formato de um token do GitHub (esperado prefixo github_pat_). Copie o token de novo. Nada foi gravado.' >&2
  exit 1
fi

api() {
  curl -s -o /dev/null -w '%{http_code}' \
    -H "Authorization: Bearer $token" -H 'Accept: application/vnd.github+json' \
    -H 'X-GitHub-Api-Version: 2022-11-28' -H 'User-Agent: set-portfolio-secret' "$@"
}

code=$(api https://api.github.com/user)
if [ "$code" != "200" ]; then
  echo "O GitHub rejeitou o token (HTTP $code). Gere um novo token e rode o script de novo. Nada foi gravado." >&2
  exit 1
fi
echo 'Token aceito pelo GitHub.'

code=$(api -X POST "https://api.github.com/repos/$site_repo/dispatches" \
  -d '{"event_type":"portfolio-update","client_payload":{"source":"set-portfolio-secret"}}')
if [ "$code" != "204" ]; then
  case "$code" in
    404) hint="o token não tem acesso ao repositório $site_repo." ;;
    403) hint="falta a permissão 'Contents: Read and write' no repositório $site_repo." ;;
    *) hint="resposta HTTP $code." ;;
  esac
  echo "O token é aceito, mas não consegue disparar o rebuild: $hint Nada foi gravado." >&2
  exit 1
fi
echo "Disparo de teste aceito: o site será reconstruído em alguns minutos."
echo

for repo in "${repos[@]}"; do
  printf '→ %s' "$repo"
  printf '%s' "$token" | gh secret set PORTFOLIO_SYNC_TOKEN --repo "$repo" --app actions
  echo '  ok'
done
unset token
echo
echo 'Concluído. A partir de agora, um push em qualquer repositório rastreado reconstrói o site.'
