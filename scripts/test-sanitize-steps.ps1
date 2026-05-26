param([string]$XmlPath)
try {
  [void][xml](Get-Content $XmlPath -Encoding UTF8)
  Write-Host "OK"
} catch {
  Write-Host "FAIL: $($_.Exception.Message.Substring(0, [Math]::Min(120, $_.Exception.Message.Length)))"
}
