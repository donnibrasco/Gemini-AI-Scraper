import { Lead, SearchParams } from "../types";

// Proxy URL for Gemini API requests
const getProxyUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return hostname === 'localhost' 
      ? 'http://localhost:3001/api/gemini'
      : `http://${hostname}:3001/api/gemini`;
  }
  return 'http://localhost:3001/api/gemini';
};

// Make API call through proxy to bypass CORS
const callGeminiViaProxy = async (endpoint: string, apiKey: string, body: any) => {
  const proxyUrl = getProxyUrl();
  
  console.log('Calling proxy at:', proxyUrl);
  console.log('Endpoint:', endpoint);
  
  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        endpoint,
        body
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Proxy error response:', errorText);
      throw new Error(`Proxy request failed: ${response.statusText} - ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Proxy call failed:', error);
    throw error;
  }
};

// 1. Search for places using Google Gemini Pro
export const searchPlaces = async (params: SearchParams, count: number = 20): Promise<{ rawText: string; searchContext: SearchParams }> => {
  const { query, city, country } = params;
  
  const apiKey = process.env.OPENROUTER_API_KEY;
  console.log('OpenRouter API Key available:', apiKey ? 'Yes (length: ' + apiKey.length + ')' : 'No');
  
  if (!apiKey) {
    throw new Error("OpenRouter API Key is missing. Please configure OPENROUTER_API_KEY in your environment.");
  }
  
  const prompt = `You are a business directory assistant. Find exactly ${count} real businesses that match "${query}" in ${city}, ${country}.

IMPORTANT: Only include businesses that DO NOT have a website.

For each business, create a realistic entry with:
- Business name
- Full address in ${city}, ${country}
- Phone number (use realistic local format)
- Website: Leave EMPTY or set to empty string (these businesses don't have websites)
- Email (some may have, some may not)
- Social media profiles (Facebook, Instagram, LinkedIn - some may have, some may not)
- Rating (1-5 stars)
- Review count (vary from 5 to 1000)
- Business hours
- Category
- Brief description

Return the results as a JSON array. Make the businesses realistic and varied. Remember: NO websites for any business.`;

  try {
    const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    
    const requestBody = {
      model: "google/gemini-2.5-pro",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 8192
    };

    console.log('Making request to OpenRouter (Gemini 2.5 Pro) via proxy...');
    const response = await callGeminiViaProxy(endpoint, apiKey, requestBody);
    console.log('OpenRouter API response:', response);

    const text = response.choices?.[0]?.message?.content || "No results found.";
    console.log('Raw text from OpenRouter (length: ' + text.length + ')');
    console.log('First 500 chars:', text.substring(0, 500));
    
    return {
      rawText: text,
      searchContext: params,
    };
  } catch (error) {
    console.error("Gemini Search Error:", error);
    throw new Error("Failed to search for places. Please check your API key and try again.");
  }
};

// 2. Parse and Enrich the raw text into the structured Lead format
export const parseAndEnrichLeads = async (rawText: string, searchContext: SearchParams): Promise<Lead[]> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error("OpenRouter API Key is missing.");
  }
  
  const currentDate = new Date().toISOString().split('T')[0];
  
  const prompt = `You are a data extraction assistant. Parse the business information below and return ONLY a valid JSON array.

Each business should have these fields:
- "Company Name": string
- "Category": string  
- "Description": string (keep brief, no special characters)
- "Address": string
- "City": string
- "Country": string
- "Coordinates": string (format: "lat,lng" or empty)
- "Phone": string
- "Email": string (or empty)
- "Website": string (or empty)
- "LinkedIn": string (or empty)
- "Facebook": string (or empty)
- "Instagram": string (or empty)
- "Rating": number (0-5)
- "Review Count": number
- "Business Hours": string (or empty)
- "Quality Score": number (1-100)
- "Quality Reasoning": string (brief)

Business data to parse:
${rawText.substring(0, 15000)}

Return ONLY valid JSON array. No markdown, no explanations, no code blocks.`;

  try {
    const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    
    const requestBody = {
      model: "google/gemini-2.5-pro",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 8192
    };

    const response = await callGeminiViaProxy(endpoint, apiKey, requestBody);
    
    console.log('OpenRouter parsing response received');
    
    let text = response.choices?.[0]?.message?.content || "[]";
    
    // Remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('Text length:', text.length);
    console.log('First 500 chars:', text.substring(0, 500));
    
    let parsedItems;
    try {
      const parsed = JSON.parse(text);
      // Handle different response structures
      if (Array.isArray(parsed)) {
        parsedItems = parsed;
      } else if (parsed.businesses) {
        parsedItems = Array.isArray(parsed.businesses) ? parsed.businesses : [parsed.businesses];
      } else if (parsed.leads) {
        parsedItems = Array.isArray(parsed.leads) ? parsed.leads : [parsed.leads];
      } else if (parsed.results) {
        parsedItems = Array.isArray(parsed.results) ? parsed.results : [parsed.results];
      } else {
        // If it's an object with fields, treat it as a single business
        parsedItems = [parsed];
      }
      console.log('Number of leads parsed:', parsedItems.length);
      if (parsedItems.length > 0) {
        console.log('First lead:', parsedItems[0]);
      }
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Failed text (first 1000 chars):', text.substring(0, 1000));
      throw new Error("Failed to parse lead data. The AI response was not valid JSON.");
    }

    // Filter out any businesses with websites
    parsedItems = parsedItems.filter((item: any) => {
      const website = item.Website || item.website || '';
      const hasWebsite = website && website.trim() !== '' && website.toLowerCase() !== 'n/a' && website.toLowerCase() !== 'none';
      return !hasWebsite;
    });
    
    console.log('After filtering (no website):', parsedItems.length, 'leads');

    // Post-processing to add the static fields
    return parsedItems.map((item: any, index: number) => ({
      ...item,
      "Generated Date": currentDate,
      "Search City": searchContext.city,
      "Search Country": searchContext.country,
      "Lead Number": index + 1,
      "Status": "New",
      "Contacted": "No",
      "Notes": "",
    })) as Lead[];

  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    throw new Error("Failed to parse lead data.");
  }
};