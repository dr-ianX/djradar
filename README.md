# DJ Radar · Los Cabos

Mapa interactivo en tiempo real que muestra DJs activos en Los Cabos, Baja California Sur, con funcionalidades comunitarias como seguimiento, reseñas y chat.

## 🎯 Características

### Core
- **Mapa interactivo** con Leaflet.js
- **Datos en tiempo real** desde Google Sheets
- **Filtros** para ver todos los DJs, solo activos, o favoritos
- **Diseño responsive** para móvil y desktop
- **Actualización automática** cada 60 segundos
- **Indicadores visuales** de DJs activos con animaciones

### Funcionalidades Comunitarias
- **Seguimiento de DJs y Venues**: Guarda tus DJs y venues favoritos con un botón ⭐
- **Persistencia Local**: Todo se guarda en localStorage (sin necesidad de login)
- **Sistema de Reseñas**: Deja reseñas cortas con emojis para cada evento
- **Chat por Evento**: Chatea con otros asistentes en tiempo real durante eventos
- **Panel de Admin**: Gestiona aprobaciones, overrides y moderación


### Arquitectura de Seguridad

La aplicación usa un backend Express simple que:
- Sirve el HTML estático
- Inyecta la variable de entorno `SHEET_URL` dinámicamente
- Mantiene la URL segura fuera del código fuente público
- Almacena reseñas y chats en archivos JSON locales
- Sistema de autenticación simple para admin vía `ADMIN_PASS`


## 🎨 Tecnologías

- **HTML5** - Estructura
- **CSS3** - Estilos (personalizado)
- **JavaScript (Vanilla)** - Lógica frontend
- **Express.js** - Backend para API y almacenamiento
- **Leaflet.js** - Mapas
- **CARTO Dark** - Tiles del mapa
- **Font Awesome** - Iconos
- **Google Fonts** - Orbitron, Rajdhani

## 📝 Estructura del Proyecto

```
DJRadar/
├── index.html          # Aplicación completa (HTML + CSS + JS)
├── server.js           # Backend Express con API endpoints
├── admin.html          # Panel de administración
├── admin.js            # Lógica del panel admin
├── package.json        # Dependencias y scripts de Node.js
├── render.yaml         # Configuración de despliegue en Render
├── data/               # Almacenamiento local (creado automáticamente)
│   ├── reviews.json    # Reseñas de eventos
│   ├── chat/           # Chats por evento
│   └── overrides.json  # Overrides de admin
└── README.md           # Este archivo
```

## 🔧 Personalización

### Variables de Entorno

- `SHEET_URL` - URL de Google Sheets (CSV export)
- `ADMIN_PASS` - Contraseña para el panel de admin
- `GOOGLE_MAPS_API_KEY` - (Opcional) API key para geocoding Google

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

## 📊 Estado del Desarrollo

El proyecto sigue un roadmap por oleadas (ver `djradar next phase v 1.2.md`):

- ✅ **Wave 1**: Mejoras al Radar + Persistencia Local (COMPLETADA)
- ⚠️ **Wave 2**: Reseñas y Emojis (60% - falta likes y sincronización)
- ⚠️ **Wave 3**: Chat por Evento + Chat de DJ (50% - falta chat exclusivo DJs)
- ❌ **Wave 4**: Sistema de Emblemas y Gamificación (PENDIENTE)
- ❌ **Wave 5**: Suscripciones de Usuarios y Roles (PENDIENTE)
- ❌ **Wave 6**: Panel de Admin Avanzado y Analíticas (PENDIENTE)


