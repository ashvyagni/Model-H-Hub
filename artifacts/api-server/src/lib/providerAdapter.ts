/**
 * Provider adapter — wraps each AI provider's API for model listing and chat.
 */
import type { Provider } from "@workspace/db";

export interface DiscoveredModel {
  id: string;
  name: string;
  contextLength: number | null;
  supportsVision: boolean;
  supportsReasoning: boolean;
  supportsFunctionCalling: boolean;
  supportsImageGeneration: boolean;
  supportsAudio: boolean;
  supportsEmbeddings: boolean;
  supportsStreaming: boolean;
  supportsJsonMode: boolean;
}

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ChatOptions {
  messages: ChatMessage[];
  model: string;
  systemPrompt?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  seed?: number | null;
  stop?: string[];
  responseFormat?: string | null;
  tools?: string | null;
}

export interface ChatResult {
  content: string;
  latencyMs: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costEstimate?: number | null;
  rawResponse?: string;
  rawRequest?: string;
}

/**
 * Get the effective base URL for a provider.
 */
function getBaseUrl(provider: Provider): string {
  if (provider.baseUrl) return provider.baseUrl.replace(/\/$/, "");

  const defaults: Record<string, string> = {
    openai: "https://api.openai.com/v1",
    anthropic: "https://api.anthropic.com",
    gemini: "https://generativelanguage.googleapis.com/v1beta",
    openrouter: "https://openrouter.ai/api/v1",
    groq: "https://api.groq.com/openai/v1",
    cohere: "https://api.cohere.ai/v1",
    together: "https://api.together.xyz/v1",
    fireworks: "https://api.fireworks.ai/inference/v1",
    mistral: "https://api.mistral.ai/v1",
    deepseek: "https://api.deepseek.com/v1",
    xai: "https://api.x.ai/v1",
    perplexity: "https://api.perplexity.ai",
    nvidia: "https://integrate.api.nvidia.com/v1",
  };
  return defaults[provider.providerType] ?? "";
}

/**
 * Build HTTP headers for a provider request.
 */
function buildHeaders(provider: Provider, extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };

  if (provider.apiKey) {
    if (provider.providerType === "anthropic") {
      headers["x-api-key"] = provider.apiKey;
      headers["anthropic-version"] = "2023-06-01";
    } else {
      headers["Authorization"] = `Bearer ${provider.apiKey}`;
    }
  }

  if (provider.organizationId) {
    headers["OpenAI-Organization"] = provider.organizationId;
  }

  // Apply custom headers from JSON string
  if (provider.customHeaders) {
    try {
      const custom = JSON.parse(provider.customHeaders);
      Object.assign(headers, custom);
    } catch {
      // ignore invalid JSON
    }
  }

  return headers;
}

/**
 * Infer model capabilities from model ID strings.
 */
function inferCapabilities(modelId: string): Partial<DiscoveredModel> {
  const lower = modelId.toLowerCase();
  return {
    supportsVision: lower.includes("vision") || lower.includes("4o") || lower.includes("claude-3") || lower.includes("gemini"),
    supportsReasoning: lower.includes("o1") || lower.includes("o3") || lower.includes("reasoning") || lower.includes("think"),
    supportsFunctionCalling: !lower.includes("embedding") && !lower.includes("whisper") && !lower.includes("tts") && !lower.includes("dall"),
    supportsImageGeneration: lower.includes("dall-e") || lower.includes("imagen") || lower.includes("flux") || lower.includes("stable-diffusion"),
    supportsAudio: lower.includes("whisper") || lower.includes("tts") || lower.includes("audio"),
    supportsEmbeddings: lower.includes("embedding") || lower.includes("embed"),
    supportsStreaming: !lower.includes("embedding") && !lower.includes("dall") && !lower.includes("tts"),
    supportsJsonMode: !lower.includes("embedding") && !lower.includes("dall") && !lower.includes("tts"),
  };
}

/**
 * Fetch available models from an OpenAI-compatible /models endpoint.
 */
async function fetchOpenAICompatibleModels(provider: Provider): Promise<DiscoveredModel[]> {
  const baseUrl = getBaseUrl(provider);
  const headers = buildHeaders(provider);

  const resp = await fetch(`${baseUrl}/models`, { headers });
  if (!resp.ok) throw new Error(`Failed to fetch models: ${resp.status} ${resp.statusText}`);

  const data = await resp.json() as { data?: Array<{ id: string; name?: string }> };
  const items = data.data ?? [];

  return items.map((item) => ({
    id: item.id,
    name: item.name ?? item.id,
    contextLength: null,
    ...inferCapabilities(item.id),
  } as DiscoveredModel));
}

/**
 * List models for a given provider.
 */
export async function listModels(provider: Provider): Promise<DiscoveredModel[]> {
  try {
    switch (provider.providerType) {
      case "openai":
      case "openrouter":
      case "groq":
      case "together":
      case "fireworks":
      case "mistral":
      case "deepseek":
      case "xai":
      case "perplexity":
      case "nvidia":
      case "azure_openai":
      case "custom":
        return await fetchOpenAICompatibleModels(provider);

      case "anthropic":
        // Anthropic doesn't have a public /models endpoint — return known models
        return [
          { id: "claude-opus-4-5", name: "Claude Opus 4.5", contextLength: 200000, supportsVision: true, supportsReasoning: true, supportsFunctionCalling: true, supportsImageGeneration: false, supportsAudio: false, supportsEmbeddings: false, supportsStreaming: true, supportsJsonMode: true },
          { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", contextLength: 200000, supportsVision: true, supportsReasoning: false, supportsFunctionCalling: true, supportsImageGeneration: false, supportsAudio: false, supportsEmbeddings: false, supportsStreaming: true, supportsJsonMode: true },
          { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", contextLength: 200000, supportsVision: true, supportsReasoning: false, supportsFunctionCalling: true, supportsImageGeneration: false, supportsAudio: false, supportsEmbeddings: false, supportsStreaming: true, supportsJsonMode: true },
          { id: "claude-3-opus-20240229", name: "Claude 3 Opus", contextLength: 200000, supportsVision: true, supportsReasoning: false, supportsFunctionCalling: true, supportsImageGeneration: false, supportsAudio: false, supportsEmbeddings: false, supportsStreaming: true, supportsJsonMode: true },
        ];

      case "gemini":
        return [
          { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", contextLength: 1048576, supportsVision: true, supportsReasoning: false, supportsFunctionCalling: true, supportsImageGeneration: false, supportsAudio: true, supportsEmbeddings: false, supportsStreaming: true, supportsJsonMode: true },
          { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", contextLength: 2097152, supportsVision: true, supportsReasoning: false, supportsFunctionCalling: true, supportsImageGeneration: false, supportsAudio: true, supportsEmbeddings: false, supportsStreaming: true, supportsJsonMode: true },
          { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", contextLength: 1048576, supportsVision: true, supportsReasoning: false, supportsFunctionCalling: true, supportsImageGeneration: false, supportsAudio: true, supportsEmbeddings: false, supportsStreaming: true, supportsJsonMode: true },
          { id: "text-embedding-004", name: "Text Embedding 004", contextLength: 2048, supportsVision: false, supportsReasoning: false, supportsFunctionCalling: false, supportsImageGeneration: false, supportsAudio: false, supportsEmbeddings: true, supportsStreaming: false, supportsJsonMode: false },
        ];

      default:
        return await fetchOpenAICompatibleModels(provider);
    }
  } catch (err) {
    throw new Error(`Model discovery failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Test provider connectivity by pinging /models or a simple endpoint.
 */
export async function testProvider(provider: Provider): Promise<{ success: boolean; latencyMs: number; message?: string; modelsEndpointWorking: boolean }> {
  const start = Date.now();

  try {
    if (provider.providerType === "anthropic") {
      // Anthropic: make a minimal completion request
      const baseUrl = getBaseUrl(provider);
      const headers = buildHeaders(provider);
      const resp = await fetch(`${baseUrl}/v1/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        }),
      });
      const latencyMs = Date.now() - start;
      return { success: resp.ok || resp.status === 400, latencyMs, modelsEndpointWorking: false, message: resp.ok ? undefined : `Status ${resp.status}` };
    }

    const models = await listModels(provider);
    const latencyMs = Date.now() - start;
    return { success: true, latencyMs, modelsEndpointWorking: true, message: `Found ${models.length} models` };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return { success: false, latencyMs, modelsEndpointWorking: false, message: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Simple cost estimation per 1M tokens (very approximate).
 */
const PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "claude-opus-4-5": { input: 15, output: 75 },
  "claude-sonnet-4-5": { input: 3, output: 15 },
  "claude-3-5-haiku-20241022": { input: 0.8, output: 4 },
  "claude-3-opus-20240229": { input: 15, output: 75 },
  "gemini-1.5-pro": { input: 1.25, output: 5 },
  "gemini-1.5-flash": { input: 0.075, output: 0.3 },
  "llama-3.1-70b-versatile": { input: 0.59, output: 0.79 },
};

export function estimateCost(model: string, promptTokens: number, completionTokens: number): number | null {
  const pricing = Object.entries(PRICING).find(([key]) => model.toLowerCase().includes(key.toLowerCase()));
  if (!pricing) return null;
  const [, prices] = pricing;
  return (promptTokens / 1_000_000) * prices.input + (completionTokens / 1_000_000) * prices.output;
}

/**
 * Send a chat completion through an OpenAI-compatible provider.
 */
export async function chat(provider: Provider, opts: ChatOptions): Promise<ChatResult> {
  const start = Date.now();
  const baseUrl = getBaseUrl(provider);
  const headers = buildHeaders(provider);

  const messages: ChatMessage[] = [];
  if (opts.systemPrompt) {
    messages.push({ role: "system", content: opts.systemPrompt });
  }
  messages.push(...opts.messages);

  const body: Record<string, unknown> = {
    model: opts.model,
    messages,
  };

  if (opts.temperature !== undefined) body.temperature = opts.temperature;
  if (opts.topP !== undefined) body.top_p = opts.topP;
  if (opts.maxTokens !== undefined) body.max_tokens = opts.maxTokens;
  if (opts.presencePenalty !== undefined) body.presence_penalty = opts.presencePenalty;
  if (opts.frequencyPenalty !== undefined) body.frequency_penalty = opts.frequencyPenalty;
  if (opts.seed !== undefined && opts.seed !== null) body.seed = opts.seed;
  if (opts.stop?.length) body.stop = opts.stop;
  if (opts.responseFormat === "json") body.response_format = { type: "json_object" };
  if (opts.tools) {
    try { body.tools = JSON.parse(opts.tools); } catch { /* ignore */ }
  }

  const rawRequest = JSON.stringify(body, null, 2);

  let endpoint = `${baseUrl}/chat/completions`;

  // Handle Anthropic separately
  if (provider.providerType === "anthropic") {
    endpoint = `${baseUrl}/v1/messages`;
    const anthropicBody: Record<string, unknown> = {
      model: opts.model,
      max_tokens: opts.maxTokens ?? 4096,
      messages: opts.messages,
    };
    if (opts.systemPrompt) anthropicBody.system = opts.systemPrompt;
    if (opts.temperature !== undefined) anthropicBody.temperature = opts.temperature;

    const resp = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(anthropicBody),
    });

    const latencyMs = Date.now() - start;
    const rawResp = await resp.text();

    if (!resp.ok) {
      throw new Error(`Anthropic API error ${resp.status}: ${rawResp}`);
    }

    const data = JSON.parse(rawResp) as {
      content?: Array<{ type: string; text: string }>;
      usage?: { input_tokens: number; output_tokens: number };
    };

    const content = data.content?.find((c) => c.type === "text")?.text ?? "";
    const usage = data.usage ? {
      promptTokens: data.usage.input_tokens,
      completionTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens,
    } : undefined;

    return {
      content,
      latencyMs,
      usage,
      costEstimate: usage ? estimateCost(opts.model, usage.promptTokens, usage.completionTokens) : null,
      rawResponse: rawResp,
      rawRequest: JSON.stringify(anthropicBody, null, 2),
    };
  }

  // Use provider's custom endpoint if set
  if (provider.endpoint) {
    endpoint = provider.endpoint;
  }

  const resp = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const latencyMs = Date.now() - start;
  const rawResp = await resp.text();

  if (!resp.ok) {
    throw new Error(`Provider API error ${resp.status}: ${rawResp}`);
  }

  const data = JSON.parse(rawResp) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };

  const content = data.choices?.[0]?.message?.content ?? "";
  const usage = data.usage ? {
    promptTokens: data.usage.prompt_tokens,
    completionTokens: data.usage.completion_tokens,
    totalTokens: data.usage.total_tokens,
  } : undefined;

  return {
    content,
    latencyMs,
    usage,
    costEstimate: usage ? estimateCost(opts.model, usage.promptTokens, usage.completionTokens) : null,
    rawResponse: rawResp,
    rawRequest,
  };
}
