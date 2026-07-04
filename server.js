require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const { LocalDataLakeProvider } = require('./lib/provider');
const { GalleryIndex, QUADRANT_MS } = require('./lib/galleryIndex');

const app = express();
const port = process.env.PORT || 8080;
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

// Canonical DataLake location (single source of truth for captured artifacts).
const dataLakePath = process.env.DATALAKE_PATH || '/home/olivero54/DATALAKE';

// ── DataLake index (built once, kept live via a filesystem watcher) ──────────
const provider = new LocalDataLakeProvider(dataLakePath);
const galleryIndex = new GalleryIndex(provider);
galleryIndex.start().catch((err) => {
    console.error('[GalleryIndex] failed to start:', err.message);
});

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Serve raw media straight from the DataLake.
app.use('/media', express.static(dataLakePath, {
    fallthrough: false,
    maxAge: '1h',
}));

// Proxy the backend data to avoid CORS issues from the browser
app.get('/api/getCharacters', async (req, res) => {
    try {
        // The backend URL is configurable via environment variables
        const response = await fetch(`${backendUrl}/getCharacters`);
        if (!response.ok) {
            throw new Error(`Backend responded with status: ${response.status}`);
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching from backend:', error.message);
        res.status(500).json({ error: 'Failed to fetch data from backend server.' });
    }
});

// Index diagnostics
app.get('/api/gallery-stats', (req, res) => {
    res.json(galleryIndex.stats());
});

/**
 * Gallery for a single 15-minute time-character quadrant.
 *
 *   GET /api/gallery/:date/:quadrant
 *     :date     YYMMDD    e.g. 260703  (local calendar date)
 *     :quadrant HHMM      e.g. 0830    (24h start-of-quadrant; snapped to :00/:15/:30/:45)
 *
 * Returns every asset whose timestamp falls in [intervalStart, intervalEnd),
 * sorted chronologically.
 */
app.get('/api/gallery/:date/:quadrant', (req, res) => {
    const { date, quadrant } = req.params;

    const dm = /^(\d{2})(\d{2})(\d{2})$/.exec(date);
    const qm = /^(\d{1,2})(\d{2})$/.exec(quadrant);
    if (!dm || !qm) {
        return res.status(400).json({
            error: 'Invalid params. Expected :date=YYMMDD and :quadrant=HHMM.',
        });
    }

    const year = 2000 + Number(dm[1]);
    const month = Number(dm[2]);
    const day = Number(dm[3]);
    const hour = Number(qm[1]);
    // Snap to the enclosing 15-minute quadrant boundary.
    const minute = Math.floor(Number(qm[2]) / 15) * 15;

    if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23) {
        return res.status(400).json({ error: 'Params out of range.' });
    }

    const { intervalStart, intervalEnd, assets } = galleryIndex.queryQuadrant(
        year, month, day, hour, minute,
    );

    res.json({
        date,
        quadrant: `${String(hour).padStart(2, '0')}${String(minute).padStart(2, '0')}`,
        intervalStart: intervalStart.toISOString(),
        intervalEnd: intervalEnd.toISOString(),
        count: assets.length,
        indexReady: galleryIndex.ready,
        assets: assets.map((rec) => ({
            url: `/media/${rec.relativePath}`,
            relativePath: rec.relativePath,
            timestamp: rec.timestamp,
            isoTime: rec.isoTime,
            mediaType: rec.mediaType,
            extension: rec.extension,
            filesize: rec.filesize,
        })),
    });
});

const pad2 = (n) => String(n).padStart(2, '0');

/**
 * Combined Time-Travel endpoint.
 *
 *   GET /api/quadrant/:epochMs
 *     :epochMs  absolute UTC epoch milliseconds identifying any instant
 *               within the desired 15-minute quadrant. Floored to the
 *               enclosing quadrant boundary and clamped so it never exceeds
 *               the live "now" quadrant (no navigating into the future).
 *
 * Returns, in one round trip, everything a selected quadrant needs to
 * re-render: week creature, day theme, time character (+ prev/next),
 * computed clock time, and the Memory Gallery assets for that interval.
 * Character data is proxied from the Memory Peg API's /getCharactersByDate;
 * gallery assets come from the local DataLake index.
 */
app.get('/api/quadrant/:epochMs', async (req, res) => {
    const raw = Number(req.params.epochMs);
    if (!Number.isFinite(raw)) {
        return res.status(400).json({ error: 'epochMs must be a finite number.' });
    }

    const requested = Math.floor(raw / QUADRANT_MS) * QUADRANT_MS;
    const liveNow = Math.floor(Date.now() / QUADRANT_MS) * QUADRANT_MS;
    const epochMs = Math.min(requested, liveNow); // cannot navigate into the future

    const start = new Date(epochMs);
    const year = start.getFullYear();
    const month = start.getMonth() + 1;
    const day = start.getDate();
    const hour = start.getHours();
    const minute = start.getMinutes();

    let characterData;
    try {
        const backendRes = await fetch(`${backendUrl}/getCharactersByDate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: `${pad2(month)}-${pad2(day)}`,
                time: `${pad2(hour)}:${pad2(minute)}`,
            }),
        });
        if (!backendRes.ok) throw new Error(`Backend responded with status: ${backendRes.status}`);
        characterData = await backendRes.json();
    } catch (error) {
        console.error('Error fetching character data for quadrant:', error.message);
        return res.status(502).json({ error: 'Failed to fetch character data from backend server.' });
    }

    const { intervalStart, intervalEnd, assets } = galleryIndex.queryQuadrant(
        year, month, day, hour, minute,
    );

    res.json({
        epochMs,
        isLive: epochMs === liveNow,
        date: `${String(year).slice(-2)}${pad2(month)}${pad2(day)}`,
        quadrant: `${pad2(hour)}${pad2(minute)}`,
        intervalStart: intervalStart.toISOString(),
        intervalEnd: intervalEnd.toISOString(),
        weekCreature: characterData.weekCreature,
        dayTheme: characterData.dayTheme,
        timeCharacter: characterData.timeCharacter,
        prevTimeCharacter: characterData.prevTimeCharacter,
        nextTimeCharacter: characterData.nextTimeCharacter,
        computedTime: characterData.computedTime,
        assets: assets.map((rec) => ({
            url: `/media/${rec.relativePath}`,
            relativePath: rec.relativePath,
            timestamp: rec.timestamp,
            isoTime: rec.isoTime,
            mediaType: rec.mediaType,
            extension: rec.extension,
            filesize: rec.filesize,
        })),
    });
});

// Serve the SPA for /getCharacters and any other route
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Frontend server is running at http://localhost:${port}`);
    console.log(`DataLake: ${dataLakePath}`);
});
