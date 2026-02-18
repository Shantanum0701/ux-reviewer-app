import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { runAudit } from './audit.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ux-audit';

// Middleware
app.use(cors());
app.use(express.json());

// Database Setup
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Schema Definition
const auditSchema = new mongoose.Schema({
    url: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    score: { type: Number },
    status: { type: String, default: 'pending', enum: ['pending', 'processing', 'completed', 'failed'] },
    result: { type: Object }, // Store JSON result directly
    error: { type: String }
});

const Audit = mongoose.model('Audit', auditSchema);

// Routes
app.get('/api/status', (req, res) => {
    const isMock = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('XXXX');
    res.json({
        status: 'ok',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        llm: isMock ? 'demo_mode' : 'configured',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/audits', async (req, res) => { // Made async
    try {
        const audits = await Audit.find().sort({ timestamp: -1 }).limit(5); // Mongoose query
        res.json(audits);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch audits' });
    }
});

app.post('/api/analyze', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const newAudit = new Audit({ url, status: 'pending' });
        const savedAudit = await newAudit.save();
        const auditId = savedAudit._id;

        // Trigger async processing
        processAudit(auditId, url).catch(console.error);

        res.json({ id: auditId, status: 'pending' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to start audit' });
    }
});

app.get('/api/audits/:id', async (req, res) => { // Made async
    try {
        const audit = await Audit.findById(req.params.id);
        if (!audit) return res.status(404).json({ error: 'Audit not found' });

        // Mongoose handles JSON automatically, so no specific parsing logic needed if type is Object/Mixed
        // But keeping resonse format consistent
        res.json(audit);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching audit' });
    }
});

async function processAudit(auditId, url) {
    try {
        console.log(`Starting audit for ${url} (ID: ${auditId})`);

        // Update status to processing
        await Audit.findByIdAndUpdate(auditId, { status: 'processing' });

        // Run the audit
        const result = await runAudit(url);

        // Save success
        await Audit.findByIdAndUpdate(auditId, {
            status: 'completed',
            result: result,
            score: result.overall_score || 0
        });

        console.log(`Audit completed for ${url}`);
    } catch (error) {
        console.error(`Audit failed for ${url}:`, error);

        // Save failure
        await Audit.findByIdAndUpdate(auditId, {
            status: 'failed',
            error: error.message || 'Unknown error'
        });
    }
}


// --- SERVE REACT FRONTEND ---
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the React app (client/dist)
app.use(express.static(path.join(__dirname, '../client/dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
// ----------------------------

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
