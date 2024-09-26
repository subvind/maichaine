import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import * as fs from 'fs/promises';
import * as path from 'path';
import { chat, MODELS, tokenCount } from '../Chat';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
      console.log(aiInput)
      const ask = chat(MODELS.CODE_MODEL);
      const res = await ask(aiInput, { system: this.nestcoderPrompt, model: MODELS.CODE_MODEL });

      yield* this.processAiResponse(res);
    } catch (error) {
      console.error('Error getting AI response:', error);
      yield 'Sorry, I encountered an error while processing your request.';
    }
  }

  private async prepareAiInput(message: string): Promise<string> {
    const { file, request } = this.parseMessage(message);
    const fileContent = await this.getFileContent(file);
    const deps = await this.predictDependencies(file, fileContent, request);
    const depFiles = await this.readDependentFiles(deps);

    return [
      ...depFiles,
      `<FILE path="${file}" TARGET>`,
      fileContent,
      '</FILE>',
      '<REQUEST>',
      request,
      '</REQUEST>'
    ].join('\n').trim();
  }

  private parseMessage(message: string): { file: string; request: string } {
    const parts = message.split(' ');
    const file = parts[0];
    const request = parts.slice(1).join(' ');
    return { file, request };
  }

  private async getFileContent(file: string): Promise<string> {
    try {
      return await fs.readFile(file, 'utf-8');
    } catch (e) {
      return "(empty file)";
    }
  }

  private async predictDependencies(file: string, fileContent: string, request: string): Promise<string[]> {
    const allFiles = await this.getAllNestFiles("./");
    const defsTree = this.buildTree(allFiles);

    const aiInput = [
      `<FILE path="${file}">`,
      fileContent.trim(),
      '</FILE>',
      '<TREE>',
      defsTree.trim(),
      '</TREE>',
      '<REQUEST>',
      request,
      '</REQUEST>'
    ].join('\n').trim();

    const ask = chat(MODELS.DEPS_MODEL);
    const res = await ask(aiInput, { system: this.nestdepsguesserPrompt, model: MODELS.DEPS_MODEL });

    const dependenciesMatch = res.match(/<DEPENDENCIES>([\s\S]*)<\/DEPENDENCIES>/);
    if (!dependenciesMatch) {
      console.error("Error: AI output does not contain a valid DEPENDENCIES tag.");
      return [];
    }

    return dependenciesMatch[1].trim().split('\n').map(dep => dep.trim());
  }

  private async getAllNestFiles(dir: string): Promise<any[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(entries.map(async (entry) => {
      const res = path.resolve(dir, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await this.getAllNestFiles(res);
        return subFiles.length > 0 ? { name: entry.name, children: subFiles } : null;
      } else if (
        entry.name.endsWith('.ts') 
        || entry.name.endsWith('.ejs') 
        || entry.name.endsWith('.stdout.txt')
      ) {
        return { name: entry.name };
      }
      return null;
    }));
    return files.filter(file => file !== null).map(file => ({...file, name: file.name.replace(/\/_$/, '')}));
  }

  private buildTree(files: any[], prefix = ''): string {
    let result = '';
    for (const file of files) {
      if (file.children) {
        result += `${prefix}- ${file.name}/\n`;
        result += this.buildTree(file.children, `${prefix}  `);
      } else {
        result += `${prefix}- ${file.name}\n`;
      }
    }
    return result;
  }

  private async readDependentFiles(deps: string[]): Promise<string[]> {
    const dir = process.cwd();
    return await Promise.all(deps.map(async (dep) => {
      let depPath, content;
      let possiblePaths = [
        path.join(dir, `${dep}.ts`),
        path.join(dir, `${dep}/_.ts`),
        path.join(dir, `${dep}.ejs`),
        path.join(dir, `${dep}.stdout.txt`)
      ];
      
      for (let possiblePath of possiblePaths) {
        try {
          content = await fs.readFile(possiblePath, 'utf-8');
          depPath = possiblePath;
          break;
        } catch (error) {
          // Continue to next possible path
        }
      }

      if (!depPath) {
        return "";
      }

      return `<FILE path="${depPath}">\n${content}\n</FILE>`;
    }));
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
