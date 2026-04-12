@echo off
:: Abre duas janelas separadas do Windows Terminal: Backend e Frontend
:: %~dp0.. resolve para a raiz do projeto (pai de /scripts)

set "ROOT=%~dp0.."

start "Backend"  wt --title "FinControl Backend"  -- cmd /k "cd /d "%ROOT%" && npm run dev:backend"
start "Frontend" wt --title "FinControl Frontend" -- cmd /k "cd /d "%ROOT%" && npm run dev:frontend"
