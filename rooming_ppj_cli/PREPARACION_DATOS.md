# Preparación y normalización de datos de contingentes

## 1. Finalidad

Esta herramienta prepara la información de los contingentes hoteleros antes de cargarla en la suite `suteba-hotel-tools-evolucion`.

La suite conservará su mecanismo habitual de carga mediante archivos CSV. Sus módulos no necesitan conocer si los datos originales provienen de SIGS o de un archivo Excel: recibirán un único CSV operativo, normalizado y compatible con el formato que consume actualmente la aplicación.

La preparación de datos será una etapa independiente y previa a la suite.

## 2. Flujo general

1. **Recepción de archivos de origen**
   - Exportación CSV de SIGS.
   - Rooming recibido en formato Excel, cuando corresponda.

2. **Lectura y normalización**
   - Lectura de cada formato de origen.
   - Normalización de nombres de columnas, fechas, tipos de habitación, servicios y otros valores que requieran equivalencias.
   - Validación de datos relevantes, especialmente DNI y registros de pasajeros.

3. **Cruce y conciliación**
   - Comparación de pasajeros entre Excel y SIGS mediante DNI.
   - Identificación de coincidencias, pasajeros presentes en una sola fuente y diferencias.
   - Aplicación de reglas de prioridad para decidir qué fuente prevalece en cada campo.
   - Conservación de los datos originales para rastrear el origen de cada valor.

4. **Generación de resultados**
   - CSV operativo normalizado, compatible con la estructura que consume la suite.
   - JSON enriquecido de respaldo, cuando corresponda.
   - Informe de validación con coincidencias, diferencias, datos pendientes y observaciones.

5. **Carga en la suite**
   - El usuario carga el CSV operativo mediante el procedimiento habitual.
   - Los módulos de vouchers, rooming y Ficha Pax continúan utilizando el contrato de datos existente, sin resolver las particularidades de cada archivo de origen.

## 3. Criterios de autoridad de los datos

Como criterio general para contingentes cuyo rooming final se recibe en Excel:

| Dato | Criterio |
|---|---|
| Pasajeros que integran el contingente | El Excel final determina quiénes viajan. |
| DNI | Se utiliza para cruzar las fuentes y detectar discrepancias. |
| Nombre y apellido | Se conserva el valor del Excel final. |
| Edad | Se conserva la edad del Excel final. |
| Habitación asignada | Se respeta la distribución del Excel final. Puede cambiar en destino por necesidades operativas, desperfectos o roturas. |
| Voucher | Se recupera de SIGS cuando existe coincidencia por DNI. Si no existe, queda pendiente; no se inventa. |
| Sede operativa del contingente | Se conserva la sede indicada en el Excel. |
| Oficina donde se abonó el viaje | Es un dato administrativo de SIGS y no debe confundirse con la sede del contingente. |
| Transporte | Se normaliza según la nomenclatura operativa acordada, por ejemplo `BUS`. |

Los valores como `SIN CARGO` en SIGS no determinan si una persona integra o no el contingente. La condición para formar parte del listado final es figurar en el Excel definitivo.

Un pasajero que aparezca en SIGS pero no en el Excel final no se incorpora automáticamente al contingente. Un pasajero del Excel que no tenga coincidencia en SIGS debe conservarse en el resultado y quedar identificado para completar o revisar los datos administrativos que correspondan.

Los campos incompletos de SIGS no deben bloquear automáticamente la preparación. Se evaluará si son necesarios para el funcionamiento de la suite o si pueden solicitarse en destino.

## 4. Normalización de tipos de habitación

Algunas fuentes utilizan variantes de escritura para un mismo tipo de habitación:

| Excel / rooming | SIGS | Equivalencia normalizada |
|---|---|---|
| `DOBLE A COMPARTIR` | `DOBLE COMPARTIR` | `DOBLE A COMPARTIR` |
| `TRIPLE A COMPARTIR` | `TRIPLE COMPARTIR` | `TRIPLE A COMPARTIR` |

Estas diferencias deben resolverse en la capa de preparación, sin exigir que cada módulo de la suite conozca todas las variantes de escritura.

## 5. Separación entre datos originales y datos operativos

La preparación debe distinguir tres niveles:

- **Datos originales:** contenido recibido de Excel y SIGS, sin sobrescribir los archivos de origen.
- **Datos normalizados:** valores transformados o conciliados, conservando la posibilidad de identificar de qué fuente provienen.
- **Datos operativos:** estructura final del CSV que consume la suite.

Los archivos originales no se modifican. La conciliación debe poder explicar qué valor se eligió y por qué, especialmente cuando las fuentes presentan diferencias.

## 6. Conversor CLI de Rooming PPJ: funcionalidad actual

El conversor CLI de Rooming PPJ es una herramienta independiente que transforma un Excel de contingente PPJ en:

- Un CSV de 14 columnas destinado al informe de rooming y su apertura o impresión en LibreOffice.
- Un JSON enriquecido de respaldo.
- Un informe de validación.

### Instalación

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Uso

La fecha y la sede pueden detectarse a partir del nombre del archivo. Por ejemplo, `PPJ MDP 05_11 MATANZA.xlsx`. El año predeterminado es 2026 y puede cambiarse con `--anio`.

```bash
python scripts/convertir_rooming.py "PPJ MDP 05_11 MATANZA.xlsx"
python scripts/convertir_rooming.py "PPJ MDP 25_11 LANUS.xlsx" --anio 2026
```

También se pueden indicar explícitamente:

```bash
python scripts/convertir_rooming.py archivo.xlsx --fecha-ingreso 05/11/2026 --noches 3 --sede MATANZA
```

Los archivos se escriben en `salida/`. El script solicita confirmación antes de escribir; `--si` omite esa pregunta.

## 7. Compatibilidad de formatos

El CSV de 14 columnas generado por este conversor es un informe de rooming para LibreOffice. **No es el CSV operativo de 28 o más columnas que consume actualmente `client/src/lib/parser.js` para los módulos de vouchers y Ficha Pax.**

Por lo tanto, el CSV de 14 columnas no debe presentarse como entrada directa del parser principal.

La integración futura deberá incorporar una etapa de conciliación y generación del CSV operativo completo, tomando como referencia el esquema real que espera la suite y contrastando el Excel con la exportación CSV de SIGS cuando ambas fuentes estén disponibles.

## 8. Estado y alcance de la implementación

El conversor CLI de Excel a rooming PPJ ya constituye una herramienta independiente de conversión y validación.

La capa general de preparación y conciliación Excel + SIGS es la evolución prevista. Su implementación debe realizarse de manera gradual y verificable:

1. Documentar el esquema exacto que consume actualmente el parser de la suite.
2. Definir el esquema de salida operativo y las reglas de prioridad por campo.
3. Implementar la lectura y normalización de las fuentes.
4. Incorporar el cruce de pasajeros por DNI y el informe de diferencias.
5. Generar el CSV operativo compatible.
6. Probar el resultado con archivos de contingentes y verificar su funcionamiento en la suite sin modificar el mecanismo habitual de carga.

## 9. Protección de datos

No subir al repositorio archivos reales de contingentes que contengan nombres, DNI, fechas de nacimiento, teléfonos, domicilios u otros datos personales. Para pruebas automatizadas se deben utilizar archivos ficticios o anonimizados.
"""