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

// Proxy endpoint for Gemini API to bypass CORS
app.post('/api/gemini', async (req, res) => {
  try {
    const { apiKey, endpoint, body } = req.body;
    
    console.log(`[${new Date().toISOString()}] API proxy request received`);
    console.log('API Key present:', apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No');
    console.log('Endpoint:', endpoint);
    console.log('Request body keys:', Object.keys(body));
    
    if (!apiKey || !endpoint) {
      console.error('Missing apiKey or endpoint');
      return res.status(400).json({ error: 'Missing apiKey or endpoint' });
    }

    console.log('Forwarding request to API...');
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add Authorization header for OpenRouter
    if (endpoint.includes('openrouter.ai')) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['HTTP-Referer'] = 'https://creativeprocess.io';
      headers['X-Title'] = 'Gemini Lead Scraper';
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });

    console.log('API response status:', response.status);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('API error:', data);
      return res.status(response.status).json(data);
    }
    
    console.log('API response successful');
    res.json(data);
  } catch (error) {
    console.error('API proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Webhook proxy server running on port ${PORT}`);
});
