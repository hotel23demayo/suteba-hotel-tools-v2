// render.js — Generación de plantillas HTML para vouchers

/**
 * Convierte datos relevantes a HTML imprimible
 * @param {Array} relevantData - Datos procesados
 * @param {Object} config - APP_CONFIG
 * @returns {string} HTML de vouchers
 */
function relevantDataToForm(relevantData, config) {
  // Agrupar por número de voucher para producir UN voucher por grupo familiar
  const voucherMap = {};
  for (const item of relevantData) {
    const reservationKey = item.voucher || `RES-${item.id || `${item.roomNumber}-${item.dinRaw}-${item.doutRaw}`}`;
    if (!voucherMap[reservationKey]) voucherMap[reservationKey] = [];
    voucherMap[reservationKey].push(item);
  }

  // Convertir a array y ordenar por número de habitación
  const voucherArray = Object.entries(voucherMap).map(([voucher, group]) => ({
    voucher,
    group,
    // Obtener el menor número de habitación del grupo para ordenar
    minRoom: Math.min(...group.map(i => parseInt(i.roomNumber) || 999999))
  }));
  
  // Ordenar por número de habitación de menor a mayor
  voucherArray.sort((a, b) => a.minRoom - b.minRoom);

  let formHTML = '';

  for (const { voucher, group } of voucherArray) {
    // Ordenar por DNI para consistencia (titular/representante será el primero)
    group.sort((a, b) => (parseInt(a.dni) || 0) - (parseInt(b.dni) || 0));

    // Cantidad de personas = número de filas que comparten el mismo voucher
    const finalCantp = group.length;

    // Duración de la estadía: tomar el máximo entre los integrantes (por seguridad)
    const stayDuration = Math.max(...group.map(i => i.stayDuration || 1));

    // Cantidad de comidas recalculada a partir del total de pax y días
    const finalMealCount = finalCantp * stayDuration * config.mealMultiplier[config.mode];

    // Representante para el voucher (primer elemento tras ordenar)
    const representative = group[0];

    // Unir habitaciones si el grupo ocupa varias
    const roomSet = Array.from(new Set(group.map(i => i.roomNumber).filter(Boolean)));
    const roomNumberCombined = roomSet.join(', ');

    const itemForRender = Object.assign({}, representative, {
      roomNumber: roomNumberCombined || representative.roomNumber,
      stayDuration
    });

    formHTML += renderVoucher(itemForRender, finalCantp, finalMealCount, config);
  }

  return formHTML;
}

/**
 * Renderiza un voucher individual
 * @param {Object} item - Datos del pasajero
 * @param {number} cantp - Cantidad de personas
 * @param {number} mealCount - Cantidad de comidas
 * @param {Object} config - APP_CONFIG
 * @returns {string} HTML del voucher
 */
function renderVoucher(item, cantp, mealCount, config) {
  const mode = config.mode;
  const serviceText = mode === 'MAP'
    ? 'Favor de brindar servicio de Cena al siguiente afiliado:'
    : mode === 'PC'
      ? 'Favor de brindar servicio de Pensión Completa al siguiente afiliado:'
      : 'Favor de brindar acceso al Balneario Alicante al siguiente afiliado:';

  const title = mode === 'MAP'
    ? 'Voucher de Comidas'
    : mode === 'PC'
      ? 'Voucher de Comidas PPJ'
      : 'Voucher de Balneario Alicante';

  const quantityLabel = mode === 'BALNEARIO' ? 'Cant. Días:' : 'Cant. Comidas:';
  const quantityValue = mode === 'BALNEARIO' ? item.stayDuration : mealCount;
  
  // Contenedor principal del voucher
  let html = '<div class="container">';
  // Ajustar ruta del logo para páginas dentro de la carpeta `client/` (../assets)
  html += '<div class="logo-container"><img src="../assets/suteba_logo_3.jpg" alt="Logo"></div>';
  html += `<h1 class="h1-container">${title}</h1>`;
  html += `<p class="p-cena">${serviceText}</p>`;
  html += `<div class="passengerName"><strong>Nombre:</strong> ${item.passengerName}</div>`;
  html += `<div class="dni"><strong>Dni:</strong> ${item.dni}</div>`;
  html += `<div class="hotel"><strong>U.Turística:</strong> ${item.hotel}</div>`;
  html += `<div class="din"><strong>Ingreso:</strong> ${item.dinRaw}</div>`;
  html += `<div class="dout"><strong>Egreso:</strong> ${item.doutRaw}</div>`;
  html += `<div class="roomNumber"><strong>Habitación Nº:</strong> <span class="roomNumberContent">${item.roomNumber}</span></div>`;
  html += `<div class="cantp"><strong>Cant. Pax:</strong> ${cantp}</div>`;
  html += '<p class="p-servicios"><strong>Servicios a Tomar</strong></p>';
  html += `<div class="cantMap"><strong>${quantityLabel}</strong> ${quantityValue}</div>`;
  
  // Sección de tildado (configurable)
  html += renderCheckSection(config, mealCount, item.stayDuration);
  
  html += '</div>';
  
  return html;
}

/**
 * Renderiza la sección de tildado según configuración
 * @param {Object} config - APP_CONFIG
 * @param {number} mealCount - Total de comidas
 * @param {number} stayDuration - Días de estadía
 * @returns {string} HTML de la sección de tildado
 */
function renderCheckSection(config, mealCount, stayDuration) {
  const mode = config.mode;
  const renderMode = config.renderMode;
  
  if (renderMode === 'image') {
    // Modo imagen (legacy)
    const imagePath = config.imageForTildes[mode];
    return `<div class="check-container"><img src="${imagePath}" alt="Check boxes"></div>`;
  } else if (renderMode === 'boxes') {
    // Modo casillas HTML imprimibles - formato organizado por tipo de comida y días
    let html = '<div class="check-container check-boxes-grid">';
    
    if (mode === 'PC') {
      // Pensión Completa: secciones separadas para Almuerzo y Cena
      html += '<div class="meal-section">';
      html += '<div class="meal-title">Almuerzo</div>';
      html += '<div class="days-grid">';
      for (let day = 1; day <= stayDuration; day++) {
        html += `
          <div class="day-box">
            <div class="day-label">Día ${day}</div>
            <div class="checkbox"></div>
          </div>
        `;
      }
      html += '</div></div>';
      
      html += '<div class="meal-section">';
      html += '<div class="meal-title">Cena</div>';
      html += '<div class="days-grid">';
      for (let day = 1; day <= stayDuration; day++) {
        html += `
          <div class="day-box">
            <div class="day-label">Día ${day}</div>
            <div class="checkbox"></div>
          </div>
        `;
      }
      html += '</div></div>';
      
    } else if (mode === 'MAP') {
      // MAP: solo Cena
      html += '<div class="meal-section">';
      html += '<div class="meal-title">Cena</div>';
      html += '<div class="days-grid">';
      for (let day = 1; day <= stayDuration; day++) {
        html += `
          <div class="day-box">
            <div class="day-label">Día ${day}</div>
            <div class="checkbox"></div>
          </div>
        `;
      }
      html += '</div></div>';
    } else if (mode === 'BALNEARIO') {
      // Balneario: una casilla diaria de acceso
      html += '<div class="meal-section">';
      html += '<div class="meal-title">Ingreso al Balneario</div>';
      html += '<div class="days-grid">';
      for (let day = 1; day <= stayDuration; day++) {
        html += `
          <div class="day-box">
            <div class="day-label">Día ${day}</div>
            <div class="checkbox"></div>
          </div>
        `;
      }
      html += '</div></div>';
    }
    
    html += '</div>';
    return html;
  }
  
  return '';
}

// Exportar funciones al scope global
window.relevantDataToForm = relevantDataToForm;
window.renderVoucher = renderVoucher;
window.renderCheckSection = renderCheckSection;
