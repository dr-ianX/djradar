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

1. Crea un nuevo **Static Site** en Render
2. Conecta este repositorio de GitHub
3. En **Build & Deploy**, configura:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `.`
4. Agrega variable de entorno:
   - **Key**: `SHEET_URL`
   - **Value**: [Tu URL CSV de Google Sheets]

### 4. Variables de Entorno

La aplicación usa la variable `SHEET_URL` para obtener los datos. Durante el build, el comando `sed` reemplaza el placeholder `__SHEET_URL__` en el HTML con el valor real.

## 📱 Uso Local

1. Clona el repositorio
2. Abre `index.html` en tu navegador
3. Para usar tus propios datos, edita la línea 367 en `index.html`:
   ```javascript
   window.SHEET_URL = 'https://docs.google.com/spreadsheets/d/TU_ID/export?format=csv';
   ```

## 🎨 Tecnologías

- **HTML5** - Estructura
- **CSS3** - Estilos (personalizado)
- **JavaScript (Vanilla)** - Lógica
- **Leaflet.js** - Mapas
- **CARTO Dark** - Tiles del mapa
- **Font Awesome** - Iconos
- **Google Fonts** - Orbitron, Rajdhani

## 📝 Estructura del Proyecto

```
DJRadar/
├── index.html          # Aplicación completa (HTML + CSS + JS)
├── package.json        # Configuración de Node.js para build
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

## 📄 Licencia

MIT License - Siéntete libre de usar este proyecto para tus propios fines.

## 👥 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request en GitHub.
