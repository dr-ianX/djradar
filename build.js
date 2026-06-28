const fs = require('fs');
const path = require('path');

console.log('=== BUILD SCRIPT STARTED ===');
console.log('Checking environment variables...');

const sheetUrl = process.env.SHEET_URL;

console.log('SHEET_URL from environment:', sheetUrl ? 'SET' : 'NOT SET');

if (!sheetUrl) {
    console.error('❌ ERROR: SHEET_URL environment variable is not set');
    console.error('This will cause the app to fail. Please set SHEET_URL in Render dashboard.');
    process.exit(1);
}

const indexPath = path.join(__dirname, 'index.html');

if (!fs.existsSync(indexPath)) {
    console.error('❌ ERROR: index.html not found at', indexPath);
    process.exit(1);
}

console.log('Reading index.html from:', indexPath);
let html = fs.readFileSync(indexPath, 'utf8');

console.log('Checking for placeholder __SHEET_URL__ in HTML...');
if (!html.includes('__SHEET_URL__')) {
    console.warn('⚠️  WARNING: Placeholder __SHEET_URL__ not found in HTML');
    console.warn('This might indicate the file was already processed or the placeholder was removed.');
}

// Reemplazar el placeholder con la URL real
console.log('Replacing placeholder with actual SHEET_URL...');
html = html.replace('__SHEET_URL__', sheetUrl);

// Verificar que el reemplazo se hizo
if (html.includes('__SHEET_URL__')) {
    console.error('❌ ERROR: Placeholder was not replaced. __SHEET_URL__ still present in HTML.');
    process.exit(1);
}

if (!html.includes(sheetUrl)) {
    console.error('❌ ERROR: SHEET_URL not found in HTML after replacement.');
    process.exit(1);
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('✅ BUILD SUCCESSFUL: SHEET_URL replaced correctly');
console.log('=== BUILD SCRIPT COMPLETED ===');
