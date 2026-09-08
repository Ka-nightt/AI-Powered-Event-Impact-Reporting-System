const ollama = require("./ollama");
const openai = require("./openai");
const gemini = require("./gemini");

const PROVIDER = (process.env.AI_PROVIDER || "ollama").toLowerCase();

const providers = { ollama, openai, gemini };

if (!providers[PROVIDER]) {
  console.warn(`Unknown AI_PROVIDER "${PROVIDER}" - falling back to ollama.`);
}

const active = providers[PROVIDER] || ollama;

/**
 * Generates text using whichever AI provider is configured via the
 * AI_PROVIDER env var ('ollama', 'openai', or 'gemini'). All providers
 * expose the same generate(prompt, options) signature, so callers don't
 * need to know which one is active.
 */
async function generate(prompt, options) {
  return active.generate(prompt, options);
}

module.exports = {
  generate,
  activeProvider: providers[PROVIDER] ? PROVIDER : "ollama",
};
