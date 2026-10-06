import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load server/.env so it works regardless of current working directory
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Check API key presence and print length only (never the key itself)
const geminiKey = process.env.GEMINI_API_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
const activeKey = geminiKey || openaiKey;
const activeKeyName = geminiKey ? 'GEMINI_API_KEY' : (openaiKey ? 'OPENAI_API_KEY' : 'NONE');
console.log(`API key (${activeKeyName}) present: ${Boolean(activeKey)}, length: ${activeKey ? activeKey.length : 0}`);

// Enable CORS for frontend requests
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Sensible fallback postcard used when LLM call, parsing, or validation fails
const DEFAULT_POSTCARD = {
  mood: 'peaceful',
  palette: ['#2E4057', '#048A81', '#54C6EB', '#F4D06F'],
  shapes: 'waves',
  density: 0.5,
  caption: 'A gentle rhythm of today',
};

// Allowed values for the shapes field
const ALLOWED_SHAPES = new Set(['waves', 'circles', 'mountains', 'stars', 'grid']);

// 3 or 6 digit hex color regex (e.g. #fff, #336699)
const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Strips markdown code block fences (```json ... ``` or ``` ... ```) if present.
 */
function stripMarkdownFences(str) {
  if (!str || typeof str !== 'string') return '';
  const trimmed = str.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  return trimmed;
}

/**
 * Validates the parsed postcard object against the required schema:
 * - mood: string
 * - palette: array of exactly 4 hex colors
 * - shapes: one of waves, circles, mountains, stars, grid
 * - density: number from 0 to 1
 * - caption: string under 8 words
 *
 * Returns an object { isValid: boolean, reason?: string } indicating which rule failed.
 */
function validatePostcard(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { isValid: false, reason: 'Payload is not a valid JSON object' };
  }

  // mood: must be a non-empty string
  if (typeof data.mood !== 'string' || data.mood.trim() === '') {
    return { isValid: false, reason: 'Validation rule failed: "mood" must be a non-empty string' };
  }

  // palette: must be an array of exactly 4 hex colors
  if (!Array.isArray(data.palette) || data.palette.length !== 4) {
    return { isValid: false, reason: 'Validation rule failed: "palette" must be an array of exactly 4 colors' };
  }
  for (let i = 0; i < data.palette.length; i++) {
    const color = data.palette[i];
    if (typeof color !== 'string' || !HEX_COLOR_REGEX.test(color)) {
      return { isValid: false, reason: `Validation rule failed: "palette[${i}]" (${color}) is not a valid hex color` };
    }
  }

  // shapes: must be one of waves, circles, mountains, stars, grid
  if (!ALLOWED_SHAPES.has(data.shapes)) {
    return { isValid: false, reason: `Validation rule failed: "shapes" must be one of waves, circles, mountains, stars, grid (received "${data.shapes}")` };
  }

  // density: must be a number between 0 and 1
  if (typeof data.density !== 'number' || Number.isNaN(data.density) || data.density < 0 || data.density > 1) {
    return { isValid: false, reason: `Validation rule failed: "density" must be a number between 0 and 1 (received ${data.density})` };
  }

  // caption: must be a string under 8 words (< 8 words)
  if (typeof data.caption !== 'string' || data.caption.trim() === '') {
    return { isValid: false, reason: 'Validation rule failed: "caption" must be a non-empty string' };
  }
  const wordCount = data.caption.trim().split(/\s+/).length;
  if (wordCount >= 8) {
    return { isValid: false, reason: `Validation rule failed: "caption" must be under 8 words (received ${wordCount} words: "${data.caption}")` };
  }

  return { isValid: true };
}

/**
 * Calls the LLM to analyze the dictated text and produce postcard parameters.
 * Supports Gemini and OpenAI providers depending on which API key is configured.
 */
async function callLLM(text) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  const prompt = `You are a postcard generator. Analyze the following dictation about someone's day and return art parameters.

Dictation: "${text}"

Respond with ONLY raw JSON matching this schema (no markdown, no explanations):
{
  "mood": "string describing mood",
  "palette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "shapes": "waves" | "circles" | "mountains" | "stars" | "grid",
  "density": 0.5,
  "caption": "short caption under 8 words"
}`;

  // Priority 1: Google Gemini API (native REST endpoint)
  if (geminiApiKey) {
    const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`LLM provider error (${response.status}): ${errorBody}`);
    }

    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  // Priority 2: OpenAI API
  if (openaiApiKey) {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You return ONLY valid JSON matching the exact schema requested.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`LLM provider error (${response.status}): ${errorBody}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || '';
  }

  throw new Error('Neither GEMINI_API_KEY nor OPENAI_API_KEY is defined in environment variables');
}

// POST /postcard endpoint
app.post('/postcard', async (req, res) => {
  const { text } = req.body || {};

  // Validate presence and type of text
  if (typeof text !== 'string') {
    return res.status(400).json({ error: 'Request body must include a "text" string.' });
  }

  // Enforce 1000 character maximum limit
  if (text.length > 1000) {
    return res.status(400).json({ error: 'Text must not exceed 1000 characters.' });
  }

  // 1. Call LLM
  let rawOutput;
  try {
    rawOutput = await callLLM(text);
  } catch (apiErr) {
    console.log(`Fallback used. Reason: ${apiErr.message}`);
    return res.json({
      source: 'fallback',
      ...DEFAULT_POSTCARD,
    });
  }

  // 2. Strip markdown fences and parse JSON
  let parsed;
  try {
    const cleaned = stripMarkdownFences(rawOutput);
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    console.log(`Fallback used. Reason: Parse failure (${parseErr.message})`);
    return res.json({
      source: 'fallback',
      ...DEFAULT_POSTCARD,
    });
  }

  // 3. Validate parsed output against schema rules
  const validation = validatePostcard(parsed);
  if (!validation.isValid) {
    console.log(`Fallback used. Reason: ${validation.reason}`);
    return res.json({
      source: 'fallback',
      ...DEFAULT_POSTCARD,
    });
  }

  // Return successfully parsed and validated LLM result
  return res.json({
    source: 'llm',
    mood: parsed.mood,
    palette: parsed.palette,
    shapes: parsed.shapes,
    density: parsed.density,
    caption: parsed.caption,
  });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Dictation Postcards server listening on http://localhost:${PORT}`);
});
