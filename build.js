const fs = require('fs');
const path = require('path');

const sheetUrl = process.env.SHEET_URL;

if (!sheetUrl) {
    console.error('Error: SHEET_URL environment variable is not set');
    console.error('Using fallback URL for testing...');
    // No exit, let it use the fallback in index.html
}

const indexPath = path.join(__dirname, 'index.html');

if (!fs.existsSync(indexPath)) {
    console.error('Error: index.html not found at', indexPath);
    process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

// Reemplazar el placeholder con la URL real
if (sheetUrl) {
    html = html.replace('__SHEET_URL__', sheetUrl);
    console.log('✅ Build completed: SHEET_URL replaced successfully');
} else {
    console.log('⚠️  Build completed: SHEET_URL not set, using fallback in index.html');
}

fs.writeFileSync(indexPath, html, 'utf8');
