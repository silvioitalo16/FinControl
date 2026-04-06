# stop-all.ps1 - Encerra frontend (Vite :5173) e backend (tsx :3001) do FinControl

$ports      = @(5173, 3001)
$labels     = @{ 5173 = 'Frontend  (Vite :5173)'; 3001 = 'Backend   (tsx  :3001)' }
$killed     = [System.Collections.Generic.HashSet[int]]::new()
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Kill-Tree ($procId) {
    if ($killed.Contains($procId)) { return }
    & taskkill /F /T /PID $procId 2>&1 | Out-Null
    [void]$killed.Add($procId)
}

Write-Host ""
Write-Host "  FinControl - encerrando servidores..." -ForegroundColor White
Write-Host "  -------------------------------------" -ForegroundColor DarkGray

foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    $label = $labels[$port]
    if ($conns) {
        foreach ($conn in $conns) {
            $ownerPid = $conn.OwningProcess
            if ($ownerPid -and $ownerPid -ne 0) {
                Kill-Tree $ownerPid
            }
        }
        Write-Host "  [ok] $label" -ForegroundColor Green
    } else {
        Write-Host "  [--] $label" -ForegroundColor DarkGray
    }
}

$extras = 0
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object {
    $_.CommandLine -and (
        $_.CommandLine -like "*$projectDir*" -or
        $_.CommandLine -like "*concurrently*"
    )
} | ForEach-Object {
    Kill-Tree $_.ProcessId
    $extras++
}

if ($extras -gt 0) {
    Write-Host "  [ok] $extras node residual encerrado" -ForegroundColor Green
}

Write-Host "  -------------------------------------" -ForegroundColor DarkGray
if ($killed.Count -eq 0) {
    Write-Host "  Nenhum servidor em execucao." -ForegroundColor DarkGray
} else {
    $n = $killed.Count
    Write-Host "  Tudo encerrado. $n processos finalizados." -ForegroundColor Cyan
}
Write-Host ""
