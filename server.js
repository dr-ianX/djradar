const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos
app.use(express.static('.'));

// Servir index.html con reemplazo de variables
app.get('/', (req, res) => {
    const sheetUrl = process.env.SHEET_URL;
    
    if (!sheetUrl) {
        console.error('ERROR: SHEET_URL environment variable not set');
        return res.status(500).send('Error: SHEET_URL not configured in environment variables');
    }
    
    let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    html = html.replace('__SHEET_URL__', sheetUrl);
    
    res.send(html);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`SHEET_URL configured: ${process.env.SHEET_URL ? 'YES' : 'NO'}`);
});
