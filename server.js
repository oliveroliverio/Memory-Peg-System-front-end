require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080;
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

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

// Serve the SPA for /getCharacters and any other route
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Frontend server is running at http://localhost:${port}`);
});
