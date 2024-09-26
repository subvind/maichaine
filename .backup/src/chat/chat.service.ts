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

  async getAiResponse(message: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
      });
      return completion.choices[0].message.content || 'No response generated.';
    } catch (error) {
      console.error('Error getting AI response:', error);
      return 'Sorry, I encountered an error while processing your request.';
    }
  }
}