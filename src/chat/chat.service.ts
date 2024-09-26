import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class ChatService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async *getAiResponseGenerator(message: string): AsyncGenerator<string, void, unknown> {
    try {
      const stream = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      yield 'Sorry, I encountered an error while processing your request.';
    }
  }
}