<#
.SYNOPSIS
  Publishes the site/ folder to a separate public repository for GitHub Pages.

.DESCRIPTION
  The repository this folder lives in is private and must stay private: it holds
  phone numbers, mail drafts and job-hunt data. GitHub Pages serves a whole
  repository, so only this folder is pushed, as the root of the public repo.

  Everything in site/ must be committed first — subtree splits committed history,
  not the working tree.

.EXAMPLE
  powershell -File site\publish.ps1 -Remote https://github.com/user/cv-site.git
#>

param(
  [Parameter(Mandatory = $true)][string]$Remote,
  [string]$Branch = "main",
  [string]$Prefix = "site"
)

$ErrorActionPreference = "Stop"

$repo = (git rev-parse --show-toplevel).Trim()
Set-Location $repo

$dirty = git status --porcelain -- $Prefix
if ($dirty) {
  Write-Error "$Prefix has uncommitted changes; commit them first:`n$dirty"
}

Write-Host "splitting $Prefix ..." -ForegroundColor Cyan
$sha = (git subtree split --prefix=$Prefix HEAD).Trim()

Write-Host "pushing $sha -> $Remote ($Branch)" -ForegroundColor Cyan
git push $Remote "${sha}:refs/heads/$Branch"

Write-Host "done. Settings -> Pages -> Deploy from a branch -> $Branch / (root)" -ForegroundColor Green
