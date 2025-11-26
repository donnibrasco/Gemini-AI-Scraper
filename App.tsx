import React, { useState } from 'react';
import { Search, Send, Download, Loader2, MapPin, Globe, Database, Copy } from 'lucide-react';
import { Lead, ScrapingStatus, SearchParams } from './types';
import { searchPlaces, parseAndEnrichLeads } from './services/geminiService';
import LeadTable from './components/LeadTable';

const WEBHOOK_URL = "https://aiisa.co/webhook/3398f3ae-0bf6-4b31-8a93-10139421ef1d";
const USE_PROXY = true; // Set to false to try direct webhook
const PROXY_URL = window.location.hostname === 'localhost' 
  ? "http://localhost:3001/api/webhook"
  : `http://${window.location.hostname}:3001/api/webhook`;

const App: React.FC = () => {
  const [params, setParams] = useState<SearchParams>({ query: '', city: '', country: '' });
  const [resultCount, setResultCount] = useState<number>(20);
  const [status, setStatus] = useState<ScrapingStatus>(ScrapingStatus.IDLE);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!process.env.API_KEY) {
      alert("API Key is missing. Please check your environment configuration.");
      return;
    }

    setStatus(ScrapingStatus.SEARCHING_MAPS);
    setLeads([]);
    setLogs([]);
    setWebhookStatus('idle');
    addLog(`Starting search for "${params.query}" in ${params.city}, ${params.country}...`);

    try {
      // Step 1: Grounding
      addLog(`Searching for ${resultCount} leads... (this may take 1-2 minutes)`);
      const { rawText, searchContext } = await searchPlaces(params, resultCount);
      addLog("Search complete. Found raw data.");
      
      // Step 2: Extraction
      setStatus(ScrapingStatus.EXTRACTING_DATA);
      addLog("Extracting and filtering leads... (30-60 seconds)");
      const extractedLeads = await parseAndEnrichLeads(rawText, searchContext);
      
      setLeads(extractedLeads);
      addLog(`Successfully extracted ${extractedLeads.length} leads.`);
      setStatus(ScrapingStatus.COMPLETE);
    } catch (error) {
      console.error(error);
      addLog(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatus(ScrapingStatus.ERROR);
    }
  };

  const sendToWebhook = async () => {
    if (leads.length === 0) return;
    setWebhookStatus('sending');
    
    const payload = JSON.stringify(leads);
    const payloadSize = new Blob([payload]).size;
    const targetUrl = USE_PROXY ? PROXY_URL : WEBHOOK_URL;
    
    addLog(`Sending ${leads.length} leads to webhook...`);
    addLog(`Payload size: ${(payloadSize / 1024).toFixed(2)} KB`);
    addLog(`Target: ${USE_PROXY ? 'Proxy Server' : 'Direct Webhook'}`);
    console.log('Webhook Payload:', JSON.parse(payload));

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payload,
      });

      addLog(`Response status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json().catch(() => ({}));
        setWebhookStatus('success');
        addLog(`✓ Webhook data sent successfully! (${leads.length} leads)`);
        if (result.message) addLog(`Server response: ${result.message}`);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setWebhookStatus('error');
        addLog(`✗ Webhook failed with status ${response.status}`);
        addLog(`Error: ${errorData.error || errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Webhook Error Details:", error);
      setWebhookStatus('error');
      addLog(`✗ Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      if (USE_PROXY) {
        addLog(`💡 Make sure the proxy server is running (npm run server)`);
      } else {
        addLog(`💡 Try enabling USE_PROXY in the code or use 'Copy JSON' button`);
      }
    }
  };

  const copyWebhookData = () => {
    if (leads.length === 0) return;
    const data = JSON.stringify(leads, null, 2);
    navigator.clipboard.writeText(data).then(() => {
      addLog("✓ Lead data copied to clipboard! Paste it into your webhook tool.");
      alert("Lead data copied to clipboard!");
    }).catch(() => {
      addLog("✗ Failed to copy to clipboard");
    });
  };

  const downloadCSV = () => {
    if (leads.length === 0) return;
    const headers = Object.keys(leads[0]).join(',');
    const rows = leads.map(lead => Object.values(lead).map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${params.city}-${params.query}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-200 font-sans selection:bg-emerald-500/30">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-950/80 backdrop-blur-xl shadow-xl">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-500 to-blue-600 shadow-xl shadow-emerald-500/30 ring-2 ring-emerald-400/20">
              <Database className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight">Gemini Lead Scraper</h1>
              <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                <span>Powered by AI</span>
                <span className="text-slate-600">•</span>
                <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 tracking-wide">Creativeprocess.io</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {/* Status Indicator */}
             {status !== ScrapingStatus.IDLE && (
               <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                 {status === ScrapingStatus.COMPLETE ? (
                   <span className="text-emerald-400 flex items-center gap-2">
                     <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50"/> 
                     <span className="font-medium">Ready</span>
                   </span>
                 ) : status === ScrapingStatus.ERROR ? (
                   <span className="text-red-400 flex items-center gap-2">
                     <span className="h-2.5 w-2.5 rounded-full bg-red-500"/> 
                     <span className="font-medium">Error</span>
                   </span>
                 ) : (
                   <span className="text-blue-400 flex items-center gap-2">
                     <Loader2 className="h-4 w-4 animate-spin" /> 
                     <span className="font-medium">Processing</span>
                   </span>
                 )}
               </div>
             )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 pb-24 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-10 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-300 to-cyan-400 mb-4">
            Find Quality Leads in Seconds
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed">
            Instantly discover and enrich business leads with AI-powered intelligence. Search any industry, any location, and get complete contact details with quality scores—all automated by Google's Gemini AI.
          </p>
        </div>

        {/* Search Form */}
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-700/50 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl ring-1 ring-emerald-500/10">
          <div className="mb-6 text-center">
            <h2 className="text-lg font-bold text-white mb-1">Start Your Lead Discovery</h2>
            <p className="text-sm text-slate-400">Find and enrich business leads instantly with AI-powered intelligence</p>
          </div>
          <form onSubmit={handleSearch} className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="md:col-span-5 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-400">Industry / Keyword</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Plumbers, Marketing Agencies"
                  className="w-full rounded-xl border border-slate-600 bg-slate-950/70 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:bg-slate-950 transition-all shadow-inner"
                  value={params.query}
                  onChange={(e) => setParams({...params, query: e.target.value})}
                />
              </div>
            </div>
            
            <div className="md:col-span-3 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-400">City</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                <input
                  type="text"
                  required
                  placeholder="e.g. New York"
                  className="w-full rounded-xl border border-slate-600 bg-slate-950/70 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:bg-slate-950 transition-all shadow-inner"
                  value={params.city}
                  onChange={(e) => setParams({...params, city: e.target.value})}
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-400">Country</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                <input
                  type="text"
                  required
                  placeholder="e.g. USA"
                  className="w-full rounded-xl border border-slate-600 bg-slate-950/70 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:bg-slate-950 transition-all shadow-inner"
                  value={params.country}
                  onChange={(e) => setParams({...params, country: e.target.value})}
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-400">Results</label>
              <input
                type="number"
                required
                min="5"
                max="100"
                placeholder="20"
                className="w-full rounded-xl border border-slate-600 bg-slate-950/70 py-3 px-4 text-sm text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:bg-slate-950 transition-all shadow-inner"
                value={resultCount}
                onChange={(e) => setResultCount(Math.min(100, Math.max(5, parseInt(e.target.value) || 20)))}
              />
            </div>

            <div className="md:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={status === ScrapingStatus.SEARCHING_MAPS || status === ScrapingStatus.EXTRACTING_DATA}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 py-3 text-sm font-bold text-white shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
              >
                {status === ScrapingStatus.SEARCHING_MAPS || status === ScrapingStatus.EXTRACTING_DATA ? (
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                ) : (
                  "Scrape Leads"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Progress / Logs */}
        {logs.length > 0 && (
          <div className="mx-auto mt-8 max-w-5xl rounded-2xl border border-slate-700/50 bg-slate-950/90 p-5 font-mono text-xs text-slate-400 max-h-40 overflow-y-auto backdrop-blur-xl shadow-xl">
            {logs.map((log, i) => <div key={i}>{log}</div>)}
          </div>
        )}

        {/* Results Area */}
        {leads.length > 0 && (
          <div className="mt-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                Generated Leads <span className="text-emerald-400">({leads.length})</span>
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={downloadCSV}
                  className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800/80 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:border-emerald-500/50 hover:shadow-lg transition-all backdrop-blur-sm"
                >
                  <Download size={16} />
                  Export CSV
                </button>
                <button
                  onClick={copyWebhookData}
                  className="flex items-center gap-2 rounded-xl border border-cyan-600/50 bg-cyan-900/30 px-5 py-2.5 text-sm font-semibold text-cyan-200 hover:bg-cyan-800/40 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20 transition-all backdrop-blur-sm"
                >
                  <Copy size={16} />
                  Copy JSON
                </button>
                <button
                  onClick={sendToWebhook}
                  disabled={webhookStatus === 'sending' || webhookStatus === 'success'}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-xl transition-all ${
                    webhookStatus === 'success' 
                      ? 'bg-green-600 cursor-default'
                      : webhookStatus === 'error'
                      ? 'bg-red-600 hover:bg-red-500 hover:shadow-red-500/30'
                      : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/40'
                  }`}
                >
                  {webhookStatus === 'sending' ? (
                     <Loader2 size={16} className="animate-spin" />
                  ) : webhookStatus === 'success' ? (
                     <Send size={16} />
                  ) : (
                     <Send size={16} />
                  )}
                  {webhookStatus === 'idle' && "Send to Webhook"}
                  {webhookStatus === 'sending' && "Sending..."}
                  {webhookStatus === 'success' && "Sent Successfully"}
                  {webhookStatus === 'error' && "Retry Send"}
                </button>
              </div>
            </div>

            <LeadTable leads={leads} />
            
            <div className="mt-6 text-center space-y-2">
              <p className="text-xs text-slate-500">
                Data generated by Gemini 2.5 Flash using Google Maps Grounding. Review data before outreach.
              </p>
              <p className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 tracking-wider">
                © 2025 Creativeprocess.io - AI-Powered Lead Intelligence Platform
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;