<#
.SYNOPSIS
  Valida um fine-grained token e grava o secret PORTFOLIO_SYNC_TOKEN em todos
  os repositórios rastreados pela página pessoal, usando o GitHub CLI (gh).

.DESCRIPTION
  O token é pedido uma única vez, de forma oculta, e nunca é gravado em disco
  nem impresso. Antes de gravar, o script confere:
    1. que o valor tem o formato de um token do GitHub;
    2. que o GitHub o aceita (GET /user);
    3. que ele consegue disparar o rebuild do site (POST /dispatches) — isso
       gera uma execução real do workflow do site, o que é inofensivo.
  Só depois disso o secret é enviado aos repositórios pela entrada padrão do
  `gh secret set`.

  Pré-requisitos: gh instalado e logado (`gh auth status`) e um fine-grained
  personal access token com acesso APENAS ao repositório
  valbergregory/valbergregory.github.io e permissão "Contents: Read and write".

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/set-portfolio-secret.ps1
#>
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$siteRepo = 'valbergregory/valbergregory.github.io'
$whitelistPath = Join-Path $PSScriptRoot '..\src\data\github-whitelist.json'
$repos = (Get-Content -Raw -Encoding UTF8 $whitelistPath | ConvertFrom-Json).repositories

Write-Host "Repositórios que receberão o secret PORTFOLIO_SYNC_TOKEN:" -ForegroundColor Cyan
$repos | ForEach-Object { Write-Host "  - $_" }
Write-Host ''
Write-Host 'Antes de colar: copie o token na página do GitHub (botão de copiar ao lado do valor github_pat_...).' -ForegroundColor Yellow

$secure = Read-Host -Prompt 'Cole o fine-grained token (a digitação fica oculta)' -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr).Trim()
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

if ([string]::IsNullOrWhiteSpace($token)) { throw 'Token vazio. Nada foi gravado.' }
if ($token -notmatch '^(github_pat_|ghp_)[A-Za-z0-9_]{20,}$') {
  throw "O valor colado não tem o formato de um token do GitHub (esperado prefixo github_pat_). Provavelmente a área de transferência continha outro texto. Copie o token de novo e rode o script novamente. Nada foi gravado."
}

$headers = @{
  Authorization          = "Bearer $token"
  Accept                 = 'application/vnd.github+json'
  'X-GitHub-Api-Version' = '2022-11-28'
  'User-Agent'           = 'set-portfolio-secret'
}

function Get-HttpStatus($err) {
  try { return [int]$err.Exception.Response.StatusCode } catch { return 0 }
}

# 1) O GitHub aceita o token?
try {
  $me = Invoke-RestMethod -Method Get -Uri 'https://api.github.com/user' -Headers $headers
} catch {
  $code = Get-HttpStatus $_
  throw "O GitHub rejeitou o token (HTTP $code). Ele pode estar incompleto, expirado ou revogado. Gere um novo token e rode o script de novo. Nada foi gravado."
}
Write-Host "Token aceito pelo GitHub (usuário: $($me.login))." -ForegroundColor Green
if ($me.login -ne 'valbergregory') {
  Write-Warning "O token pertence à conta '$($me.login)', não a 'valbergregory'."
}

# 2) Ele consegue disparar o rebuild do site? (gera uma execução real, inofensiva)
try {
  $body = '{"event_type":"portfolio-update","client_payload":{"source":"set-portfolio-secret"}}'
  Invoke-RestMethod -Method Post -Uri "https://api.github.com/repos/$siteRepo/dispatches" -Headers $headers -ContentType 'application/json' -Body $body | Out-Null
} catch {
  $code = Get-HttpStatus $_
  $hint = switch ($code) {
    404 { "o token não tem acesso ao repositório $siteRepo (em 'Repository access', selecione esse repositório)." }
    403 { "falta a permissão 'Contents: Read and write' no repositório $siteRepo." }
    default { "resposta HTTP $code." }
  }
  throw "O token é aceito, mas não consegue disparar o rebuild: $hint Corrija o token no GitHub e rode o script de novo. Nada foi gravado."
}
Write-Host "Disparo de teste aceito: o site será reconstruído em alguns minutos (aba Actions de $siteRepo)." -ForegroundColor Green
Write-Host ''

# 3) Gravar o secret em cada repositório rastreado.
foreach ($repo in $repos) {
  Write-Host "→ $repo" -NoNewline
  $token | gh secret set PORTFOLIO_SYNC_TOKEN --repo $repo --app actions
  if ($LASTEXITCODE -ne 0) { throw "Falha ao gravar o secret em $repo" }
  Write-Host '  ok' -ForegroundColor Green
}
$token = $null
$headers = $null
Write-Host ''
Write-Host 'Concluído. A partir de agora, um push em qualquer repositório rastreado reconstrói o site.' -ForegroundColor Green
