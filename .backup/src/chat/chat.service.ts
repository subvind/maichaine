import { Injectable } from '@nestjs/common';
import { Configuration, OpenAIApi } from 'openai';

@Injectable()
export class ChatService {
  private openai: OpenAIApi;

  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
  }

  async getAiResponse(message: string): Promise<string> {
    try {
      const completion = await this.openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
      });
      return completion.data.choices[0].message.content || 'No response generated.';
    } catch (error) {
      console.error('Error getting AI response:', error);
      return 'Sorry, I encountered an error while processing your request.';
    }
  }
}