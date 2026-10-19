const fs = require("fs");
const path = require("path");

const {
    parseCSV
} = require("../../src/parser/csvParser");

const {
    processReservations
} = require("../../src/business/processReservations");


function assert(condition, message) {

    if (!condition) {
        throw new Error(`TEST FALLIDO: ${message}`);
    }
}


console.log(
    "\n=== Integracion CSV -> reservas procesadas ===\n"
);


const csvPath = path.join(
    __dirname,
    "../../lanus.csv"
);

const csv = fs.readFileSync(csvPath, "utf8");
const records = parseCSV(csv);
const reservas = processReservations(records);


assert(
    records.length === 47,
    "lanus.csv deberia producir 47 registros"
);

assert(
    reservas.length === 36,
    "lanus.csv deberia producir 36 reservas"
);

assert(
    reservas.every(reserva =>
        Array.isArray(reserva.habitaciones) &&
        reserva.habitaciones.length > 0
    ),
    "Cada reserva deberia conservar al menos una habitacion"
);

assert(
    reservas[0].voucher === "30243127",
    "La primera reserva deberia conservar su voucher"
);

assert(
    reservas[0].cantidadPasajeros === 1,
    "La primera reserva deberia conservar su cantidad de pasajeros"
);

assert(
    reservas[0].habitaciones[0].numero === "227",
    "La primera reserva deberia conservar su habitacion"
);


console.log(
    "OK CSV procesado y convertido en reservas"
);
