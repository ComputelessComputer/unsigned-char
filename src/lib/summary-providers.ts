export type SummaryProviderId =
  | "openai"
  | "anthropic"
  | "google_generative_ai"
  | "openrouter"
  | "ollama"
  | "lmstudio"
  | "custom";

export type SummaryProviderDefinition = {
  id: SummaryProviderId;
  label: string;
  defaultBaseUrl: string;
  requiresApiKey: boolean;
  modelPlaceholder: string;
  help: string;
  modelPresets?: readonly SummaryModelPreset[];
};

export type SummaryModelPreset = {
  value: string;
  label: string;
  resolvedModel: string;
  aliases?: readonly string[];
  searchTerms?: readonly string[];
};

export const SUMMARY_PROVIDERS: readonly SummaryProviderDefinition[] = [
  {
    id: "openai",
    label: "OpenAI",
    defaultBaseUrl: "https://api.openai.com/v1",
    requiresApiKey: true,
    modelPlaceholder: "gpt-5.4-mini",
    help: "Use the standard OpenAI chat endpoint with your API key and model name.",
    modelPresets: [
      {
        value: "preset:openai:gpt-5.4",
        label: "GPT-5.4",
        resolvedModel: "gpt-5.4",
      },
      {
        value: "preset:openai:gpt-5.4-mini",
        label: "GPT-5.4 mini",
        resolvedModel: "gpt-5.4-mini",
      },
      {
        value: "preset:openai:gpt-5.4-nano",
        label: "GPT-5.4 nano",
        resolvedModel: "gpt-5.4-nano",
      },
    ],
  },
  {
    id: "anthropic",
    label: "Anthropic",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    requiresApiKey: true,
    modelPlaceholder: "claude-sonnet-4-6",
    help: "Uses Anthropic's Messages API. Add your API key and a Claude model.",
    modelPresets: [
      {
        value: "preset:anthropic:sonnet",
        label: "Sonnet",
        resolvedModel: "claude-sonnet-4-6",
        searchTerms: ["claude sonnet 4.6"],
      },
      {
        value: "preset:anthropic:opus",
        label: "Opus",
        resolvedModel: "claude-opus-4-6",
        searchTerms: ["claude opus 4.6"],
      },
      {
        value: "preset:anthropic:haiku",
        label: "Haiku",
        resolvedModel: "claude-haiku-4-5",
        aliases: ["claude-haiku-4-5-20251001"],
        searchTerms: ["claude haiku 4.5"],
      },
    ],
  },
  {
    id: "google_generative_ai",
    label: "Google Gemini",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
    requiresApiKey: true,
    modelPlaceholder: "gemini-2.5-flash",
    help: "Uses the Gemini generateContent API from Google AI Studio.",
    modelPresets: [
      {
        value: "preset:google_generative_ai:flash",
        label: "Flash",
        resolvedModel: "gemini-2.5-flash",
        searchTerms: ["gemini 2.5 flash"],
      },
      {
        value: "preset:google_generative_ai:pro",
        label: "Pro",
        resolvedModel: "gemini-2.5-pro",
        searchTerms: ["gemini 2.5 pro"],
      },
      {
        value: "preset:google_generative_ai:flash-lite",
        label: "Flash-Lite",
        resolvedModel: "gemini-2.5-flash-lite",
        searchTerms: ["gemini 2.5 flash-lite", "gemini 2.5 flash lite"],
      },
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    requiresApiKey: true,
    modelPlaceholder: "openai/gpt-5.4-mini",
    help: "Route summaries through OpenRouter with any supported chat model.",
  },
  {
    id: "ollama",
    label: "Ollama",
    defaultBaseUrl: "http://127.0.0.1:11434/v1",
    requiresApiKey: false,
    modelPlaceholder: "llama3.2",
    help: "Ensure `ollama serve` is running and that the model is already pulled locally.",
  },
  {
    id: "lmstudio",
    label: "LM Studio",
    defaultBaseUrl: "http://127.0.0.1:1234/v1",
    requiresApiKey: false,
    modelPlaceholder: "local-model-id",
    help: "Point to LM Studio's local server and use a loaded chat-capable model.",
  },
  {
    id: "custom",
    label: "Custom",
    defaultBaseUrl: "",
    requiresApiKey: false,
    modelPlaceholder: "model-name",
    help: "Use any OpenAI-compatible `/chat/completions` endpoint.",
  },
] as const;

export function getSummaryProviderDefinition(providerId: string) {
  return SUMMARY_PROVIDERS.find((provider) => provider.id === providerId) ?? null;
}

export function getSummaryProviderModelPresets(providerId: string) {
  return getSummaryProviderDefinition(providerId)?.modelPresets ?? [];
}

export function getSummaryModelPreset(providerId: string, model: string) {
  const trimmedModel = model.trim();
  if (!trimmedModel) {
    return null;
  }

  return (
    getSummaryProviderModelPresets(providerId).find(
      (preset) =>
        preset.value === trimmedModel ||
        preset.resolvedModel === trimmedModel ||
        preset.aliases?.includes(trimmedModel),
    ) ?? null
  );
}
