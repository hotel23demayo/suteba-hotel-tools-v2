# Solución a problemas de CORS

## Problema

Al abrir archivos HTML con doble clic (`file://`), el navegador bloquea algunas operaciones por políticas de CORS.

## Solución vigente

Usar siempre un servidor HTTP local desde la raíz del proyecto.

### Opción 1 (recomendada): launcher principal

```bash
./launcher.sh
```

Abre la app en:

`http://localhost:8000/index.html`

### Opción 2: servidor manual

```bash
python3 -m http.server 8000
```

Luego abrir:

`http://localhost:8000/index.html`

## Flujo Alicante (overlay PDF)

Para vouchers de Balneario Alicante, usar el flujo web desde el menú principal:

```bash
./launcher.sh
```

Luego abrir `http://localhost:8000/index.html` y entrar en **Vouchers Alicante**.

Este flujo no depende del render HTML legacy de `client/legacy/vouchers-balneario.html`; genera el PDF calibrado directamente en:

`python/vouchersAlicante/Vouchers_Alicante_Calibrado.pdf`

## Verificación rápida

1. Ejecutar `./launcher.sh`
2. Abrir `http://localhost:8000/index.html`
3. Confirmar que la página carga sin errores en consola/red

## Nota

Los scripts legacy `start-server.sh` y `start-server.bat` ya no forman parte del flujo recomendado en este repo.
