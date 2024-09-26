import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RobotController } from './robot/robot.controller';
import { RobotService } from './robot/robot.service';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { ChatGateway } from './chat/chat.gateway';

@Module({
  imports: [],
  controllers: [AppController, RobotController, ChatController],
  providers: [AppService, RobotService, ChatService, ChatGateway],
})
export class AppModule {}