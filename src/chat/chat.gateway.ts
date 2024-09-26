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

    // Get AI response in chunks
    const aiResponseGenerator = this.chatService.getAiResponseGenerator(message);

    for await (const chunk of aiResponseGenerator) {
      // Send AI response chunk to all clients
      this.server.clients.forEach((client) => {
        client.send(JSON.stringify({ type: 'ai', content: chunk, isChunk: true }));
      });
    }

    // Send a message to indicate the AI response is complete
    this.server.clients.forEach((client) => {
      client.send(JSON.stringify({ type: 'ai', isComplete: true }));
    });
  }
}