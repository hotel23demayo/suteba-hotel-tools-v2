# Actualización: Ajustes Granulares de Posiciones Verticales

## Resumen de Cambios

El script `python/vouchersAlicante/generar_vouchers_overlay.py` ha sido actualizado para permitir **ajustes independientes de cada voucher** en la dimensión vertical (Y), resolviendo el problema de inconsistencias entre slots causadas por proporciones irregulares en la plantilla PDF.

---

## ✅ Cambios Implementados

### 1. **Nuevos Parámetros CLI**
Se agregaron tres parámetros que permiten calibrar cada voucher por separado:

```
--slot-1-y-adjust-mm VALOR    Ajuste Y solo para voucher #1
--slot-2-y-adjust-mm VALOR    Ajuste Y solo para voucher #2
--slot-3-y-adjust-mm VALOR    Ajuste Y solo para voucher #3
```

- Valores positivos = mover hacia arriba
- Valores negativos = mover hacia abajo
- Si se omiten, usa el valor de `--y-adjust-mm` (o 0.0)

### 2. **Lógica de Fallback Inteligente**
- Si especificas `--slot-1-y-adjust-mm 2`, solo el voucher #1 se mueve
- Los vouchers #2 y #3 usan `--y-adjust-mm` (global) o 0.0 si tampoco se proporciona
- Permite combinar ambos: `--y-adjust-mm 1.0 --slot-1-y-adjust-mm 2.5`

### 3. **Limpieza de Código**
Se eliminó la función `estimate_stay_days()` que ya no se usaba.

---

## 🎯 Uso Práctico

### Caso: Voucher #1 aparece demasiado arriba

**Problema visual:**
```
[Voucher #1 - muy alto]

[Voucher #2 - posición correcta]

[Voucher #3 - posición correcta]
```

**Solución:**
```bash
python3 python/vouchersAlicante/generar_vouchers_overlay.py \
  --csv consultaRegimenReport.csv \
  --template-pdf "VOUCHER ALICANTE.pdf" \
  --output Vouchers_Arreglado.pdf \
  --slot-1-y-adjust-mm 2.0       # Solo voucher #1, 2mm arriba
```

**Resultado:**
- Voucher #1 se ajusta 2mm
- Voucher #2 y #3 permanecen inalterados

---

## 📋 Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `python/vouchersAlicante/generar_vouchers_overlay.py` | ✅ Params granulares, limpieza de código |
| **NUEVO:** `AJUSTES_FINOS_POSICIONES.md` | 📖 Documentación detallada |
| **NUEVO:** `EJEMPLOS_USO_VOUCHERS.sh` | 🔧 Scripts de ejemplo |

---

## 🧪 Test de Validación

Todos los cambios fueron validados:

✅ Compilación sin errores (`py_compile`)
✅ Generación de PDFs sin errores (test end-to-end)
✅ PDFs resultantes válidos (válidos según `file` command)

---

## 🚀 Próximos Pasos Recomendados

1. **Calibra tu plantilla:**
   ```bash
   # Genera con diferentes valores para ver cuál funciona mejor
   python3 python/vouchersAlicante/generar_vouchers_overlay.py \
     --slot-1-y-adjust-mm 0.5   # Prueba 0.5, 1.0, 1.5, 2.0, etc.
   ```

2. **Crea un alias en tu shell** (.bashrc, .zshrc, etc.):
   ```bash
   alias gen-vouchers='python3 python/vouchersAlicante/generar_vouchers_overlay.py --slot-1-y-adjust-mm 2.0'
   ```

3. **Revisa `AJUSTES_FINOS_POSICIONES.md`** para documentación completa y más ejemplos.

---

## 📞 Referencia Rápida

```bash
# Generar sin ajustes (línea base)
python3 python/vouchersAlicante/generar_vouchers_overlay.py

# Generar con ajuste solo en voucher #1
python3 python/vouchersAlicante/generar_vouchers_overlay.py --slot-1-y-adjust-mm 2.0

# Generar con ajustes en los 3 vouchers
python3 python/vouchersAlicante/generar_vouchers_overlay.py \
  --slot-1-y-adjust-mm 2.0 \
  --slot-2-y-adjust-mm 0.0 \
  --slot-3-y-adjust-mm -1.0
```

---

**Versión:** 2.0 (con soporte granular) | **Fecha:** 2025-02-20

