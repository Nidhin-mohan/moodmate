import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface GenerateOpts {
  model?: string;
  maxTokens?: number;
}

export async function generate(prompt: string, opts: GenerateOpts = {}) {
  const response = await ai.models.generateContent({
    model: opts.model || 'gemini-2.5-flash',
    contents: prompt,
    config: {
      maxOutputTokens: opts.maxTokens || 1024,
    },
  });

  return response.text;
}
