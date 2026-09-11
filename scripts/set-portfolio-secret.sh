#!/usr/bin/env bash
# Equivalente em Bash de set-portfolio-secret.ps1: grava o secret
# PORTFOLIO_SYNC_TOKEN em todos os repositórios da whitelist com o gh.
# O token é lido de forma oculta e enviado por stdin; nunca é gravado nem impresso.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mapfile -t repos < <(node -e "console.log(require('$here/../src/data/github-whitelist.json').repositories.join('\n'))")

echo "Repositórios que receberão o secret PORTFOLIO_SYNC_TOKEN:"
printf '  - %s\n' "${repos[@]}"
read -r -s -p 'Cole o fine-grained token (a digitação fica oculta): ' token
echo
[ -n "$token" ] || { echo 'Token vazio.' >&2; exit 1; }

for repo in "${repos[@]}"; do
  printf '→ %s' "$repo"
  printf '%s' "$token" | gh secret set PORTFOLIO_SYNC_TOKEN --repo "$repo" --app actions
  echo '  ok'
done
unset token
echo 'Concluído. Faça um push em qualquer repositório rastreado para testar o disparo.'
