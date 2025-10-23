@echo off
title 🌸 Mariela PDV - Frontend
color 0A

echo ===============================================
echo     🌸 Mariela PDV - Iniciando Projeto
echo ===============================================
echo.

REM Verifica se o Node.js está instalado
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ ERRO: Node.js não encontrado!
    echo Baixe em: https://nodejs.org/
    pause
    exit /b 1
)

REM Verifica se node_modules existe
if not exist "node_modules\" (
    echo [1/2] Instalando dependências...
    call npm install
    if errorlevel 1 (
        echo ❌ ERRO: Falha ao instalar dependências!
        pause
        exit /b 1
    )
) else (
    echo [1/2] Dependências já instaladas.
)

echo.
echo [2/2] Iniciando servidor frontend...
echo.
echo ===============================================
echo Frontend: http://192.168.0.10:8080/
echo Backend (Render): Configurado em VITE_API_URL
echo Banco de Dados: MongoDB Atlas Cloud
echo ===============================================
echo.
echo 🌐 O navegador será aberto automaticamente.
echo Pressione CTRL+C para parar o servidor.
echo.

REM Abre navegador
start "" http://192.168.0.10:8080/

REM Inicia o servidor (minimizado, em background)
start /min cmd /c "npm run dev"
