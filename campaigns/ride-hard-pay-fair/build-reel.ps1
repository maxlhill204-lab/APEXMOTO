$ErrorActionPreference = "Stop"

$campaignDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$assetsDir = Join-Path $campaignDir "assets"
$stockDir = Join-Path $assetsDir "stock"
$audioDir = Join-Path $assetsDir "audio"
$renderDir = Join-Path $campaignDir "render"
$segmentsDir = Join-Path $renderDir "segments"
$outputPath = Join-Path $campaignDir "apex-moto-ride-hard-pay-fair-reel.mp4"
$ffmpeg = Join-Path $campaignDir ".tools\node_modules\ffmpeg-static\ffmpeg.exe"
$font = "C\:/Windows/Fonts/bahnschrift.ttf"

if (-not (Test-Path -LiteralPath $ffmpeg)) {
  & npm install --prefix (Join-Path $campaignDir ".tools") --no-save ffmpeg-static
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $ffmpeg)) {
    throw "The campaign FFmpeg dependency could not be installed."
  }
}

New-Item -ItemType Directory -Force -Path $segmentsDir, $stockDir, $audioDir | Out-Null

$downloads = @{
  (Join-Path $stockDir "biker-putting-on-helmet.mp4") = "https://assets.mixkit.co/videos/43105/43105-720.mp4"
  (Join-Path $stockDir "motorcyclist-accelerating.mp4") = "https://assets.mixkit.co/videos/43095/43095-720.mp4"
  (Join-Path $stockDir "rear-tire-roost.mp4") = "https://assets.mixkit.co/videos/43099/43099-720.mp4"
  (Join-Path $stockDir "aerial-riding.mp4") = "https://assets.mixkit.co/videos/43116/43116-720.mp4"
  (Join-Path $stockDir "vertical-bike-macro.mp4") = "https://assets.mixkit.co/videos/41946/41946-720.mp4"
  (Join-Path $audioDir "vampires-in-the-city.mp3") = "https://assets.mixkit.co/music/892/892.mp3"
  (Join-Path $audioDir "motocross-engine.mp3") = "https://assets.mixkit.co/active_storage/sfx/2727/2727-preview.mp3"
  (Join-Path $audioDir "camera-shutter.mp3") = "https://assets.mixkit.co/active_storage/sfx/1133/1133-preview.mp3"
  (Join-Path $audioDir "cinematic-whoosh.mp3") = "https://assets.mixkit.co/active_storage/sfx/1492/1492-preview.mp3"
  (Join-Path $audioDir "big-cinematic-impact.mp3") = "https://assets.mixkit.co/active_storage/sfx/788/788-preview.mp3"
}
foreach ($entry in $downloads.GetEnumerator()) {
  if (-not (Test-Path -LiteralPath $entry.Key)) {
    Invoke-WebRequest -UseBasicParsing -Uri $entry.Value -OutFile $entry.Key
  }
}

$videoCodec = @("-an", "-r", "24", "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart")
$grade = "eq=contrast=1.16:brightness=-0.07:saturation=0.72,colorbalance=bs=.035:rs=.035,unsharp=5:5:.35:5:5:0"
$portraitCrop = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920"

function Invoke-Ffmpeg([string[]]$Arguments) {
  & $ffmpeg -hide_banner -loglevel error -y @Arguments
  if ($LASTEXITCODE -ne 0) { throw "FFmpeg failed with exit code $LASTEXITCODE" }
}

function New-StillSegment {
  param(
    [string]$InputPath,
    [string]$OutputName,
    [double]$Duration,
    [string]$ExtraFilter = "",
    [double]$ZoomStep = 0.0014
  )
  $filters = @($portraitCrop)
  if ($ExtraFilter) { $filters += $ExtraFilter }
  $filters += "zoompan=z='min(zoom+$ZoomStep,1.07)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=24"
  $filters += "eq=contrast=1.08:saturation=.92"
  Invoke-Ffmpeg (@("-loop", "1", "-i", $InputPath, "-t", $Duration.ToString("0.00", [cultureinfo]::InvariantCulture), "-vf", ($filters -join ",")) + $videoCodec + @((Join-Path $segmentsDir $OutputName)))
}

function New-StockSegment {
  param(
    [string]$InputPath,
    [string]$OutputName,
    [double]$Start,
    [double]$Duration,
    [string]$CropFilter = ""
  )
  $filters = if ($CropFilter) { "$CropFilter,$grade" } else { "$portraitCrop,$grade" }
  Invoke-Ffmpeg (@("-ss", $Start.ToString("0.00", [cultureinfo]::InvariantCulture), "-i", $InputPath, "-t", $Duration.ToString("0.00", [cultureinfo]::InvariantCulture), "-vf", $filters) + $videoCodec + @((Join-Path $segmentsDir $OutputName)))
}

$helmet = Join-Path $assetsDir "helmet-cinematic.png"
$goggles = Join-Path $assetsDir "goggles-cinematic.png"
$riderPrep = Join-Path $assetsDir "rider-goggle-prep.png"
$logo = Join-Path (Split-Path -Parent (Split-Path -Parent $campaignDir)) "public\brand\apex-moto-logo.png"

# Tactile opening: exact products, then rider movement.
New-StillSegment -InputPath $goggles -OutputName "00-goggles.mp4" -Duration 0.65 -ExtraFilter "crop=864:1536:54:65,scale=1080:1920" -ZoomStep 0.0022
New-StillSegment -InputPath $helmet -OutputName "01-helmet.mp4" -Duration 0.60 -ExtraFilter "crop=864:1536:48:40,scale=1080:1920" -ZoomStep 0.0018
New-StillSegment -InputPath $riderPrep -OutputName "02-rider-prep.mp4" -Duration 0.95 -ExtraFilter "crop=864:1536:48:40,scale=1080:1920" -ZoomStep 0.0020

# Action body.
New-StockSegment -InputPath (Join-Path $stockDir "motorcyclist-accelerating.mp4") -OutputName "03-launch.mp4" -Start 1.25 -Duration 1.80 -CropFilter "crop=405:720:360:0,scale=1080:1920"
New-StockSegment -InputPath (Join-Path $stockDir "rear-tire-roost.mp4") -OutputName "04-roost.mp4" -Start 0.20 -Duration 0.90 -CropFilter "crop=405:720:0:0,scale=1080:1920"
New-StockSegment -InputPath (Join-Path $stockDir "aerial-riding.mp4") -OutputName "05-aerial.mp4" -Start 10.00 -Duration 1.50 -CropFilter "crop=405:720:430:0,scale=1080:1920"

# Product proof: real helmet and goggles, not generated substitutes.
New-StillSegment -InputPath $helmet -OutputName "06-helmet-hero.mp4" -Duration 1.40 -ExtraFilter "crop=900:1600:30:20,scale=1080:1920" -ZoomStep 0.0010
New-StillSegment -InputPath $goggles -OutputName "07-goggles-hero.mp4" -Duration 1.10 -ExtraFilter "crop=900:1600:20:20,scale=1080:1920" -ZoomStep 0.0017
New-StillSegment -InputPath $helmet -OutputName "08-peak-macro.mp4" -Duration 0.80 -ExtraFilter "crop=720:1280:0:170,scale=1080:1920" -ZoomStep 0.0026
New-StillSegment -InputPath $helmet -OutputName "09-shell-macro.mp4" -Duration 0.80 -ExtraFilter "crop=720:1280:220:160,scale=1080:1920" -ZoomStep 0.0024
New-StillSegment -InputPath $helmet -OutputName "10-rear-macro.mp4" -Duration 0.80 -ExtraFilter "crop=720:1280:240:120,scale=1080:1920" -ZoomStep 0.0028

# Dust hook frame.
$hookFilter = "crop=405:720:690:0,scale=1080:1920,$grade," +
  "drawtext=fontfile='$font':text='THE DIRT DOES NOT CARE':fontcolor=0xf5f2e8:fontsize=54:x=(w-text_w)/2:y=760:borderw=0," +
  "drawtext=fontfile='$font':text='WHAT LOGO YOU PAID FOR.':fontcolor=0xd9a827:fontsize=54:x=(w-text_w)/2:y=835:borderw=0"
Invoke-Ffmpeg (@("-ss", "4.30", "-i", (Join-Path $stockDir "motorcyclist-accelerating.mp4"), "-t", "1.90", "-vf", $hookFilter) + $videoCodec + @((Join-Path $segmentsDir "11-hook.mp4")))

# Exact APEX MOTO logo on the evergreen end card.
$endFilter = "[1:v]scale=640:640[logo];" +
  "[0:v][logo]overlay=(W-w)/2:320," +
  "drawtext=fontfile='$font':text='RIDE HARD. PAY FAIR.':fontcolor=0xf5f2e8:fontsize=64:x=(w-text_w)/2:y=1120," +
  "drawtext=fontfile='$font':text='APEXMOTO.COM.AU':fontcolor=0xd9a827:fontsize=38:x=(w-text_w)/2:y=1240"
Invoke-Ffmpeg (@("-f", "lavfi", "-i", "color=c=0x080808:s=1080x1920:r=24:d=1.80", "-loop", "1", "-i", $logo, "-filter_complex", $endFilter, "-t", "1.80") + $videoCodec + @((Join-Path $segmentsDir "12-end-card.mp4")))

$orderedSegments = @(
  "00-goggles.mp4", "01-helmet.mp4", "02-rider-prep.mp4", "03-launch.mp4", "04-roost.mp4", "05-aerial.mp4",
  "06-helmet-hero.mp4", "07-goggles-hero.mp4", "08-peak-macro.mp4", "09-shell-macro.mp4", "10-rear-macro.mp4",
  "11-hook.mp4", "12-end-card.mp4"
)
$concatPath = Join-Path $renderDir "segments.txt"
$orderedSegments | ForEach-Object { "file '$((Join-Path $segmentsDir $_).Replace("'", "''"))'" } | Set-Content -Encoding utf8 $concatPath
$visualPath = Join-Path $renderDir "visual-only.mp4"
Invoke-Ffmpeg @("-f", "concat", "-safe", "0", "-i", $concatPath, "-c", "copy", $visualPath)

# Licensed music and effects. The mix is kept clean and punchy for phone speakers.
$music = Join-Path $audioDir "vampires-in-the-city.mp3"
$engine = Join-Path $audioDir "motocross-engine.mp3"
$shutter = Join-Path $audioDir "camera-shutter.mp3"
$whoosh = Join-Path $audioDir "cinematic-whoosh.mp3"
$impact = Join-Path $audioDir "big-cinematic-impact.mp3"
$audioFilter = @"
[1:a]atrim=start=54.0:end=69.0,asetpts=PTS-STARTPTS,volume=0.42,afade=t=in:st=0:d=0.20,afade=t=out:st=14.2:d=0.8[music];
[2:a]atrim=start=0:end=7.0,asetpts=PTS-STARTPTS,volume=0.62,afade=t=in:st=0:d=0.3,afade=t=out:st=5.4:d=1.2,adelay=1250|1250[engine];
[3:a]atrim=start=0:end=0.55,asetpts=PTS-STARTPTS,volume=0.90,adelay=620|620[click1];
[3:a]atrim=start=0:end=0.55,asetpts=PTS-STARTPTS,volume=0.75,adelay=6400|6400[click2];
[3:a]atrim=start=0:end=0.55,asetpts=PTS-STARTPTS,volume=0.72,adelay=8900|8900[click3];
[3:a]atrim=start=0:end=0.55,asetpts=PTS-STARTPTS,volume=0.72,adelay=9700|9700[click4];
[3:a]atrim=start=0:end=0.55,asetpts=PTS-STARTPTS,volume=0.72,adelay=10500|10500[click5];
[4:a]atrim=start=0:end=1.1,asetpts=PTS-STARTPTS,volume=0.68,adelay=7800|7800[whoosh1];
[4:a]atrim=start=0:end=1.1,asetpts=PTS-STARTPTS,volume=0.72,adelay=11300|11300[whoosh2];
[5:a]atrim=start=0:end=2.4,asetpts=PTS-STARTPTS,volume=0.72,adelay=0|0[impact1];
[5:a]atrim=start=0:end=1.8,asetpts=PTS-STARTPTS,volume=0.55,adelay=13200|13200[impact2];
[music][engine][click1][click2][click3][click4][click5][whoosh1][whoosh2][impact1][impact2]amix=inputs=11:duration=first:dropout_transition=0,loudnorm=I=-14:LRA=7:TP=-1.2,afade=t=out:st=14.55:d=0.45[aout]
"@ -replace "`r?`n", ""

Invoke-Ffmpeg @(
  "-i", $visualPath,
  "-i", $music,
  "-i", $engine,
  "-i", $shutter,
  "-i", $whoosh,
  "-i", $impact,
  "-filter_complex", $audioFilter,
  "-map", "0:v:0", "-map", "[aout]",
  "-t", "15.00", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", $outputPath
)

Write-Host "Built $outputPath"
