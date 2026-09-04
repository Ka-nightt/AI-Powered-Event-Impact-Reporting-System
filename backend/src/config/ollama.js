const axios = require('axios');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1';

/**
 * Sends a prompt to a locally running Ollama instance and returns the
 * generated text. Falls back to a clear error message (not a crash) if
 * Ollama isn't reachable, so report generation can still continue with a
 * placeholder rather than failing the whole request.
 */
async function generate(prompt, { temperature = 0.4 } = {}) {
  try {
    const response = await axios.post(
      `${OLLAMA_HOST}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: { temperature },
      },
      { timeout: 60000 }
    );
    return response.data.response?.trim() || '';
  } catch (err) {
    console.error('Ollama request failed:', err.message);
    throw new Error(
      `Could not reach local AI model at ${OLLAMA_HOST}. Is 'ollama serve' running and is '${OLLAMA_MODEL}' pulled?`
    );
  }
}

module.exports = { generate, OLLAMA_MODEL, OLLAMA_HOST };
