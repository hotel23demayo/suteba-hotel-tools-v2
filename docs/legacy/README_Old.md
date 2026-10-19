# Sistema de Gestión Hotelera SUTEBA

Sistema web unificado para procesamiento de datos hoteleros, generación de vouchers de comidas y gestión de reservas.

**Herramientas incluidas:**
- **Generador de Vouchers** — Vouchers de comidas MAP y PC listos para imprimir
- **Procesador de Reservas** — Organización y formateo de rooming lists

Este proyecto está pensado para uso local (en el navegador) sin backend — cargas archivos CSV y las herramientas procesan, organizan y formatean los datos según tus necesidades.

---

## 🎯 Características principales

### 🎫 Generador de Vouchers
Procesa archivos CSV de reservas y genera vouchers configurables para servicios de comidas:

**Dos modos soportados:**
- **MAP** (Media Pensión) → Cena únicamente (1 comida/día)
- **PC** (Pensión Completa) → Almuerzo + Cena (2 comidas/día)

**Funcionalidades:**
- Toggle entre modos MAP/PC en tiempo real
- Normalización automática de nombres a MAYÚSCULAS
- Cálculo automático de duración de estadía y cantidad de comidas
- Casillas de tildado imprimibles organizadas por tipo de comida y día
- Formato optimizado para impresión (4 vouchers por página A4)
- Agrupación inteligente por habitación y voucher

### 📋 Procesador de Reservas (Rooming)
Organiza y procesa rooming lists para facilitar la gestión hotelera:

**Funcionalidades:**
- Procesamiento de CSV con datos de reservas
- Ordenamiento automático por número de habitación y nombre
- Parser robusto que maneja comas en campos (ej: observaciones)
- Visualización en tabla HTML interactiva
- Generación de estadísticas (habitaciones ocupadas, cantidad de pasajeros)
- Exportación a CSV compatible con LibreOffice (separador `;`)
- Resaltado de campos clave (habitación, nombre)

---

## 📁 Estructura del proyecto

```
vouchers-unificados/
├── index.html              — Página principal con menú de navegación
├── vouchers.html           — Generador de vouchers MAP/PC
├── rooming.html            — Procesador de reservas hoteleras
├── src/
│   ├── app.js             — Bootstrap y configuración
│   ├── styles.css         — Estilos unificados SUTEBA
│   └── lib/
│       ├── parser.js      — Parsing y normalización CSV
│       ├── business.js    — Reglas de negocio MAP vs PC
│       └── render.js      — Generación de templates HTML
├── assets/
│   ├── MapDay.png         — Imagen tildado para MAP (legacy)
│   ├── JubPc2.png         — Imagen tildado para PC (legacy)
│   └── suteba_logo_3.jpg  — Logo SUTEBA
├── test-data-ppj.csv      — CSV ejemplo PC
├── test-data-map.csv      — CSV ejemplo MAP
└── MIGRATION_GUIDE.md     — Guía de migración versiones antiguas
```

### Archivos legacy (compatibilidad)
- `Voucher_ppj.html` — Versión original PC standalone
- `jubis.js` — Script original PC
- `map_scripts_new.js` — Script original MAP
- `index_map.html` — Interfaz original MAP

> **Nota:** Los archivos legacy se mantienen por compatibilidad, pero se recomienda usar el sistema unificado a través de `index.html`.

---

## 🚀 Cómo usar

### Inicio rápido

1. **Abre `index.html`** en tu navegador (doble click o arrastra al navegador)
2. Selecciona la herramienta que necesitas:
   - **🎫 Generador de Vouchers** → Para crear vouchers de comidas
   - **📋 Procesador de Reservas** → Para organizar rooming lists

### Generador de Vouchers

1. Selecciona el modo:
   - **MAP (Cena)** — Para vouchers de Media Pensión
   - **PC (Almuerzo + Cena)** — Para vouchers de Pensión Completa
2. Click en "📁 Cargar Archivo CSV"
3. Los vouchers se mostrarán automáticamente
4. Usa "🖨️ Imprimir" para generar la versión imprimible (4 vouchers por página A4)

### Procesador de Reservas

1. Click en "📁 Cargar Archivo CSV"
2. Revisa la tabla generada con los datos ordenados
3. Verifica las estadísticas (habitaciones ocupadas, cantidad de pasajeros)
4. Click en "Guardar como archivo CSV" para exportar los datos procesados

---

## 📊 Formato de CSV esperado

### Para Generador de Vouchers

CSV con las siguientes columnas (basado en `test-data-ppj.csv`):

| Posición | Campo | Descripción |
|----------|-------|-------------|
| 0 | Cód. Alojamiento | Código del alojamiento |
| 1 | Descripción | Nombre del hotel |
| 2 | Nro. habitación | Número de habitación |
| 3 | Tipo habitación | DBL, TRIPLE, etc. |
| 4 | Observación habitación | Notas especiales |
| 5 | Cantidad plazas | Número de plazas |
| 6 | Voucher | Código de voucher |
| 7 | Sede | Sede de origen |
| 8 | Fecha de ingreso | dd/mm/YYYY |
| 9 | Fecha de egreso | dd/mm/YYYY |
| 10 | Plazas ocupadas | Plazas utilizadas |
| 11 | Tipo documento | DNI, etc. |
| 12 | Nro. doc. | Número de documento |
| 13 | Apellido y nombre | Nombre completo |
| 14 | Edad | Edad del pasajero |
| 15 | Entidad | SUTEBA, etc. |
| 16 | Servicios | "PENSIÓN COMPLETA" o "MEDIA PENSION" |

**Notas importantes:**
- Las fechas deben estar en formato `dd/mm/YYYY`
- El campo "Servicios" determina si se incluye en MAP o PC
- El campo "Observación habitación" puede contener comas (se maneja automáticamente)

### Para Procesador de Reservas

Mismo formato que vouchers. El procesador:
- Extrae campos relevantes (habitación, fechas, nombre, DNI, etc.)
- Ordena por habitación y luego por nombre
- Genera CSV de salida con separador `;` para LibreOffice

---

## ⚙️ Configuración avanzada

Edita `src/app.js` para personalizar comportamiento:

```javascript
const APP_CONFIG = {
  mode: 'PC',              // Modo inicial: 'PC' o 'MAP'
  renderMode: 'boxes',     // 'boxes' (casillas HTML) o 'image' (PNG legacy)
  mealMultiplier: {
    'MAP': 1,              // MAP: 1 comida/día (cena)
    'PC': 2                // PC: 2 comidas/día (almuerzo + cena)
  },
  imageForTildes: {
    'MAP': 'assets/MapDay.png',
    'PC': 'assets/JubPc2.png'
  }
}
```

---

## 🔧 Mejoras recientes

### Versión actual (Diciembre 2025)

**Generador de Vouchers:**
- ✅ Reducción de tamaño de casillas de tildado en ~30%
- ✅ Optimización para 4 vouchers por página A4 (antes 3)
- ✅ Documentación completa de cambios CSS
- ✅ Navegación integrada con sistema unificado

**Procesador de Reservas:**
- ✅ Parser CSV robusto para manejar comas en observaciones
- ✅ Corrección automática de campos extras
- ✅ Exportación compatible con LibreOffice
- ✅ Integración con estilos SUTEBA
- ✅ Estadísticas en tiempo real

**Sistema General:**
- ✅ Página principal con menú de navegación
- ✅ Diseño unificado con logo SUTEBA
- ✅ Botones de navegación entre herramientas
- ✅ Interfaz responsive y profesional

---
## 🧪 Testing

Ejecutar pruebas locales (Python):

```bash
python3 test_processData.py
```

Ejecutar pruebas locales (Node.js):

```bash
node test_processData.js
```

---

## 🐛 Limitaciones conocidas y roadmap

### Limitaciones actuales
1. Parser CSV básico en generador de vouchers — considerar migrar a PapaParse para casos complejos
2. Validaciones de formato de fecha podrían ser más robustas
3. Sin persistencia de configuración entre sesiones

### Mejoras futuras
- [ ] Tests automatizados con CI/CD
- [ ] Validación y mensajes de error más descriptivos
- [ ] Soporte para múltiples formatos de fecha
- [ ] Persistencia de preferencias en localStorage
- [ ] Preview de vouchers antes de imprimir
- [ ] Modo oscuro

---

## 📝 Changelog

### Diciembre 2025
- Sistema unificado con menú de navegación
- Integración de procesador de reservas (rooming)
- Parser CSV robusto para manejar comas en campos
- Optimización de vouchers para 4 por página A4
- Diseño responsive y estilos SUTEBA unificados

### Versiones anteriores
Ver `MIGRATION_GUIDE.md` para historial completo de cambios

---

## 📄 Licencia

Proyecto desarrollado para SUTEBA.

---

## 👤 Contacto

Para preguntas, sugerencias o reportar problemas:
- Abre un [issue en GitHub](https://github.com/xpablodaniel/vouchers-unificados/issues)
- Contacta al equipo de desarrollo

---

**Sistema de Gestión Hotelera SUTEBA © 2025**
