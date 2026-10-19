# 🏨 Voucher Alicante - Generador Automático (Overlay)

Este módulo automatiza la creación de vouchers de Balneario Alicante con base en el diseño existente de `VOUCHER ALICANTE.odt`.

## 📋 Enfoque recomendado

Para mantener el diseño exacto del voucher, se usa este flujo:

1. Exportar una vez `VOUCHER ALICANTE.odt` a PDF.
2. Leer `consultaRegimenReport.csv`.
3. Superponer solo los datos variables sobre la plantilla PDF (overlay).

Así evitamos romper el diseño original y podemos calibrar posiciones fácilmente.

---

## ✅ Implementación en este repo

- Script: `python/vouchersAlicante/generar_vouchers_overlay.py`
- Entrada: `consultaRegimenReport.csv`
- Plantilla base: `VOUCHER ALICANTE.pdf` (exportada desde el ODT)
- Salida: `Vouchers_Alicante_Final.pdf`

### Campos que completa

- Pasajero (titular del voucher)
- Documento
- Hotel
- Habitación(es)
- Fecha de ingreso / egreso
- Cantidad de personas (Pax)
- Número de voucher
- Logo institucional (por defecto `assets/suteba_logo_3.jpg`)

Además, marca hasta 5 días de control según duración de estadía.

---

## 🚀 Instalación y uso

### 1) Dependencias Python

```bash
pip install reportlab pypdf
```

### 2) Exportar ODT a PDF (una vez)

Si usás LibreOffice:

```bash
libreoffice --headless --convert-to pdf "VOUCHER ALICANTE.odt" --outdir .
```

### 3) Ejecutar el generador

Desde la raíz del proyecto:

```bash
python3 python/vouchersAlicante/generar_vouchers_overlay.py \
  --csv consultaRegimenReport.csv \
  --template-pdf "VOUCHER ALICANTE.pdf" \
  --output Vouchers_Alicante_Final.pdf
```

### 4) Calibración fina (opcional)

Si el texto cae corrido respecto al diseño:

```bash
python3 python/vouchersAlicante/generar_vouchers_overlay.py \
  --x-adjust-mm 1.5 \
  --y-adjust-mm -2
```

### 5) Control de logo (opcional)

Usar otro logo:

```bash
python3 python/vouchersAlicante/generar_vouchers_overlay.py \
  --logo assets/suteba_logo_3.jpg
```

Desactivar inserción de logo:

```bash
python3 python/vouchersAlicante/generar_vouchers_overlay.py --no-logo
```

---

## 🛠️ Notas técnicas

- Agrupa datos por `Voucher`.
- Selecciona titular por mayor edad del grupo.
- Renderiza 3 vouchers por página.
- Mantiene el diseño preexistente porque no redibuja el formulario: solo superpone datos.
