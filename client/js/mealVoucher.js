(() => {
    const form = document.getElementById("mealVoucherForm");
    const status = document.getElementById("status");

    const templateUrl =
        "../python/mealVoucher/VOUCHER_DE_COMIDAS_DIARIO_NUEVO.pdf";
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

        if (!["23 DE MAYO", "31 DE AGOSTO"].includes(hotel)) {
            errors.push("selecciona un hotel valido");
        }

        if (!/^\d+$/.test(dni)) {
            errors.push("el DNI debe ser numerico");
        }

        if (!values.fecha) {
            errors.push("selecciona una fecha");
        }

        if (!habitacion) {
            errors.push("completa la habitacion");
        }

        if (!Number.isInteger(cantidadPersonas) || cantidadPersonas <= 0) {
            errors.push("la cantidad debe ser un entero mayor que cero");
        }

        if (errors.length) {
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
        if (!response.ok) {
            throw new Error(`No se pudo cargar ${url}.`);
        }
        return response.json();
    }

    async function generatePdf(data, positions) {
        const response = await fetch(templateUrl);

        if (!response.ok) {
            throw new Error("No se pudo cargar la nueva plantilla PDF.");
        }

        const templateBytes = await response.arrayBuffer();
        const pdfDocument = await PDFLib.PDFDocument.load(templateBytes);

        if (pdfDocument.getPageCount() < 1) {
            throw new Error("La plantilla no contiene páginas.");
        }

        const page = pdfDocument.getPages()[0];
        const font = await pdfDocument.embedFont(
            PDFLib.StandardFonts.Helvetica
        );
        const fields = positions.fields;

        // Ocultar el hotel preimpreso sin tapar los bordes de su caja.
        const cover = positions.hotelCover;
        page.drawRectangle({
            x: cover.x,
            y: cover.y,
            width: cover.width,
            height: cover.height,
            color: PDFLib.rgb(1, 1, 1),
            borderWidth: 0
        });

        for (const [fieldName, value] of Object.entries(data)) {
            const position = fields[fieldName];

            if (!position) {
                throw new Error(
                    `No hay posicion configurada para ${fieldName}.`
                );
            }

            const text = String(value);
            let fontSize = position.fontSize || 9;
            let x;
            const y = position.y;

            if (fieldName === "hotel") {
                const center = (position.x1 + position.x2) / 2;
                const availableWidth = position.x2 - position.x1 - 8;
                const textWidth = font.widthOfTextAtSize(text, fontSize);

                if (textWidth > availableWidth) {
                    fontSize *= availableWidth / textWidth;
                }

                x = center - font.widthOfTextAtSize(text, fontSize) / 2;
            } else if (position.align === "center") {
                x = position.x -
                    font.widthOfTextAtSize(text, fontSize) / 2;
            } else {
                x = position.x;

                if (position.maxWidth) {
                    const textWidth =
                        font.widthOfTextAtSize(text, fontSize);

                    if (textWidth > position.maxWidth) {
                        fontSize *= position.maxWidth / textWidth;
                    }
                }
            }

            page.drawText(text, {
                x,
                y,
                size: fontSize,
                font,
                color: PDFLib.rgb(0, 0, 0)
            });
        }

        // Recortar después de dibujar: las posiciones siguen siendo
        // las coordenadas originales de la plantilla A4.
        const crop = positions.crop;

        page.setMediaBox(
            crop.x,
            crop.y,
            crop.width,
            crop.height
        );

        page.setCropBox(
            crop.x,
            crop.y,
            crop.width,
            crop.height
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

            const filename =
                `voucher_cena_${data.dni}_${values.fecha}.pdf`;

            const blob = new Blob([pdfBytes], {
                type: "application/pdf"
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = filename;
            link.click();

            setTimeout(() => URL.revokeObjectURL(url), 1000);

            setStatus(`Voucher generado: ${filename}`);
        } catch (error) {
            console.error("Error al generar el voucher:", error);
            setStatus(error.message, true);
        }
    });
})();
