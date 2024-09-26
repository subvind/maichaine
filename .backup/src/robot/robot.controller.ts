import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { RobotService } from './robot.service';

@Controller('robot')
export class RobotController {
  constructor(private readonly robotService: RobotService) {}

  @Post('move-mouse')
  moveMouse(@Body() body: { x: number; y: number }): string {
    this.robotService.moveMouse(body.x, body.y);
    return 'Mouse moved';
  }

  @Get('mouse-position')
  getMousePosition(): { x: number; y: number } {
    return this.robotService.getMousePos();
  }

  @Post('type')
  typeString(@Body('text') text: string): string {
    this.robotService.typeString(text);
    return 'Text typed';
  }

  // Add more endpoints as needed
}