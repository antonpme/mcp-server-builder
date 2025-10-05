import OpenAI from 'openai';
import { GenerationRequest, SupportedLanguage, SupportedTransport } from '../types';

export interface OpenAIServiceOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class OpenAIService {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly temperature: number;
  private readonly maxTokens: number;

  constructor(apiKey: string, options: OpenAIServiceOptions = {}) {
    const sanitizedKey = apiKey?.trim();
    if (!sanitizedKey) {
      throw new Error('OpenAI API key is required.');
    }

    this.client = new OpenAI({ apiKey: sanitizedKey });
    this.model = options.model ?? 'gpt-4o-mini';
    this.temperature = options.temperature ?? 0.15;
    this.maxTokens = options.maxTokens ?? 1800;
  }

  async generateServerSpecification(request: GenerationRequest): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        messages: [
          { role: 'system', content: this.buildSystemPrompt() },
          { role: 'user', content: this.buildUserPrompt(request) }
        ]
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Received empty response from OpenAI.');
      }

      return content.trim();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`OpenAI request failed: ${message}`);
    }
  }

  private buildSystemPrompt(): string {
    return [
      'You are an expert assistant that generates Model Context Protocol (MCP) servers.',
      'Always reply with a single JSON document wrapped in a ```json code block.',
      'The JSON must match the following structure:',
      '{',
      '  "serverCode": string,',
      '  "packageJson"?: string,',
      '  "readme"?: string,',
      '  "installInstructions"?: string,',
      '  "usageExample"?: string,',
      '  "dependencies"?: Record<string,string> | string[],',
      '  "devDependencies"?: Record<string,string> | string[],',
      '  "scripts"?: Record<string,string>,',
      '  "additionalFiles"?: Record<string,string>',
      '}',
      'When providing dependencies prefer Record<string,string> with semantic version ranges.',
      'Do not include any explanations outside the JSON code block.'
    ].join('\n');
  }

  private buildUserPrompt(request: GenerationRequest): string {
    const languageGuidance = this.getLanguageGuidance(request.language);
    const transportGuidance = this.getTransportGuidance(request.transport);

    return [
      `Goal: Create an MCP server for the following requirement: ${request.description.trim()}.`,
      `Preferred language: ${request.language}.`,
      `Transport: ${request.transport}.`,
      languageGuidance,
      transportGuidance,
      'Ensure the generated server exposes at least one meaningful tool with validation.',
      'Populate README, install instructions, and usage examples so a developer can quickly run the server.',
      'If additional helper files are needed (e.g., utilities, prompts, schemas), include them via the additionalFiles property.'
    ].join('\n');
  }

  private getLanguageGuidance(language: SupportedLanguage): string {
    switch (language) {
      case 'javascript':
        return 'Use modern JavaScript (ES2020) with ECMAScript modules. Provide a package.json with runnable scripts.';
      case 'python':
        return 'Use Python 3.10+ syntax. Include dependencies in a requirements.txt via additionalFiles when needed.';
      default:
        return 'Use TypeScript targeting Node.js 18+. Provide typesafe tool handlers and include a package.json.';
    }
  }

  private getTransportGuidance(transport: SupportedTransport): string {
    switch (transport) {
      case 'sse':
        return 'Configure the server for Server-Sent Events transport. Include any setup needed for SSE in the README.';
      default:
        return 'Configure the server for stdio transport.';
    }
  }
}
