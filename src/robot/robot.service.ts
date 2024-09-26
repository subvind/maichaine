import { Injectable } from '@nestjs/common';
import { mouse, straightTo, keyboard, Point } from '@nut-tree-fork/nut-js';

@Injectable()
export class RobotService {
  async moveMouse(x: number, y: number): Promise<void> {
    await mouse.move(
      straightTo(
        new Point(x, y)
      )
    );
  }

  async getMousePos(): Promise<{ x: number; y: number }> {
    const position = await mouse.getPosition();
    return { x: position.x, y: position.y };
  }

  async typeString(text: string): Promise<void> {
    await keyboard.type(text);
  }

  // Add more NutJS functions as needed
}