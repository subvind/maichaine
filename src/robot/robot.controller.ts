import { Controller, Get, Post, Body } from '@nestjs/common';
import { RobotService } from './robot.service';

@Controller('robot')
export class RobotController {
  constructor(private readonly robotService: RobotService) {}

  @Post('move-mouse')
  async moveMouse(@Body() body: { x: number; y: number }): Promise<string> {
    await this.robotService.moveMouse(body.x, body.y);
    return 'Mouse moved';
  }

  @Get('mouse-position')
  getMousePosition(): Promise<{ x: number; y: number }> {
    return this.robotService.getMousePos();
  }

  @Post('type')
  async typeString(@Body('text') text: string): Promise<string> {
    await this.robotService.typeString(text);
    return 'Text typed';
  }

  // Add more endpoints as needed
}