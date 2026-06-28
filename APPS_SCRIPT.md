Guía: enviar respuestas de Google Forms a DJ Radar (webhook)

Resumen
- Usaremos Google Apps Script ligado a la hoja de respuestas para enviar una petición POST al endpoint `/api/webhook/submission` que creaste en tu servidor.
- Tu servidor requiere que la cabecera `x-webhook-token` coincida con la variable de entorno `SHEET_WEBHOOK_SECRET`.

Pasos en Google (rápido)
1. Abre la Google Sheet que recibe las respuestas del Form.
2. Desde `Extensiones > Apps Script` crea un nuevo proyecto.
3. Reemplaza el contenido de `Code.gs` por el siguiente script (ajusta `WEBHOOK_URL` y `WEBHOOK_TOKEN`):

```javascript
const WEBHOOK_URL = 'https://tu-dominio.com/api/webhook/submission';
const WEBHOOK_TOKEN = 'tu-token-que-guardaste-en-SHEET_WEBHOOK_SECRET';

function onFormSubmit(e) {
  try {
    // e.namedValues contiene un objeto con las columnas y valores
    const payload = { namedValues: e.namedValues };
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: { 'x-webhook-token': WEBHOOK_TOKEN },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    const resp = UrlFetchApp.fetch(WEBHOOK_URL, options);
    Logger.log('Webhook response: ' + resp.getResponseCode() + ' ' + resp.getContentText());
  } catch (err) {
    Logger.log('Webhook error: ' + err);
  }
}
```

4. Guardar el script.
5. En el editor de Apps Script, crea un activador (Trigger):
   - En `Desplegar` o `Relojes/Triggers` (icono de reloj), añade un trigger `onFormSubmit`:
     - Evento: `On form submit` (From spreadsheet -> On form submit)
     - Permisos: te pedirá autorizar; acepta.

6. Asegúrate de que `WEBHOOK_TOKEN` coincide con `SHEET_WEBHOOK_SECRET` en tu servidor.
7. Prueba enviando una respuesta desde tu Google Form — deberías ver entradas en `submissions.json` y podrás aprobarlas desde `/admin`.

Notas de seguridad y recomendaciones
- No expongas `SHEET_WEBHOOK_SECRET` públicamente. Guarda `SHEET_WEBHOOK_SECRET` en tu entorno de despliegue.
- Considera usar HTTPS (necesario en producción). Si usas Render/Heroku/Vercel, asegúrate de la URL pública.
- Si no quieres triggers en Apps Script, también puedes usar Zapier/Integromat para hacer POSTs.

Si quieres, te preparo el script de Apps Script ya con los nombres de columna que usas en la hoja. Envíame los encabezados exactos (por ejemplo: `DJ`, `Venue`, `Fecha`, `Inicio`, `Fin`, `Estado`) y lo adapto.
 
---

Script personalizado para tus encabezados:

```javascript
// Reemplaza WEBHOOK_URL y WEBHOOK_TOKEN con tus valores
const WEBHOOK_URL = 'https://tu-dominio.com/api/webhook/submission';
const WEBHOOK_TOKEN = 'tu-token-secreto-igual-que-SHEET_WEBHOOK_SECRET';

function onFormSubmit(e) {
  try {
    const namedValues = e.namedValues || {};
    const payload = {
      namedValues: namedValues,
      form: {
        DJ: (namedValues['DJ'] && namedValues['DJ'][0]) || '',
        Venue: (namedValues['Venue'] && namedValues['Venue'][0]) || '',
        Date: (namedValues['Date'] && namedValues['Date'][0]) || '',
        Start: (namedValues['Start'] && namedValues['Start'][0]) || '',
        Ending: (namedValues['Ending'] && namedValues['Ending'][0]) || '',
        'Lugar / dirección': (namedValues['Lugar / dirección'] && namedValues['Lugar / dirección'][0]) || '',
        MusicStyle: (namedValues['MusicStyle'] && namedValues['MusicStyle'][0]) || '',
        Estado: (namedValues['Estado'] && namedValues['Estado'][0]) || '',
        'Correo de contacto': (namedValues['Correo de contacto'] && namedValues['Correo de contacto'][0]) || ''
      }
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: { 'x-webhook-token': WEBHOOK_TOKEN },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const resp = UrlFetchApp.fetch(WEBHOOK_URL, options);
    Logger.log('Webhook response: ' + resp.getResponseCode() + ' ' + resp.getContentText());
  } catch (err) {
    Logger.log('Webhook error: ' + err);
  }
}
```

Instrucciones rápidas:
- Establece `SHEET_WEBHOOK_SECRET` en tu servidor con el mismo token que pongas en `WEBHOOK_TOKEN`.
- Si tu servidor está en `localhost`, usa un túnel (ej. `ngrok`) y pon la URL pública en `WEBHOOK_URL`.
- En Apps Script: guarda, autoriza permisos y crea un trigger `On form submit` desde la hoja.
- Prueba enviando un formulario; las entradas aparecerán en `submissions.json` y podrás aprobarlas desde `/admin`.

Si quieres que yo configure la escritura de aprobaciones de vuelta a la hoja (paso opcional), te explico las dos alternativas (Apps Script vs Sheets API) y preparo el código.