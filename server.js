const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

function normalizeSheetUrl(rawUrl) {
    if (!rawUrl) return '';

    const url = String(rawUrl).trim();

    // If it's already a CSV export URL
    if (url.includes('/export?format=csv')) return url;

    // Google "Publicar en la web" may return a URL like:
    // /spreadsheets/d/e/<publicId>/pub?output=csv
    // Support it by returning it as-is.
    if (url.includes('pub?output=csv')) return url;


    // Accept both:
    //  - https://docs.google.com/spreadsheets/d/<sheetId>/...
    //  - https://sheets.google.com/<sheetId>/...
    // and normalize to:
    //  https://docs.google.com/spreadsheets/d/<sheetId>/export?format=csv&gid=...
    const match = url.match(
        /(?:docs\.google\.com\/spreadsheets\/d|sheets\.google\.com)\/?(?:d\/)?([a-zA-Z0-9-_]+)/
    );

    if (match) {
        const sheetId = match[1];
        const gidMatch = url.match(/[?&]gid=(\d+)/);
        const gid = gidMatch ? `&gid=${gidMatch[1]}` : '';
        return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid}`;
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

    const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
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

app.get('/api/sheet/edit', (req, res) => {
    const sheetUrl = getSheetUrl();
    if (!sheetUrl) {
        return res.status(500).send('SHEET_URL not configured');
    }

    const editUrl = sheetUrl.replace(/\/export\?format=csv.*$/, '/edit');
    if (!editUrl.includes('/edit')) {
        return res.status(400).send('No se pudo construir la URL de edición');
    }

    return res.redirect(editUrl);
});

app.get('/api/health', (req, res) => {
    res.status(200).json({ ok: true });
});

app.get('/api/geocode', async (req, res) => {
    const place = req.query.place || '';
    if (!place) {
        return res.status(400).json({ error: 'No place provided' });
    }

    try {
        const query = String(place).trim();

        // Quick parse: if the place string already includes coordinates (Google Maps @lat,lng or lat,lng), return them
        const coordMatch = query.match(/@?(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
        if (coordMatch) {
            const lat = parseFloat(coordMatch[1]);
            const lng = parseFloat(coordMatch[2]);
            return res.json({ lat, lng, displayName: query });
        }

        // First try Nominatim (OpenStreetMap)
        const searchUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=0&q=${encodeURIComponent(query)}`;
        let response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'DJRadar/1.0'
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data && data[0]) {
                return res.json({
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    displayName: data[0].display_name
                });
            }
        }

        // Fallback: if a Google Maps API key is provided, use Google Geocoding API
        const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY;
        if (googleKey) {
            try {
                const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${googleKey}`;
                response = await fetch(gUrl);
                if (response.ok) {
                    const gData = await response.json();
                    if (gData && gData.results && gData.results[0]) {
                        const loc = gData.results[0].geometry.location;
                        return res.json({ lat: loc.lat, lng: loc.lng, displayName: gData.results[0].formatted_address });
                    }
                }
            } catch (e) {
                console.error('Google geocoding failed:', e);
            }
        }

        // Nothing found
        return res.status(404).json({ error: 'No location found' });
    } catch (error) {
        console.error('Geocoding error:', error);
        res.status(502).json({ error: 'Geocoding failed' });
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

