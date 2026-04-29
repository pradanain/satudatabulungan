param(
  [string]$InputPath,
  [string]$OutputPath = "web/src/lib/data/opd-directory.json",
  [string]$SheetName = "Data Lengkap"
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$pythonScript = Join-Path $PSScriptRoot "sync-opd-excel.py"

if (-not $InputPath -or [string]::IsNullOrWhiteSpace($InputPath)) {
  if ($env:OPD_EXCEL_INPUT) {
    $InputPath = $env:OPD_EXCEL_INPUT
  } else {
    $InputPath = Join-Path $HOME "Downloads\bulungan_perangkat_daerah_enriched_putaran2_final.xlsx"
  }
}

if ([System.IO.Path]::IsPathRooted($OutputPath)) {
  $resolvedOutput = $OutputPath
} else {
  $resolvedOutput = Join-Path $repoRoot $OutputPath
}

python $pythonScript --input $InputPath --output $resolvedOutput --sheet $SheetName
exit $LASTEXITCODE
