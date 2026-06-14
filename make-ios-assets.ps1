# Genere les images source iOS (icone 1024 + splash 2732) pour @capacitor/assets.
# Usage : powershell -ExecutionPolicy Bypass -File make-ios-assets.ps1

Add-Type -AssemblyName System.Drawing

$assets = Join-Path $PSScriptRoot 'assets'
New-Item -ItemType Directory -Force -Path $assets | Out-Null

function New-Night([int]$size, [single]$moonFrac, [int]$nStars, [int]$seed, [bool]$haloCenter) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(30, 40, 92),
        [System.Drawing.Color]::FromArgb(7, 11, 28),
        90.0)
    $g.FillRectangle($bg, $rect)

    $rand = New-Object System.Random($seed)
    $star = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(225, 255, 255, 255))
    $cx = $size / 2.0; $cy = $size / 2.0
    $moonR = $size * $moonFrac
    $placed = 0
    while ($placed -lt $nStars) {
        $x = $rand.Next(40, $size - 40); $y = $rand.Next(40, $size - 40)
        $dx = $x - $cx; $dy = $y - $cy
        if ([Math]::Sqrt($dx * $dx + $dy * $dy) -lt $moonR * 1.25) { continue }
        $r = $rand.Next([int]($size/300), [int]($size/120))
        $g.FillEllipse($star, $x, $y, $r, $r)
        $placed++
    }

    $mD = $moonR * 2
    $mx = $cx - $moonR; $my = $cy - $moonR
    $halo = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 246, 207, 114))
    $g.FillEllipse($halo, $mx - $moonR*0.18, $my - $moonR*0.18, $mD + $moonR*0.36, $mD + $moonR*0.36)
    $moonRect = New-Object System.Drawing.RectangleF($mx, $my, $mD, $mD)
    $moon = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $moonRect,
        [System.Drawing.Color]::FromArgb(255, 248, 221),
        [System.Drawing.Color]::FromArgb(238, 199, 96),
        45.0)
    $g.FillEllipse($moon, $moonRect)
    $crater = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(55, 170, 130, 60))
    $g.FillEllipse($crater, $mx + $mD*0.30, $my + $mD*0.26, $mD*0.16, $mD*0.16)
    $g.FillEllipse($crater, $mx + $mD*0.58, $my + $mD*0.46, $mD*0.12, $mD*0.12)
    $g.FillEllipse($crater, $mx + $mD*0.40, $my + $mD*0.62, $mD*0.10, $mD*0.10)

    $g.Dispose()
    return $bmp
}

# Icone 1024 (lune large, pleine page, pas de transparence)
$icon = New-Night 1024 0.30 16 42 $false
$icon.Save((Join-Path $assets 'icon-only.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$icon.Save((Join-Path $assets 'icon-foreground.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$icon.Dispose()

# Splash 2732 (lune plus petite, centree, beaucoup d'etoiles)
$splash = New-Night 2732 0.13 60 7 $true
$splash.Save((Join-Path $assets 'splash.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$splash.Save((Join-Path $assets 'splash-dark.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$splash.Dispose()

Write-Host 'assets/ : icon-only.png, splash.png, splash-dark.png generes.'
