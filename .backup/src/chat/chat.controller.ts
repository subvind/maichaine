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
    res.setHeader('Content-Type', 'text/html');
    
    // Send user message immediately
    res.write(`<div class="message user-message">${message}</div>`);

    // Get AI response
    const aiResponse = await this.chatService.getAiResponse(message);
    
    // Send AI response
    res.write(`<div class="message ai-message">${aiResponse}</div>`);
    
    res.end();
  }
}