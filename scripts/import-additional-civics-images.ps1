$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$entries = Get-Content (Join-Path $PSScriptRoot '../src/data/additionalCivicsImages.json') -Raw | ConvertFrom-Json
$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
foreach ($entry in $entries) {
  $source = Join-Path 'C:/Users/Administrator/Downloads' $entry.original
  $destination = Join-Path $PSScriptRoot ('../src/assets/civics-photos/' + $entry.file)
  if ($entry.file.EndsWith('.webp')) { Copy-Item -LiteralPath $source -Destination $destination; continue }
  $image = [System.Drawing.Image]::FromFile($source)
  try {
    $scale = [Math]::Min([double]1, [double]1400 / [Math]::Max($image.Width, $image.Height))
    $bitmap = [System.Drawing.Bitmap]::new([int]($image.Width * $scale), [int]($image.Height * $scale))
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $parameters = [System.Drawing.Imaging.EncoderParameters]::new(1)
    try {
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.DrawImage($image, 0, 0, $bitmap.Width, $bitmap.Height)
      $parameters.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, [long]82)
      $bitmap.Save($destination, $encoder, $parameters)
    } finally { $parameters.Dispose(); $graphics.Dispose(); $bitmap.Dispose() }
  } finally { $image.Dispose() }
}
