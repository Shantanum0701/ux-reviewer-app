import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { runAudit } from './audit.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ux-audit';

// Middleware
app.use(cors());
app.use(express.json());

// Database Setup (Non-blocking)
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Schema Definition
const auditSchema = new mongoose.Schema({
    url: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    score: { type: Number },
    status: { type: String, default: 'pending', enum: ['pending', 'processing', 'completed', 'failed'] },
    result: { type: Object },
    error: { type: String }
});

const Audit = mongoose.model('Audit', auditSchema);

// In-memory fallback
const localAudits = [];

// --- ROUTES ---

app.get('/api/status', (req, res) => {
    const isMock = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('XXXX') || process.env.OPENAI_API_KEY.includes('dummy');
    res.json({
        status: 'ok',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        llm: isMock ? 'demo_mode' : 'configured',
        timestamp: new Date().toISOString()
    });
});

app.post('/api/analyze', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'URL is required' });

        const tempId = new mongoose.Types.ObjectId();

        // Try to save to DB if connected
        if (mongoose.connection.readyState === 1) {
            const newAudit = new Audit({ _id: tempId, url, status: 'pending' });
            await newAudit.save();
        } else {
            console.log("DB disconnected, using in-memory tracking");
            localAudits.push({ _id: tempId, url, status: 'pending', timestamp: new Date() });
        }

        // Start audit in background
        processAudit(tempId, url);

        res.json({ auditId: tempId });
    } catch (error) {
        console.error('Analysis request failed:', error);
        res.status(500).json({ error: 'Failed to start analysis' });
    }
});

app.get('/api/status/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let audit;

        if (mongoose.connection.readyState === 1) {
            audit = await Audit.findById(id);
        } else {
            audit = localAudits.find(a => a._id.toString() === id);
        }

        if (!audit) return res.status(404).json({ error: 'Audit not found' });

        res.json({
            status: audit.status,
            result: audit.result,
            error: audit.error,
            score: audit.score
        });
    } catch (error) {
        res.status(500).json({ error: 'Status check failed' });
    }
});

app.get('/api/history', async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const history = await Audit.find().sort({ timestamp: -1 }).limit(5);
            res.json(history);
        } else {
            res.json(localAudits.slice(-5).reverse());
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// Helper Function
async function processAudit(auditId, url) {
    try {
        console.log(`Starting audit for ${url}`);

        // Update status to processing
        if (mongoose.connection.readyState === 1) {
            await Audit.findByIdAndUpdate(auditId, { status: 'processing' });
        } else {
            const a = localAudits.find(x => x._id.toString() === auditId.toString());
            if (a) a.status = 'processing';
        }

        // Run the actual audit
        const result = await runAudit(url);

        // Save success
        if (mongoose.connection.readyState === 1) {
            await Audit.findByIdAndUpdate(auditId, {
                status: 'completed',
                result: result,
                score: result.overall_score || 0
            });
        } else {
            const a = localAudits.find(x => x._id.toString() === auditId.toString());
            if (a) {
                a.status = 'completed';
                a.result = result;
                a.score = result.overall_score || 0;
            }
        }
    } catch (error) {
        console.error(`Audit failed:`, error);

        // Save failure
        if (mongoose.connection.readyState === 1) {
            await Audit.findByIdAndUpdate(auditId, {
                status: 'failed',
                error: error.message || 'Unknown error'
            });
        } else {
            const a = localAudits.find(x => x._id.toString() === auditId.toString());
            if (a) {
                a.status = 'failed';
                a.error = error.message;
            }
        }
    }
}

// --- SERVE REACT FRONTEND ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
