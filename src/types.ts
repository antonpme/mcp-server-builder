export type SupportedLanguage = 'typescript' | 'javascript' | 'python';
export type SupportedTransport = 'stdio' | 'sse';

export interface GenerationRequest {
  description: string;
  language: SupportedLanguage;
  transport: SupportedTransport;
  serverName?: string;
}
