const fs = require('fs');
const path = require('path');

const sheetUrl = process.env.SHEET_URL;

if (!sheetUrl) {
    console.error('Error: SHEET_URL environment variable is not set');
    process.exit(1);
}

const indexPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Reemplazar el placeholder con la URL real
html = html.replace('__SHEET_URL__', sheetUrl);

fs.writeFileSync(indexPath, html, 'utf8');

console.log('✅ Build completed: SHEET_URL replaced successfully');
