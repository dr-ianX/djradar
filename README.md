# DJ Radar · Los Cabos

Mapa interactivo en tiempo real que muestra DJs activos en Los Cabos, Baja California Sur.

## 🎯 Características

- **Mapa interactivo** con Leaflet.js
- **Datos en tiempo real** desde Google Sheets
- **Filtros** para ver todos los DJs o solo los que están en vivo
- **Diseño responsive** para móvil y desktop
- **Actualización automática** cada 60 segundos
- **Indicadores visuales** de DJs activos con animaciones

## 🚀 Despliegue en Render

### 1. Preparar Google Sheet

Crea una hoja de Google Sheets con las siguientes columnas (nombres flexibles):
- `DJ` o `Artista` o `Nombre`
- `Venue` o `Lugar` o `Club`
- `Fecha` (formato: YYYY-MM-DD)
- `Hora_inicio` (formato: HH:MM)
- `Hora_fin` (formato: HH:MM)
- `Latitud` (coordenadas decimales)
- `Longitud` (coordenadas decimales)
- `Estilo` o `Género` (opcional)

### 2. Obtener URL CSV

1. Ve a Archivo → Compartir → Publicar en la web
2. Selecciona "Hoja de cálculo completa"
3. Formato: Valores separados por comas (.csv)
4. Copia la URL generada

### 3. Configurar en Render

1. Crea un nuevo **Web Service** en Render
2. Selecciona **Node.js** como entorno
3. Conecta este repositorio de GitHub
4. En **Build & Deploy**, configura:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Agrega variable de entorno:
   - **Key**: `SHEET_URL`
   - **Value**: [Tu URL CSV de Google Sheets]

### 4. Arquitectura de Seguridad

La aplicación usa un backend Express simple que:
- Sirve el HTML estático
- Inyecta la variable de entorno `SHEET_URL` dinámicamente
- Reemplaza el placeholder `__SHEET_URL__` con la URL real
- Mantiene la URL segura fuera del código fuente público


## 🎨 Tecnologías

- **HTML5** - Estructura
- **CSS3** - Estilos (personalizado)
- **JavaScript (Vanilla)** - Lógica frontend
- **Express.js** - Backend simple para inyección de variables
- **Leaflet.js** - Mapas
- **CARTO Dark** - Tiles del mapa
- **Font Awesome** - Iconos
- **Google Fonts** - Orbitron, Rajdhani

## 📝 Estructura del Proyecto

```
DJRadar/
├── index.html          # Aplicación completa (HTML + CSS + JS)
├── server.js           # Backend Express para inyección de variables
├── package.json        # Dependencias y scripts de Node.js
├── render.yaml         # Configuración de despliegue en Render
└── README.md           # Este archivo
```

## 🔧 Personalización

### Cambiar ubicación del mapa

Edita las líneas 382-384 en `index.html`:
```javascript
const CENTER_LAT = 22.8800;  // Latitud de Los Cabos
const CENTER_LNG = -109.9120; // Longitud de Los Cabos
const ZOOM_LEVEL = 13;
```

### Cambiar colores

El tema usa principalmente:
- `#00d4ff` - Cian (acentos)
- `#ff00aa` - Magenta (secundario)
- `#00ffaa` - Verde (indicadores activos)
- `#0a0a0a` - Negro (fondo)

## 🚧 Próximas Funcionalidades (Roadmap)

- [ ] Sistema de suscripciones para DJs
- [ ] Sistema de suscripciones para venues
- [ ] Sistema de suscripciones para asistentes
- [ ] Autenticación de usuarios
- [ ] Backend con base de datos
- [ ] Panel de administración
- [ ] Notificaciones push
- [ ] Integración con redes sociales

