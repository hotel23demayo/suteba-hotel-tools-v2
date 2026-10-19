#!/usr/bin/env python3
"""
Script para completar el PDF original (1fichaPax.pdf) con los datos de los pasajeros
sin modificar el diseño existente, solo sobrepone texto en las posiciones correctas.
"""

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from pypdf import PdfReader, PdfWriter
import io
import re
import os


def crear_overlay_datos(datos_titular, num_pasajeros, acompanantes=[], todas_habitaciones=[]):
    """
    Crea un PDF transparente con solo los datos para sobreponer en la plantilla.
    
    Args:
        datos_titular: dict con los datos del titular
        num_pasajeros: int con el total de personas
        acompanantes: list de dicts con los datos de los acompañantes
        todas_habitaciones: list con todos los números de habitación del grupo
    """
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=A4)
    width, height = A4
    
    # Configurar fuente
    c.setFont("Helvetica", 10)
    
    # Función auxiliar para validar y limpiar campos
    def limpiar_campo(valor):
        """Retorna el valor solo si es válido, sino retorna cadena vacía para dejarlo en blanco"""
        if not valor or valor.strip() == '' or valor == '0' or 'No informado' in str(valor):
            return ''
        return str(valor).strip()
    
    # ===== DATOS PERSONALES =====
    # Apellido y nombre
    y_nombre = height - 57 * mm
    c.drawString(70 * mm, y_nombre, datos_titular['Apellido y nombre'].upper())
    
    # Documento tipo y número
    y_doc = height - 65 * mm
    c.drawString(80 * mm, y_doc, f"{datos_titular['Tipo documento']}: {datos_titular['Nro. doc.']}")
    
    # Número de contacto
    y_contacto = height - 72 * mm
    telefono = limpiar_campo(datos_titular.get('Celular')) or limpiar_campo(datos_titular.get('Teléfono'))
    if telefono:
        c.drawString(80 * mm, y_contacto, telefono)
    
    # Email (solo si es válido)
    email = limpiar_campo(datos_titular.get('Email'))
    if email:
        c.drawString(130 * mm, y_contacto, email)
    
    # Seccional (quitar prefijo numérico "NN - ")
    y_seccional = height - 95 * mm
    sede_raw = datos_titular.get('Sede', '')
    sede_limpia = limpiar_campo(sede_raw)
    if sede_limpia:
        # Eliminar prefijo numérico con guión (por ejemplo "39 - CHIVILCOY" -> "CHIVILCOY")
        sede_limpia = re.sub(r'^\s*\d+\s*[-–—]\s*', '', sede_limpia)
        c.drawString(45 * mm, y_seccional, sede_limpia)
    
    # Fecha de nacimiento
    y_fechanac = height - 65 * mm
    c.drawString(162 * mm, y_fechanac, datos_titular['Fecha de nacimiento'])
    
    # ===== DATOS ACOMPAÑANTES =====
    # Llenar los datos de los acompañantes (máximo 3 líneas)
    y_acomp_inicial = height - 115 * mm  # Posición aproximada de la primera línea de acompañantes
    espaciado = 7 * mm  # Espacio entre líneas
    
    c.setFont("Helvetica", 9)
    for idx, acomp in enumerate(acompanantes[:3]):  # Máximo 3 acompañantes
        y_linea = y_acomp_inicial - (idx * espaciado)
        
        # Nombre del acompañante
        c.drawString(45 * mm, y_linea, acomp['Apellido y nombre'].upper())
        
        # Documento del acompañante
        doc_acomp = f"{acomp['Tipo documento']}: {acomp['Nro. doc.']}"
        c.drawString(105 * mm, y_linea, doc_acomp)
    
    # ===== ALOJAMIENTO =====
    c.setFont("Helvetica", 10)
    
    # Número de habitación (mostrar todas las habitaciones del grupo si hay más de una)
    y_habitacion = height - 187 * mm
    if todas_habitaciones and len(todas_habitaciones) > 1:
        # Ordenar habitaciones y formatear
        habitaciones_texto = ", ".join(sorted(set(todas_habitaciones)))
        c.drawString(110 * mm, y_habitacion, habitaciones_texto)
    else:
        # Solo una habitación
        c.drawString(110 * mm, y_habitacion, datos_titular['Nro. habitación'])
    
    # Fecha de ingreso
    y_ingreso = height - 173 * mm
    c.drawString(75 * mm, y_ingreso, datos_titular['Fecha de ingreso'])
    
    # Fecha de egreso
    c.drawString(142 * mm, y_ingreso, datos_titular['Fecha de egreso'])
    
    # ===== SERVICIOS =====
    # Marcar checkbox según el servicio
    servicios = datos_titular.get('Servicios', '').upper()
    y_servicios = height - 198 * mm
    
    if 'DESAYUNO' in servicios and 'MEDIA' not in servicios:
        c.drawString(75 * mm, y_servicios, "X")  # Desayuno
    elif 'MEDIA' in servicios:
        c.drawString(113 * mm, y_servicios, "X")  # Media pensión
    elif 'COMPLETA' in servicios or 'PENSION' in servicios:
        c.drawString(140 * mm, y_servicios, "X")  # Pensión completa
    
    # Número de voucher
    y_voucher = height - 40 * mm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(80 * mm, y_voucher, datos_titular['Voucher'])
    
    c.save()
    packet.seek(0)
    return packet


def generar_ficha_sobre_original(datos_titular, num_pasajeros, nombre_salida, acompanantes=[], todas_habitaciones=[]):
    """
    Genera una ficha sobreponiéndole los datos al PDF original.
    
    Args:
        datos_titular: dict con los datos del titular
        num_pasajeros: int con el total de personas
        nombre_salida: str con la ruta del archivo de salida
        acompanantes: list de dicts con los datos de los acompañantes
        todas_habitaciones: list con todos los números de habitación del grupo
    """
    try:
        # Leer el PDF original (ruta relativa al script)
        pdf_path = os.path.join(os.path.dirname(__file__), "1fichaPax.pdf")
        pdf_original = PdfReader(pdf_path)
        
        # Crear overlay con los datos
        overlay_packet = crear_overlay_datos(datos_titular, num_pasajeros, acompanantes, todas_habitaciones)
        overlay_pdf = PdfReader(overlay_packet)
        
        # Crear writer
        output = PdfWriter()
        
        # Obtener la página original
        page = pdf_original.pages[0]
        
        # Superponer los datos
        page.merge_page(overlay_pdf.pages[0])
        
        # Agregar la página al output
        output.add_page(page)
        
        # Guardar
        with open(nombre_salida, "wb") as output_file:
            output.write(output_file)
        
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    # Prueba con datos de ejemplo
    datos_ejemplo = {
        'Apellido y nombre': 'BROVIA MARCELO',
        'Tipo documento': 'DNI',
        'Nro. doc.': '27759476',
        'Fecha de nacimiento': '10/02/1980',
        'Email': 'romassafra@gmail.com',
        'Teléfono': '2346 52-3456',
        'Celular': '',
        'Sede': '39 - CHIVILCOY',
        'Nro. habitación': '114',
        'Fecha de ingreso': '26/12/2025',
        'Fecha de egreso': '01/01/2026',
        'Servicios': 'MEDIA PENSIÓN',
        'Voucher': '39001277'
    }
    
    # Acompañantes de ejemplo (familia Brovia)
    acompanantes_ejemplo = [
        {
            'Apellido y nombre': 'RAMOS MARIA JOSE',
            'Tipo documento': 'DNI',
            'Nro. doc.': '30753607'
        },
        {
            'Apellido y nombre': 'BROVIA JUANITA',
            'Tipo documento': 'DNI',
            'Nro. doc.': '50721556'
        },
        {
            'Apellido y nombre': 'BROVIA RENATA',
            'Tipo documento': 'DNI',
            'Nro. doc.': '53511166'
        }
    ]
    
    # Habitaciones (familia Brovia tiene 114 y 116)
    habitaciones_ejemplo = ['114', '116']
    
    ok = generar_ficha_sobre_original(datos_ejemplo, 5, "test_overlay.pdf", acompanantes_ejemplo, habitaciones_ejemplo)
    if ok:
        print("✅ Ficha de prueba generada: test_overlay.pdf")
    else:
        print("✗ No se generó el PDF de prueba (falta 1fichaPax.pdf o hubo un error)")
