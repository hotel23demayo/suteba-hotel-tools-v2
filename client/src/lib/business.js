// business.js — Reglas de negocio específicas para MAP vs PC

/**
 * Procesa datos parseados y aplica reglas de negocio según el modo
 * @param {Array} parsedData - Datos parseados del CSV
 * @param {string} mode - 'MAP' o 'PC'
 * @param {Object} config - APP_CONFIG
 * @returns {Array} Datos relevantes filtrados y procesados
 */
function processData(fileContents, mode, config = APP_CONFIG) {
  const parsedData = parseCSV(fileContents);
  console.log('📋 Parsed data:', parsedData.length, 'rows');
  const relevantData = [];
  const mealMultiplier = config.mealMultiplier[mode] ?? 1;
  const serviceLookup = config.serviceLookup[mode];
  console.log('🔍 Mode:', mode, '| Looking for:', serviceLookup, '| Meal multiplier:', mealMultiplier);

  for (const row of parsedData) {
    // Filtrar según servicios contratados
    const shouldInclude = shouldIncludeRow(row.servicios, row.observacion, serviceLookup, mode);
    console.log('Row', row.dni, '| Servicios:', row.servicios, '| Include?', shouldInclude);
    if (!shouldInclude) {
      continue;
    }

    // Normalizar nombre
    const passengerName = normalizePassengerName(row.nombre, row.apellido);

    // Calcular duración de estadía
    const stayDuration = calculateStayDuration(row.dinRaw, row.doutRaw);

    // Determinar cantidad de personas según tipo de habitación
    let cantp = determineCantp(row.tipo, row.plazas);

    // Calcular cantidad de comidas
    const mealCount = cantp * stayDuration * mealMultiplier;

    const relevantFields = {
      id: row.id,
      passengerName,
      dni: row.dni,
      hotel: row.hotel,
      din: formatDate(row.dinRaw),
      dout: formatDate(row.doutRaw),
      dinRaw: row.dinRaw,
      doutRaw: row.doutRaw,
      roomNumber: row.roomNumber,
      cantp,
      stayDuration,
      voucher: row.voucher,
      mealCount,
      tipo: row.tipo
    };

    relevantData.push(relevantFields);
  }

  return relevantData;
}

/**
 * Decide si incluir la fila según servicios contratados
 * @param {string} servicios - Campo de servicios del CSV
 * @param {string} observacion - Campo observación del CSV
 * @param {string} serviceLookup - Servicio esperado ('MEDIA PENSION' o 'PENSION COMPLETA')
 * @param {string} mode - Modo actual
 * @returns {boolean} True si debe incluirse
 */
function shouldIncludeRow(servicios, observacion, serviceLookup, mode) {
  // Normalizar texto: mayúsculas + quitar acentos
  const normalize = (text) => {
    return (text || '')
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remover marcas diacríticas (acentos)
  };
  
  const servicesNormalized = normalize(servicios);
  const observationNormalized = normalize(observacion);
  
  if (mode === 'MAP') {
    // Media Pensión: incluir si tiene MEDIA PENSION pero no solo DESAYUNO
    if (servicesNormalized.includes('DESAYUNO') && !servicesNormalized.includes('MEDIA PENSION')) {
      return false;
    }
    return servicesNormalized.includes('MEDIA PENSION');
  } else if (mode === 'PC') {
    // Pensión Completa: incluir si tiene PENSION COMPLETA (sin acento)
    return servicesNormalized.includes('PENSION COMPLETA');
  } else if (mode === 'BALNEARIO') {
    // Balneario: sin filtros por servicio, incluir todas las reservas
    return true;
  }
  
  return false;
}

/**
 * Determina la cantidad de personas según tipo de habitación
 * @param {string} tipo - Tipo de habitación
 * @param {string} plazas - Cantidad de plazas del CSV
 * @returns {number} Cantidad de personas para el voucher
 */
function determineCantp(tipo, plazas) {
  const tipoUpper = (tipo || '').toUpperCase();
  
  // Lógica para vouchers compartidos vs individuales
  if (tipoUpper.includes('DBL MAT') || tipoUpper.includes('DOBLE A COMPARTIR')) {
    return 2;
  } else if (tipoUpper.includes('TRIPLE A COMPARTIR')) {
    return 3;
  } else if (tipoUpper.includes('DBL IND')) {
    return 1;
  }
  
  // Fallback: usar plazas del CSV o default 1
  return parseInt(plazas) || 1;
}

/**
 * Agrupa datos por habitación y voucher para evitar duplicados
 * @param {Array} relevantData - Datos procesados
 * @returns {Object} Datos agrupados por clave roomNumber+voucher
 */
function groupDataByRoomAndVoucher(relevantData) {
  const groupedData = {};

  for (const item of relevantData) {
    const key = item.roomNumber + item.voucher;

    if (!groupedData[key]) {
      groupedData[key] = [];
    }

    groupedData[key].push(item);
  }

  return groupedData;
}

// Exportar funciones al scope global
window.processData = processData;
window.shouldIncludeRow = shouldIncludeRow;
window.determineCantp = determineCantp;
window.groupDataByRoomAndVoucher = groupDataByRoomAndVoucher;
