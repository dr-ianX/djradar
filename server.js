const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

function normalizeSheetUrl(rawUrl) {
    if (!rawUrl) return '';

    const url = rawUrl.trim();
    if (url.includes('docs.google.com/spreadsheets')) {
        const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (match) {
            const sheetId = match[1];
            const gidMatch = url.match(/[?&]gid=(\d+)/);
            const gid = gidMatch ? `&gid=${gidMatch[1]}` : '';
            return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid}`;
        }
    }

    return url;
}

function getSheetUrl() {
    return normalizeSheetUrl(process.env.SHEET_URL || process.env.SHEET_API_URL || '');
}

app.get('/', (req, res) => {
    const sheetUrl = getSheetUrl();

    if (!sheetUrl) {
        console.error('WARNING: SHEET_URL environment variable not set');
    }

    let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    res.type('html').send(html);
});

app.get('/api/sheet', async (req, res) => {
    const sheetUrl = getSheetUrl();

    if (!sheetUrl) {
        return res.status(500).json({ error: 'SHEET_URL not configured in environment variables' });
    }

    if (req.query.edit === '1') {
        const editUrl = sheetUrl.replace(/\/export\?format=csv.*$/, '/edit');
        if (!editUrl.includes('/edit')) {
            return res.status(400).json({ error: 'No se pudo construir la URL de edición' });
        }
        return res.redirect(editUrl);
    }

    try {
        const response = await fetch(sheetUrl);
        if (!response.ok) {
            const text = await response.text();
            console.error('Failed to fetch sheet from Google Sheets:', response.status, text);
            return res.status(502).send('No se pudo cargar la hoja configurada. Revisa que la URL sea pública y que apunte a un export CSV de Google Sheets.');
        }

        const csvText = await response.text();
        res.type('text/csv').send(csvText);
    } catch (error) {
        console.error('Error fetching sheet data:', error);
        res.status(502).send('No se pudo cargar la hoja configurada. Revisa que la URL sea pública y que apunte a un export CSV de Google Sheets.');
    }
});

app.use(express.static(path.join(__dirname)));

function startServer(port = PORT) {
    return new Promise((resolve) => {
        const server = app.listen(port, () => {
            console.log(`Server running on port ${server.address().port}`);
            console.log(`SHEET_URL configured: ${getSheetUrl() ? 'YES' : 'NO'}`);
            resolve(server);
        });
    });
}

if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };
