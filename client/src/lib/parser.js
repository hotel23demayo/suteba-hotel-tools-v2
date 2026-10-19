// parser.js — Parsing y normalización de CSV compartido entre MAP y PC

/**
 * Parsea el contenido CSV y normaliza los campos principales
 * @param {string} fileContents - Contenido del archivo CSV
 * @returns {Array} Array de objetos con campos parseados y normalizados
 */
function parseCSV(fileContents) {
  const lines = fileContents.split('\n');
  const parsedData = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;

    let fields = line.split(',');

    // Detectar formato del CSV según número de campos
    let parsed;
    
    if (fields.length >= 28) {
      // Formato CSV real (3feb.csv) - nombre completo junto en columna 13
      parsed = {
        id: fields[0],
        hotel: fields[1],
        roomNumber: (fields[2] || '').replace(/[^\d]/g, ''),
        tipo: fields[3],
        observacion: fields[4],
        plazas: fields[5],
        voucher: fields[6],
        sede: fields[7],
        dinRaw: fields[8],
        doutRaw: fields[9],
        plazasOcupadas: fields[10],
        tipoDoc: fields[11],
        dni: fields[12],
        nombreCompleto: (fields[13] || '').trim().toUpperCase(), // Nombre completo tal cual del CSV en mayúsculas
        edad: fields[14],
        entidad: fields[15],
        servicios: fields[16],
        paquete: fields[17],
        transporte: fields[18]
      };
      
      // Usar el nombre completo sin separación
      parsed.nombre = parsed.nombreCompleto;
      parsed.apellido = '';
    } else {
      // Formato CSV antiguo (pruebas_ppj.csv) - nombre y apellido separados
      // Corrección de CSV roto (campo Observación con comas extras)
      const EXPECTED_FIELDS_COUNT = 19;
      if (fields.length > EXPECTED_FIELDS_COUNT) {
        const extraFields = fields.length - EXPECTED_FIELDS_COUNT;
        const endObservationIndex = 4 + extraFields;
        const correctedObservation = fields.slice(4, endObservationIndex + 1).join(';');
        const fixedFields = [
          ...fields.slice(0, 4),
          correctedObservation,
          ...fields.slice(endObservationIndex + 1)
        ];
        fields = fixedFields;
      }
      
      parsed = {
        id: fields[0],
        hotel: fields[1],
        roomNumber: (fields[2] || '').replace(/[^\d]/g, ''),
        tipo: fields[3],
        observacion: fields[4],
        plazas: fields[5],
        voucher: fields[6],
        estado: fields[7],
        dinRaw: fields[8],
        doutRaw: fields[9],
        tarifa: fields[10],
        categoria: fields[11],
        dni: fields[12],
        nombre: (fields[13] || '').trim(),
        apellido: (fields[14] || '').trim(),
        email: fields[15],
        servicios: fields[16],
        origen: fields[17],
        destino: fields[18]
      };
    }

    parsedData.push(parsed);
  }

  return parsedData;
}

/**
 * Normaliza el nombre completo (nombre + apellido cuando aplica) a MAYÚSCULAS
 * @param {string} nombre - Nombre de pila
 * @param {string} apellido - Apellido
 * @returns {string} Nombre completo normalizado en MAYÚSCULAS
 */
function normalizePassengerName(nombre, apellido) {
  const namePart = (nombre || '').trim();
  const surnamePart = (apellido || '').trim();
  
  // Incluir apellido solo si parece válido (no email, no contiene dígitos)
  const includeSurname = surnamePart !== '' && 
                         !surnamePart.includes('@') && 
                         !/\d/.test(surnamePart);
  
  const fullName = includeSurname ? `${namePart} ${surnamePart}` : namePart;
  return fullName.toUpperCase();
}

/**
 * Formatea fecha de dd/mm/yyyy a yyyy/mm/dd
 * @param {string} dateString - Fecha en formato dd/mm/yyyy
 * @returns {string} Fecha en formato yyyy/mm/dd
 */
function formatDate(dateString) {
  const parts = dateString.split('/');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Calcula la duración de estadía en días
 * @param {string} dinRaw - Check-in (dd/mm/yyyy)
 * @param {string} doutRaw - Check-out (dd/mm/yyyy)
 * @returns {number} Duración en días
 */
function calculateStayDuration(dinRaw, doutRaw) {
  const dinDate = new Date(formatDate(dinRaw));
  const doutDate = new Date(formatDate(doutRaw));
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((doutDate - dinDate) / millisecondsPerDay);
}

// Exportar funciones al scope global
window.parseCSV = parseCSV;
window.normalizePassengerName = normalizePassengerName;
window.formatDate = formatDate;
window.calculateStayDuration = calculateStayDuration;
