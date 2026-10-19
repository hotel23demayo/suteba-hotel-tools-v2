import csv
import os
from collections import defaultdict
from datetime import datetime


# Configuración
CSV_DATOS = 'consultaRegimenReport.csv'  # Usuario debe proporcionar su propio archivo CSV


def agrupar_por_voucher(csv_path):
    """
    Agrupa los registros por número de voucher y retorna un diccionario
    donde cada voucher contiene una lista de todos los pasajeros asociados.
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
    
    Returns:
        tuple: (titular, lista_acompanantes)
    """
    # Ordenar por edad de forma descendente
    pasajeros_ordenados = sorted(pasajeros, key=lambda x: int(x['Edad']), reverse=True)
    titular = pasajeros_ordenados[0]
    
    # Los acompañantes son todos excepto el titular
    acompanantes = [p for p in pasajeros_ordenados[1:]]
    
    return titular, acompanantes


def llenar_pdf(datos_titular, num_pasajeros, acompanantes=[], todas_habitaciones=[]):
    """
    Genera un PDF con los datos del titular del voucher usando el PDF original.
    """
    from generar_con_overlay import generar_ficha_sobre_original
    
    voucher = datos_titular['Voucher']
    # Nombre del archivo de salida basado en voucher
    nombre_salida = f"fichas/ficha_voucher_{voucher}.pdf"
    
    try:
        # Generar la ficha sobreponiéndole datos al PDF original
        ok = generar_ficha_sobre_original(datos_titular, num_pasajeros, nombre_salida, acompanantes, todas_habitaciones)
        if ok:
            return True
        else:
            print(f"Error: generar_ficha_sobre_original devolvió False para {nombre_salida}")
            return False
    except Exception as e:
        print(f"Error al generar PDF: {e}")
        return False


def main():
    # Crear carpeta de salida si no existe
    if not os.path.exists('fichas'):
        os.makedirs('fichas')
    
    print("=" * 60)
    print("Generador de Fichas de Pasajeros")
    print("=" * 60)
    
    # Agrupar pasajeros por voucher
    vouchers = agrupar_por_voucher(CSV_DATOS)
    
    print(f"\nTotal de vouchers encontrados: {len(vouchers)}")
    print("-" * 60)
    
    fichas_generadas = 0
    
    # Procesar cada voucher
    for voucher_num, pasajeros in vouchers.items():
        num_pasajeros = len(pasajeros)
        titular, acompanantes = obtener_titular_y_acompanantes(pasajeros)
        
        # Extraer todas las habitaciones únicas del grupo
        todas_habitaciones = list(set([p['Nro. habitación'] for p in pasajeros]))
        
        print(f"\nVoucher: {voucher_num}")
        print(f"  - Cantidad de pasajeros: {num_pasajeros}")
        print(f"  - Titular: {titular['Apellido y nombre']} (Edad: {titular['Edad']})")
        
        if len(todas_habitaciones) > 1:
            print(f"  - Habitaciones: {', '.join(sorted(todas_habitaciones))}")
        else:
            print(f"  - Habitación: {todas_habitaciones[0]}")
        
        if acompanantes:
            print(f"  - Acompañantes: {len(acompanantes)}")
            for acomp in acompanantes[:3]:  # Mostrar máximo 3
                print(f"    • {acomp['Apellido y nombre']} - DNI {acomp['Nro. doc.']}")
        
        # Generar la ficha para el titular con sus acompañantes y habitaciones
        if llenar_pdf(titular, num_pasajeros, acompanantes, todas_habitaciones):
            fichas_generadas += 1
            print(f"  ✓ Ficha generada: ficha_voucher_{voucher_num}.pdf")
        else:
            print(f"  ✗ Error al generar ficha")
    
    print("\n" + "=" * 60)
    print(f"Proceso completado: {fichas_generadas} fichas generadas")
    print("=" * 60)


if __name__ == "__main__":
    main()
