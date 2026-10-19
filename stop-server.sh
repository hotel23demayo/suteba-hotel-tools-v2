#!/bin/bash
# Script para detener el servidor SUTEBA Hotel Tools

echo "⏹️  Deteniendo servidor SUTEBA Hotel Tools..."

# Leer el PID del archivo
if [ -f /tmp/suteba-server.pid ]; then
    SERVER_PID=$(cat /tmp/suteba-server.pid)
    
    if ps -p $SERVER_PID > /dev/null 2>&1; then
        kill $SERVER_PID
        echo "✅ Servidor detenido (PID: $SERVER_PID)"
        rm /tmp/suteba-server.pid
    else
        echo "⚠️  El proceso $SERVER_PID ya no existe"
        rm /tmp/suteba-server.pid
    fi
else
    # Intentar buscar y matar cualquier servidor Python en puerto 8000
    echo "🔍 Buscando procesos en puerto 8000..."
    
    # Buscar procesos usando el puerto 8000
    PIDS=$(lsof -ti:8000 2>/dev/null)
    
    if [ -n "$PIDS" ]; then
        for PID in $PIDS; do
            kill $PID 2>/dev/null
            echo "✅ Proceso $PID detenido"
        done
    else
        echo "ℹ️  No hay servidores ejecutándose en el puerto 8000"
    fi
fi

# Limpiar log
if [ -f /tmp/suteba-server.log ]; then
    rm /tmp/suteba-server.log
fi

echo "✅ Limpieza completa"
