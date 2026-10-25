$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$apkPath = Join-Path $projectRoot 'SignBySign-Android.apk'
if (-not (Test-Path -LiteralPath $apkPath)) {
  throw 'SignBySign-Android.apk is required to recover the already-built browser OCR bundle.'
}

node (Join-Path $PSScriptRoot 'generate-web-catalog.mjs')
if ($LASTEXITCODE -ne 0) { throw 'Could not generate the standalone catalog.' }

Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($apkPath)
$files = @{
  'assets/public/native-bridge.js' = 'web-bridge.js'
  'assets/public/vendor/tesseract/tesseract.min.js' = 'vendor/tesseract/tesseract.min.js'
  'assets/public/vendor/tesseract/worker.min.js' = 'vendor/tesseract/worker.min.js'
  'assets/public/vendor/core/tesseract-core-lstm.js' = 'vendor/core/tesseract-core-lstm.js'
  'assets/public/vendor/core/tesseract-core-lstm.wasm' = 'vendor/core/tesseract-core-lstm.wasm'
  'assets/public/vendor/core/tesseract-core-lstm.wasm.js' = 'vendor/core/tesseract-core-lstm.wasm.js'
  'assets/public/vendor/core/tesseract-core-simd-lstm.js' = 'vendor/core/tesseract-core-simd-lstm.js'
  'assets/public/vendor/core/tesseract-core-simd-lstm.wasm' = 'vendor/core/tesseract-core-simd-lstm.wasm'
  'assets/public/vendor/core/tesseract-core-simd-lstm.wasm.js' = 'vendor/core/tesseract-core-simd-lstm.wasm.js'
}

try {
  foreach ($source in $files.Keys) {
    $entry = $archive.GetEntry($source)
    if (-not $entry) { throw "Missing APK asset: $source" }
    $destination = Join-Path $projectRoot $files[$source]
    $directory = Split-Path -Parent $destination
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
    $inputStream = $entry.Open()
    $outputStream = [System.IO.File]::Create($destination)
    try { $inputStream.CopyTo($outputStream) }
    finally { $outputStream.Dispose(); $inputStream.Dispose() }
  }
} finally {
  $archive.Dispose()
}

Write-Host 'Standalone web assets are ready.'
