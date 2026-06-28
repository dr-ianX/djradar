// Apps Script: enviar respuestas del Form al webhook de DJ Radar
// Configure script properties:
//   WEBHOOK_URL = https://tu-app.onrender.com/api/webhook/submission
//   WEBHOOK_TOKEN = el mismo valor que SHEET_WEBHOOK_SECRET en Render
//   TARGET_SHEET_ID = el ID de la hoja de Google Sheets donde quieres guardar los datos
//   TARGET_SHEET_NAME = el nombre de la pestaña dentro de la hoja, por ejemplo "Form Responses 1"

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
    // El formulario ya escribe en esta misma hoja; no necesitamos duplicar la fila.
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

    // Si el form no está conectado directamente a la hoja objetivo,
    // este script también puede guardar la fila en esa hoja.
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
    Logger.log('Error sending webhook: %s', err.toString());
  }
}
