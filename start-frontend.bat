@echo off
REM ================================
REM 🌸 Mariela PDV - Frontend
REM ================================

REM Verifica se node_modules existe
if not exist "node_modules\" (
    echo Instalando dependencias...
    call npm install
)

REM Inicia o servidor em background (sem travar)
start /min cmd /c "npm run dev"

REM Abre o navegador automaticamente
start "" http://localhost:8080
