import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Helper to delay execution
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to send command to Roku
const sendToRoku = async (ip: string, endpoint: string, method: 'POST' | 'GET' = 'POST') => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    try {
        const response = await fetch(`http://${ip}:8060${endpoint}`, {
            method,
            signal: controller.signal
        });
        clearTimeout(timeout);
        return response.ok;
    } catch (error) {
        clearTimeout(timeout);
        console.error(`Failed to reach Roku at ${ip}${endpoint}:`, error);
        throw error;
    }
};

// 1. Generic Keypress Proxy
app.post('/api/keypress/:key', async (req, res) => {
    const { key } = req.params;
    const { ip } = req.body;

    if (!ip) {
        res.status(400).json({ error: 'Roku IP address is required' });
        return;
    }

    try {
        await sendToRoku(ip, `/keypress/${key}`);
        res.json({ success: true, message: `Sent ${key}` });
    } catch (error) {
        res.status(502).json({ error: 'Failed to communicate with Roku device' });
    }
});

// 2. Generic Launch Proxy (for apps or inputs)
app.post('/api/launch/:appId', async (req, res) => {
    const { appId } = req.params;
    const { ip } = req.body;

    if (!ip) {
        res.status(400).json({ error: 'Roku IP address is required' });
        return;
    }

    try {
        await sendToRoku(ip, `/launch/${appId}`);
        res.json({ success: true, message: `Launched ${appId}` });
    } catch (error) {
        res.status(502).json({ error: 'Failed to communicate with Roku device' });
    }
});

// 3. SPECIAL MACRO: Power On + HDMI 1
app.post('/api/macros/power-on-hdmi1', async (req, res) => {
    const { ip } = req.body;

    if (!ip) {
        res.status(400).json({ error: 'Roku IP address is required' });
        return;
    }

    try {
        console.log(`[Macro] Executing Power On + HDMI1 for ${ip}`);
        
        // 1. Send PowerOn (or Power - PowerOn is safer if supported, acts as discrete ON)
        // Many Rokus support 'PowerOn', some only 'Power'. We'll try PowerOn.
        await sendToRoku(ip, '/keypress/PowerOn');
        
        // 2. Wait for TV to wake up (Roku TVs can take a few seconds)
        // We'll wait 3 seconds to be safe.
        await sleep(3000);

        // 3. Switch to HDMI 1
        // ID for HDMI1 is usually 'tvinput.hdmi1'
        await sendToRoku(ip, '/launch/tvinput.hdmi1');

        res.json({ success: true, message: 'Executed Power On sequence' });
    } catch (error) {
        console.error(error);
        res.status(502).json({ error: 'Macro execution failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Roku Proxy Server running on http://localhost:${PORT}`);
});
