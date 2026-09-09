const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

/**
 * Sends a prompt to the Gemini API (Google AI Studio's free tier) and
 * returns the generated text. Mirrors the same generate(prompt) signature
 * as config/ollama.js and config/openai.js so aiService.js can use any of
 * the three interchangeably.
 */
async function generate(prompt, { temperature = 0.4 } = {}) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set - cannot reach Gemini.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  try {
    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature },
      },
      {
        headers: {
          'x-goog-api-key': GEMINI_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );
    const parts = response.data.candidates?.[0]?.content?.parts;
    return parts?.map((p) => p.text).join('').trim() || '';
  } catch (err) {
    const detail = err.response?.data?.error?.message || err.message;
    console.error('Gemini request failed:', detail);
    throw new Error(`Could not reach Gemini (${GEMINI_MODEL}): ${detail}`);
  }
}

module.exports = { generate, GEMINI_MODEL };
