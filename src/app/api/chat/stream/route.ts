import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { SYSTEM_PROMPT, prepareConversationContext } from '@/features/ai/shared/prompt-engineering';
import type { Message } from '@/features/ai/shared/types';

export const dynamic = 'force-dynamic';

// For local mode: the client sends provider and credentials in the request body

type AIProvider = 'anthropic' | 'openai' | 'ollama' | 'custom';

interface ValidatedRequest {
  messages: Message[];
  apiKey: string;
  provider: AIProvider;
  baseUrl: string;
  model: string;
}

function validateRequest(body: unknown): ValidatedRequest | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as {
    messages?: unknown;
    apiKey?: unknown;
    provider?: unknown;
    baseUrl?: unknown;
    model?: unknown;
  };

  if (!Array.isArray(b.messages)) return null;
  if (typeof b.apiKey !== 'string') return null;
  if (!['anthropic', 'openai', 'ollama', 'custom'].includes(b.provider as string)) return null;
  if (typeof b.baseUrl !== 'string') return null;
  if (typeof b.model !== 'string') return null;

  return {
    messages: b.messages,
    apiKey: b.apiKey,
    provider: b.provider as AIProvider,
    baseUrl: b.baseUrl,
    model: b.model,
  };
}

export async function POST(req: Request) {
  const body = await req.json();
  const validated = validateRequest(body);

  if (!validated) {
    return new Response('Invalid request', { status: 400 });
  }

  const { messages, apiKey, provider, baseUrl, model } = validated;

  // Format messages for AI API
  const aiMessages = prepareConversationContext(messages).map(m => ({
    role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
    content: m.content,
  }));

  if (provider === 'anthropic') {
    const anthropic = createAnthropic({
      apiKey: apiKey,
    });

    const result = await streamText({
      model: anthropic(model || 'claude-3-sonnet-20240229'),
      system: SYSTEM_PROMPT,
      messages: aiMessages,
      maxOutputTokens: 1024,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  }

  // All other providers use OpenAI-compatible API
  // This includes: openai, ollama, custom (DeepSeek, Gemini, Tongyi, Wenxin, etc.)
  const effectiveBaseUrl = baseUrl.endsWith('/v1') ? baseUrl : `${baseUrl}/v1`;
  const openai = createOpenAI({
    apiKey: apiKey || 'ollama', // Ollama doesn't require API key by default
    baseURL: effectiveBaseUrl,
  });

  const result = await streamText({
    model: openai(model),
    system: SYSTEM_PROMPT,
    messages: aiMessages,
    maxOutputTokens: 1024,
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
}
