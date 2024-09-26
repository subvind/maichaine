import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { chat, MODELS } from '../Chat';

@Injectable()
export class ChatService {
  private openai: OpenAI;
  private nestcoderPrompt: string;
  private nestdepsguesserPrompt: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.loadPrompts();
  }

  private async loadPrompts() {
    const promptsDir = path.join(process.cwd(), 'prompts');
    this.nestcoderPrompt = await fs.readFile(path.join(promptsDir, 'nestcoder.prompt.text'), 'utf-8');
    this.nestdepsguesserPrompt = await fs.readFile(path.join(promptsDir, 'nestdepsguesser.prompt.text'), 'utf-8');
  }

  async *getAiResponseGenerator(message: string): AsyncGenerator<string, void, unknown> {
    try {
      const aiInput = await this.prepareAiInput(message);
      const ask = chat(MODELS.CODE_MODEL);
      const res = await ask(aiInput, { system: this.nestcoderPrompt, model: MODELS.CODE_MODEL });

      yield* this.processAiResponse(res);
    } catch (error) {
      console.error('Error getting AI response:', error);
      yield 'Sorry, I encountered an error while processing your request.';
    }
  }

  private async prepareAiInput(message: string): Promise<string> {
    // Implement logic to prepare AI input similar to nestcoder/main.mjs
    // This may include reading files, collecting dependencies, etc.
    // For now, we'll just return the message as is
    return message;
  }

  private async *processAiResponse(response: string): AsyncGenerator<string, void, unknown> {
    const fileMatches = response.matchAll(/<FILE path="([^"]+)">([\s\S]*?)<\/FILE>/g);
    for (const match of fileMatches) {
      const [, filePath, content] = match;
      yield `File: ${filePath}\n\n${content}\n\n`;
      await this.writeFile(filePath, content);
    }
  }

  private async writeFile(filePath: string, content: string) {
    try {
      const absolutePath = path.resolve(filePath);
      const currentDir = process.cwd();

      if (!absolutePath.startsWith(currentDir)) {
        console.error(`Error: Cannot write to file outside of current working directory: ${filePath}`);
        return;
      }

      const backupDir = path.join(currentDir, '.backup');
      await fs.mkdir(backupDir, { recursive: true });

      const backupPath = path.join(backupDir, path.relative(currentDir, absolutePath));
      await fs.mkdir(path.dirname(backupPath), { recursive: true });

      if (await fs.access(absolutePath).then(() => true).catch(() => false)) {
        await fs.copyFile(absolutePath, backupPath);
      }

      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, content, 'utf-8');

      console.log(`File updated successfully: ${filePath}`);
      console.log(`Backup created: ${backupPath}`);
    } catch (error) {
      console.error(`Error writing file ${filePath}: ${error.message}`);
    }
  }
}