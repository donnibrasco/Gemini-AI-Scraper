import React, { useState } from 'react';
import { Search, Send, Download, Loader2, MapPin, Globe, Database } from 'lucide-react';
import { Lead, ScrapingStatus, SearchParams } from './types';
import { searchPlaces, parseAndEnrichLeads } from './services/geminiService';
import LeadTable from './components/LeadTable';

const WEBHOOK_URL = "https://aiisa.co/webhook/3398f3ae-0bf6-4b31-8a93-10139421ef1d";

const App: React.FC = () => {
  const [params, setParams] = useState<SearchParams>({ query: '', city: '', country: '' });
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
      const { rawText, searchContext } = await searchPlaces(params);
      addLog("Map search complete. Found raw data.");
      
      // Step 2: Extraction
      setStatus(ScrapingStatus.EXTRACTING_DATA);
      addLog("Analyzing data and extracting leads...");
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
    addLog(`Sending ${leads.length} leads to webhook...`);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leads),
      });

      if (response.ok) {
        setWebhookStatus('success');
        addLog("Webhook transmission successful!");
      } else {
        // Some webhooks return opaque responses for CORS, but if it fails explicitly:
        setWebhookStatus('error');
        addLog(`Webhook failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error("Webhook Error", error);
      // Often CORS errors occur in browser-to-webhook scenarios
      setWebhookStatus('error');
      addLog("Webhook failed (likely CORS or Network Error). Check console.");
    }
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
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-lg shadow-emerald-500/20">
              <Database className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Gemini Lead Scraper</h1>
              <p className="text-xs text-slate-400">Powered by Google Maps Grounding</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {/* Status Indicator */}
             {status !== ScrapingStatus.IDLE && (
               <div className="flex items-center gap-2 text-sm">
                 {status === ScrapingStatus.COMPLETE ? (
                   <span className="text-emerald-400 flex items-center gap-1">
                     <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/> Ready
                   </span>
                 ) : status === ScrapingStatus.ERROR ? (
                   <span className="text-red-400">Error</span>
                 ) : (
                   <span className="text-blue-400 flex items-center gap-1">
                     <Loader2 className="h-3 w-3 animate-spin" /> Processing
                   </span>
                 )}
               </div>
             )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Search Form */}
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-700 bg-slate-800/50 p-6 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSearch} className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="md:col-span-5 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Industry / Keyword</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Plumbers, Marketing Agencies"
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  value={params.query}
                  onChange={(e) => setParams({...params, query: e.target.value})}
                />
              </div>
            </div>
            
            <div className="md:col-span-3 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">City</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                <input
                  type="text"
                  required
                  placeholder="e.g. New York"
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  value={params.city}
                  onChange={(e) => setParams({...params, city: e.target.value})}
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Country</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                <input
                  type="text"
                  required
                  placeholder="e.g. USA"
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  value={params.country}
                  onChange={(e) => setParams({...params, country: e.target.value})}
                />
              </div>
            </div>

            <div className="md:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={status === ScrapingStatus.SEARCHING_MAPS || status === ScrapingStatus.EXTRACTING_DATA}
                className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-emerald-500 hover:shadow-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
          <div className="mx-auto mt-6 max-w-4xl rounded-lg border border-slate-800 bg-black/40 p-4 font-mono text-xs text-slate-400 max-h-32 overflow-y-auto">
            {logs.map((log, i) => <div key={i}>{log}</div>)}
          </div>
        )}

        {/* Results Area */}
        {leads.length > 0 && (
          <div className="mt-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-2xl font-bold text-white">Generated Leads <span className="text-emerald-500">({leads.length})</span></h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={downloadCSV}
                  className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 hover:border-slate-500 transition-colors"
                >
                  <Download size={16} />
                  Export CSV
                </button>
                <button
                  onClick={sendToWebhook}
                  disabled={webhookStatus === 'sending' || webhookStatus === 'success'}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white shadow-lg transition-all ${
                    webhookStatus === 'success' 
                      ? 'bg-green-600 cursor-default'
                      : webhookStatus === 'error'
                      ? 'bg-red-600 hover:bg-red-500'
                      : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/20'
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
            
            <div className="mt-4 text-center text-xs text-slate-500">
              Data generated by Gemini 2.5 Flash using Google Maps Grounding. Review data before outreach.
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;