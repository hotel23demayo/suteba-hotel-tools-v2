(() => {
    const form = document.getElementById("mealVoucherForm");
    const status = document.getElementById("status");
    const mmToPt = 72 / 25.4;
    const templateUrl = "../python/mealVoucher/VOUCHER_DE_COMIDAS_DIARIO.pdf";
    const positionsUrl = "../python/mealVoucher/positions.json";

    document.getElementById("fecha").value = new Date()
        .toISOString()
        .slice(0, 10);

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

        if (!nombre) errors.push("completa el apellido y nombre");
        if (!["23 DE MAYO", "31 DE AGOSTO"].includes(hotel)) errors.push("selecciona un hotel valido");
        if (!/^\d+$/.test(dni)) errors.push("el DNI debe ser numerico");
        if (!values.fecha) errors.push("selecciona una fecha");
        if (!habitacion) errors.push("completa la habitacion");
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
            fecha: formatDate(values.fecha),
            habitacion,
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
        const fields = positions.fields;

        for (const [fieldName, value] of Object.entries(data)) {
            const position = fields[fieldName];
            if (!position || position.x_mm === null || position.y_top_mm === null) {
                throw new Error(`No hay posicion calibrada para ${fieldName}.`);
            }

            const text = String(value);
            const fontSize = 10;
            const textWidth = font.widthOfTextAtSize(text, fontSize);
            const x = position.align === "center"
                ? position.x_mm * mmToPt - textWidth / 2
                : position.x_mm * mmToPt;

            page.drawText(text, {
                x,
                y: page.getHeight() - position.y_top_mm * mmToPt,
                size: fontSize,
                font
            });
        }

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
            const filename = `voucher_cena_${data.dni}_${values.fecha}.pdf`;
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
