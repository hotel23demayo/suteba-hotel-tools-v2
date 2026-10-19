# Ajustes Finos de Posiciones en Vouchers Alicante

## Problema de Inconsistencia Vertical

Si notas que los vouchers en el PDF generado tienen posiciones verticales inconsistentes (p. ej., el voucher #1 aparece más arriba que los demás), es porque la plantilla PDF original tiene proporciones irregulares entre slots.

---

## Solución: Parámetros Granulares por Slot

El script `generar_vouchers_overlay.py` ahora permite ajustar **cada voucher de manera independiente** usando:

- `--slot-1-y-adjust-mm`: Ajuste vertical para el voucher #1 (en milímetros)
- `--slot-2-y-adjust-mm`: Ajuste vertical para el voucher #2 (en milímetros)
- `--slot-3-y-adjust-mm`: Ajuste vertical para el voucher #3 (en milímetros)

Valores positivos = mover hacia arriba | Valores negativos = mover hacia abajo

---

## Ejemplos de Uso

### Caso 1: Ajustar solo el voucher #1 (2 mm hacia arriba)

```bash
python3 python/vouchersAlicante/generar_vouchers_overlay.py \
  --csv consultaRegimenReport.csv \
  --template-pdf "VOUCHER ALICANTE.pdf" \
  --output Vouchers_Alicante_Ajustado.pdf \
  --slot-1-y-adjust-mm 2
```

**Resultado:**
- Voucher #1: se mueve 2 mm hacia arriba
- Voucher #2 y #3: sin cambios (se mantiene su posición original)

---

### Caso 2: Ajustar todos los vouchers con valores individuales

```bash
python3 python/vouchersAlicante/generar_vouchers_overlay.py \
  --csv consultaRegimenReport.csv \
  --template-pdf "VOUCHER ALICANTE.pdf" \
  --output Vouchers_Alicante_Calibrado.pdf \
  --slot-1-y-adjust-mm 2.5 \
  --slot-2-y-adjust-mm 0.0 \
  --slot-3-y-adjust-mm -1.0
```

**Resultado:**
- Voucher #1: 2.5 mm hacia arriba
- Voucher #2: sin cambios
- Voucher #3: 1.0 mm hacia abajo

---

### Caso 3: Ajuste global + granular (combinar `--y-adjust-mm` con parámetros por slot)

```bash
python3 python/vouchersAlicante/generar_vouchers_overlay.py \
  --csv consultaRegimenReport.csv \
  --template-pdf "VOUCHER ALICANTE.pdf" \
  --output Vouchers_Alicante_Final.pdf \
  --y-adjust-mm 1.0 \
  --slot-1-y-adjust-mm 1.5
```

**Cómo funciona:**
- `--y-adjust-mm 1.0` es el ajuste base (se aplica a todos)
- `--slot-1-y-adjust-mm 1.5` **anula** el valor global para el slot #1
- **Resultado final:**
  - Voucher #1: 1.5 mm
  - Voucher #2: 1.0 mm (usa el global)
  - Voucher #3: 1.0 mm (usa el global)

---

## Proceso de Calibración Recomendado

1. **Generar versión base** (sin ajustes):
   ```bash
   python3 python/vouchersAlicante/generar_vouchers_overlay.py \
     --csv consultaRegimenReport.csv \
     --template-pdf "VOUCHER ALICANTE.pdf" \
     --output test_baseline.pdf
   ```

2. **Revisar en Print Preview** del navegador o visor PDF. Identificar qué vouchers están desalineados.

3. **Ajustar solo el voucher problemático**. Empezar con incrementos pequeños (±0.5 mm):
   ```bash
   python3 python/vouchersAlicante/generar_vouchers_overlay.py \
     --csv consultaRegimenReport.csv \
     --template-pdf "VOUCHER ALICANTE.pdf" \
     --output test_slot1_plus05.pdf \
     --slot-1-y-adjust-mm 0.5
   ```

4. **Comparar visualmente** y ajustar hasta que las posiciones sean consistentes.

5. **Guardar los valores de ajuste** que funcionen en tu flujo (p. ej., como alias en shell):
   ```bash
   alias gen-vouchers-ok="python3 python/vouchersAlicante/generar_vouchers_overlay.py --slot-1-y-adjust-mm 2.0"
   ```

---

## Parámetros de Referencia Completa

```bash
python3 python/vouchersAlicante/generar_vouchers_overlay.py --help
```

**Salida:**

```
Genera vouchers Alicante por overlay sobre plantilla PDF

options:
  -h, --help                    show this help message and exit
  --csv CSV                     Ruta al CSV (default: consultaRegimenReport.csv)
  --template-pdf TEMPLATE_PDF   Plantilla PDF
  --output OUTPUT               Archivo PDF de salida
  --x-adjust-mm X_ADJUST_MM     Ajuste horizontal (global)
  --y-adjust-mm Y_ADJUST_MM     Ajuste vertical (global para los 3 slots)
  --slot-1-y-adjust-mm AMOUNT   Ajuste Y solo para voucher #1 (anula --y-adjust-mm)
  --slot-2-y-adjust-mm AMOUNT   Ajuste Y solo para voucher #2 (anula --y-adjust-mm)
  --slot-3-y-adjust-mm AMOUNT   Ajuste Y solo para voucher #3 (anula --y-adjust-mm)
  --logo LOGO                   Ruta al logo (default: assets/suteba_logo_3.jpg)
  --no-logo                     Desactiva logo
```

---

## Notas Técnicas

- **Rango recomendado de ajuste:** -5 a +5 mm por slot
- **Precisión:** El sistema usa milímetros; ReportLab convierte internamente a puntos
- **Efecto visual:** Cambios menores a 0.5 mm puede no ser visibles en pantalla, pero sí en impresión
- Si un slot no se especifica, usar el valor de `--y-adjust-mm` (o 0.0 si tampoco se proporciona)

