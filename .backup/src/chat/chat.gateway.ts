import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'ws';
import { ChatService } from './chat.service';

@WebSocketGateway(8080)
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() message: string): Promise<void> {
    // Send user message to all clients
    this.server.clients.forEach((client) => {
      client.send(JSON.stringify({ type: 'user', content: message }));
    });

    // Get AI response
    const aiResponse = await this.chatService.getAiResponse(message);

    // Send AI response to all clients
    this.server.clients.forEach((client) => {
      client.send(JSON.stringify({ type: 'ai', content: aiResponse }));
    });
  }
}