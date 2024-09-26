import { Controller, Get, Render, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @Render('chat')
  root() {
    return { messages: [] };
  }

  @Post('process')
  async processRequest(@Body('message') message: string) {
    const responseGenerator = this.chatService.getAiResponseGenerator(message);
    const responses = [];
    for await (const chunk of responseGenerator) {
      responses.push(chunk);
    }
    return { responses };
  }
}