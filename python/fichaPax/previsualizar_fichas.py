import csv
from collections import defaultdict
import json

# Configuración
CSV_DATOS = 'ingresos26_12.csv'


def agrupar_por_voucher(csv_path):
    """
    Agrupa los registros por número de voucher.
    """
    vouchers = defaultdict(list)
    
    with open(csv_path, mode='r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for fila in reader:
            voucher_num = fila['Voucher']
            vouchers[voucher_num].append(fila)
    
    return vouchers


def obtener_titular_y_acompanantes(pasajeros):
    """
    Selecciona el titular del grupo (persona de mayor edad) y retorna
    también la lista de acompañantes.
    """
    pasajeros_ordenados = sorted(pasajeros, key=lambda x: int(x['Edad']), reverse=True)
    titular = pasajeros_ordenados[0]
    acompanantes = [p for p in pasajeros_ordenados[1:]]
    return titular, acompanantes


def main():
    print("=" * 80)
    print("PREVISUALIZACIÓN DE DATOS - Fichas por Voucher")
    print("=" * 80)
    
    # Agrupar pasajeros por voucher
    vouchers = agrupar_por_voucher(CSV_DATOS)
    
    print(f"\nTotal de vouchers: {len(vouchers)}")
    print(f"Total de fichas a generar: {len(vouchers)}\n")
    
    for idx, (voucher_num, pasajeros) in enumerate(vouchers.items(), 1):
        num_pasajeros = len(pasajeros)
        titular, acompanantes = obtener_titular_y_acompanantes(pasajeros)
        
        print(f"\n{'─' * 80}")
        print(f"FICHA #{idx} - VOUCHER: {voucher_num}")
        print(f"{'─' * 80}")
        
        # Función para limpiar campos
        def mostrar_campo(valor):
            if not valor or valor == '0' or 'No informado' in str(valor):
                return '[EN BLANCO - a completar]'
            return valor
        
        # Datos que se rellenarán en el PDF
        datos_ficha = {
            'Nombre': titular['Apellido y nombre'],
            'DNI': titular['Nro. doc.'],
            'Tipo_doc': titular['Tipo documento'],
            'Edad': titular['Edad'],
            'Fecha_nac': titular['Fecha de nacimiento'],
            'Habitación': titular['Nro. habitación'],
            'Tipo_hab': titular['Tipo habitación'],
            'Voucher': titular['Voucher'],
            'Check-in': titular['Fecha de ingreso'],
            'Check-out': titular['Fecha de egreso'],
            'Sede': titular['Sede'],
            'Email': mostrar_campo(titular['Email']),
            'Teléfono': mostrar_campo(titular['Teléfono']),
            'Celular': mostrar_campo(titular['Celular']),
            'Entidad': titular['Entidad'],
            'Paquete': titular['Paquete'],
            'Nº Pasajeros': str(num_pasajeros)
        }
        
        # Mostrar datos del titular
        print("\n📋 DATOS DEL TITULAR (persona de mayor edad):")
        for campo, valor in datos_ficha.items():
            print(f"  {campo:.<20} {valor}")
        
        # Mostrar acompañantes que irán en la ficha
        if acompanantes:
            print(f"\n👥 ACOMPAÑANTES (se incluirán en la ficha):")
            for i, acomp in enumerate(acompanantes[:3], 1):  # Máximo 3
                print(f"  {i}. {acomp['Apellido y nombre']} - DNI {acomp['Nro. doc.']}")
            if len(acompanantes) > 3:
                print(f"  ⚠️  Nota: Hay {len(acompanantes) - 3} acompañante(s) más que no caben en la ficha")
        
        # Mostrar todos los pasajeros del grupo
        if num_pasajeros > 1:
            print(f"\n📝 GRUPO COMPLETO ({num_pasajeros} personas):")
            for i, pasajero in enumerate(pasajeros, 1):
                print(f"  {i}. {pasajero['Apellido y nombre']} - {pasajero['Edad']} años - DNI {pasajero['Nro. doc.']}")
    
    print(f"\n{'═' * 80}")
    print(f"✅ Se generarán {len(vouchers)} fichas PDF (una por voucher)")
    print(f"{'═' * 80}\n")


if __name__ == "__main__":
    main()
