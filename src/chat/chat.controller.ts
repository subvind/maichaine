import { Controller, Get, Post, Body, Res, Render } from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @Render('chat')
  root() {
    return { messages: [] };
  }

  @Post('send')
  async sendMessage(@Body('message') message: string, @Res() res: Response) {
    const aiResponse = await this.chatService.getAiResponse(message);
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <div class="message user-message">${message}</div>
      <div class="message ai-message">${aiResponse}</div>
    `);
  }
}