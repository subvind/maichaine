import OpenAI from 'openai';

export const MODELS = {
  DEPS_MODEL: "gpt-3.5-turbo",
  CODE_MODEL: "gpt-3.5-turbo",
};

export function chat(model: string) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  return async function ask(input: string, options: { system: string; model: string }) {
    const { system, model } = options;
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: input },
      ],
      temperature: 0,
    });

    return response.choices[0].message.content || '';
  };
}

export function tokenCount(text: string): number {
  // Implement token counting logic here
  // For simplicity, we'll just return the character count divided by 4 (rough estimate)
  return Math.ceil(text.length / 4);
}