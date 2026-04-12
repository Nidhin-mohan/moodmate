import { generate as geminiGenerate } from './gemini.provider';

interface GenerateOpts {
  model?: string;
  maxTokens?: number;
}

export async function generate(prompt: string, opts: GenerateOpts = {}) {
  try {
    const result = await geminiGenerate(prompt, opts);
    return { result, provider: 'gemini' };
  } catch (error: unknown) {
    const e = error as Record<string, unknown>;
    const status = e?.['status'] ?? (e?.['response'] as Record<string, unknown>)?.['status'];
    const msg = ((e?.['message'] as string) || '').toLowerCase();

    if (status === 429 || msg.includes('rate limit') || msg.includes('quota')) {
      const err = new Error('AI rate limit reached. Try again shortly.');
      (err as Error & { code: string }).code = 'AI_RATE_LIMITED';
      throw err;
    }

    throw error;
  }
}
