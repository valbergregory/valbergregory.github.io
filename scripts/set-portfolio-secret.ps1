<#
.SYNOPSIS
  Grava o secret PORTFOLIO_SYNC_TOKEN em todos os repositórios rastreados pela
  página pessoal, usando o GitHub CLI (gh) já autenticado.

.DESCRIPTION
  O token é pedido uma única vez, de forma oculta, e enviado ao GitHub pela
  entrada padrão do `gh secret set`. Ele nunca é gravado em disco nem impresso.
  Pré-requisitos: gh instalado e logado (`gh auth status`), e um fine-grained
  personal access token com acesso APENAS ao repositório
  valbergregory/valbergregory.github.io e permissão "Contents: Read and write".

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/set-portfolio-secret.ps1
#>
$ErrorActionPreference = 'Stop'

$whitelistPath = Join-Path $PSScriptRoot '..\src\data\github-whitelist.json'
$repos = (Get-Content -Raw -Encoding UTF8 $whitelistPath | ConvertFrom-Json).repositories

Write-Host "Repositórios que receberão o secret PORTFOLIO_SYNC_TOKEN:" -ForegroundColor Cyan
$repos | ForEach-Object { Write-Host "  - $_" }

$secure = Read-Host -Prompt 'Cole o fine-grained token (a digitação fica oculta)' -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}
if ([string]::IsNullOrWhiteSpace($token)) { throw 'Token vazio.' }
if ($token -notmatch '^github_pat_') {
  Write-Warning 'O valor não parece um fine-grained token (prefixo github_pat_). Continuando mesmo assim.'
}

foreach ($repo in $repos) {
  Write-Host "→ $repo" -NoNewline
  $token | gh secret set PORTFOLIO_SYNC_TOKEN --repo $repo --app actions
  if ($LASTEXITCODE -ne 0) { throw "Falha ao gravar o secret em $repo" }
  Write-Host '  ok' -ForegroundColor Green
}
$token = $null
Write-Host 'Concluído. Faça um push em qualquer repositório rastreado para testar o disparo.' -ForegroundColor Green
