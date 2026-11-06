# Conversor CLI de Rooming PPJ

Herramienta independiente para convertir archivos Excel de contingentes PPJ en un CSV de rooming para LibreOffice, un JSON enriquecido de respaldo y un informe de validación.

## Requisitos

- Python 3.
- Dependencias indicadas en `requirements.txt`.

## Instalación

Desde el directorio `rooming_ppj_cli/`:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Uso

La fecha de ingreso y la sede pueden detectarse a partir del nombre del archivo. Por ejemplo:

```bash
python scripts/convertir_rooming.py "PPJ MDP 05_11 MATANZA.xlsx"
python scripts/convertir_rooming.py "PPJ MDP 25_11 LANUS.xlsx" --anio 2026
```

También se pueden indicar explícitamente:

```bash
python scripts/convertir_rooming.py archivo.xlsx --fecha-ingreso 05/11/2026 --noches 3 --sede MATANZA
```

El año predeterminado es 2026 y puede cambiarse con `--anio`.

## Archivos generados

Los resultados se escriben en `salida/`:

- CSV de rooming de 14 columnas.
- JSON enriquecido.
- Informe de validación.

El script solicita confirmación antes de escribir los archivos. Se puede omitir la pregunta con `--si`.

## Compatibilidad

El CSV de 14 columnas está destinado al informe de rooming y a su apertura o impresión en LibreOffice. No es el CSV operativo de 28 o más columnas que consume `client/src/lib/parser.js` para los módulos de vouchers y Ficha Pax.

La preparación y conciliación de archivos Excel + SIGS para generar el CSV operativo compatible es una etapa de evolución documentada en [`PREPARACION_DATOS.md`](PREPARACION_DATOS.md); no forma parte de la funcionalidad actual de este conversor.

## Protección de datos

No guardar ni versionar archivos reales de pasajeros. Utilizar datos ficticios o anonimizados para pruebas y mantener fuera del repositorio los archivos de entrada y los resultados que puedan contener datos personales.
