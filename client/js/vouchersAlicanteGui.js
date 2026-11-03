(function () {
  const dropArea = document.getElementById('dropArea');
  const csvInput = document.getElementById('csvInput');
  const generateBtn = document.getElementById('generateBtn');
  const status = document.getElementById('status');

  let csvFile = null;
  let templateBytes = null;
  let groupedRecords = [];

  const mmToPt = (mm) => (72 / 25.4) * mm;

  function normalize(value) {
    return (value || '').toString().trim();
  }

  function parseIntSafe(value, fallback = -1) {
    const parsed = parseInt(normalize(value), 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function extractDocumentNumber(value) {
    const raw = normalize(value);
    const digits = raw.replace(/\D/g, '');
    return digits || raw;
  }

  function updateGenerateButtonState() {
    generateBtn.disabled = !(csvFile && templateBytes && groupedRecords.length > 0);
  }

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.style.color = isError ? '#b00020' : '#1f4d1f';
  }

  function parseCSV(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors && results.errors.length > 0) {
            reject(new Error(results.errors[0].message || 'Error parseando CSV'));
            return;
          }
          resolve(results.data || []);
        },
        error: (error) => reject(error),
      });
    });
  }

  function selectHolder(rows) {
    if (!rows || rows.length === 0) return null;
    return [...rows].sort((a, b) => parseIntSafe(b['Edad']) - parseIntSafe(a['Edad']))[0];
  }

  function groupByVoucher(rows) {
    const groups = {};

    rows.forEach((row) => {
      const voucher = normalize(row['Voucher']);
      if (!voucher) return;
      if (!groups[voucher]) groups[voucher] = [];
      groups[voucher].push(row);
    });

    const records = Object.keys(groups)
      .map((voucher) => {
        const groupRows = groups[voucher];
        const holder = selectHolder(groupRows);
        if (!holder) return null;

        const rooms = Array.from(
          new Set(
            groupRows
              .map((row) => normalize(row['Nro. habitación']))
              .filter(Boolean)
          )
        ).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));

        return {
          voucher,
          passenger: normalize(holder['Apellido y nombre']).toUpperCase(),
          document: extractDocumentNumber(holder['Nro. doc.']),
          room: rooms.join(', '),
          minRoom: Math.min(...rooms.map((room) => parseIntSafe(room, Number.MAX_SAFE_INTEGER))),
          fromDate: normalize(holder['Fecha de ingreso']),
          toDate: normalize(holder['Fecha de egreso']),
          pax: groupRows.length,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.minRoom - b.minRoom);

    return records;
  }

  function chunk(array, size) {
    const result = [];
    for (let index = 0; index < array.length; index += size) {
      result.push(array.slice(index, index + size));
    }
    return result;
  }

  async function loadDefaultTemplate() {
    const response = await fetch('/python/vouchersAlicante/VOUCHER ALICANTE.pdf');
    if (!response.ok) {
      throw new Error('No se pudo cargar la plantilla por defecto');
    }
    const bytes = await response.arrayBuffer();
    templateBytes = bytes;
  }

  async function handleCsvFile(file) {
    if (!file || !file.name.toLowerCase().endsWith('.csv')) {
      setStatus('Seleccioná un archivo con extensión .csv', true);
      return;
    }

    try {
      csvFile = file;
      const rows = await parseCSV(file);
      groupedRecords = groupByVoucher(rows);
      dropArea.classList.toggle('loaded', groupedRecords.length > 0);
      setStatus(`${file.name}: ${groupedRecords.length} vouchers listos para generar`);
      updateGenerateButtonState();
    } catch (error) {
      groupedRecords = [];
      dropArea.classList.remove('loaded');
      setStatus(`Error en CSV: ${error.message}`, true);
      updateGenerateButtonState();
    }
  }

  async function generatePdf() {
    if (!templateBytes) {
      setStatus('No está disponible la plantilla oficial en este entorno', true);
      return;
    }

    if (!groupedRecords.length) {
      setStatus('Primero cargá un CSV válido', true);
      return;
    }

    setStatus('Generando vouchers...');
    generateBtn.disabled = true;

    try {
      const templateDoc = await PDFLib.PDFDocument.load(templateBytes);
      const outputDoc = await PDFLib.PDFDocument.create();
      const helvetica = await outputDoc.embedFont(PDFLib.StandardFonts.Helvetica);
      const helveticaBold = await outputDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

      const slotTopYsMm = [255, 165, 75];
      const slotAdjustsMm = [4.0, 5.5, 6.0];
      const xBaseMm = 24;

      const groupedChunks = chunk(groupedRecords, 3);

      for (const recordsChunk of groupedChunks) {
        const [templatePage] = await outputDoc.copyPages(templateDoc, [0]);
        outputDoc.addPage(templatePage);

        recordsChunk.forEach((record, slotIndex) => {
          const yTopMm = slotTopYsMm[slotIndex] + slotAdjustsMm[slotIndex];

          templatePage.drawText(record.passenger, {
            x: mmToPt(xBaseMm + 0),
            y: mmToPt(yTopMm - 1),
            size: 10,
            font: helveticaBold,
          });

          templatePage.drawText(record.document, {
            x: mmToPt(xBaseMm - 5),
            y: mmToPt(yTopMm - 12),
            size: 9,
            font: helvetica,
          });

          templatePage.drawText(record.room, {
            x: mmToPt(xBaseMm + 0),
            y: mmToPt(yTopMm - 25),
            size: 9,
            font: helvetica,
          });

          templatePage.drawText(record.fromDate, {
            x: mmToPt(xBaseMm + 70),
            y: mmToPt(yTopMm - 25),
            size: 9,
            font: helvetica,
          });

          templatePage.drawText(record.toDate, {
            x: mmToPt(xBaseMm + 120),
            y: mmToPt(yTopMm - 25),
            size: 9,
            font: helvetica,
          });

          templatePage.drawText(String(record.pax), {
            x: mmToPt(xBaseMm + 28),
            y: mmToPt(yTopMm - 32),
            size: 9,
            font: helvetica,
          });
        });
      }

      const outName = 'Vouchers_Alicante.pdf';

      const pdfBytes = await outputDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = outName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      setStatus('✅ PDF generado');
    } catch (error) {
      setStatus(`❌ Error generando PDF: ${error.message}`, true);
    } finally {
      updateGenerateButtonState();
    }
  }

  function preventDefaults(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
    dropArea.addEventListener(eventName, preventDefaults);
  });

  dropArea.addEventListener('drop', (event) => {
    const files = event.dataTransfer && event.dataTransfer.files;
    if (files && files.length > 0) {
      handleCsvFile(files[0]);
    }
  });

  csvInput.addEventListener('change', (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleCsvFile(files[0]);
    }
  });

  generateBtn.addEventListener('click', generatePdf);

  loadDefaultTemplate()
    .then(() => {
      setStatus('Seleccioná el CSV de pasajeros');
      updateGenerateButtonState();
    })
    .catch(() => {
      setStatus('No se pudo cargar la plantilla de voucher', true);
      updateGenerateButtonState();
    });
})();
