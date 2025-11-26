import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Proxy endpoint for webhook
app.post('/api/webhook', async (req, res) => {
  const WEBHOOK_URL = "https://aiisa.co/webhook/3398f3ae-0bf6-4b31-8a93-10139421ef1d";
  
  try {
    console.log(`[${new Date().toISOString()}] Forwarding ${req.body.length} leads to webhook...`);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const responseText = await response.text();
    
    console.log(`Webhook responded with status: ${response.status}`);
    
    res.status(response.status).json({
      success: response.ok,
      status: response.status,
      message: responseText || 'Webhook request completed',
    });
  } catch (error) {
    console.error('Webhook proxy error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Webhook proxy server running on port ${PORT}`);
});
