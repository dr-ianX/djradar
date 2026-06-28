Guía: enviar respuestas de Google Forms a DJ Radar (webhook)

Resumen
- Usaremos Google Apps Script ligado a la hoja de respuestas para enviar una petición POST al endpoint `/api/webhook/submission` que creaste en tu servidor.
- Tu servidor requiere que la cabecera `x-webhook-token` coincida con la variable de entorno `SHEET_WEBHOOK_SECRET`.

Pasos en Google (rápido)
1. Abre la Google Sheet donde quieres que queden guardadas las respuestas.
   - Si estás usando un Google Form, asegúrate de que este Form esté vinculado exactamente a esa hoja de respuestas.
   - Si abriste Apps Script desde otra hoja distinta de la hoja de respuestas del Form, el trigger no funcionará correctamente.
2. Desde `Extensiones > Apps Script` crea un nuevo proyecto.
3. En `Configurar propiedades del proyecto` o `Project Properties`, añade estas Script Properties:
   - `WEBHOOK_URL` = `https://tu-app.onrender.com/api/webhook/submission`
   - `WEBHOOK_TOKEN` = el mismo valor que pusiste en `SHEET_WEBHOOK_SECRET` en Render
   - `TARGET_SHEET_ID` = el ID de tu hoja de cálculo de Google Sheets (parte larga de la URL)
   - `TARGET_SHEET_NAME` = el nombre de la pestaña donde quieres guardar las filas (por ejemplo `Form Responses 1`)
4. Reemplaza el contenido de `Code.gs` por el siguiente script. No pongas el token directo en el código; usa las Properties.

```javascript
function getWebhookConfig() {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty('WEBHOOK_URL');
  const token = props.getProperty('WEBHOOK_TOKEN');
  const sheetId = props.getProperty('TARGET_SHEET_ID');
  const sheetName = props.getProperty('TARGET_SHEET_NAME');
  if (!url || !token) {
    throw new Error('Configura WEBHOOK_URL y WEBHOOK_TOKEN en las Script Properties.');
  }
  return { url, token, sheetId, sheetName };
}

function formatField(value) {
  return Array.isArray(value) ? value[0] : value || '';
}

function buildFormObject(namedValues) {
  return {
    DJ: formatField(namedValues['DJ']),
    Venue: formatField(namedValues['Venue']),
    Date: formatField(namedValues['Date']),
    Start: formatField(namedValues['Start']),
    Ending: formatField(namedValues['Ending']),
    'Lugar / dirección': formatField(namedValues['Lugar / dirección']),
    MusicStyle: formatField(namedValues['MusicStyle']),
    Estado: formatField(namedValues['Estado']),
    'Correo de contacto': formatField(namedValues['Correo de contacto'])
  };
}

function appendToTargetSheet(rowData, config, sourceSpreadsheet) {
  if (!config.sheetId || !config.sheetName) return;
  if (sourceSpreadsheet && sourceSpreadsheet.getId() === config.sheetId) {
    return;
  }
  const spreadsheet = SpreadsheetApp.openById(config.sheetId);
  const sheet = spreadsheet.getSheetByName(config.sheetName);
  if (!sheet) throw new Error('No se encontró la pestaña ' + config.sheetName + ' en la hoja.');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(header => {
    const key = String(header).trim();
    return rowData[key] || '';
  });
  sheet.appendRow(row);
}

function onFormSubmit(e) {
  try {
    const namedValues = e.namedValues || {};
    const config = getWebhookConfig();
    const formData = buildFormObject(namedValues);

    if (config.sheetId && config.sheetName) {
      appendToTargetSheet(formData, config, e.source || SpreadsheetApp.getActiveSpreadsheet());
    }

    const payload = {
      namedValues: namedValues,
      form: formData
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: { 'x-webhook-token': config.token },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const resp = UrlFetchApp.fetch(config.url, options);
    Logger.log('Webhook response: %s %s', resp.getResponseCode(), resp.getContentText());
  } catch (err) {
    Logger.log('Webhook error: %s', err.toString());
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

Nota importante: tu Google Form debe estar vinculado a la hoja de respuestas que aparece en `SHEET_URL`. El flujo correcto es:
- El Form guarda cada envío en la hoja de respuestas.
- DJ Radar lee esa hoja desde `SHEET_URL` para mostrar el mapa y los datos.
- El webhook es adicional: envía cada envío al servidor para que puedas ver y aprobar rápidamente en `/admin`.

Si el Form no está conectado a esa hoja, tus datos no llegarán a DJ Radar aunque el webhook funcione.

Script personalizado para tus encabezados:
- Usa las Script Properties `TARGET_SHEET_ID` y `TARGET_SHEET_NAME` para que el script escriba en la hoja correcta.
- Si el Form está enlazado a la misma hoja, el script detecta la misma hoja y no duplicará filas.

Instrucciones rápidas:
- Establece `SHEET_WEBHOOK_SECRET` en tu servidor con el mismo token que pongas en `WEBHOOK_TOKEN`.
- Si tu servidor está en `localhost`, usa un túnel (ej. `ngrok`) y pon la URL pública en `WEBHOOK_URL`.
- En Apps Script: guarda, autoriza permisos y crea un trigger `On form submit` desde la hoja.
- Prueba enviando un formulario; las entradas aparecerán en `submissions.json` y podrás aprobarlas desde `/admin`.

Si quieres que yo configure la escritura de aprobaciones de vuelta a la hoja (paso opcional), te explico las dos alternativas (Apps Script vs Sheets API) y preparo el código.