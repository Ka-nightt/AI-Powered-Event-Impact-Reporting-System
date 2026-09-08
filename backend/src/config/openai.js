const axios = require("axios");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

/**
 * Sends a prompt to the OpenAI Chat Completions API and returns the
 * generated text. Mirrors the same generate(prompt) signature as
 * config/ollama.js so aiService.js can use either provider interchangeably.
 */
async function generate(prompt, { temperature = 0.4 } = {}) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set - cannot reach OpenAI.");
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: OPENAI_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 300000,
      },
    );
    return response.data.choices?.[0]?.message?.content?.trim() || "";
  } catch (err) {
    const detail = err.response?.data?.error?.message || err.message;
    console.error("OpenAI request failed:", detail);
    throw new Error(`Could not reach OpenAI (${OPENAI_MODEL}): ${detail}`);
  }
}

module.exports = { generate, OPENAI_MODEL };
