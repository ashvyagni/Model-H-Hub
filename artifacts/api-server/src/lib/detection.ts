/**
 * Smart provider detection engine.
 * Uses API key prefixes, base URLs, and endpoint patterns to identify providers.
 */

export interface DetectionResult {
  detected: boolean;
  providerType: string | null;
  name: string | null;
  confidence: number;
  suggestedBaseUrl: string | null;
  reason: string | null;
}

interface ProviderPattern {
  type: string;
  name: string;
  baseUrl: string;
  keyPrefixes?: string[];
  urlPatterns?: string[];
  endpointPatterns?: string[];
}

const PROVIDER_PATTERNS: ProviderPattern[] = [
  {
    type: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    keyPrefixes: ["sk-proj-", "sk-"],
    urlPatterns: ["api.openai.com"],
    endpointPatterns: ["openai.com"],
  },
  {
    type: "anthropic",
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com",
    keyPrefixes: ["sk-ant-"],
    urlPatterns: ["api.anthropic.com"],
    endpointPatterns: ["anthropic.com"],
  },
  {
    type: "gemini",
    name: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    keyPrefixes: ["AIza"],
    urlPatterns: ["generativelanguage.googleapis.com", "aiplatform.googleapis.com"],
    endpointPatterns: ["googleapis.com"],
  },
  {
    type: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    keyPrefixes: ["sk-or-"],
    urlPatterns: ["openrouter.ai"],
    endpointPatterns: ["openrouter.ai"],
  },
  {
    type: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    keyPrefixes: ["gsk_"],
    urlPatterns: ["api.groq.com"],
    endpointPatterns: ["groq.com"],
  },
  {
    type: "cohere",
    name: "Cohere",
    baseUrl: "https://api.cohere.ai/v1",
    keyPrefixes: ["co_"],
    urlPatterns: ["api.cohere.ai"],
    endpointPatterns: ["cohere.ai"],
  },
  {
    type: "together",
    name: "Together AI",
    baseUrl: "https://api.together.xyz/v1",
    keyPrefixes: ["together_"],
    urlPatterns: ["api.together.xyz", "api.together.ai"],
    endpointPatterns: ["together.xyz", "together.ai"],
  },
  {
    type: "fireworks",
    name: "Fireworks AI",
    baseUrl: "https://api.fireworks.ai/inference/v1",
    keyPrefixes: ["fw_"],
    urlPatterns: ["api.fireworks.ai"],
    endpointPatterns: ["fireworks.ai"],
  },
  {
    type: "mistral",
    name: "Mistral AI",
    baseUrl: "https://api.mistral.ai/v1",
    keyPrefixes: ["mistral_", "MistralAI_"],
    urlPatterns: ["api.mistral.ai"],
    endpointPatterns: ["mistral.ai"],
  },
  {
    type: "deepseek",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    keyPrefixes: ["sk-", "deepseek_"],
    urlPatterns: ["api.deepseek.com"],
    endpointPatterns: ["deepseek.com"],
  },
  {
    type: "xai",
    name: "xAI (Grok)",
    baseUrl: "https://api.x.ai/v1",
    keyPrefixes: ["xai-"],
    urlPatterns: ["api.x.ai"],
    endpointPatterns: ["x.ai"],
  },
  {
    type: "perplexity",
    name: "Perplexity",
    baseUrl: "https://api.perplexity.ai",
    keyPrefixes: ["pplx-"],
    urlPatterns: ["api.perplexity.ai"],
    endpointPatterns: ["perplexity.ai"],
  },
  {
    type: "nvidia",
    name: "NVIDIA NIM",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    keyPrefixes: ["nvapi-"],
    urlPatterns: ["integrate.api.nvidia.com"],
    endpointPatterns: ["nvidia.com"],
  },
  {
    type: "azure_openai",
    name: "Azure OpenAI",
    baseUrl: "",
    keyPrefixes: [],
    urlPatterns: ["openai.azure.com", "cognitiveservices.azure.com"],
    endpointPatterns: ["azure.com", "openai.azure.com"],
  },
];

export function detectProvider(
  apiKey?: string,
  baseUrl?: string,
  endpoint?: string
): DetectionResult {
  const candidates: Array<{ pattern: ProviderPattern; score: number; reasons: string[] }> = [];

  for (const pattern of PROVIDER_PATTERNS) {
    let score = 0;
    const reasons: string[] = [];

    // Check API key prefixes
    if (apiKey && pattern.keyPrefixes && pattern.keyPrefixes.length > 0) {
      for (const prefix of pattern.keyPrefixes) {
        if (apiKey.startsWith(prefix)) {
          // Give higher weight to more specific/longer prefixes
          const specificity = prefix.length > 4 ? 60 : 40;
          score += specificity;
          reasons.push(`API key starts with "${prefix}"`);
          break;
        }
      }
    }

    // Check base URL patterns
    if (baseUrl && pattern.urlPatterns) {
      for (const urlPattern of pattern.urlPatterns) {
        if (baseUrl.toLowerCase().includes(urlPattern.toLowerCase())) {
          score += 80;
          reasons.push(`Base URL contains "${urlPattern}"`);
          break;
        }
      }
    }

    // Check endpoint patterns
    if (endpoint && pattern.endpointPatterns) {
      for (const epPattern of pattern.endpointPatterns) {
        if (endpoint.toLowerCase().includes(epPattern.toLowerCase())) {
          score += 70;
          reasons.push(`Endpoint contains "${epPattern}"`);
          break;
        }
      }
    }

    if (score > 0) {
      candidates.push({ pattern, score, reasons });
    }
  }

  if (candidates.length === 0) {
    return {
      detected: false,
      providerType: null,
      name: null,
      confidence: 0,
      suggestedBaseUrl: null,
      reason: "Could not detect provider from the provided information",
    };
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];

  // Normalize confidence to 0-100
  const confidence = Math.min(100, Math.round((best.score / 160) * 100));

  return {
    detected: true,
    providerType: best.pattern.type,
    name: best.pattern.name,
    confidence,
    suggestedBaseUrl: best.pattern.baseUrl || null,
    reason: best.reasons.join("; "),
  };
}
