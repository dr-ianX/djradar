// Apps Script: enviar respuestas del Form al webhook de DJ Radar
// 1) Ajusta WEBHOOK_URL y WEBHOOK_TOKEN abajo
// 2) Guarda y crea un trigger "On form submit" en la hoja

const WEBHOOK_URL = 'https://tu-dominio.com/api/webhook/submission';
const WEBHOOK_TOKEN = 'tu-token-secreto-igual-que-SHEET_WEBHOOK_SECRET';

function onFormSubmit(e) {
  try {
    const namedValues = e.namedValues || {};

    const payload = {
      namedValues: namedValues,
      // Map columnas principales para facilitar parsing en el servidor
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
    Logger.log('Webhook response: %s %s', resp.getResponseCode(), resp.getContentText());

  } catch (err) {
    Logger.log('Error sending webhook: %s', err.toString());
  }
}
