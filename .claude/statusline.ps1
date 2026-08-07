[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$d = 'sig'
$raw = [Console]::In.ReadToEnd()
if ($raw.Trim()) {
    $j = $raw | ConvertFrom-Json
    $m = if ($j.model.display_name) { $j.model.display_name } else { '?' }
    $pct = 'ctx {0:F0}%' -f $j.context_window.remaining_percentage
} else {
    $m = '...'
    $pct = '...'
}
[Console]::WriteLine("$d | $m | $pct")
