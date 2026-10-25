$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$resRoot = Join-Path $projectRoot 'android/app/src/main/res'
$assetRoot = Join-Path $projectRoot 'assets'
$teal = [System.Drawing.ColorTranslator]::FromHtml('#176D65')
$white = [System.Drawing.Color]::White

function Save-Icon([int]$size, [string]$shape, [string]$destination) {
    $bitmap = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.ScaleTransform([single]($size / 108.0), [single]($size / 108.0))

    $background = [System.Drawing.SolidBrush]::new($teal)
    if ($shape -eq 'round') {
        $graphics.FillEllipse($background, 0, 0, 108, 108)
    } elseif ($shape -eq 'square') {
        $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
        $path.AddArc(0, 0, 50, 50, 180, 90)
        $path.AddArc(58, 0, 50, 50, 270, 90)
        $path.AddArc(58, 58, 50, 50, 0, 90)
        $path.AddArc(0, 58, 50, 50, 90, 90)
        $path.CloseFigure()
        $graphics.FillPath($background, $path)
        $path.Dispose()
    }

    $pen = [System.Drawing.Pen]::new($white, [single]12)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $points = [System.Drawing.PointF[]]@(
        [System.Drawing.PointF]::new(31, 78),
        [System.Drawing.PointF]::new(54, 30),
        [System.Drawing.PointF]::new(78, 78)
    )
    $graphics.DrawLines($pen, $points)
    $pen.Dispose()
    $background.Dispose()
    $graphics.Dispose()
    $bitmap.Save($destination, [System.Drawing.Imaging.ImageFormat]::Png)
    $bitmap.Dispose()
}

$sizes = [ordered]@{ mdpi = 48; hdpi = 72; xhdpi = 96; xxhdpi = 144; xxxhdpi = 192 }
foreach ($density in $sizes.Keys) {
    $folder = Join-Path $resRoot "mipmap-$density"
    $size = $sizes[$density]
    Save-Icon $size 'square' (Join-Path $folder 'ic_launcher.png')
    Save-Icon $size 'round' (Join-Path $folder 'ic_launcher_round.png')
    Save-Icon ($size * 9 / 4) 'foreground' (Join-Path $folder 'ic_launcher_foreground.png')
}
Save-Icon 512 'square' (Join-Path $assetRoot 'app-icon.png')

Set-Content -LiteralPath (Join-Path $assetRoot 'app-icon.svg') -Encoding utf8 -Value @'
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 108 108">
  <title>Sign by Sign</title>
  <rect x="0" y="0" width="108" height="108" rx="25" fill="#176d65"/>
  <path d="M31 78 54 30 78 78" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
'@

$foreground = @'
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path android:fillColor="@android:color/transparent"
        android:strokeColor="#FFFFFF"
        android:strokeWidth="12"
        android:strokeLineCap="round"
        android:strokeLineJoin="round"
        android:pathData="M31,78 L54,30 L78,78" />
</vector>
'@
Set-Content -LiteralPath (Join-Path $resRoot 'drawable-v24/ic_launcher_foreground.xml') -Encoding utf8 -Value $foreground
Set-Content -LiteralPath (Join-Path $resRoot 'drawable-v24/ic_launcher_monochrome.xml') -Encoding utf8 -Value $foreground
Set-Content -LiteralPath (Join-Path $resRoot 'values/ic_launcher_background.xml') -Encoding utf8 -Value @'
<?xml version="1.0" encoding="utf-8"?>
<resources><color name="ic_launcher_background">#176D65</color></resources>
'@
Set-Content -LiteralPath (Join-Path $resRoot 'drawable/ic_launcher_background.xml') -Encoding utf8 -Value @'
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp" android:height="108dp"
    android:viewportWidth="108" android:viewportHeight="108">
    <path android:fillColor="#176D65" android:pathData="M0,0h108v108h-108z" />
</vector>
'@

$adaptive = @'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
    <monochrome android:drawable="@drawable/ic_launcher_monochrome"/>
</adaptive-icon>
'@
Set-Content -LiteralPath (Join-Path $resRoot 'mipmap-anydpi-v26/ic_launcher.xml') -Encoding utf8 -Value $adaptive
Set-Content -LiteralPath (Join-Path $resRoot 'mipmap-anydpi-v26/ic_launcher_round.xml') -Encoding utf8 -Value $adaptive

Write-Output "Sign by Sign launcher icons generated: $assetRoot/app-icon.png"
