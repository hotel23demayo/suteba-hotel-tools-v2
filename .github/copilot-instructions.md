<!-- Copilot / AI agent instructions for vouchers-unificados -->
# Quick onboarding for AI coding agents

This repository is a small, client-side web tool to process hotel CSVs and produce vouchers and rooming reports. Use these concise notes to be productive immediately.

- **Big picture**: static site (no backend). Entry points: `index.html`, `vouchers.html`, `rooming.html`. Core logic lives in `src/` and is plain ES scripts loaded in the pages.

- **Key components**:
  - [src/app.js](src/app.js) — bootstrap, file input handling, UI toggles and print helper.
  - [src/lib/parser.js](src/lib/parser.js) — CSV parsing and normalization (handles two CSV shapes and fixes extra commas).
  - [src/lib/business.js](src/lib/business.js) — business rules for MAP vs PC, filtering, grouping and calculations.
  - [src/lib/render.js](src/lib/render.js) — HTML voucher rendering (boxes or image-based legacy mode).
  - `assets/` — logos and legacy checkbox images used by `render.js`.

- **Primary data flow** (follow this when making changes):
  1. User loads CSV via UI (handled in `src/app.js`).
  2. `processData(fileContents, mode)` in `src/lib/business.js` calls `parseCSV` from `src/lib/parser.js`.
  3. Business rules compute `mealCount`, `cantp`, `stayDuration` and group rows.
  4. `src/lib/render.js` turns grouped data into printable HTML.

- **Important conventions & gotchas**:
  - CSVs can be in two formats. `parser.js` detects by field count and attempts to fix extra commas by joining observation fields — avoid aggressive refactors that change that heuristic without tests.
  - Dates in CSV are `dd/mm/YYYY`; parser functions `formatDate` and `calculateStayDuration` expect that format.
  - String normalization removes diacritics for service matching (see `shouldIncludeRow` in `business.js`).
  - No bundler or npm scripts — files are loaded directly in the browser. Run a static server for development (see workflows).
  - Expected input file: CSV with reservation data (suggested name: `consultaRegimenReport.csv`). Users must provide their own CSV files. The UI will display a warning if rows with **Pensión Completa (PC)** are present while the app is in **MAP** mode (those rows are filtered out).

- **Developer workflows** (what actually works locally):
  - Quick manual preview: open `index.html` in the browser (double-click) or run a simple static server:

```bash
python3 -m http.server 8000
# or
npx http-server -c-1 .
```

  - Python utilities: there are utility scripts under `python/fichaPax/`. Available scripts include:
    - `llenar_fichas.py` — fill passenger sheets (usage: `python3 python/fichaPax/llenar_fichas.py`).
    - `generar_con_overlay.py` — generate PDFs with overlays (usage: `python3 python/fichaPax/generar_con_overlay.py`).
    - `previsualizar_fichas.py` — preview generated forms (usage: `python3 python/fichaPax/previsualizar_fichas.py`).
    Check the top of each script for required third-party packages and run them with `python3` from the repository root (or activate your virtualenv).
  - Tests: README lists ad-hoc test commands `python3 test_processData.py` and `node test_processData.js` if present; run them from repo root.

- **How to make safe changes**:
  - When changing parsing behavior, run manual tests with `test-data-ppj.csv` and `test-data-map.csv` in the repo root.
  - Prefer adding small, focused unit tests (create `test_*.js` or `test_*.py`) that exercise `parseCSV`, `processData` and `relevantDataToForm`.
  - When modifying rendering layout, verify print output by using the browser Print Preview (the CSS is tuned for 4 vouchers per A4 page).

- **Examples of common edits and where to implement them**:
  - Change initial mode or rendering mode: edit `APP_CONFIG` in [src/app.js](src/app.js) (keys: `mode`, `renderMode`).
  - Add a new CSV format: extend `parseCSV` in [src/lib/parser.js](src/lib/parser.js) and update `README.md` CSV spec.
  - Change meal calculation rules: edit `mealMultiplier` in `APP_CONFIG` or `processData` in [src/lib/business.js](src/lib/business.js).

- **Integration points / external dependencies**:
  - No external JS packages in the client code. Parser is custom; migrating to PapaParse is suggested in README but not implemented.
  - Python scripts in `python/fichaPax/` may require third-party Python packages — inspect their top-level imports before running.

- **When unsure, follow these safe defaults**:
  1. Run the app locally with a static server and test with provided CSVs.
  2. Modify a single module at a time (parser → business → render) and verify full flow in the browser.
  3. Preserve legacy `renderMode: 'image'` behaviour unless you confirm all consumers can use `boxes`.

If anything here is incomplete or you want me to expand examples (e.g., specific line references, test scaffolding, or Python deps), tell me which part to expand.
