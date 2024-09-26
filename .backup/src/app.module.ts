import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RobotController } from './robot/robot.controller';
import { RobotService } from './robot/robot.service';

@Module({
  imports: [],
  controllers: [AppController, RobotController],
  providers: [AppService, RobotService],
})
export class AppModule {}