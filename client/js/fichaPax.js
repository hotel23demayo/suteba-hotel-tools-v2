(function(){
  const dropArea = document.getElementById('dropArea');
  const fileInput = document.getElementById('fileInput');
  const fileInfo = document.getElementById('fileInfo');
  const controlsArea = document.getElementById('controlsArea');
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const status = document.getElementById('status');
  const previewArea = document.getElementById('previewArea');
  const previewFrame = document.getElementById('previewFrame');

  let parsedRows = [];
  let grouped = []; // groups by voucher (computed after parsing)

  function preventDefaults(e){e.preventDefault();e.stopPropagation();}
  ['dragenter','dragover','dragleave','drop'].forEach(evt => dropArea.addEventListener(evt, preventDefaults));

  dropArea.addEventListener('drop', e => {
    const dt = e.dataTransfer; const files = dt.files; handleFiles(files);
  });

  fileInput.addEventListener('change', e => handleFiles(e.target.files));

  function handleFiles(files){
    if(!files || files.length===0) return;
    const file = files[0];
    fileInfo.textContent = `Archivo: ${file.name} — ${Math.round(file.size/1024)} KB`;
    parseCSVFile(file);
  }

  function parseCSVFile(file){
    status.textContent = 'Parseando...';
    Papa.parse(file, {
      header:true,
      skipEmptyLines:true,
      complete: function(results){
        parsedRows = results.data;
        grouped = groupByVoucher(parsedRows);
        status.textContent = `✅ ${grouped.length} vouchers cargados`;
        // Show search UI
        controlsArea.style.display = 'block';
        searchInput.focus();
      },
      error: function(err){ status.textContent = 'Error parseando CSV: '+err.message }
    });
  }


  function escapeHtml(s){ return s.replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"})[c]) }

  // Search functionality
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if(query.length === 0){
      searchResults.innerHTML = '<p style="color:#666">Ingrese voucher, DNI o apellido para buscar</p>';
      previewArea.style.display = 'none';
      return;
    }
    const matches = grouped.filter(g => {
      const voucherMatch = g.voucher.toLowerCase().includes(query);
      const dniMatch = (g.titular['Nro. doc.'] || g.titular['Nro doc'] || '').toString().includes(query);
      const apellidoMatch = (g.titular['Apellido y nombre'] || g.titular['Nombre'] || '').toLowerCase().includes(query);
      return voucherMatch || dniMatch || apellidoMatch;
    });
    renderSearchResults(matches, query);
  });

  function renderSearchResults(matches, query){
    if(matches.length === 0){
      searchResults.innerHTML = `<p style="color:#999">No se encontraron resultados para "${escapeHtml(query)}"</p>`;
      previewArea.style.display = 'none';
      return;
    }
    let html = `<p style="margin-bottom:12px;color:#333">Se encontraron <strong>${matches.length}</strong> resultado(s):</p>`;
    html += '<div style="display:grid;gap:12px">';
    matches.forEach((g, idx) => {
      const nombre = (g.titular['Apellido y nombre'] || g.titular['Nombre'] || 'Sin nombre').toUpperCase();
      const dni = g.titular['Nro. doc.'] || g.titular['Nro doc'] || 'Sin DNI';
      const voucher = g.voucher || 'Sin voucher';
      const habitaciones = (g.todas_habitaciones && g.todas_habitaciones.length > 0) ? g.todas_habitaciones.join(', ') : 'Sin asignar';
      const numPax = g.num_pasajeros || 1;
      
      // Detectar servicio MAP/PC
      const servicios = (g.titular['Servicios'] || g.titular['servicio'] || '').toUpperCase();
      // Importante: verificar MEDIA PENSION primero antes que PENSION solo
      const hasMAP = servicios.includes('MEDIA PENSION') || servicios.includes('MEDIA');
      const hasPC = !hasMAP && (servicios.includes('PENSION COMPLETA') || servicios.includes('COMPLETA'));
      let serviceBadge = '';
      if (hasPC) {
        serviceBadge = '<span style="display:inline-block;background:#28a745;color:white;padding:2px 8px;border-radius:3px;font-size:11px;margin-left:8px">PC</span>';
      } else if (hasMAP) {
        serviceBadge = '<span style="display:inline-block;background:#ffc107;color:#000;padding:2px 8px;border-radius:3px;font-size:11px;margin-left:8px">MAP</span>';
      }
      
      html += `
        <div style="border:1px solid #ddd;padding:12px;border-radius:6px;background:#f9f9f9">
          <div style="display:flex;justify-content:space-between;align-items:start;gap:12px;flex-wrap:wrap">
            <div style="flex:1;min-width:200px">
              <div style="font-weight:bold;font-size:15px;margin-bottom:4px">${escapeHtml(nombre)}${serviceBadge}</div>
              <div style="font-size:13px;color:#555">Voucher: ${escapeHtml(voucher)} | DNI: ${escapeHtml(dni)}</div>
              <div style="font-size:13px;color:#555">Habitación: ${escapeHtml(habitaciones)} | Pasajeros: ${numPax}</div>
            </div>
            <div>
              <button class="generateSingleBtn" data-index="${idx}" style="padding:8px 16px;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;font-size:14px">Generar ficha</button>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    searchResults.innerHTML = html;
    
    // Attach event listeners to buttons
    document.querySelectorAll('.generateSingleBtn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const idx = parseInt(e.target.dataset.index);
        const group = matches[idx];
        await generateSingleVoucher(group);
      });
    });
  }

  // Group rows by Voucher and pick titular (oldest by Edad) + accompanantes
  function groupByVoucher(rows){
    const m = {};
    rows.forEach(r=>{
      const v = (r['Voucher']||r['voucher']||'').toString().trim();
      if(!v) return;
      if(!m[v]) m[v]=[];
      m[v].push(r);
    });
    const groups = Object.keys(m).map(v=>{
      const pax = m[v];
      // choose titular by max Edad when present
      let titular = pax[0];
      try{
        const hasEdad = pax.some(p=>p['Edad'] && !isNaN(parseInt(p['Edad'])));
        if(hasEdad){
          titular = pax.reduce((a,b)=> ((parseInt(a['Edad']||0) >= parseInt(b['Edad']||0))? a : b));
        }
      }catch(e){ /* ignore and fallback */ }
      const acompanantes = pax.filter(p=>p!==titular);
      const todas_habitaciones = Array.from(new Set(pax.map(p=>p['Nro. habitación']||p['Nro habitacion']||p['Habitacion']||'').filter(Boolean)));
      return { voucher: v, titular, acompanantes, todas_habitaciones, num_pasajeros: pax.length, rows: pax };
    });
    return groups;
  }

  // Generate single voucher PDF
  async function generateSingleVoucher(group){
    const btn = event.target;
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Generando...';
    
    try {
      // Generar ficha de pasajero
      status.textContent = '⏳ Generando ficha de pasajero...';
      const templateUrl = '/python/fichaPax/1fichaPax.pdf';
      const templateBytes = await fetch(templateUrl).then(r=>r.arrayBuffer());
      
      const fichaPdfBytes = await fillTemplate(templateBytes, group, 0);
      
      // Descargar ficha
      const nameBase = sanitizeFilename((group.voucher || group.titular['Apellido y nombre'] || group.titular['Nombre'] || 'ficha').toString());
      const fichaName = `ficha_${nameBase}.pdf`;
      const fichaBlob = new Blob([fichaPdfBytes], {type:'application/pdf'});
      triggerDownload(fichaBlob, fichaName);
      
      status.textContent = '✅ Ficha generada correctamente';
      
      // Show preview de la ficha
      const url = URL.createObjectURL(fichaBlob);
      previewFrame.src = url;
      previewArea.style.display = 'block';
      
      setTimeout(() => {
        status.textContent = `✅ ${grouped.length} vouchers cargados`;
      }, 4000);
    } catch(err) {
      status.textContent = '❌ Error generando ficha: ' + err.message;
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  async function fillTemplate(templateBytes, group, idx){
    // Use the positions map extracted from generar_con_overlay.py (python/fichaPax/positions.json)
    const pdfDoc = await PDFLib.PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const first = pages[0];

    // Embed fonts
    const helv = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const helvBold = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

    // Load positions map (cache on window)
    if(!window.__ficha_positions_map){
      const map = await fetch('/python/fichaPax/positions.json').then(r=>r.json());
      window.__ficha_positions_map = map.fields || {};
    }
    const pos = window.__ficha_positions_map;

    const mmToPt = 72/25.4; // points per mm
    const pageHeight = first.getHeight();

    const titular = group.titular || {};

    // Helper to get field from titular
    const tVal = (keys)=>{
      for(const k of keys){ if(titular[k] && String(titular[k]).trim() !== '') return String(titular[k]).trim(); }
      return '';
    };

    // Validación de email: rechazar "no informado" (case insensitive)
    const isValidEmail = (email) => {
      if (!email) return false;
      const cleaned = email.trim().toLowerCase();
      // Rechazar "no informado", "noinformado", "sin email", etc.
      if (cleaned === 'no informado' || cleaned === 'noinformado' || 
          cleaned === 'sin email' || cleaned === 'sin mail' ||
          cleaned === 'n/a' || cleaned === 'na' || cleaned === '-') {
        return false;
      }
      // Validación básica de formato email
      return cleaned.includes('@') && cleaned.length > 5;
    };

    // Validación de teléfono: rechazar números muy cortos (menos de 6 dígitos)
    const isValidPhone = (phone) => {
      if (!phone) return false;
      const cleaned = phone.toString().replace(/[^\d]/g, ''); // Solo dígitos
      // Teléfonos argentinos tienen al menos 6-8 dígitos válidos
      return cleaned.length >= 6;
    };

    // Draw main fields using the map
    const name = tVal(['Apellido y nombre','Nombre','Nombre completo','NombrePax','Nombre y Apellido']).toUpperCase();
    if(name && pos['Apellido y nombre']){
      const p = pos['Apellido y nombre'];
      const x = p.x_mm * mmToPt;
      const y = pageHeight - (p.y_top_mm * mmToPt);
      first.drawText(name, { x, y, size: p.size || 10, font: helv });
    }

    // Documento tipo + número
    const tipo = tVal(['Tipo documento','Tipo','Tipo Doc']);
    const nro = tVal(['Nro. doc.','Nro doc','Nro Documento']);
    const docText = (tipo? tipo + ': ' : '') + (nro? nro : '');
    if(docText && pos['TipoDocumento_Nro']){
      const p = pos['TipoDocumento_Nro'];
      const x = p.x_mm * mmToPt;
      const y = pageHeight - (p.y_top_mm * mmToPt);
      first.drawText(docText, { x, y, size: p.size || 10, font: helv });
    }

    // Telefono / Email con validación
    const telefonoRaw = tVal(['Celular','Teléfono','Telefono']);
    const telefono = isValidPhone(telefonoRaw) ? telefonoRaw : '';
    if(telefono && pos['Telefono']){
      const p = pos['Telefono'];
      const x = p.x_mm * mmToPt;
      const y = pageHeight - (p.y_top_mm * mmToPt);
      first.drawText(telefono, { x, y, size: p.size || 10, font: helv });
    }
    const emailRaw = tVal(['Email','E-mail','Correo']);
    const email = isValidEmail(emailRaw) ? emailRaw : '';
    if(email && pos['Email']){
      const p = pos['Email'];
      const x = p.x_mm * mmToPt;
      const y = pageHeight - (p.y_top_mm * mmToPt);
      first.drawText(email, { x, y, size: p.size || 10, font: helv });
    }

    // Sede
    const sede = tVal(['Sede','Seccional']);
    if(sede && pos['Sede']){
      const p = pos['Sede'];
      const x = p.x_mm * mmToPt;
      const y = pageHeight - (p.y_top_mm * mmToPt);
      // Apply the same cleaning as in python script (remove leading NN - )
      const clean = sede.replace(/^\s*\d+\s*[-–—]\s*/, '');
      first.drawText(clean, { x, y, size: p.size || 10, font: helv });
    }

    // Fecha de nacimiento
    const fnac = tVal(['Fecha de nacimiento','Fecha nacimiento','Fecha Nacimiento']);
    if(fnac && pos['Fecha de nacimiento']){
      const p = pos['Fecha de nacimiento'];
      const x = p.x_mm * mmToPt;
      const y = pageHeight - (p.y_top_mm * mmToPt);
      first.drawText(fnac, { x, y, size: p.size || 10, font: helv });
    }

    // Acompanantes (based on group.acompanantes)
    if(pos['Acomp']){
      const p = pos['Acomp'];
      const acomp = group.acompanantes || [];
      for(let i=0;i<Math.min(acomp.length, p.max); i++){
        const an = (acomp[i]['Apellido y nombre'] || acomp[i]['Nombre'] || '').toUpperCase();
        const ad = (acomp[i]['Tipo documento']? (acomp[i]['Tipo documento'] + ': ') : '') + (acomp[i]['Nro. doc.'] || acomp[i]['Nro doc'] || '');
        const y = pageHeight - ((p.y_first_top_mm + (i) * p.spacing_mm) * mmToPt);
        const xName = p.x_mm_name * mmToPt;
        const xDoc = p.x_mm_doc * mmToPt;
        if(an) first.drawText(an, { x: xName, y, size: p.size || 9, font: helv });
        if(ad && ad.trim() !== ': ') first.drawText(`${ad}`, { x: xDoc, y, size: p.size || 9, font: helv });
      }
    }

    // Habitacion(s)
    const habitacionesRaw = (group.todas_habitaciones && group.todas_habitaciones.length>0) ? group.todas_habitaciones.join(', ') : '';
    if(pos['NroHabitacion']){
      const p = pos['NroHabitacion'];
      const x = p.x_mm * mmToPt;
      const y = pageHeight - (p.y_top_mm * mmToPt);
      first.drawText(habitacionesRaw || '', { x, y, size: p.size || 10, font: helv });
    }

    // Fecha ingreso/egreso (from titular)
    const fIngreso = tVal(['Fecha de ingreso','Fecha ingreso','Checkin']);
    const fEgreso = tVal(['Fecha de egreso','Fecha egreso','Checkout']);
    if(fIngreso && pos['FechaIngreso']){
      const p = pos['FechaIngreso'];
      const x = p.x_mm * mmToPt;
      const y = pageHeight - (p.y_top_mm * mmToPt);
      first.drawText(fIngreso, { x, y, size: p.size || 10, font: helv });
    }
    if(fEgreso && pos['FechaEgreso']){
      const p = pos['FechaEgreso'];
      const x = p.x_mm * mmToPt;
      const y = pageHeight - (p.y_top_mm * mmToPt);
      first.drawText(fEgreso, { x, y, size: p.size || 10, font: helv });
    }

    // Servicios -> mark X at positions
    if(pos['Servicios']){
      const p = pos['Servicios'];
      const servicios = (tVal(['Servicios','Servicio']) || '').toUpperCase();
      if(servicios.includes('DESAYUNO') && !servicios.includes('MEDIA')){
        const x = p.x_mm_desayuno * mmToPt; const y = pageHeight - (p.y_top_mm * mmToPt);
        first.drawText('X', { x, y, size: p.size || 10, font: helv });
      } else if(servicios.includes('MEDIA')){
        const x = p.x_mm_media * mmToPt; const y = pageHeight - (p.y_top_mm * mmToPt);
        first.drawText('X', { x, y, size: p.size || 10, font: helv });
      } else if(servicios.includes('COMPLETA') || servicios.includes('PENSION')){
        const x = p.x_mm_completa * mmToPt; const y = pageHeight - (p.y_top_mm * mmToPt);
        first.drawText('X', { x, y, size: p.size || 10, font: helv });
      }
    }

    // Voucher
    const voucher = (group.voucher || titular['Voucher'] || titular['voucher'] || '');
    if(voucher && pos['Voucher']){
      const p = pos['Voucher'];
      const x = p.x_mm * mmToPt;
      const y = pageHeight - (p.y_top_mm * mmToPt);
      first.drawText(voucher, { x, y, size: p.size || 11, font: helvBold });
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }

  function sanitizeFilename(s){ return s.replace(/[^a-z0-9\-_\.]/ig,'_').slice(0,120); }
  function triggerDownload(blob, name){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),2000);
  }

  /**
   * Genera el HTML del voucher de comida basado en el grupo y modo
   * @param {Object} group - Grupo con titular y acompañantes
   * @param {string} mode - 'MAP' o 'PC'
   * @returns {Promise<string>} HTML del voucher
   */
  async function generateMealVoucherHTML(group, mode) {
    const titular = group.titular || {};
    
    // Helper to get field from titular
    const tVal = (keys) => {
      for(const k of keys){ 
        if(titular[k] && String(titular[k]).trim() !== '') return String(titular[k]).trim(); 
      }
      return '';
    };
    
    // Extraer datos necesarios
    const passengerName = (tVal(['Apellido y nombre','Nombre','Nombre completo','NombrePax','Nombre y Apellido']) || 'Sin nombre').toUpperCase();
    const dni = tVal(['Nro. doc.','Nro doc','Nro Documento']) || 'Sin DNI';
    const hotel = tVal(['U. Turística','UTuristica','Hotel','Unidad Turistica']) || 'Sin hotel';
    const dinRaw = tVal(['Fecha de ingreso','Fecha ingreso','Checkin']) || '';
    const doutRaw = tVal(['Fecha de egreso','Fecha egreso','Checkout']) || '';
    const habitaciones = (group.todas_habitaciones && group.todas_habitaciones.length > 0) 
      ? group.todas_habitaciones.join(', ') 
      : 'Sin asignar';
    const numPax = group.num_pasajeros || 1;
    
    // Calcular duración de estadía
    let stayDuration = 1;
    if (dinRaw && doutRaw) {
      try {
        // Formato esperado: dd/mm/yyyy
        const parseDate = (str) => {
          const [d, m, y] = str.split('/').map(Number);
          return new Date(y, m - 1, d);
        };
        const din = parseDate(dinRaw);
        const dout = parseDate(doutRaw);
        const diffTime = Math.abs(dout - din);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        stayDuration = diffDays || 1;
      } catch(e) {
        console.warn('Error calculando duración:', e);
      }
    }
    
    // Calcular cantidad de comidas según modo
    const mealMultiplier = mode === 'PC' ? 2 : 1; // PC = almuerzo + cena, MAP = solo cena
    const mealCount = numPax * stayDuration * mealMultiplier;
    
    // Textos según modo
    const serviceText = mode === 'MAP' 
      ? 'Favor de brindar servicio de Cena al siguiente afiliado:' 
      : 'Favor de brindar servicio de Pensión Completa al siguiente afiliado:';
    const title = mode === 'MAP' ? 'Voucher de Comidas' : 'Voucher de Comidas PPJ';
    
    // Generar HTML del voucher
    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12pt; }
    .container { 
      width: 100%; 
      max-width: 190mm; 
      margin: 0 auto; 
      padding: 10mm;
      border: 2px solid #333;
    }
    .logo-container { text-align: center; margin-bottom: 10px; }
    .logo-container img { max-width: 120px; height: auto; }
    h1 { text-align: center; font-size: 18pt; margin-bottom: 10px; }
    .p-cena { text-align: center; margin-bottom: 15px; font-size: 11pt; }
    .passengerName, .dni, .hotel, .din, .dout, .roomNumber, .cantp, .cantMap {
      margin-bottom: 8px;
      font-size: 11pt;
    }
    .p-servicios { 
      text-align: center; 
      margin: 15px 0 10px 0; 
      font-size: 12pt; 
      font-weight: bold;
    }
    .check-container { margin-top: 15px; }
    .check-boxes-grid { 
      display: flex; 
      flex-direction: column; 
      gap: 15px;
    }
    .meal-section { 
      border: 1px solid #999; 
      padding: 10px; 
      border-radius: 4px;
    }
    .meal-title { 
      font-weight: bold; 
      font-size: 13pt; 
      margin-bottom: 10px; 
      text-align: center;
    }
    .days-grid { 
      display: flex; 
      flex-wrap: wrap; 
      gap: 10px; 
      justify-content: center;
    }
    .day-box { 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      gap: 5px;
    }
    .day-label { 
      font-size: 10pt; 
      font-weight: bold;
    }
    .checkbox { 
      width: 20px; 
      height: 20px; 
      border: 2px solid #333; 
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <img src="../assets/suteba_logo_3.jpg" alt="Logo SUTEBA">
    </div>
    <h1>${title}</h1>
    <p class="p-cena">${serviceText}</p>
    <div class="passengerName"><strong>Nombre:</strong> ${passengerName}</div>
    <div class="dni"><strong>DNI:</strong> ${dni}</div>
    <div class="hotel"><strong>U.Turística:</strong> ${hotel}</div>
    <div class="din"><strong>Ingreso:</strong> ${dinRaw}</div>
    <div class="dout"><strong>Egreso:</strong> ${doutRaw}</div>
    <div class="roomNumber"><strong>Habitación Nº:</strong> ${habitaciones}</div>
    <div class="cantp"><strong>Cant. Pax:</strong> ${numPax}</div>
    <p class="p-servicios">Servicios a Tomar</p>
    <div class="cantMap"><strong>Cant. Comidas:</strong> ${mealCount}</div>
    <div class="check-container check-boxes-grid">`;
    
    // Generar casillas según modo
    if (mode === 'PC') {
      // Pensión Completa: Almuerzo y Cena
      html += `
      <div class="meal-section">
        <div class="meal-title">Almuerzo</div>
        <div class="days-grid">`;
      for (let day = 1; day <= stayDuration; day++) {
        html += `
          <div class="day-box">
            <div class="day-label">Día ${day}</div>
            <div class="checkbox"></div>
          </div>`;
      }
      html += `
        </div>
      </div>
      <div class="meal-section">
        <div class="meal-title">Cena</div>
        <div class="days-grid">`;
      for (let day = 1; day <= stayDuration; day++) {
        html += `
          <div class="day-box">
            <div class="day-label">Día ${day}</div>
            <div class="checkbox"></div>
          </div>`;
      }
      html += `
        </div>
      </div>`;
    } else {
      // MAP: solo Cena
      html += `
      <div class="meal-section">
        <div class="meal-title">Cena</div>
        <div class="days-grid">`;
      for (let day = 1; day <= stayDuration; day++) {
        html += `
          <div class="day-box">
            <div class="day-label">Día ${day}</div>
            <div class="checkbox"></div>
          </div>`;
      }
      html += `
        </div>
      </div>`;
    }
    
    html += `
    </div>
  </div>
</body>
</html>`;
    
    return html;
  }

})();