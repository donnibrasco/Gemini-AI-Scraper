import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Lead, SearchParams } from "../types";

// 1. Search for places using Gemini Maps Grounding
export const searchPlaces = async (params: SearchParams): Promise<{ rawText: string; searchContext: SearchParams }> => {
  const { query, city, country } = params;
  
  // We use a fresh instance to ensure clean state
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Find at least 10 top-rated businesses matching "${query}" in ${city}, ${country}. 
  For each business, provide detailed information including their name, full address, rating, review count, phone number, website, business hours, and a brief description of what they do. 
  Also, try to identify their specific category.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Using flash for speed with tools
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        // We do NOT set responseMimeType to JSON here because we are using tools
      },
    });

    return {
      rawText: response.text || "No results found.",
      searchContext: params,
    };
  } catch (error) {
    console.error("Gemini Search Error:", error);
    throw new Error("Failed to search for places. Please check your API key and try again.");
  }
};

// 2. Parse and Enrich the raw text into the structured Lead format
export const parseAndEnrichLeads = async (rawText: string, searchContext: SearchParams): Promise<Lead[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const currentDate = new Date().toISOString().split('T')[0];
  
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        "Company Name": { type: Type.STRING },
        "Category": { type: Type.STRING },
        "Description": { type: Type.STRING },
        "Address": { type: Type.STRING },
        "City": { type: Type.STRING },
        "Country": { type: Type.STRING },
        "Coordinates": { type: Type.STRING, description: "Lat,Lng format if available, else blank" },
        "Phone": { type: Type.STRING },
        "Email": { type: Type.STRING, description: "Infer if possible or leave blank" },
        "Website": { type: Type.STRING },
        "LinkedIn": { type: Type.STRING, description: "Leave blank if unknown" },
        "Facebook": { type: Type.STRING, description: "Leave blank if unknown" },
        "Instagram": { type: Type.STRING, description: "Leave blank if unknown" },
        "Rating": { type: Type.NUMBER },
        "Review Count": { type: Type.NUMBER },
        "Business Hours": { type: Type.STRING },
        "Quality Score": { type: Type.NUMBER, description: "Score 1-100 based on rating, reviews, and completeness" },
        "Quality Reasoning": { type: Type.STRING, description: "Why this score was given" },
      },
      required: ["Company Name", "Address", "Rating", "Quality Score", "Quality Reasoning"],
    },
  };

  const prompt = `
    You are a data extraction expert. I will provide you with a text containing information about businesses found via Google Maps.
    
    Your task is to EXTRACT this information into a strict JSON array.
    
    Input Context:
    Search Query: ${searchContext.query}
    Search City: ${searchContext.city}
    Search Country: ${searchContext.country}
    
    Raw Data Text:
    ${rawText}
    
    Instructions:
    1. Extract as much detail as possible for each business found.
    2. For "Quality Score", calculate a number between 1-100. High rating + High review count + Website available = High Score (e.g., 90+). Low rating or no website = Low Score.
    3. For "Quality Reasoning", explain briefly (e.g., "High rating (4.8) with over 500 reviews indicates a reputable business").
    4. If a field like Email/LinkedIn/Facebook is not explicitly mentioned, leave it as an empty string "". Do NOT hallucinate contact details.
    5. Format "Coordinates" as "lat, lng" if inferred from the address, otherwise empty.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const parsedItems = JSON.parse(response.text || "[]");

    // Post-processing to add the static fields that Gemini doesn't need to generate
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