# SUTEBA Hotel Tools

Sistema web unificado para procesamiento de datos hoteleros, generación de vouchers de comidas y gestión de reservas.

**Última actualización:** Marzo 2026 - Flujo web unificado para vouchers Alicante

---

## 🚀 Inicio Rápido para Usuarios

### Ubuntu (Uso en producción)

1. **Primera vez - Instalar lanzador:**
   ```bash
   ./instalar-ubuntu-nativo.sh
   ```

2. **Uso diario:**
   - Doble clic en el icono "SUTEBA Hotel Tools" en el escritorio
   - El servidor se inicia automáticamente
   - El navegador se abre con la aplicación

### WSL / Desarrollo

```bash
./launcher.sh
```

### Vouchers Alicante (flujo actual)

Desde el menú web principal (`index.html`), ingresar a **Vouchers Alicante**.

Rutas operativas del flujo Alicante:
- CSV de entrada: `consultaRegimenReport.csv`, aportado por el usuario y no incluido en el repositorio.
- Plantilla PDF: `python/vouchersAlicante/VOUCHER ALICANTE.pdf`
- El generador produce el PDF de salida según su configuración. Revisar el nombre y la ubicación resultantes al ejecutar el módulo.

### Voucher de Comidas Diario

Desde el menú principal (`index.html`), ingresar a **Voucher de Comidas Diario**.
La interfaz está en `client/mealVoucher.html` y su lógica en `client/js/mealVoucher.js`.
La plantilla PDF y las posiciones de los campos se cargan desde `python/mealVoucher/`.
Verificar la vista previa, el tamaño de papel y la escala antes de imprimir.

### Detener el servidor

```bash
./stop-server.sh
```

---

## 🎯 Características Principales

### 🎫 Generador de Vouchers
- **Páginas separadas** para Media Pensión (MAP) y Pensión Completa (PC)
- **Media Pensión**: Solo cenas (trabajadores)
- **Pensión Completa**: Almuerzos y cenas (jubilados PPJ)
- **Balneario Alicante por overlay PDF** (flujo Python oficial para impresión)
- Cálculo automático de comidas por estadía
- Casillas de tildado por día organizadas
- Formato optimizado para impresión (4 vouchers por A4)
- Ordenamiento automático por número de habitación

### 📋 Procesador de Reservas (Rooming)
- **Páginas separadas** para MAP y PC con filtrado automático
- Rooming MAP: Filtra solo "Media Pensión"
- Rooming PC: Filtra solo "Pensión Completa"
- Campos fijos en orden específico para impresión
- Ordenamiento automático por habitación
- Exportación a CSV compatible con LibreOffice (separador punto y coma)
- Estadísticas de ocupación

### 👤 Ficha Pax
- Generación individual de fichas de pasajeros desde CSV
- Búsqueda rápida por voucher, DNI o apellido
- Vista previa en iframe antes de descargar
- PDFs descargables con overlay sobre template
- Módulo independiente (solo fichas, no vouchers)

### ✨ Mejoras Recientes

#### Actualización más reciente (Marzo 2026)

**🏖️ Flujo oficial para vouchers Alicante (web)**
- Generación disponible desde `client/vouchers-alicante-gui.html` (acceso por menú principal)
- Plantilla fija para mantener formato esperado por usuarios
- Posiciones calibradas finales por slot: `4.0 / 5.5 / 6.0 mm`
- Corrección de paginación: un voucher por número de voucher sin repetición entre páginas

**🧭 Menú principal ajustado**
- El flujo HTML anterior de balneario se movió a `client/legacy/vouchers-balneario.html`
- El acceso operativo desde `index.html` usa la interfaz de plantilla fija de Alicante

### ✨ Mejoras Recientes (Enero 2026)

#### Actualización más reciente (Enero 26, 2026)

**🎫 Páginas separadas para MAP y Pensión Completa**
- Creados `vouchers.html` (Media Pensión) y `vouchers-pc.html` (Pensión Completa)
- Sistema de override de configuración sin modificar código base
- Cada página carga automáticamente su modo correspondiente
- Filtrado automático: PC muestra almuerzos y cenas, MAP solo cenas

**📊 Rooming lists separados por tipo de pensión**
- `rooming.html` para Media Pensión (trabajadores)
- `rooming-pc.html` para Pensión Completa (jubilados PPJ)
- Campos fijos en orden específico: Nro. habitación, Fecha ingreso/egreso, Plazas, Tipo doc, DNI, Nombre, Edad, Voucher, Tipo hab, Observación
- Filtrado automático por tipo de servicio
- Exportación CSV con separador punto y coma para LibreOffice

**🏠 Menu principal actualizado**
- 5 secciones claras: Vouchers MAP, Vouchers PC, Rooming MAP, Rooming PC, Fichas
- Emojis distintivos para cada funcionalidad
- Navegación intuitiva según tipo de contingente

#### Actualización anterior (Enero 6, 2026)

**🔧 Corrección dependencias html2pdf**
- Agregada librería `html2pdf.js` a `fichaPax.html` (corrige error en Ubuntu nativo)
- El módulo ahora carga correctamente en todos los entornos (WSL y Ubuntu)

**🎯 Módulos independientes reforzados**
- Eliminada generación automática de vouchers desde `fichaPax`
- Cada módulo mantiene su funcionalidad específica y separada
- `fichaPax` → solo fichas de check-in (sin vouchers)
- `vouchers` → solo vouchers de comida MAP/PC

**🔢 Ordenamiento por habitación en vouchers**
- Vouchers ahora se ordenan por número de habitación (menor a mayor)
- Respeta el orden del CSV si ya viene ordenado
- Implementado en [client/src/lib/render.js](client/src/lib/render.js)

**🧹 Limpieza de marcadores de trazabilidad**
- Eliminado numeral `#1` de fichas individuales (no tiene sentido en generación unitaria)
- Código más limpio y PDFs sin marcadores innecesarios

### ✨ Mejoras Anteriores (Enero 2026)

#### Interfaz Unificada con Drag & Drop
- **Las 3 herramientas** (Vouchers, Rooming, Ficha Pax) ahora tienen interfaz consistente
- Arrastra archivos CSV directamente o haz clic para seleccionar
- Feedback visual al arrastrar archivos

#### Lanzador de Escritorio para Ubuntu
- Instalación simple con `./instalar-ubuntu-nativo.sh`
- Icono en el escritorio que inicia todo automáticamente
- Sin necesidad de conocimientos técnicos para usuarios finales

#### Solución de CORS
- Servidor HTTP integrado con lanzador automático
- Ya no es necesario abrir archivos HTML directamente
- Funciona correctamente en Ubuntu y WSL

#### Módulo Ficha Pax Completo
- Función `generateMealVoucherHTML` implementada
- Genera vouchers HTML con estilos CSS embebidos
- Conversión automática a PDF con html2pdf

---

## 📁 Estructura del Proyecto

```text
suteba-hotel-tools-evolucion/
├── index.html
├── launcher.sh
├── stop-server.sh
├── instalar-ubuntu-nativo.sh
├── requirements.txt
├── .gitignore
├── README.md
├── GUIA_USUARIOS.md
├── INSTALACION_POR_ENTORNO.md
├── SOLUCION_CORS.md
├── .github/
│   └── copilot-instructions.md
├── assets/
│   ├── JubPc2.png
│   ├── MapDay.png
│   ├── reservaCalendar.png
│   ├── reservaPencil.png
│   └── suteba_logo_3.jpg
├── client/
│   ├── balnearioVoucher.html
│   ├── fichaPax.html
│   ├── mealVoucher.html
│   ├── rooming.html
│   ├── rooming-pc.html
│   ├── vouchers.html
│   ├── vouchers-pc.html
│   ├── vouchers-alicante-gui.html
│   ├── legacy/
│   │   └── vouchers-balneario.html
│   ├── js/
│   │   ├── balnearioVoucher.js
│   │   ├── fichaPax.js
│   │   ├── mealVoucher.js
│   │   └── vouchersAlicanteGui.js
│   └── src/
│       ├── app.js
│       ├── styles.css
│       └── lib/
│           ├── business.js
│           ├── parser.js
│           └── render.js
├── python/
│   ├── balneario/
│   │   ├── VOUCHER_ALICANTE.pdf
│   │   └── positions.json
│   ├── fichaPax/
│   │   ├── 1fichaPax.pdf
│   │   ├── generar_con_overlay.py
│   │   ├── llenar_fichas.py
│   │   ├── previsualizar_fichas.py
│   │   ├── index.html
│   │   └── positions.json
│   ├── mealVoucher/
│   │   ├── VOUCHER_DE_COMIDAS_DIARIO.pdf
│   │   └── positions.json
│   └── vouchersAlicante/
│       ├── VOUCHER ALICANTE.pdf
│       └── generar_vouchers_overlay.py
├── docs/
│   ├── AJUSTES_FINOS_POSICIONES.md
│   ├── Generador Automático (Overlay).md
│   └── legacy/
├── tests/
│   └── business/
│       └── testProcessReservationsCsv.js
└── voucher de comidas diario.odt
```

**Nota:** el acceso directo de Ubuntu se genera durante la instalación y no se versiona. Las carpetas de otros proyectos, los datos locales y los archivos temporales están excluidos mediante `.gitignore`.

---

## 💻 Uso para Desarrolladores

### Ejecutar localmente

```bash
./launcher.sh
```

El navegador se abrirá automáticamente en `http://localhost:8000/index.html`

### Arquitectura de datos



### Convenciones importantes

- **Formatos CSV**: `parser.js` detecta automáticamente 2 formatos y corrige comas extra
- **Fechas**: Formato `dd/mm/YYYY` esperado en CSV
- **Normalización**: Elimina diacríticos para matching de servicios
- **Sin bundler**: Archivos cargados directamente en navegador
- **Usuarios proveen CSV**: No hay archivos de ejemplo incluidos

### Cambios comunes y dónde hacerlos

- **Modo por defecto en páginas**: Usar `window.APP_CONFIG_OVERRIDE` antes de cargar `app.js`
- **Nuevo formato CSV**: Extender `parseCSV` en [client/src/lib/parser.js](client/src/lib/parser.js)
- **Reglas de comidas**: Modificar `mealMultiplier` en [client/src/lib/business.js](client/src/lib/business.js)
- **Campos rooming PC**: Editar array `REPORT_FIELDS` en [client/rooming-pc.html](client/rooming-pc.html)

### Scripts Python (Utilidades)

Scripts bajo `python/fichaPax/`:
- `llenar_fichas.py` — Generación masiva de fichas
- `generar_con_overlay.py` — PDFs con overlay
- `previsualizar_fichas.py` — Vista previa de formularios
- `positions.json` — Mapeo de coordenadas para campos PDF

Ejecutar con: `python3 python/fichaPax/script.py`

---

## 📝 Changelog Detallado

### Enero 2026 - v2.0

**✨ Interfaz unificada con Drag & Drop**
- Las 3 herramientas (Vouchers, Rooming, Ficha Pax) ahora tienen interfaz consistente
- Arrastrar archivos CSV o hacer clic para seleccionar
- Feedback visual (cambio de color al arrastrar)
- Archivos: `client/vouchers.html`, `client/rooming.html`, `client/src/app.js`

**🖥️ Lanzador de escritorio para Ubuntu**
- Script `instalar-ubuntu-nativo.sh` crea icono en escritorio
- Archivo `.desktop` para integración con Ubuntu
- Script `launcher.sh` inicia servidor + abre navegador automáticamente
- Script `stop-server.sh` para detener servidor limpiamente
- Detecta si está en WSL y ajusta comportamiento

**🔧 Solución completa de CORS**
- Servidor HTTP integrado (puerto 8000)
- Ya no es necesario abrir archivos HTML directamente
- Logs en `/tmp/suteba-server.log`
- PID tracking en `/tmp/suteba-server.pid`

**👤 Módulo Ficha Pax completado**
- Función `generateMealVoucherHTML()` implementada
- Genera vouchers HTML self-contained con CSS embebido
- Conversión a PDF con html2pdf.js
- Búsqueda por voucher/DNI/apellido en tiempo real
- Generación individual (< 1 seg vs 30 seg en lote)
- Badges visuales para MAP/PC
- Archivo: `client/js/fichaPax.js`

**🧹 Limpieza de proyecto**
- Eliminados archivos CSV de ejemplo (usuarios proveen los suyos)
- Removidos scripts redundantes (`start-server.sh`, `start-server.bat`, `instalar-lanzador.sh`)
- Documentación consolidada en archivos específicos

### Diciembre 2025 - v1.x

**📋 Agrupación por voucher y habitación**
- Un voucher por grupo familiar (no por persona)
- Rooming agrupa por habitación con capacidad máxima
- Cálculo correcto de `Cant. Pax` y `Cant. Comidas`

**🔤 Normalización de nombres**
- Todos los nombres a MAYÚSCULAS en vouchers
- Limpieza de prefijos numéricos en Seccionales
- Case original preservado en fichas PDF

**🎨 Mejoras visuales**
- Casillas de tildado organizadas por tipo de comida
- Formato optimizado 4 vouchers por A4
- Logo SUTEBA en todas las páginas
- Rutas relativas corregidas (`../assets/`)

---

## 📚 Documentación Adicional

- **[GUIA_USUARIOS.md](GUIA_USUARIOS.md)** — Guía simple para usuarios finales
- **[INSTALACION_POR_ENTORNO.md](INSTALACION_POR_ENTORNO.md)** — WSL vs Ubuntu nativo
- **[SOLUCION_CORS.md](SOLUCION_CORS.md)** — Detalles técnicos del fix CORS
- **[Generador Automático (Overlay).md](docs/Generador%20Autom%C3%A1tico%20(Overlay).md)** — Flujo overlay de vouchers Alicante
- **[AJUSTES_FINOS_POSICIONES.md](docs/AJUSTES_FINOS_POSICIONES.md)** — Calibración fina por slot
- **[CHANGELOG_GRANULAR_ADJUSTS.md](docs/legacy/CHANGELOG_GRANULAR_ADJUSTS.md)** — Historial de ajustes granulares (legacy)
- **[README_Old.md](docs/legacy/README_Old.md)** — Versión anterior para referencia (legacy)

---

## 🆘 Solución de Problemas

### El icono no aparece en el escritorio
- Verifica que estás en Ubuntu nativo (no WSL): `grep -i microsoft /proc/version`
- En WSL usa directamente: `./launcher.sh`

### Error: python3 not found
```bash
sudo apt update
sudo apt install python3
```

### Puerto 8000 ocupado
```bash
./stop-server.sh
# O manualmente:
lsof -ti:8000 | xargs kill
```

### No se ven los cambios en el navegador
Forzar recarga: **Ctrl + Shift + R** (o Cmd + Shift + R en Mac)

---

## 🤝 Contribuir

Este es un proyecto interno de SUTEBA. Para cambios contactar al administrador del sistema.

**Mejoras sugeridas para el futuro:**
- Migrar parser CSV a PapaParse para mayor robustez
- Tests unitarios automatizados (Jest/Pytest)
- Validación de CSV más estricta
- Opción de temas/colores personalizables

---

**Última actualización:** Febrero 22, 2026
**Versión:** 2.3
**Mantenido por:** Equipo IT SUTEBA

---

## 🔐 Flujo Git recomendado (sin datos sensibles)

Este proyecto procesa datos personales de afiliados. **No se deben subir CSV reales al repositorio**.

### 1) Revisar estado

```bash
git status
```

### 2) Validar que no haya CSV de producción para commitear

```bash
git status --short
```

Si aparece un archivo de datos reales (por ejemplo `consultaRegimenReport.csv`), eliminarlo o dejarlo fuera del commit.

### 3) Agregar cambios de código/documentación

```bash
git add .
```

### 4) Confirmar que no quedaron datos sensibles staged

```bash
git diff --cached --name-only
```

### 5) Commit

```bash
git commit -m "feat: vouchers balneario + mejoras de flujo"
```

### 6) Push

```bash
git push origin main
```
