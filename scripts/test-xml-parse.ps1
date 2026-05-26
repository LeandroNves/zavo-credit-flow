$files = @(
  "_out_0_template_copy.docx",
  "_out_1_rendered.docx",
  "_out_2_breaks_only.docx",
  "_out_3_sanitized.docx",
  "_out_4_double_zip.docx"
)
foreach ($f in $files) {
  $tmp = Join-Path $env:TEMP ("docx-" + [guid]::NewGuid().ToString())
  Copy-Item $f ($tmp + ".zip")
  Expand-Archive ($tmp + ".zip") $tmp -Force
  $xmlPath = Join-Path $tmp "word\document.xml"
  try {
    [void][xml](Get-Content $xmlPath -Encoding UTF8)
    Write-Host "$f XML parse OK"
  } catch {
    Write-Host "$f XML parse FAIL: $($_.Exception.Message)"
  }
  Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
  Remove-Item ($tmp + ".zip") -Force -ErrorAction SilentlyContinue
}
