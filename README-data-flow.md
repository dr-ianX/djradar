# Flujo recomendado para administrar DJs

## Opción simple y profesional

1. Crea un formulario de Google Forms con estos campos:
   - Nombre del DJ
   - Venue / lugar
   - Fecha
   - Hora inicio
   - Hora fin
   - Lugar o dirección
   - Estilo
   - Link de Google Maps (opcional)
   - Correo de contacto

2. Conecta el formulario a una Hoja de Google Sheets.

3. Cada vez que alguien envíe una solicitud, tú la revisas.

4. Si la apruebas, copias la fila a un archivo JSON del proyecto o a una base de datos simple.

## Opción más simple todavía

Si quieres algo muy rápido, puedes:
- usar Google Forms para recibir solicitudes
- revisar las respuestas manualmente
- copiar las aprobadas a data.json

## Estructura esperada en data.json

[
  {
    "name": "DJ Example",
    "venue": "Venue Name",
    "date": "2026-06-27",
    "start": "22:00",
    "end": "03:00",
    "place": "Cabo San Lucas, Baja California Sur",
    "style": "House"
  }
]
