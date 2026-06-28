const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('../server');

let server;
let port;

test('GET /api/sheet returns the CSV proxied from the configured sheet URL', async () => {
  process.env.SHEET_URL = 'data:text/csv;charset=utf-8,Name,Venue,Date,Start,End,Lat,Lng,Style%0ADJ Test,Club Test,2026-06-27,22:00,03:00,22.88,-109.91,House';

  server = await startServer(0);
  const address = server.address();
  port = typeof address === 'object' && address ? address.port : 0;

  const response = await fetch(`http://127.0.0.1:${port}/api/sheet`);
  assert.equal(response.status, 200);

  const body = await response.text();
  assert.match(body, /DJ Test/);
  assert.match(body, /Club Test/);

  await new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});
