#!/bin/bash
# Launcher script - Inicia el servidor y abre el navegador automáticamente

# Obtener el directorio del script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Puerto a usar
PORT=8000

# Verificar si el puerto ya está en uso
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  El servidor ya está corriendo en el puerto $PORT"
    echo "🌐 Abriendo navegador..."
else
    echo "🚀 Iniciando SUTEBA Hotel Tools..."
    echo "📂 Directorio: $SCRIPT_DIR"
    echo "🌐 Servidor en: http://localhost:$PORT"
    echo ""
    
    # Iniciar el servidor en segundo plano
    python3 -m http.server $PORT > /tmp/suteba-server.log 2>&1 &
    SERVER_PID=$!
    
    # Guardar el PID para poder detenerlo después
    echo $SERVER_PID > /tmp/suteba-server.pid
    
    echo "✅ Servidor iniciado (PID: $SERVER_PID)"
    echo "📝 Log: /tmp/suteba-server.log"
    echo ""
    
    # Esperar un momento para que el servidor inicie
    sleep 2
fi

# Abrir el navegador en la página principal
echo "🌐 Abriendo navegador en index.html..."

# Detectar y usar el navegador disponible
if command -v xdg-open > /dev/null; then
    xdg-open "http://localhost:$PORT/index.html" 2>/dev/null
elif command -v gnome-open > /dev/null; then
    gnome-open "http://localhost:$PORT/index.html" 2>/dev/null
elif command -v firefox > /dev/null; then
    firefox "http://localhost:$PORT/index.html" 2>/dev/null &
elif command -v google-chrome > /dev/null; then
    google-chrome "http://localhost:$PORT/index.html" 2>/dev/null &
elif command -v chromium-browser > /dev/null; then
    chromium-browser "http://localhost:$PORT/index.html" 2>/dev/null &
else
    echo "❌ No se pudo detectar el navegador"
    echo "Por favor abre manualmente: http://localhost:$PORT/index.html"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ SUTEBA Hotel Tools está listo"
echo ""
echo "📄 Páginas disponibles:"
echo "   • Inicio: http://localhost:$PORT/index.html"
echo "   • Vouchers: http://localhost:$PORT/client/vouchers.html"
echo "   • Rooming: http://localhost:$PORT/client/rooming.html"
echo "   • Ficha Pax: http://localhost:$PORT/client/fichaPax.html"
echo ""
echo "⏹️  Para detener el servidor ejecuta: ./stop-server.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
