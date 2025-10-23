#!/bin/bash

echo "========================================"
echo "  Mariela PDV - Iniciando Projeto"
echo "========================================"
echo ""

# Verifica se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "[1/2] Instalando dependencias do frontend..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERRO: Falha ao instalar dependencias!"
        exit 1
    fi
else
    echo "[1/2] Dependencias ja instaladas"
fi

echo ""
echo "[2/2] Iniciando servidor frontend..."
echo ""
echo "========================================"
echo "Frontend rodando em: http://localhost:8080"
echo "Backend (Render): Configurado em VITE_API_URL"
echo "MongoDB: Atlas Cloud"
echo "========================================"
echo ""
echo "Pressione CTRL+C para parar o servidor"
echo ""

npm run dev
