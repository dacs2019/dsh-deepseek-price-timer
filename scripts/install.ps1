# Installs the plugin into the DeepSeek Harness profile fallback (resolvable
# from every profile) and registers it in the home-level patch (all profiles).
$ErrorActionPreference = 'Stop'

$project = Split-Path -Parent $PSScriptRoot
$homeDsh = Join-Path $env:USERPROFILE '.dsh'
$fallback = Join-Path $homeDsh 'profiles\node_modules'
$target = Join-Path $fallback 'dsh-deepseek-price-timer'

if (-not (Test-Path $homeDsh)) { throw "No se encontró $homeDsh (¿tienes DSH instalado?)" }
New-Item -ItemType Directory -Force -Path $fallback | Out-Null

if (Test-Path $target) {
    $item = Get-Item $target -Force
    if ($item.LinkType -eq 'Junction') { "junction ya existe: $target" }
    else { Remove-Item $target -Recurse -Force }
}
if (-not (Test-Path $target)) {
    cmd /c mklink /J "`"$target`"" "`"$project`"" | Out-Null
    if (-not (Test-Path (Join-Path $target 'package.json'))) { throw "falló la junction" }
    "junction creada: $target -> $project"
}

$patch = Join-Path $homeDsh 'cordis.patch.yml'
$row = @'

# dsh-deepseek-price-timer: DeepSeek peak/valley widget (all profiles).
- insert:
    - id: dspt-permanent
      name: 'dsh-deepseek-price-timer'
'@
if (Test-Path $patch) {
    $content = Get-Content $patch -Raw
    if ($content -match 'dspt-permanent') { "fila ya registrada en $patch" }
    else {
        $utf8 = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::AppendAllText($patch, $row, $utf8)
        "fila añadida a $patch"
    }
} else {
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($patch, "# Home-level patch applied to every profile.`n$row", $utf8)
    "patch home creado: $patch"
}

""
"Instalado. Reinicia el servidor web (dsh web) y recarga la página."
