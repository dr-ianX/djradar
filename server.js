const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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

function extractLatLngFromQuery(query) {
    if (!query) return null;
    const patterns = [
        /@(-?\d+\.\d+),(-?\d+\.\d+)/,
        /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
        /q=(-?\d+\.\d+),(-?\d+\.\d+)/
    ];
    for (const regex of patterns) {
        const match = query.match(regex);
        if (match) {
            return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
        }
    }
    const simple = query.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (simple) return { lat: parseFloat(simple[1]), lng: parseFloat(simple[2]) };
    return null;
}

app.get('/api/geocode', async (req, res) => {
    const place = req.query.place || '';
    if (!place) {
        return res.status(400).json({ error: 'No place provided' });
    }

    try {
        const query = String(place).trim();
        const directCoords = extractLatLngFromQuery(query);
        if (directCoords) {
            return res.json({ lat: directCoords.lat, lng: directCoords.lng, displayName: query });
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

// -------------------- Admin overrides API --------------------
function requireAdmin(req, res, next) {
    const token = req.headers['x-admin-token'] || '';
    const adminPass = process.env.ADMIN_PASS || '';
    if (!adminPass) return res.status(500).json({ error: 'ADMIN_PASS not configured on server' });
    if (!token || token !== adminPass) return res.status(401).json({ error: 'Unauthorized' });
    next();
}

const OVERRIDES_FILE = path.join(__dirname, 'overrides.json');

// -------------------- Reviews storage --------------------
const REVIEWS_FILE = path.join(__dirname, 'data', 'reviews.json');

function readReviews() {
    try {
        if (!fs.existsSync(path.dirname(REVIEWS_FILE))) fs.mkdirSync(path.dirname(REVIEWS_FILE), { recursive: true });
        if (!fs.existsSync(REVIEWS_FILE)) return {};
        const txt = fs.readFileSync(REVIEWS_FILE, 'utf8');
        return txt ? JSON.parse(txt) : {};
    } catch (e) {
        console.error('Failed reading reviews:', e);
        return {};
    }
}

function writeReviews(obj) {
    try {
        if (!fs.existsSync(path.dirname(REVIEWS_FILE))) fs.mkdirSync(path.dirname(REVIEWS_FILE), { recursive: true });
        fs.writeFileSync(REVIEWS_FILE, JSON.stringify(obj, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error('Failed writing reviews:', e);
        return false;
    }
}

app.get('/api/reviews/:id', (req, res) => {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const all = readReviews();
    const arr = Array.isArray(all[id]) ? all[id] : [];
    res.json(arr);
});

app.post('/api/reviews', (req, res) => {
    const body = req.body || {};
    const id = body.id;
    const text = typeof body.text === 'string' ? body.text.slice(0,100) : '';
    const emojis = Array.isArray(body.emojis) ? body.emojis : [];
    const nickname = body.nickname ? String(body.nickname) : null;
    const ts = body.ts || Date.now();

    if (!id || !text) return res.status(400).json({ error: 'Missing id or text' });

    const all = readReviews();
    all[id] = all[id] || [];
    all[id].push({ text, emojis, nickname, ts });
    const ok = writeReviews(all);
    if (!ok) return res.status(500).json({ error: 'Failed to save' });
    res.json({ ok: true });
});

// -------------------- Chats storage --------------------
const CHATS_FILE = path.join(__dirname, 'data', 'chats.json');

function readChats() {
    try {
        if (!fs.existsSync(path.dirname(CHATS_FILE))) fs.mkdirSync(path.dirname(CHATS_FILE), { recursive: true });
        if (!fs.existsSync(CHATS_FILE)) return {};
        const txt = fs.readFileSync(CHATS_FILE, 'utf8');
        return txt ? JSON.parse(txt) : {};
    } catch (e) {
        console.error('Failed reading chats:', e);
        return {};
    }
}

function writeChats(obj) {
    try {
        if (!fs.existsSync(path.dirname(CHATS_FILE))) fs.mkdirSync(path.dirname(CHATS_FILE), { recursive: true });
        fs.writeFileSync(CHATS_FILE, JSON.stringify(obj, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error('Failed writing chats:', e);
        return false;
    }
}

app.get('/api/chat/:id', (req, res) => {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const all = readChats();
    const arr = Array.isArray(all[id]) ? all[id] : [];
    res.json(arr);
});

app.post('/api/chat/:id', (req, res) => {
    const id = req.params.id;
    const body = req.body || {};
    const text = typeof body.text === 'string' ? body.text.trim().slice(0, 280) : '';
    const nickname = body.nickname ? String(body.nickname).slice(0, 24) : 'Anónimo';
    const ts = body.ts || Date.now();

    if (!id || !text) return res.status(400).json({ error: 'Missing id or text' });

    const all = readChats();
    all[id] = all[id] || [];
    all[id].push({ text, nickname, ts });
    const ok = writeChats(all);
    if (!ok) return res.status(500).json({ error: 'Failed to save' });
    res.json({ ok: true });
});

// -------------------- Admin: reviews moderation --------------------
app.get('/api/admin/reviews', requireAdmin, (req, res) => {
    const all = readReviews();
    res.json(all);
});

// Delete a single review by id and index
app.delete('/api/admin/reviews/:id/:idx', requireAdmin, (req, res) => {
    const id = req.params.id;
    const idx = parseInt(req.params.idx, 10);
    if (!id || !Number.isFinite(idx)) return res.status(400).json({ error: 'Missing id or idx' });
    const all = readReviews();
    if (!Array.isArray(all[id]) || idx < 0 || idx >= all[id].length) return res.status(404).json({ error: 'Review not found' });
    all[id].splice(idx, 1);
    const ok = writeReviews(all);
    if (!ok) return res.status(500).json({ error: 'Failed to save' });
    res.json({ ok: true });
});

// Delete all reviews for an id
app.delete('/api/admin/reviews/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const all = readReviews();
    if (all[id]) delete all[id];
    const ok = writeReviews(all);
    if (!ok) return res.status(500).json({ error: 'Failed to save' });
    res.json({ ok: true });
});

app.get('/api/admin/chats', requireAdmin, (req, res) => {
    const all = readChats();
    res.json(all);
});

app.delete('/api/admin/chats/:id/:idx', requireAdmin, (req, res) => {
    const id = req.params.id;
    const idx = parseInt(req.params.idx, 10);
    if (!id || !Number.isFinite(idx)) return res.status(400).json({ error: 'Missing id or idx' });
    const all = readChats();
    if (!Array.isArray(all[id]) || idx < 0 || idx >= all[id].length) return res.status(404).json({ error: 'Chat message not found' });
    all[id].splice(idx, 1);
    const ok = writeChats(all);
    if (!ok) return res.status(500).json({ error: 'Failed to save' });
    res.json({ ok: true });
});

app.delete('/api/admin/chats/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const all = readChats();
    if (all[id]) delete all[id];
    const ok = writeChats(all);
    if (!ok) return res.status(500).json({ error: 'Failed to save' });
    res.json({ ok: true });
});

function readOverrides() {
    try {
        if (!fs.existsSync(OVERRIDES_FILE)) return {};
        const text = fs.readFileSync(OVERRIDES_FILE, 'utf8');
        return text ? JSON.parse(text) : {};
    } catch (e) {
        console.error('Failed reading overrides:', e);
        return {};
    }
}

function writeOverrides(obj) {
    fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(obj, null, 2), 'utf8');
}

// -------------------- Submissions (from Google Forms / Apps Script) --------------------
const SUBMISSIONS_FILE = path.join(__dirname, 'submissions.json');

function readSubmissions() {
    try {
        if (!fs.existsSync(SUBMISSIONS_FILE)) return [];
        const text = fs.readFileSync(SUBMISSIONS_FILE, 'utf8');
        return text ? JSON.parse(text) : [];
    } catch (e) {
        console.error('Failed reading submissions:', e);
        return [];
    }
}

function writeSubmissions(arr) {
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(arr, null, 2), 'utf8');
}

function makeIdForRow(dj, venue, date, start) {
    const normalize = s => String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
    return encodeURIComponent((normalize(dj)+'_'+normalize(venue)+'_'+String(date||'')+'_'+String(start||'')).replace(/[^a-z0-9_\-]/g,''));
}

app.post('/api/webhook/submission', async (req, res) => {
    const secret = process.env.SHEET_WEBHOOK_SECRET || '';
    if (!secret) return res.status(500).json({ error: 'SHEET_WEBHOOK_SECRET not configured' });
    const token = req.headers['x-webhook-token'] || '';
    if (!token || token !== secret) return res.status(401).json({ error: 'Unauthorized' });

    const body = req.body || {};
    // Accept both namedValues and a plain object
    const payload = body.namedValues || body.form || body || {};
    const dj = payload['DJ'] || payload['dj'] || payload['Nombre'] || payload['Name'] || payload['Artist'] || '';
    const venue = payload['Venue'] || payload['venue'] || payload['Lugar'] || '';
    const date = payload['Fecha'] || payload['Date'] || '';
    const start = payload['Inicio'] || payload['Start'] || payload['hora inicio'] || '';

    const submissions = readSubmissions();
    const id = makeIdForRow(dj, venue, date, start) + '_' + Date.now();
    const entry = { id, receivedAt: new Date().toISOString(), dj, venue, date, start, raw: payload };
    submissions.push(entry);
    try {
        writeSubmissions(submissions);
        return res.json({ ok: true, id });
    } catch (e) {
        console.error('Failed saving submission:', e);
        return res.status(500).json({ error: 'Failed to save' });
    }
});

app.get('/api/submissions', requireAdmin, (req, res) => {
    const subs = readSubmissions();
    res.json(subs);
});

app.delete('/api/admin/submission/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    const subs = readSubmissions();
    const idx = subs.findIndex(s => s.id === id);
    if (idx === -1) {
        return res.status(404).json({ error: 'Submission not found' });
    }
    subs.splice(idx, 1);
    try {
        writeSubmissions(subs);
        return res.json({ ok: true });
    } catch (e) {
        console.error('Failed deleting submission:', e);
        return res.status(500).json({ error: 'Failed to delete' });
    }
});

app.post('/api/admin/approveSubmission', requireAdmin, (req, res) => {
    const body = req.body || {};
    if (!body.id) return res.status(400).json({ error: 'Missing id' });
    const subs = readSubmissions();
    const idx = subs.findIndex(s => s.id === body.id);
    if (idx === -1) return res.status(404).json({ error: 'Submission not found' });
    const sub = subs[idx];

    // Create an override entry to approve the DJ
    const overrides = readOverrides();
    const overrideId = makeIdForRow(sub.dj, sub.venue, sub.date, sub.start);
    overrides[overrideId] = {
        DJ: sub.dj,
        Venue: sub.venue,
        Fecha: sub.date,
        Inicio: sub.start,
        estado: 'aprobado'
    };
    try {
        writeOverrides(overrides);
        // remove submission
        subs.splice(idx, 1);
        writeSubmissions(subs);
        return res.json({ ok: true, overrideId });
    } catch (e) {
        console.error('Approve failed:', e);
        return res.status(500).json({ error: 'Failed to approve' });
    }
});

app.post('/api/admin/approveAllSubmissions', requireAdmin, (req, res) => {
    const submissions = readSubmissions();
    if (!submissions.length) return res.json({ ok: true, approved: 0 });

    const overrides = readOverrides();
    let approvedCount = 0;
    for (const sub of submissions) {
        const overrideId = makeIdForRow(sub.dj, sub.venue, sub.date, sub.start);
        overrides[overrideId] = {
            DJ: sub.dj,
            Venue: sub.venue,
            Fecha: sub.date,
            Inicio: sub.start,
            estado: 'aprobado'
        };
        approvedCount += 1;
    }

    try {
        writeOverrides(overrides);
        writeSubmissions([]);
        return res.json({ ok: true, approved: approvedCount });
    } catch (e) {
        console.error('Approve all failed:', e);
        return res.status(500).json({ error: 'Failed to approve all submissions' });
    }
});

app.delete('/api/admin/submissions', requireAdmin, (req, res) => {
    try {
        writeSubmissions([]);
        return res.json({ ok: true, deleted: true });
    } catch (e) {
        console.error('Delete all submissions failed:', e);
        return res.status(500).json({ error: 'Failed to delete submissions' });
    }
});

app.get('/api/admin/overrides', requireAdmin, (req, res) => {
    const data = readOverrides();
    res.json(data);
});

app.post('/api/admin/overrides', requireAdmin, (req, res) => {
    const body = req.body || {};
    if (!body.id || !body.override) return res.status(400).json({ error: 'Missing id or override' });
    const all = readOverrides();
    all[body.id] = body.override;
    try {
        writeOverrides(all);
        res.json({ ok: true });
    } catch (e) {
        console.error('Failed to write overrides:', e);
        res.status(500).json({ error: 'Failed to save' });
    }
});

app.delete('/api/admin/overrides/:id', requireAdmin, (req, res) => {
    const id = req.params.id;
    const all = readOverrides();
    if (all[id]) delete all[id];
    try {
        writeOverrides(all);
        res.json({ ok: true });
    } catch (e) {
        console.error('Failed to write overrides:', e);
        res.status(500).json({ error: 'Failed to save' });
    }
});

// Serve admin UI (static file)
app.get('/admin', (req, res) => {
    const html = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');
    res.type('html').send(html);
});

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

