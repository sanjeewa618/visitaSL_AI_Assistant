import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { UserSettings } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const SYSTEM_INSTRUCTION = `You are "visitaSL", a professional and friendly Sri Lanka tourism assistant. 
Your goal is to help travelers plan their perfect trip to Sri Lanka.

Key Capabilities:
1. Trip Planning: Generate detailed itineraries (Day 1, Day 2, etc.) based on location, days, and preferences. ALWAYS consider the "Number of People" if provided to suggest appropriate transport and larger restaurant/hotel options.
2. Route Finding: Provide travel options (Bus, Car, Bike) between cities with distance and estimated time.
3. Budget Estimation: Calculate costs for hotels, food, and transport based on group size and duration. Use LKR (Sri Lankan Rupees) for all prices. Ensure the total budget reflects the number of travelers.
4. Place Recommendations: Suggest places based on "Travel Vibes" (Adventure, Beaches, Nature, Culture, Wildlife).
5. Service Finder: Find hotels, restaurants, and villas in specific areas.

Guidelines:
- ALWAYS ask for the user's "Travel Vibe" if they ask for general recommendations.
- Use Google Search and Maps grounding to provide real-time, accurate information.
- Format itineraries clearly with bullet points and bold headers.
- Be concise but helpful.
- If a user asks for routes, provide multiple options (Bus, Train, Private Car).
- If a user asks for routes between two places, ALWAYS include a "Google Maps View" section with direct route links (Driving and Transit).
- For hotels, provide at least 5-10 options with ratings and price ranges in LKR if possible.
- When describing a city or place, provide both its historical context (past) and its current/future outlook (events, developments).
- ALWAYS include a Google Maps link for every specific place, hotel, or restaurant mentioned.
- NEVER use shortened Google Maps URLs (maps.app.goo.gl). Always use full links in this format: https://www.google.com/maps/search/?api=1&query=PLACE_NAME
- Use Markdown tables for comparing hotels, routes, or budgets. Ensure tables are formatted correctly.

Response Format:
- Use Markdown for formatting.
- If you generate an itinerary, wrap it in a clear structure.
- If you provide a route, include Distance and Time clearly.
- For tables, use standard Markdown table syntax: | Header | Header |
- ALWAYS use LKR for currency.
- If you generate a final trip plan (especially if it covers 1-14 days), you MUST include a structured JSON block at the end of your response. This block is CRITICAL for the application to save the trip.
  \`\`\`json
  {
    "type": "trip_plan",
    "location": "Main Destination",
    "days": 5,
    "budget": {
      "total": 250000,
      "breakdown": { "hotels": 120000, "transport": 60000, "food": 70000 }
    },
    "itinerary": [
      { "day": 1, "title": "Arrival & Check-in", "activities": ["Activity 1", "Activity 2"] },
      ...
    ]
  }
  \`\`\`

CUSTOM TRIP REQUESTS:
When a user provides a list of places with specific days and costs (e.g., "galle (3 days, LKR 25000)"), you MUST:
- Respect the user's provided duration and cost for those specific legs.
- Provide a detailed day-by-day itinerary for the total duration.
- Include specific hotel and restaurant recommendations for each destination, suitable for the specified number of people.
- Suggest transport options based on the number of travelers (e.g., Tuk-tuk for 1-2, Car for 3-4, Van for 5+).
- Include a "Final Budget Summary" at the end of your text response, then the JSON block.
- The JSON block MUST accurately reflect the total days and total budget.
- Ensure all text is clearly visible and easy to read. Avoid excessive bolding or complex formatting that might obscure the text.

VARIATIONS:
- Support trips from 1 day up to 14 days.
- Adjust transport recommendations based on group size.
- Ensure budget reflects the total number of people.
- If the user provides a budget for a specific leg (e.g., LKR 25000 for 3 days), ensure your recommendations for that leg fit within that budget.

SETTINGS COMPLIANCE:
- Language: If a language is specified in USER PREFERENCES, you MUST respond ONLY in that language.
- Budget: If a budget level (Low, Medium, Luxury) is specified, your hotel and restaurant recommendations MUST align with that level.
- Transport: If a preferred transport mode is specified, your route and time suggestions MUST be based on that mode.
- Style: Adjust your tone (Friendly, Professional) and length (Short, Detailed) as requested.
`;

function toGoogleMapsSearchUrl(place: string) {
  const query = encodeURIComponent(place.trim() || 'Sri Lanka');
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function normalizeMapsLinks(text: string) {
  // Rewrite markdown links where URL is a broken maps.app.goo.gl short link.
  let normalized = text.replace(
    /\[([^\]]+)\]\((https?:\/\/(?:www\.)?maps\.app\.goo\.gl[^)]*)\)/gi,
    (_match, label) => `[${label}](${toGoogleMapsSearchUrl(label)})`
  );

  // Rewrite bare short URLs to a stable maps search fallback.
  normalized = normalized.replace(
    /https?:\/\/(?:www\.)?maps\.app\.goo\.gl\/[\w-]+/gi,
    toGoogleMapsSearchUrl('Sri Lanka tourist attractions')
  );

  return normalized;
}

function toGoogleMapsRouteUrl(origin: string, destination: string, mode: 'driving' | 'transit') {
  const originQuery = encodeURIComponent(origin.trim());
  const destinationQuery = encodeURIComponent(destination.trim());
  return `https://www.google.com/maps/dir/?api=1&origin=${originQuery}&destination=${destinationQuery}&travelmode=${mode}`;
}

function appendRouteOverviewMaps(text: string) {
  const routeHeadingMatch = text.match(/Route\s+Overview\s*:\s*([^\n]+?)\s+to\s+([^\n]+)/i);
  if (!routeHeadingMatch) return text;

  const origin = routeHeadingMatch[1]?.trim();
  const destination = routeHeadingMatch[2]?.trim();
  if (!origin || !destination) return text;

  const routeLinkPattern = /google\.com\/maps\/dir\/\?api=1/i;
  if (routeLinkPattern.test(text)) return text;

  const drivingUrl = toGoogleMapsRouteUrl(origin, destination, 'driving');
  const transitUrl = toGoogleMapsRouteUrl(origin, destination, 'transit');

  return `${text}\n\n### Google Maps View\n- Driving: [Open in Google Maps](${drivingUrl})\n- Transit: [Open in Google Maps](${transitUrl})`;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTemporaryModelError(message: string) {
  const upper = message.toUpperCase();
  return (
    upper.includes('UNAVAILABLE') ||
    message.includes('"code":503') ||
    upper.includes('HIGH DEMAND') ||
    upper.includes('TIMED OUT') ||
    upper.includes('DEADLINE_EXCEEDED')
  );
}

export async function generateChatResponse(
  messages: { role: 'user' | 'assistant', content: string }[],
  settings?: UserSettings
) {
  const fastMode = process.env.GEMINI_FAST_MODE !== 'false';
  const defaultModels = fastMode
    ? 'gemini-flash-latest,gemini-2.0-flash,gemini-1.5-flash'
    : 'gemini-2.0-flash,gemini-flash-latest,gemini-1.5-flash';
  const modelCandidates = (process.env.GEMINI_MODELS || defaultModels)
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  const enableGoogleSearch = process.env.ENABLE_GOOGLE_SEARCH === 'true';
  const maxContextMessages = Number(process.env.GEMINI_MAX_CONTEXT_MESSAGES || 10);
  const baseMaxOutputTokens = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 1400);
  const detailedMaxOutputTokens = Number(process.env.GEMINI_DETAILED_MAX_OUTPUT_TOKENS || 3200);
  const itineraryMaxOutputTokens = Number(process.env.GEMINI_ITINERARY_MAX_OUTPUT_TOKENS || 3800);
  const retryAttempts = Math.max(1, Number(process.env.GEMINI_RETRY_ATTEMPTS || 3));
  const retryBaseDelayMs = Math.max(300, Number(process.env.GEMINI_RETRY_BASE_DELAY_MS || 1200));
  
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Gemini API Key is missing. Please configure it in the Secrets panel.");
  }

  const settingsInstruction = settings ? `
USER PREFERENCES:
- Language: ${settings.language} (Respond ONLY in this language)
- Budget: ${settings.budget} (Prioritize recommendations matching this budget)
- Preferred Transport: ${settings.transport} (Prioritize routes using this mode)
- Response Style: ${settings.responseStyle} (Adapt your tone and length to this style)
- Location Access: ${settings.locationEnabled ? 'Enabled' : 'Disabled'}
` : '';

  // Keep only recent turns to reduce prompt size and response latency.
  const recentMessages = messages.slice(-Math.max(2, maxContextMessages));

  const contents = recentMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const latestUserText = [...recentMessages]
    .reverse()
    .find((m) => m.role === 'user')
    ?.content?.toLowerCase() || '';

  const needsDetailedAnswer =
    latestUserText.includes('recommend') ||
    latestUserText.includes('inspiration') ||
    latestUserText.includes('itinerary') ||
    latestUserText.includes('detailed') ||
    latestUserText.includes('plan') ||
    latestUserText.includes('top') ||
    latestUserText.includes('budget');

  const needsItineraryHeavyAnswer =
    latestUserText.includes('itinerary') ||
    latestUserText.includes('day 1') ||
    latestUserText.includes('3-day') ||
    latestUserText.includes('5-day') ||
    latestUserText.includes('7-day');

  const maxOutputTokens = needsItineraryHeavyAnswer
    ? Math.max(baseMaxOutputTokens, itineraryMaxOutputTokens)
    : needsDetailedAnswer
      ? Math.max(baseMaxOutputTokens, detailedMaxOutputTokens)
      : baseMaxOutputTokens;

  try {
    let lastModelError: any = null;

    for (const model of modelCandidates) {
      for (let attempt = 1; attempt <= retryAttempts; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION + settingsInstruction,
              maxOutputTokens,
              // googleSearch can consume separate quota fast on some projects.
              ...(enableGoogleSearch ? { tools: [{ googleSearch: {} }] } : {}),
            },
          });

          if (!response.text) {
            console.warn("Gemini returned an empty response. This might be due to safety filters.");
            return { text: "I'm sorry, I cannot provide information on that topic due to safety guidelines. Please try asking something else about Sri Lanka tourism." };
          }

          return {
            ...response,
            text: appendRouteOverviewMaps(normalizeMapsLinks(response.text)),
          };
        } catch (modelError: any) {
          const modelMsg = String(modelError?.message || modelError || '');
          const upperModelMsg = modelMsg.toUpperCase();
          const isModelNotFound =
            upperModelMsg.includes('NOT_FOUND') ||
            modelMsg.includes('is not found for API version') ||
            modelMsg.includes('"code":404');

          if (isModelNotFound) {
            lastModelError = modelError;
            break;
          }

          if (isTemporaryModelError(modelMsg)) {
            lastModelError = modelError;
            if (attempt < retryAttempts) {
              const delayMs = retryBaseDelayMs * attempt;
              await wait(delayMs);
              continue;
            }

            // Current model still overloaded after retries; try next model candidate.
            break;
          }

          throw modelError;
        }
      }
    }

    if (lastModelError) {
      throw lastModelError;
    }

    throw new Error('No compatible Gemini model is configured.');
  } catch (error: any) {
    console.error("Gemini API Error Details:", error);
    // Provide a more descriptive error for debugging
    const msg = error?.message || 'Unknown error';
    const serialized = typeof msg === 'string' ? msg : JSON.stringify(msg);
    const upper = serialized.toUpperCase();

    if (
      upper.includes('RESOURCE_EXHAUSTED') ||
      serialized.includes('"code":429') ||
      upper.includes('RATE_LIMIT') ||
      upper.includes('QUOTA')
    ) {
      throw new Error(
        'Gemini quota exceeded (429). Try again later, or use a key/project with available quota. If needed, keep ENABLE_GOOGLE_SEARCH disabled.'
      );
    }

    if (
      upper.includes('NOT_FOUND') ||
      serialized.includes('is not found for API version') ||
      serialized.includes('"code":404')
    ) {
      throw new Error(
        'Gemini model not available for this key/project (404). Try using gemini-flash-latest, or set GEMINI_MODELS in .env.local with valid model names for your account.'
      );
    }

    if (
      upper.includes('UNAVAILABLE') ||
      serialized.includes('"code":503') ||
      upper.includes('HIGH DEMAND')
    ) {
      throw new Error(
        'Gemini is temporarily overloaded (503). Automatic retries were attempted. Please retry in a few seconds.'
      );
    }

    if (msg.includes('API_KEY_INVALID')) {
      throw new Error("Invalid Gemini API Key. Please check your configuration.");
    }
    throw new Error(`Gemini API Error: ${serialized}`);
  }
}

export async function getPlacesByVibe(vibe: string) {
  const prompt = `List the top 10 places to visit in Sri Lanka for the vibe: "${vibe}". 
  Include a brief description, why it's good for this vibe, and a Google Maps link for each.`;
  
  return await generateChatResponse([{ role: 'user', content: prompt }]);
}
