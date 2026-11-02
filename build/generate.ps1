# =====================================================================
# generate.ps1 - builds the Portfolio site assets from Complete Cards/.
#   1. Reads each canonical *_card.json, extracts TEXT fields only
#      (drops the huge base64 image blobs).
#   2. Generates optimized web images: <nn>_front.jpg / <nn>_back.jpg
#      at ~1200px (display) and <nn>_front@2x.jpg / <nn>_back@2x.jpg
#      at ~2000px (lightbox zoom). Masters in Complete Cards/ untouched.
#   3. Writes data/cards.js (window.CARDS = [...]) as the single source
#      of truth the site reads.
#
# Re-run any time (e.g. after you add cards #21-31). It rebuilds from
# scratch, so adding a card = add its folder to the $cardFolders map
# below and re-run.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File generate.ps1
# =====================================================================

Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

# --- Paths -----------------------------------------------------------
$projectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$completeDir = Join-Path $projectRoot 'Complete Cards'
$portfolio   = Join-Path $projectRoot 'Portfolio'
$imgOutDir   = Join-Path $portfolio 'assets\cards'
$dataOutDir  = Join-Path $portfolio 'data'

New-Item -ItemType Directory -Force -Path $imgOutDir  | Out-Null
New-Item -ItemType Directory -Force -Path $dataOutDir | Out-Null

Write-Host "Project root:   $projectRoot"
Write-Host "Complete Cards: $completeDir"
Write-Host "Output images:  $imgOutDir"
Write-Host "Output data:    $dataOutDir"
Write-Host ""

# --- Canonical card folders (number -> folder name) ------------------
# Explicit map so we control EXACTLY which export is canonical and avoid
# the messy 1.1/1.2 duplicates and the stray 17-SnakeHead under 1-Rats.
$cardFolders = [ordered]@{
   1 = '1 Rats'
   2 = '2 Brown Treesnake'
   3 = '3 Burmese Python'
   4 = '4 Spotted Lanternfly'
   5 = '5 Zebra Mussels'
   6 = '6 Feral hogs'
   7 = '7 Silver Carp'
   8 = '8 Southern House Mosquito'
   9 = '9 Kudzu'
  10 = '10 RIFA'
  11 = '11 Sea Lamprey'
  12 = '12 Big Headed Carp'
  13 = '13 Hydrilla'
  14 = '14 Lionfish'
  15 = '15 Cheatgrass'
  16 = '16 Coconut Rhino Beetle'
  17 = '17 SnakeHead'
  18 = '18 Blue Catfish'
  19 = '19 Golden Mussels'
  20 = '20 Black Carp'
  21 = '21 Grass Carp'
}

# --- Image resize helper ---------------------------------------------
function Save-Resized {
  param([string]$SrcPath, [string]$OutPath, [int]$TargetWidth, [int]$Quality = 88)

  $img = [System.Drawing.Image]::FromFile($SrcPath)
  try {
    $w = $TargetWidth
    $h = [int][math]::Round($img.Height * ($w / $img.Width))
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    try {
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $g.DrawImage($img, 0, 0, $w, $h)
      $g.Dispose()

      $enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
      $ep  = New-Object System.Drawing.Imaging.EncoderParameters 1
      $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]$Quality)
      $bmp.Save($OutPath, $enc, $ep)
    } finally { $bmp.Dispose() }
  } finally { $img.Dispose() }
  return "{0}x{1}" -f $w, $h
}

# --- Field extraction: only the text we need -------------------------
$keepFields = @(
  'f_common','f_sci','f_teamA','f_teamB','f_feat1','f_feat2','f_year','f_tagline',
  's_spread','s_impact','s_resil','s_stealth','s_gross',
  'b_common','b_sci','b_first','b_path','b_impacts','b_detect','b_manage',
  'b_qr','b_photo_credit','b_map_credit',
  'colMain1','colMain2','colAcc1','colAcc2'
)

$cards = New-Object System.Collections.ArrayList

foreach ($entry in $cardFolders.GetEnumerator()) {
  $num = $entry.Key
  $folderName = $entry.Value
  $folder = Join-Path $completeDir $folderName
  if (-not (Test-Path -LiteralPath $folder)) { Write-Warning "MISSING folder for #${num}: $folder"; continue }

  $folderFiles = Get-ChildItem -LiteralPath $folder -File
  $front = $folderFiles | Where-Object { $_.Name -like '*_front.png' } | Select-Object -First 1
  $back  = $folderFiles | Where-Object { $_.Name -like '*_back.png'  } | Select-Object -First 1
  $json  = $folderFiles | Where-Object { $_.Name -like '*_card.json' } | Select-Object -First 1

  if (-not $front) { Write-Warning "#${num}: no _front.png in $folder"; continue }
  if (-not $back)  { Write-Warning "#${num}: no _back.png in $folder" }
  if (-not $json)  { Write-Warning "#${num}: no _card.json in $folder" }

  $nn = '{0:D2}' -f $num

  $frontDisp = Join-Path $imgOutDir "${nn}_front.jpg"
  $frontZoom = Join-Path $imgOutDir "${nn}_front@2x.jpg"
  $dimF = Save-Resized -SrcPath $front.FullName -OutPath $frontDisp -TargetWidth 1200
  Save-Resized -SrcPath $front.FullName -OutPath $frontZoom -TargetWidth 2000 | Out-Null
  Write-Host ("#{0,2}  front {1}  (1200 + 2000)" -f $num, $dimF)

  $backRel = $null
  $backZoomRel = $null
  if ($back) {
    $backDisp = Join-Path $imgOutDir "${nn}_back.jpg"
    $backZoom = Join-Path $imgOutDir "${nn}_back@2x.jpg"
    Save-Resized -SrcPath $back.FullName -OutPath $backDisp -TargetWidth 1200 | Out-Null
    Save-Resized -SrcPath $back.FullName -OutPath $backZoom -TargetWidth 2000 | Out-Null
    $backRel = "assets/cards/${nn}_back.jpg"
    $backZoomRel = "assets/cards/${nn}_back@2x.jpg"
    Write-Host ("#{0,2}  back  done" -f $num)
  }

  $data = [ordered]@{
    num       = $num
    front     = "assets/cards/${nn}_front.jpg"
    frontZoom = "assets/cards/${nn}_front@2x.jpg"
    back      = $backRel
    backZoom  = $backZoomRel
  }

  if ($json) {
    # Read JSON explicitly as UTF-8 so em-dashes and other multibyte chars survive.
    $jsonText = [System.IO.File]::ReadAllText($json.FullName, [System.Text.Encoding]::UTF8)
    $raw = $jsonText | ConvertFrom-Json
    $f = $raw.fields
    foreach ($k in $keepFields) {
      if ($f -and ($f.PSObject.Properties.Name -contains $k)) {
        $data[$k] = $f.$k
      }
    }
  }

  [void]$cards.Add($data)
}

# --- Write data/cards.js --------------------------------------------
$jsonOut = $cards | ConvertTo-Json -Depth 6
$header  = "// AUTO-GENERATED by Portfolio/build/generate.ps1 - do not edit by hand."
$header2 = "// Re-run generate.ps1 to rebuild after adding or changing cards."
$body    = "window.CARDS = $jsonOut;"
$outPath = Join-Path $dataOutDir 'cards.js'
$fullText = ($header + "`r`n" + $header2 + "`r`n" + $body + "`r`n")
# Write as UTF-8 WITHOUT BOM via .NET so em-dashes etc. survive intact.
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($outPath, $fullText, $utf8NoBom)

Write-Host ""
Write-Host ("Wrote {0} cards to {1}" -f $cards.Count, $outPath)
Write-Host "Done."
