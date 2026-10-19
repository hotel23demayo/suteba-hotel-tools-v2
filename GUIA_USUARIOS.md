# 🚀 SUTEBA Hotel Tools - Guía Rápida para Usuarios

## 📋 Instalación (Solo la primera vez)

### ⚠️ IMPORTANTE: Diferencia WSL vs Ubuntu Nativo

Este proyecto debe usarse en **Ubuntu nativo** (instalación completa de Ubuntu).

- **Si estás en WSL** (Windows Subsystem for Linux): Usa `./launcher.sh` directamente
- **Si estás en Ubuntu nativo**: Instala el lanzador con icono de escritorio

### Para usuarios de Ubuntu NATIVO

1. Abre una terminal en la carpeta del proyecto
2. Ejecuta el instalador:
   ```bash
   ./instalar-ubuntu-nativo.sh
   ```
3. ¡Listo! Ya tendrás un icono en tu escritorio

### Para desarrolladores en WSL

No uses el archivo .desktop en WSL. Simplemente ejecuta:
```bash
./launcher.sh
```

O crea un alias en tu `~/.bashrc`:
```bash
alias suteba='cd /ruta/al/proyecto && ./launcher.sh'
```

---

## 💻 Uso Diario

### Opción 1: Con el lanzador instalado (Recomendado)

1. **Doble clic** en el icono "SUTEBA Hotel Tools" en tu escritorio
2. El navegador se abrirá automáticamente
3. ¡Comienza a trabajar!

### Opción 2: Desde la terminal

```bash
./launcher.sh
```

### Opción 3: Usar tu favorito del navegador

Si ya tienes el servidor corriendo, simplemente abre tu favorito:
- `http://localhost:8000/index.html`

---

## 📄 Módulos disponibles

Desde la página principal puedes acceder a:

- **📋 Vouchers MAP/PC** - Generación de vouchers de comidas según el tipo de pensión.
- **🏨 Rooming MAP/PC** - Listados de habitaciones y pasajeros, con filtros según el tipo de pensión.
- **👤 Ficha Pax** - Generación de fichas individuales de pasajeros.
- **🏖️ Vouchers Alicante** - Generación de vouchers mediante plantilla PDF.
- **🍽️ Voucher de Comidas Diario** - Completar e imprimir el voucher diario de comidas sobre la plantilla oficial.

### Voucher de Comidas Diario

1. Desde el menú principal, ingresá a **Voucher de Comidas Diario**.
2. Completá los campos solicitados en pantalla.
3. Revisá los datos y la vista previa antes de imprimir.
4. Utilizá la opción de impresión del navegador y verificá la escala y el tamaño del papel.

La plantilla PDF y las posiciones de los campos se encuentran en `python/mealVoucher/`. No renombres ni muevas esos archivos, porque el módulo los carga desde esas rutas.

### Nota sobre los archivos CSV

Los CSV con datos de reservas o pasajeros deben ser aportados por el usuario cuando corresponda. No deben incluirse en el repositorio Git si contienen datos personales o información real de huéspedes.


### Nota para Vouchers Alicante

En la pantalla de **Vouchers Alicante** puedes usar el botón **Seleccionar CSV (Descargas)**.
En navegadores compatibles, el selector se abre directamente en la carpeta Descargas/Downloads.
Si el navegador no soporta esa función, el sistema usa automáticamente el selector normal de archivos.

---

## ⏹️ Detener el servidor

Cuando termines de trabajar:

```bash
./stop-server.sh
```

O simplemente cierra la terminal donde se ejecutó.

---

## ❓ Problemas comunes

### El navegador no se abre automáticamente

No te preocupes, abre manualmente:
```
http://localhost:8000/index.html
```

### Error: "Puerto 8000 ya en uso"

El servidor ya está corriendo. Solo abre el navegador en:
```
http://localhost:8000/index.html
```

### Error: "python3: command not found"

Necesitas instalar Python 3:
```bash
sudo apt-get update
sudo apt-get install python3
```

### Los archivos no se generan o hay errores CORS

**IMPORTANTE:** Nunca abras los archivos HTML haciendo doble clic directamente.
Siempre usa el lanzador o inicia el servidor con `./launcher.sh`

---

## 🆘 Soporte

Si tienes problemas, contacta al administrador del sistema y proporciona:
- Qué módulo estabas usando
- Qué error apareció en pantalla
- El contenido de `/tmp/suteba-server.log` si existe

---

## 🎯 Tips para usuarios nuevos

1. **Siempre usa el lanzador** - Es la forma más fácil
2. **No cierres el navegador** - Solo cierra las pestañas
3. **Guarda tus favoritos** - Marca las páginas que más uses
4. **Lee los mensajes** - La aplicación te guía con mensajes claros

---

*Versión 1.0 - Enero 2026*
