(() => {
    const form = document.getElementById("balnearioVoucherForm");
    const status = document.getElementById("status");
    const mmToPt = 72 / 25.4;
    const templateUrl = "../python/balneario/VOUCHER_ALICANTE.pdf";
    const positionsUrl = "../python/balneario/positions.json";

    function localDateValue(date = new Date()) {
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return localDate.toISOString().slice(0, 10);
    }

    document.getElementById("fecha").value = localDateValue();

    function setStatus(message, error = false) {
        status.textContent = message;
        status.classList.toggle("error", error);
    }

    function formatDate(value) {
        const [year, month, day] = value.split("-");
        return `${day}/${month}/${year}`;
    }

    function validateInput(values) {
        const errors = [];
        const nombre = values.nombre.trim();
        const dni = values.dni.trim();
        const hotel = values.hotel.trim().toUpperCase();
        const habitacion = values.habitacion.trim();
        const cantidadPersonas = Number(values.cantidadPersonas);

        if (!nombre) errors.push("completa el nombre y apellido");
        if (!/^\d+$/.test(dni)) errors.push("el DNI debe ser numerico");
        if (!["23 DE MAYO", "31 DE AGOSTO"].includes(hotel)) errors.push("selecciona un hotel valido");
        if (!values.fecha) errors.push("completa la fecha");
        if (!Number.isInteger(cantidadPersonas) || cantidadPersonas <= 0) {
            errors.push("la cantidad debe ser un entero mayor que cero");
        }

        if (errors.length > 0) {
            throw new Error(`Revisa los datos: ${errors.join(", ")}.`);
        }

        return {
            nombre: nombre.toUpperCase(),
            dni,
            hotel,
            habitaciones: habitacion,
            fecha: formatDate(values.fecha),
            cantidadPersonas
        };
    }

    async function loadJson(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`No se pudo cargar ${url}.`);
        return response.json();
    }

    async function generatePdf(data, positions) {
        const response = await fetch(templateUrl);
        if (!response.ok) throw new Error("No se pudo cargar la plantilla PDF.");

        const templateBytes = await response.arrayBuffer();
        const pdfDocument = await PDFLib.PDFDocument.load(templateBytes);
        const page = pdfDocument.getPages()[0];
        const font = await pdfDocument.embedFont(PDFLib.StandardFonts.Helvetica);
        const boldFont = await pdfDocument.embedFont(PDFLib.StandardFonts.HelveticaBold);
        const slot = positions.slots[0];
        const manual = positions.manualVoucher;

        if (!slot || !manual || !manual.hotel || !manual.pageCrop) {
            throw new Error("Faltan posiciones para el voucher manual de Balneario.");
        }

        for (const [fieldName, value] of Object.entries(data)) {
            if (fieldName === "hotel") continue;

            const positionField = fieldName === "fecha" ? "fechaIngreso" : fieldName;
            const position = slot[positionField];
            if (!position || position.x_mm === null || position.y_from_bottom_mm === null) {
                throw new Error(`No hay posicion calibrada para ${fieldName}.`);
            }

            page.drawText(String(value), {
                x: position.x_mm * mmToPt,
                y: position.y_from_bottom_mm * mmToPt,
                size: 9,
                font: fieldName === "nombre" ? boldFont : font
            });
        }

        const hotelPosition = manual.hotel;
        const cover = hotelPosition.cover;
        page.drawRectangle({
            x: cover.x_mm * mmToPt,
            y: cover.y_from_bottom_mm * mmToPt,
            width: cover.width_mm * mmToPt,
            height: cover.height_mm * mmToPt,
            color: PDFLib.rgb(1, 1, 1)
        });
        page.drawText(data.hotel, {
            x: hotelPosition.x_mm * mmToPt - font.widthOfTextAtSize(data.hotel, 9) / 2,
            y: hotelPosition.y_from_bottom_mm * mmToPt,
            size: 9,
            font
        });

        const crop = manual.pageCrop;
        page.setMediaBox(
            crop.x_mm * mmToPt,
            crop.y_from_bottom_mm * mmToPt,
            crop.width_mm * mmToPt,
            crop.height_mm * mmToPt
        );

        return pdfDocument.save();
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        setStatus("Generando voucher...");

        try {
            const values = Object.fromEntries(new FormData(form));
            const data = validateInput(values);
            const positions = await loadJson(positionsUrl);
            const pdfBytes = await generatePdf(data, positions);
            const filename = `voucher_balneario_${data.dni}_${values.fecha}.pdf`;
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
            setStatus(`Voucher generado: ${filename}`);
        } catch (error) {
            setStatus(error.message, true);
        }
    });
})();