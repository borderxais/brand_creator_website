# deploy.ps1
[CmdletBinding()]
param()

Write-Host "🚀 Starting deployment script..."

Write-Host "📁 Loading environment variables from .env file..."
Get-Content .env |
  Where-Object { -not ($_ -match '^\s*#' -or $_ -match '^\s*$') } |
  ForEach-Object {
    $parts = $_ -split('=', 2)
    if ($parts.Count -eq 2) {
      # set in current session and for child processes
      Set-Item -Path Env:$($parts[0]) -Value $parts[1]
    }
  }
Write-Host "✅ Environment variables loaded successfully."

Write-Host "📄 Generating app.yaml from template..."
# load template as one string
$template = Get-Content app.yaml.template -Raw

# replace both ${VAR} and $VAR occurrences
Get-ChildItem Env: | ForEach-Object {
  $name  = [regex]::Escape($_.Name)
  $value = [regex]::Escape($_.Value)
  $template = $template -replace "(?:\$\{$name\}|\$$name)", $value
}

# write out the rendered file
$template | Set-Content app.yaml
Write-Host "✅ app.yaml generated successfully."