#!/bin/bash
# Script simplificado para Ubuntu NATIVO (no WSL)
# Copia este archivo junto con el proyecto a tu máquina Ubuntu

echo "🚀 Instalación Rápida - SUTEBA Hotel Tools para Ubuntu"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar que NO sea WSL
if grep -qi microsoft /proc/version 2>/dev/null; then
    echo "❌ ERROR: Estás ejecutando esto en WSL"
    echo "   Este script es para Ubuntu NATIVO"
    echo ""
    echo "   En WSL, simplemente ejecuta: ./launcher.sh"
    echo ""
    exit 1
fi

echo "✅ Ubuntu nativo detectado"
echo ""

# Obtener directorio del proyecto
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Crear archivo .desktop principal
DESKTOP_FILE="$PROJECT_DIR/SUTEBA-Hotel-Tools.desktop"

cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=SUTEBA Hotel Tools
Comment=Herramienta para gestión de vouchers y fichas de hotel
Exec=$PROJECT_DIR/launcher.sh
Path=$PROJECT_DIR
Icon=applications-internet
Terminal=false
Categories=Office;Utility;
StartupNotify=true
EOF

chmod +x "$DESKTOP_FILE"

echo "✅ Archivo .desktop creado"
echo ""

# Determinar ubicación del escritorio
DESKTOP_PATH="$HOME/Escritorio"
if [ ! -d "$DESKTOP_PATH" ]; then
    DESKTOP_PATH="$HOME/Desktop"
fi

if [ ! -d "$DESKTOP_PATH" ]; then
    echo "❌ No se encontró la carpeta del escritorio"
    echo "   Por favor copia manualmente:"
    echo "   cp $DESKTOP_FILE ~/Escritorio/"
    exit 1
fi

# Copiar al escritorio
cp "$DESKTOP_FILE" "$DESKTOP_PATH/"
chmod +x "$DESKTOP_PATH/SUTEBA-Hotel-Tools.desktop"

# Instalar en menú de aplicaciones del usuario
APPLICATIONS_DIR="$HOME/.local/share/applications"
mkdir -p "$APPLICATIONS_DIR"

cp "$DESKTOP_FILE" "$APPLICATIONS_DIR/suteba-hotel-tools.desktop"
chmod +x "$APPLICATIONS_DIR/suteba-hotel-tools.desktop"

if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$APPLICATIONS_DIR" >/dev/null 2>&1 || true
fi

# Marcar como confiable (Ubuntu 20.04+)
gio set "$DESKTOP_PATH/SUTEBA-Hotel-Tools.desktop" metadata::trusted true 2>/dev/null || {
    echo "⚠️  No se pudo marcar como confiable automáticamente"
    echo "   Haz clic derecho → 'Permitir ejecución' cuando lo uses"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ¡INSTALACIÓN COMPLETA!"
echo ""
echo "📱 Verás un icono en tu escritorio: 'SUTEBA Hotel Tools'"
echo "📱 También quedan disponibles en el menú de aplicaciones de Ubuntu"
echo ""
echo "🎯 Para usar:"
echo "   1. Doble clic en el icono del escritorio"
echo "   2. Si pregunta, marca 'Confiar y ejecutar'"
echo "   3. El navegador se abrirá automáticamente"
echo ""
echo "⏹️  Para detener: ./stop-server.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
