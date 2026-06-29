import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, providersTable, historyTable } from "@workspace/db";
import { PlaygroundChatBody } from "@workspace/api-zod";
import { chat, estimateCost } from "../lib/providerAdapter";

const router: IRouter = Router();

// POST /playground/chat
router.post("/playground/chat", async (req, res): Promise<void> => {
  const parsed = PlaygroundChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const [provider] = await db.select().from(providersTable).where(eq(providersTable.id, data.providerId));
  if (!provider) {
    res.status(400).json({ error: "Provider not found" });
    return;
  }

  if (!provider.enabled) {
    res.status(400).json({ error: "Provider is disabled" });
    return;
  }

  const startTime = Date.now();

  try {
    const result = await chat(provider, {
      messages: data.messages,
      model: data.model,
      systemPrompt: data.systemPrompt ?? undefined,
      temperature: data.temperature ?? undefined,
      topP: data.topP ?? undefined,
      maxTokens: data.maxTokens ?? undefined,
      presencePenalty: data.presencePenalty ?? undefined,
      frequencyPenalty: data.frequencyPenalty ?? undefined,
      seed: data.seed ?? undefined,
      stop: data.stop ?? undefined,
      responseFormat: data.responseFormat ?? undefined,
      tools: data.tools ?? undefined,
    });

    // Auto-save to history
    await db.insert(historyTable).values({
      providerId: data.providerId,
      model: data.model,
      requestType: "chat",
      status: "success",
      latencyMs: result.latencyMs,
      promptTokens: result.usage?.promptTokens,
      completionTokens: result.usage?.completionTokens,
      totalTokens: result.usage?.totalTokens,
      costEstimate: result.costEstimate ?? undefined,
      rawRequest: result.rawRequest,
      rawResponse: result.rawResponse,
    }).catch(() => { /* non-critical */ });

    res.json(result);
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Save failed request to history
    await db.insert(historyTable).values({
      providerId: data.providerId,
      model: data.model,
      requestType: "chat",
      status: "error",
      latencyMs,
      errorMessage,
      rawRequest: JSON.stringify(data),
    }).catch(() => { /* non-critical */ });

    res.status(400).json({ error: errorMessage });
  }
});

// POST /playground/stream — SSE streaming
router.post("/playground/stream", async (req, res): Promise<void> => {
  const parsed = PlaygroundChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const [provider] = await db.select().from(providersTable).where(eq(providersTable.id, data.providerId));
  if (!provider) {
    res.status(400).json({ error: "Provider not found" });
    return;
  }

  if (!provider.enabled) {
    res.status(400).json({ error: "Provider is disabled" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const baseUrl = provider.baseUrl ?? "";
  const apiKey = provider.apiKey ?? "";
  const startTime = Date.now();

  const messages: Array<{ role: string; content: string }> = [];
  if (data.systemPrompt) messages.push({ role: "system", content: data.systemPrompt });
  messages.push(...data.messages);

  const body = {
    model: data.model,
    messages,
    stream: true,
    temperature: data.temperature,
    top_p: data.topP,
    max_tokens: data.maxTokens,
    presence_penalty: data.presencePenalty,
    frequency_penalty: data.frequencyPenalty,
    seed: data.seed,
  };

  try {
    const url = provider.endpoint ?? `${baseUrl}/chat/completions`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    };

    if (provider.providerType === "anthropic") {
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";
      delete headers["Authorization"];
    }

    const upstream = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      res.write(`data: ${JSON.stringify({ error: text })}\n\n`);
      res.end();
      return;
    }

    let fullContent = "";
    const reader = upstream.body?.getReader();
    if (!reader) {
      res.end();
      return;
    }

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            res.write("data: [DONE]\n\n");
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content ?? "";
            if (content) {
              fullContent += content;
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch {
            // ignore parse errors in stream
          }
        }
      }
    }

    // Save to history
    const latencyMs = Date.now() - startTime;
    await db.insert(historyTable).values({
      providerId: data.providerId,
      model: data.model,
      requestType: "chat_stream",
      status: "success",
      latencyMs,
      rawRequest: JSON.stringify(body),
      rawResponse: fullContent,
    }).catch(() => { /* non-critical */ });

    res.end();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.end();
  }
});

export default router;
