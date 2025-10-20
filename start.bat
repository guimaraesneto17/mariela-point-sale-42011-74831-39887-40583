@echo off
echo ========================================
echo   Mariela PDV - Iniciando Projeto
echo ========================================
echo.

REM Verifica se node_modules existe
if not exist "node_modules\" (
    echo [1/2] Instalando dependencias do frontend...
    call npm install
    if errorlevel 1 (
        echo ERRO: Falha ao instalar dependencias!
        pause
        exit /b 1
    )
) else (
    echo [1/2] Dependencias ja instaladas
)

echo.
echo [2/2] Iniciando servidor frontend...
echo.
echo ========================================
echo Frontend rodando em: http://localhost:5173
echo Backend (Render): Configurado em VITE_API_URL
echo MongoDB: Atlas Cloud
echo ========================================
echo.
echo Pressione CTRL+C para parar o servidor
echo.

npm run dev
