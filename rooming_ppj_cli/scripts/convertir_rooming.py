#!/usr/bin/env python3
"""Convierte roomings PPJ en Excel a un CSV de rooming compatible con LibreOffice.

El CSV generado es el informe de 14 columnas del módulo Rooming; NO es el CSV
operativo de 28+ columnas que consume parser.js para vouchers/ficha Pax.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import unicodedata
from collections import Counter
from datetime import date, datetime
from pathlib import Path

try:
    from openpyxl import load_workbook
except ImportError:
    print("Falta openpyxl. Instalar con: python -m pip install -r requirements.txt", file=sys.stderr)
    raise SystemExit(2)

HEADERS = [
    "Nro. habitación", "Fecha de ingreso", "Fecha de egreso", "Cantidad plazas",
    "Tipo documento", "Nro. doc.", "Apellido y nombre", "Edad", "Voucher",
    "Servicio", "Estado", "Paquete", "Sede", "Observación habitación",
]


def norm(value: object) -> str:
    text = "" if value is None else str(value).strip()
    return " ".join(text.split())


def parse_date(value: object, reference_year: int | None = None) -> date | None:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    text = norm(value)
    for fmt in ("%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            pass
    # Año de dos cifras: con ingreso 2026, 00..26 => 2000..2026 y 27..99 => 1927..1999.
    for sep in ("/", "-"):
        parts = text.split(sep)
        if len(parts) == 3 and len(parts[2]) == 2 and all(p.isdigit() for p in parts):
            day, month, yy = map(int, parts)
            try:
                century = 2000 if reference_year is not None and yy <= reference_year % 100 else 1900
                return date(century + yy, month, day)
            except ValueError:
                return None
    return None


def parse_filename(path: Path, year: int) -> tuple[date | None, str | None]:
    # Ejemplo: PPJ MDP 05_11 MATANZA.xlsx
    clean_name = re.sub(r"\s*\(\d+\)(?=\.xlsx?$)", "", path.name, flags=re.I)
    match = re.search(r"(?:^|\s)(\d{1,2})[_-](\d{1,2})(?:\s+(.+?))?\.xlsx?$", clean_name, re.I)
    if not match:
        return None, None
    day, month = int(match.group(1)), int(match.group(2))
    try:
        incoming = date(year, month, day)
    except ValueError:
        return None, None
    sede = match.group(3).strip(" _-") if match.group(3) else None
    return incoming, sede.upper() if sede else None


def parse_room(value: object) -> tuple[str, str, str]:
    raw = norm(value)
    # Captura: "101 A - DOBLE A COMPARTIR" o "101 - DOBLE MATRIMONIAL"
    match = re.match(r"^(\d+)\s*([A-Z])?\s*(?:[-–—]\s*)?(.*)$", raw, re.I)
    if not match:
        return raw, "", ""
    number, assignment, room_type = match.groups()
    return number, (assignment or "").upper(), norm(room_type).upper()


def capacity(room_type: str) -> str:
    t = normalize_text(room_type)
    if "TRIPLE" in t:
        return "3"
    if "DOBLE" in t or "DBL" in t:
        return "2"
    return ""


def normalize_text(text: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", text.upper()) if unicodedata.category(c) != "Mn")


def age_on(birth: date | None, reference: date) -> str:
    if birth is None:
        return ""
    return str(reference.year - birth.year - ((reference.month, reference.day) < (birth.month, birth.day)))


def load_sigs_vouchers(path: Path | None) -> tuple[dict[str, str], list[str]]:
    """Lee SIGS por DNI; no modifica las habitaciones del Excel."""
    if path is None:
        return {}, []
    if not path.is_file():
        raise ValueError(f"No existe el listado SIGS: {path}")
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        sample = f.read(4096)
        f.seek(0)
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\\t")
        except csv.Error:
            dialect = csv.excel
        reader = csv.DictReader(f, dialect=dialect)
        if not reader.fieldnames or not {"Nro. doc.", "Voucher"}.issubset(set(reader.fieldnames)):
            raise ValueError("El CSV SIGS debe contener 'Nro. doc.' y 'Voucher'.")
        by_dni: dict[str, set[str]] = {}
        for row in reader:
            dni, voucher = norm(row.get("Nro. doc.")), norm(row.get("Voucher"))
            if dni and voucher:
                by_dni.setdefault(dni, set()).add(voucher)
    ambiguous = [dni for dni, values in by_dni.items() if len(values) > 1]
    mapping = {dni: next(iter(values)) for dni, values in by_dni.items() if len(values) == 1}
    warnings = [f"DNI {dni}: más de un voucher en SIGS; queda sin asignar" for dni in ambiguous]
    return mapping, warnings


def read_rows(xlsx: Path, sheet_name: str, incoming: date, nights: int, hotel: str, service: str,
              package: str, state: str, transport: str, sede_override: str | None,
              voucher_map: dict[str, str]):
    wb = load_workbook(xlsx, data_only=True, read_only=True)
    if sheet_name not in wb.sheetnames:
        raise ValueError(f"No existe la hoja '{sheet_name}'. Hojas disponibles: {', '.join(wb.sheetnames)}")
    ws = wb[sheet_name]
    header_row = None
    headers = {}
    for row_num, row in enumerate(ws.iter_rows(min_row=1, max_row=15, values_only=True), start=1):
        labels = {norm(v).casefold(): i for i, v in enumerate(row) if v is not None}
        if "habitacion" in labels and "dni" in labels and "nombre y apellido" in labels:
            header_row, headers = row_num, labels
            break
    if header_row is None:
        raise ValueError("No pude localizar los encabezados Habitacion, DNI y Nombre y Apellido.")

    def get(row, label):
        idx = headers.get(label.casefold())
        return row[idx] if idx is not None and idx < len(row) else None

    checkout = date.fromordinal(incoming.toordinal() + nights)
    output, enriched, errors = [], [], []
    seen_dni = Counter()
    for excel_row, row in enumerate(ws.iter_rows(min_row=header_row + 1, values_only=True), start=header_row + 1):
        if not any(v is not None and norm(v) for v in row):
            continue
        dni = norm(get(row, "DNI"))
        name = norm(get(row, "Nombre y Apellido")).upper()
        room_raw = get(row, "Habitacion")
        if not dni and not name and not norm(room_raw):
            continue
        room, assignment, room_type = parse_room(room_raw)
        birth = parse_date(get(row, "Fecha nac."), incoming.year)
        cuil = norm(get(row, "CUIL"))
        phone = norm(get(row, "Celular"))
        coverage = norm(get(row, "N° IOMA"))
        regime = norm(get(row, "Regimen (Celiaco / Vegetariano/Diabético)"))
        relation = norm(get(row, "Afiliado o Acompañante"))
        row_errors = []
        if not dni: row_errors.append("DNI vacío")
        if not name: row_errors.append("nombre vacío")
        if not room: row_errors.append("habitación no reconocida")
        if not birth: row_errors.append("fecha de nacimiento ausente o inválida")
        elif birth > incoming: row_errors.append("fecha de nacimiento posterior al ingreso; revisar")
        voucher = voucher_map.get(dni, "") if dni else ""
        if not voucher: row_errors.append("voucher no encontrado en SIGS")
        if dni:
            seen_dni[dni] += 1
        observation = " | ".join(x for x in [assignment, relation, f"COBERTURA: {coverage}" if coverage else "",
                                                   f"CUIL: {cuil}" if cuil else "", f"TEL: {phone}" if phone else "",
                                                   f"REGIMEN: {regime}" if regime else ""] if x)
        output.append({
            "Nro. habitación": room,
            "Fecha de ingreso": incoming.strftime("%d/%m/%Y"),
            "Fecha de egreso": checkout.strftime("%d/%m/%Y"),
            "Cantidad plazas": capacity(room_type),
            "Tipo documento": "DNI",
            "Nro. doc.": dni,
            "Apellido y nombre": name,
            "Edad": age_on(birth, incoming),
            "Voucher": voucher,
            "Servicio": service,
            "Estado": state,
            "Paquete": package,
            "Sede": sede_override or "",
            "Observación habitación": observation,
        })
        enriched.append({
            "fila_excel": excel_row, "habitacion_original": norm(room_raw), "habitacion": room,
            "asignacion": assignment, "tipo_habitacion": room_type, "dni": dni,
            "nombre": name, "fecha_nacimiento": birth.isoformat() if birth else None,
            "edad_al_ingreso": age_on(birth, incoming), "afiliado_o_acompanante": relation,
            "cobertura": coverage, "cuil": cuil, "celular": phone,
            "regimen_alimentario": regime, "hotel": hotel, "fecha_ingreso": incoming.isoformat(),
            "fecha_egreso": checkout.isoformat(), "noches": nights, "servicio": service,
            "paquete": package, "estado": state, "transporte": transport,
            "voucher": voucher or None, "errores": row_errors,
        })
        if row_errors:
            errors.append(f"Fila {excel_row}: {', '.join(row_errors)}")

    duplicates = [dni for dni, count in seen_dni.items() if count > 1]
    for dni in duplicates:
        errors.append(f"DNI duplicado ({dni}): {seen_dni[dni]} apariciones")
    wb.close()
    return output, enriched, errors, checkout


def main():
    parser = argparse.ArgumentParser(description="Convierte un Excel de contingente PPJ a CSV de rooming.")
    parser.add_argument("archivo", type=Path, help="Ruta del archivo .xlsx")
    parser.add_argument("--fecha-ingreso", help="Fecha dd/mm/aaaa; si se omite, se intenta leer del nombre")
    parser.add_argument("--noches", type=int, default=3)
    parser.add_argument("--anio", type=int, default=2026)
    parser.add_argument("--hotel", default="HOTEL 23 DE MAYO")
    parser.add_argument("--servicio", default="PC")
    parser.add_argument("--paquete", default="PPJ")
    parser.add_argument("--estado", default="O")
    parser.add_argument("--transporte", default="BUS")
    parser.add_argument("--sede", help="Sobrescribe la sede detectada en el nombre")
    parser.add_argument("--sigs", type=Path, help="CSV oficial de SIGS para completar vouchers por DNI")
    parser.add_argument("--hoja", default="ROOMING")
    parser.add_argument("--salida", type=Path, default=Path("salida"))
    parser.add_argument("--si", action="store_true", help="No solicitar confirmación interactiva")
    args = parser.parse_args()

    if not args.archivo.is_file():
        parser.error(f"No existe el archivo: {args.archivo}")
    if args.archivo.suffix.lower() not in (".xlsx", ".xlsm"):
        parser.error("El archivo debe ser .xlsx o .xlsm")
    if args.noches < 1:
        parser.error("--noches debe ser mayor que cero")

    inferred_date, inferred_sede = parse_filename(args.archivo, args.anio)
    incoming = parse_date(args.fecha_ingreso) if args.fecha_ingreso else inferred_date
    if not incoming:
        parser.error("No pude determinar la fecha. Indicá --fecha-ingreso dd/mm/aaaa")
    sede = (args.sede or inferred_sede or "").upper()
    if not sede:
        parser.error("No pude determinar la sede. Indicá --sede")

    voucher_map, sigs_warnings = load_sigs_vouchers(args.sigs)
    rows, enriched, errors, checkout = read_rows(args.archivo, args.hoja, incoming, args.noches,
                                                  args.hotel, args.servicio, args.paquete,
                                                  args.estado, args.transporte, sede, voucher_map)
    errors.extend(sigs_warnings)
    rooms = len({r["Nro. habitación"] for r in rows})
    print("\n========== CONVERSOR DE ROOMING PPJ ==========")
    print(f"Archivo:       {args.archivo.name}")
    print(f"Hoja:          {args.hoja}")
    print(f"Hotel:         {args.hotel}")
    print(f"Sede:          {sede}")
    print(f"Ingreso:       {incoming:%d/%m/%Y}")
    print(f"Egreso:        {checkout:%d/%m/%Y}")
    print(f"Noches:        {args.noches}")
    print(f"Pasajeros:     {len(rows)}")
    print(f"Habitaciones:  {rooms}")
    print(f"Servicio:      {args.servicio}")
    print(f"Paquete:       {args.paquete}")
    print(f"Estado:        {args.estado}")
    print(f"Transporte:    {args.transporte}")
    missing_vouchers = sum(1 for r in rows if not r["Voucher"])
    print(f"Vouchers SIGS: {len(rows) - missing_vouchers} asignados")
    print(f"Sin voucher:   {missing_vouchers}")
    if args.sigs:
        print(f"SIGS:          {args.sigs.name}")
    print("\nVouchers asignados por coincidencia exacta de DNI.")
    print("Se conserva la cantidad de pasajeros, las edades y la distribución de habitaciones del Excel.")
    print("Las habitaciones de SIGS NO reemplazan las del Excel; se revisarán las asignaciones del hotel.")
    print("ADVERTENCIA: el CSV será el informe de rooming de 14 columnas; no es el CSV 28+ campos del parser de vouchers/ficha Pax.")
    if errors:
        print(f"\nObservaciones: {len(errors)}")
        for item in errors[:20]: print(f"  - {item}")
        if len(errors) > 20: print(f"  ... y {len(errors)-20} más")

    if not args.si:
        answer = input("\n¿Confirmar generación? [s/N]: ").strip().lower()
        if answer not in ("s", "si", "sí", "y", "yes"):
            print("Cancelado. No se generaron archivos.")
            return 1

    args.salida.mkdir(parents=True, exist_ok=True)
    slug = re.sub(r"[^a-z0-9]+", "_", sede.lower()).strip("_")
    stem = f"rooming_{slug}_{incoming:%Y%m%d}"
    csv_path = args.salida / f"{stem}.csv"
    json_path = args.salida / f"{stem}_completo.json"
    report_path = args.salida / f"{stem}_validacion.txt"
    with csv_path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=HEADERS, delimiter=";", extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    json_path.write_text(json.dumps(enriched, ensure_ascii=False, indent=2), encoding="utf-8")
    report = [f"Archivo: {args.archivo.name}", f"SIGS: {args.sigs.name if args.sigs else 'no indicado'}",
              f"Pasajeros: {len(rows)}", f"Vouchers asignados: {len(rows)-missing_vouchers}",
              f"Sin voucher: {missing_vouchers}", f"Habitaciones: {rooms}",
              f"Ingreso: {incoming:%d/%m/%Y}", f"Egreso: {checkout:%d/%m/%Y}",
              f"Observaciones: {len(errors)}", *errors]
    report_path.write_text("\n".join(report) + "\n", encoding="utf-8")
    print("\nArchivos generados:")
    print(f"  CSV:       {csv_path}")
    print(f"  JSON:      {json_path}")
    print(f"  Validación:{report_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
