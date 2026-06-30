# DJ Radar · Los Cabos — Plan de Desarrollo (ToDo)

> **Objetivo**: Convertir el radar en una plataforma comunitaria ligera, con persistencia local, gamificación, chat por eventos y suscripciones que generen ingresos, manteniendo la agilidad y sin sobrecargar la experiencia.

---

## 🧭 Visión General

- **App gratuita para usuarios**: Mapa, lista, búsqueda, filtros, seguimiento de DJs/venues (guardado en localStorage), y reseñas con emojis (máx 100 caracteres).
- **Suscripciones (pago)**: Usuarios miembros → acceso a chats de eventos, emblemas, descuentos en venues asociados.
- **DJs y Venues (pago)**: Perfiles mejorados, gestión de fechas, estadísticas, chat con su comunidad.
- **Admin (tú)**: Panel para aprobar solicitudes, gestionar emblemas, ver estadísticas, y configurar promociones.

**Principios**: 
- **Simplicidad**: No reinventar la rueda, usar localStorage para persistencia, Google Sheets para datos iniciales, Express como backend ligero.
- **Incremental**: Implementar por oleadas funcionales, cada una desplegable y usable.
- **Comunidad primero**: Las reseñas y chats son el motor de engagement.

---

## 🗃️ Arquitectura de Datos (versión actual y futura)

### Ahora (Fase 0)
- **Google Sheets**: Fuente de verdad para DJs, venues, horarios, ubicaciones.
- **Frontend**: Lee vía `/api/sheet` (proxy Express) y muestra.
- **localStorage**: Guarda:
  - `followedDJs`: array de IDs.
  - `followedVenues`: array de IDs.
  - `userReviews`: objeto con clave `eventId` → {text, emojis, timestamp}.
  - `userProfile`: {nickname, emblems, subscriptionTier} (si se suscribe, se sincroniza con backend).

### Futuro (cuando crezca)
- **Base de datos (SQLite o PostgreSQL)**: Para usuarios registrados, suscripciones, reseñas, chats, notificaciones.
- **Migración progresiva**: Los datos de localStorage se pueden subir al registrar al usuario.

---

## 🚀 Roadmap por Oleadas

### 🌊 Wave 1: Mejoras al Radar + Persistencia Local

**Objetivo**: Añadir seguimiento de DJs/venues sin login, guardar en localStorage, y mejorar la UI para mostrar "favoritos".

- [ ] **1.1** Añadir botón "Seguir" (⭐) en cada DJ de la lista y en el popup del mapa.
  - Al hacer clic, toggle follow y guardar en `localStorage.followedDJs`.
  - Mostrar icono de estrella relleno/vacío según estado.
- [ ] **1.2** Añadir botón "Seguir" para venues (similar).
- [ ] **1.3** Crear filtro "Favoritos" en la barra de filtros (junto a Todos/Ahora/Próximos).
- [ ] **1.4** Guardar el último filtro seleccionado y la búsqueda en localStorage para restaurar al recargar.
- [ ] **1.5** Mostrar en la lista un indicador (⭐) junto al nombre si es seguido.
- [ ] **1.6** Ordenar la lista por: activos primero, luego favoritos, luego el resto (opcional).

---

### 🌊 Wave 2: Reseñas y Emojis

**Objetivo**: Permitir a los usuarios dejar reseñas cortas con emojis y verlas en el evento.

- [ ] **2.1** Diseñar un modal o sección expandible en el popup del mapa para "Dejar reseña".
  - Campo de texto (máx 100 caracteres) y selector de emojis (predefinidos: 🎧🔥💣🤩😴👎).
- [ ] **2.2** Guardar reseñas en localStorage con estructura: `{ eventId: { text, emojis, timestamp, nickname (opcional) } }`.
- [ ] **2.3** Mostrar las reseñas guardadas en el popup (o en un panel lateral al hacer clic en "Ver reseñas").
- [ ] **2.4** Permitir "me gusta" a reseñas de otros (solo si hay múltiples usuarios; por ahora, solo local).
- [ ] **2.5** (Opcional) Sincronizar reseñas con el backend mediante un endpoint simple (`POST /api/reviews`) para que sean globales (requiere autenticación básica, pero podemos dejarlo para Wave 3).

---

### 🌊 Wave 3: Chat por Evento + Chat de DJ

**Objetivo**: Crear espacios de conversación para cada evento (y para DJs con suscripción). Usar localStorage para simular persistencia local, pero con un backend ligero (Express + archivo JSON o SQLite) para que sea global.

- [ ] **3.1** Definir endpoints:
  - `GET /api/chat/:eventId` → devuelve mensajes (array).
  - `POST /api/chat/:eventId` → añade mensaje (requiere nickname o token anónimo).
- [ ] **3.2** En el frontend, añadir un botón "Chat del evento" en el popup del mapa (o en la lista).
  - Abre un panel lateral con el historial y un campo para escribir.
  - Los mensajes se envían al backend y se almacenan en un archivo JSON (o SQLite).
- [ ] **3.3** Para los DJs suscritos (identificados por un token o campo en la hoja), añadir un chat especial en su perfil.
  - Solo accesible para usuarios que sigan al DJ o que hayan pagado (suscripción).
  - El DJ puede moderar (borrar mensajes).
- [ ] **3.4** Implementar notificaciones push (con Service Worker) para nuevos mensajes en chats seguidos (opcional, pero potente).

---

### 🌊 Wave 4: Sistema de Emblemas y Gamificación

**Objetivo**: Motivar la participación con emblemas y vincularlos a descuentos en venues.

- [ ] **4.1** Definir emblemas automáticos:
  - "Primera reseña" (al dejar 1 reseña).
  - "Crítico" (al dejar 10 reseñas).
  - "Raver de verdad" (asistir a 5 eventos, marcando "voy").
  - "Embajador" (compartir la app en redes).
- [ ] **4.2** Mostrar emblemas en el perfil del usuario (aún sin login, se puede generar un perfil local con nickname).
- [ ] **4.3** Crear una página de "Mi perfil" (accesible desde el menú) que muestre emblemas y estadísticas.
- [ ] **4.4** Para venues/DJs suscritos, permitirles ofrecer descuentos a usuarios con ciertos emblemas (ej. "10% off en barra para Embajadores").
- [ ] **4.5** Añadir en el perfil del venue una sección "Beneficios para la comunidad" donde se listan los descuentos.

---

### 🌊 Wave 5: Suscripciones de Usuarios y Roles

**Objetivo**: Implementar planes de pago para usuarios (miembros) que desbloquean funcionalidades.

- [ ] **5.1** Definir tiers (ej. Básico: gratis, Pro: $5/mes, VIP: $15/mes).
  - Pro: acceso a todos los chats, emblemas especiales, sin anuncios.
  - VIP: lo anterior + acceso a chats de DJs exclusivos, descuentos en venues.
- [ ] **5.2** Crear un formulario de suscripción (con pago externo, ej. PayPal o transferencia) y un sistema de validación de pagos (manual al principio).
- [ ] **5.3** Almacenar el tier en localStorage y/o backend.
- [ ] **5.4** Modificar la UI para ocultar/mostrar funcionalidades según el tier.
- [ ] **5.5** Para DJs y venues, crear paneles de gestión (ya los tienes en `admin.html`, pero ahora separados por rol).

---

### 🌊 Wave 6: Panel de Admin Avanzado y Analíticas (Día 6)

**Objetivo**: Darle al admin (tú) herramientas para gestionar la comunidad y ver métricas.

- [ ] **6.1** Dashboard con:
  - Usuarios activos (contador de visitas únicas, usando localStorage + backend).
  - Número de reseñas, chats activos.
  - DJs y venues suscritos.
  - Ingresos estimados.
- [ ] **6.2** Panel de moderación: ver reseñas reportadas, mensajes inapropiados, etc.
- [ ] **6.3** Configuración de emblemas y descuentos (CRUD).
- [ ] **6.4** Herramienta para enviar notificaciones masivas a usuarios (por email o push).

---

## 🎨 Decisiones de UI/UX Clave

- **Persistencia sin login**: Usar localStorage para todo (seguimientos, reseñas, perfil local). Si el usuario quiere suscribirse, se le pide email y se genera un ID único que se almacena en backend.
- **Reseñas cortas**: Input de texto + botones de emojis predefinidos. Mostrar como "burbujas" estilo chat.
- **Chat por evento**: Panel lateral deslizable desde el mapa o desde la lista. Mensajes con timestamp y nickname (anónimo o registrado).
- **Emblemas**: Mostrar como pequeños íconos en el perfil y junto al nombre del usuario en reseñas/chats.
- **Suscripciones**: Página de "Mi cuenta" con botón "Mejorar plan" que lleva a instrucciones de pago (manual, con código promocional).
- **Diseño**: Mantener la línea oscura/neón actual, pero con más espacio para interacciones.

---

## 🛠️ Backend Endpoints Necesarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/sheet` | Obtener datos de Google Sheets (ya existe) |
| POST | `/api/reviews` | Guardar reseña (eventId, texto, emojis, nickname) |
| GET | `/api/reviews/:eventId` | Obtener reseñas de un evento |
| POST | `/api/chat/:eventId` | Enviar mensaje al chat de un evento |
| GET | `/api/chat/:eventId` | Obtener mensajes del chat |
| POST | `/api/user/follow` | Guardar seguimiento (para sincronizar si hay backend) |
| GET | `/api/user/profile/:userId` | Obtener perfil público (emblemas, etc.) |
| POST | `/api/subscribe` | Procesar suscripción (validar pago) |
| GET | `/api/admin/stats` | Obtener métricas para el admin |
| POST | `/api/admin/broadcast` | Enviar notificación masiva |

**Almacenamiento**: Puedes usar archivos JSON (ej. `data/reviews.json`, `data/chats/`) para empezar, y migrar a SQLite después.

---

## 🔥 Prioridades Inmediatas (Ahora Mismo)

1. **Añadir persistencia local de seguimientos** (Wave 1.1 a 1.4). Esto te dará una mejora inmediata en la experiencia.
2. **Implementar reseñas con emojis** (Wave 2). Es fácil y muy valorado por la comunidad.
3. **Crear el chat por evento** (Wave 3) usando un simple archivo JSON en el servidor. Esto cambiará la dinámica de la app.

El resto (suscripciones, gamificación, paneles avanzados) puede venir después, pero ya tendrás una base funcional y atractiva.

---

## ✅ Resumen de Entregables

- [ ] Código fuente en GitHub (público o privado)
- [ ] Despliegue en Render (Web Service) con variables de entorno
- [ ] Documentación actualizada en README.md
- [ ] Este archivo ToDo.md como guía de desarrollo

---

## 🧠 Notas Mentales


- **No te compliques con la autenticación al principio**: localStorage es suficiente para retener usuarios. La suscripción puede ser manual (pago por transferencia, y tú activas manualmente el tier en un archivo de configuración).
- **Mantén el código modular**: Separa lógica de UI, API, y almacenamiento para facilitar cambios.
- **Prueba en móvil**: La mayoría de los usuarios usará el teléfono, así que asegúrate de que los paneles laterales y modales sean táctiles.
- **Escucha a los primeros usuarios**: Ellos te dirán qué funcionalidades valoran más.

---

¡Manos a la obra! 🚀