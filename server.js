import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Groq } from 'groq-sdk';

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Verify Groq API key is loaded
if (!process.env.GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not set in .env.local file');
    process.exit(1);
}

// Add CORS and content type headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Serve static files with correct MIME types
app.use(express.static(__dirname, {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

// Handle source map requests
app.use((req, res, next) => {
    if (req.url.endsWith('.map')) {
        res.status(404).send('Source map not found');
    } else {
        next();
    }
});

// Parse JSON bodies
app.use(express.json());

// Groq chat completions endpoint
app.post('/api/groq/chat/completions', async (req, res) => {
    try {
        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });

        const completion = await groq.chat.completions.create({
            messages: req.body.messages,
            model: "mixtral-8x7b-32768",
        });

        res.json(completion);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Internal Server Error',
            message: error.message 
        });
    }
});

// Add this before app.listen()
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// Add this to handle 404s
app.use((req, res) => {
    console.log('404 Not Found:', req.url);
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.url}`
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Groq API Key:', process.env.GROQ_API_KEY ? 'Present' : 'Missing');
}); 