import { Injectable } from '@nestjs/common';
import * as robot from 'robotjs';

@Injectable()
export class RobotService {
  moveMouse(x: number, y: number): void {
    robot.moveMouse(x, y);
  }

  getMousePos(): { x: number; y: number } {
    return robot.getMousePos();
  }

  typeString(text: string): void {
    robot.typeString(text);
  }

  // Add more RobotJS functions as needed
}