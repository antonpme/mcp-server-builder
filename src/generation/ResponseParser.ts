import { ParsedResponse } from './CodeGenerator';

/**
 * Abstract base class for response parsers
 */
export abstract class BaseResponseParser {
  abstract parse(response: string): ParsedResponse;
  
  /**
   * Extract JSON from a response string
   */
  protected extractJson(response: string): any | null {
    if (!response || response.trim().length === 0) {
      return null;
    }

    // Try to extract JSON from code blocks first
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        let jsonString = jsonMatch[1].trim();

        // Clean up the JSON string - remove any markdown formatting or extra content
        // Look for the first '{' and last '}' to extract just the JSON object
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonString = jsonString.substring(firstBrace, lastBrace + 1);
        }

        // Try to parse the cleaned JSON
        const parsed = JSON.parse(jsonString);
        if (this.validateJsonStructure(parsed)) {
          return parsed;
        }
      } catch (error) {
        console.warn('Failed to parse JSON from code block:', error instanceof Error ? error.message : 'Unknown error');
        // Continue to other extraction methods
      }
    }

    // Try to find JSON objects in the response using multiple approaches
    const jsonObjects = this.findJsonObjects(response);
    for (const jsonObject of jsonObjects) {
      try {
        const parsed = JSON.parse(jsonObject);
        if (this.validateJsonStructure(parsed)) {
          return parsed;
        }
      } catch (error) {
        // Continue to next potential JSON object
        continue;
      }
    }

    // Last resort: try to parse the entire response as JSON
    try {
      const parsed = JSON.parse(response.trim());
      if (this.validateJsonStructure(parsed)) {
        return parsed;
      }
    } catch (error) {
      // Not valid JSON
    }

    return null;
  }
  
  /**
   * Find all potential JSON objects in a string
   */
  private findJsonObjects(text: string): string[] {
    const jsonObjects: string[] = [];
    let braceCount = 0;
    let startIdx = -1;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === '{') {
        if (braceCount === 0) {
          startIdx = i;
        }
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        
        if (braceCount === 0 && startIdx !== -1) {
          // Found a complete JSON object
          jsonObjects.push(text.substring(startIdx, i + 1));
          startIdx = -1;
        } else if (braceCount < 0) {
          // Reset if we have more closing than opening braces
          braceCount = 0;
          startIdx = -1;
        }
      }
    }
    
    return jsonObjects;
  }

  /**
   * Validate JSON structure for MCP server generation
   */
  private validateJsonStructure(data: any): boolean {
    try {
      if (!data || typeof data !== 'object') {
        return false;
      }

      // Check for required fields
      const hasServerCode = data.serverCode && typeof data.serverCode === 'string' && data.serverCode.trim().length > 0;
      const hasCodeInOtherFields = (data.packageJson || data.readme || data.installInstructions || data.usageExample);

      if (!hasServerCode && !hasCodeInOtherFields) {
        return false;
      }

      // Validate field types
      const stringFields = ['serverCode', 'packageJson', 'readme', 'installInstructions', 'usageExample'];
      for (const field of stringFields) {
        if (data[field] !== undefined && typeof data[field] !== 'string') {
          return false;
        }
      }

      // Validate dependencies and scripts if present
      if (data.dependencies !== undefined && typeof data.dependencies !== 'object') {
        return false;
      }

      if (data.devDependencies !== undefined && typeof data.devDependencies !== 'object') {
        return false;
      }

      if (data.scripts !== undefined && typeof data.scripts !== 'object') {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Extract code blocks from a response
   */
  protected extractCodeBlocks(response: string): Record<string, string> {
    const codeBlocks: Record<string, string> = {};
    
    // Extract all code blocks with language hints
    const codeBlockRegex = /```(\w+)?\s*([\s\S]*?)\s*```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(response)) !== null) {
      const language = match[1] || 'unknown';
      const code = match[2];
      codeBlocks[language] = code;
    }
    
    return codeBlocks;
  }
  
  /**
   * Extract sections from a markdown response
   */
  protected extractSections(response: string): Record<string, string> {
    const sections: Record<string, string> = {};
    
    // Extract sections using markdown headers
    const sectionRegex = /##\s+(.+?)\s*([\s\S]*?)(?=##\s+|$)/g;
    let match;
    
    while ((match = sectionRegex.exec(response)) !== null) {
      const sectionName = match[1].toLowerCase().replace(/\s+/g, '_');
      const sectionContent = match[2].trim();
      sections[sectionName] = sectionContent;
    }
    
    return sections;
  }
  
  /**
   * Generate basic README if none provided
   */
  protected generateBasicReadme(serverName: string, description: string): string {
    return `# ${serverName}

${description}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## Configuration

Add this server to your MCP client configuration.

## License

MIT`;
  }
  
  /**
   * Generate basic installation instructions if none provided
   */
  protected generateBasicInstallInstructions(language: string): string {
    const configs: Record<string, string> = {
      typescript: '1. Install dependencies: `npm install`\n2. Build the project: `npm run build`\n3. Configure the server in your MCP client\n4. Start the server: `npm start`',
      javascript: '1. Install dependencies: `npm install`\n2. Configure the server in your MCP client\n3. Start the server: `npm start`',
      python: '1. Install dependencies: `pip install -r requirements.txt`\n2. Configure the server in your MCP client\n3. Start the server: `python server.py`'
    };
    
    return configs[language] || configs.typescript;
  }
  
  /**
   * Generate basic usage example if none provided
   */
  protected generateBasicUsageExample(): string {
    return `// Example usage
const server = new MCPServer();
server.start();`;
  }
}

/**
 * Parser for structured JSON responses
 */
export class JsonResponseParser extends BaseResponseParser {
  parse(response: string): ParsedResponse {
    const jsonData = this.extractJson(response);
    
    if (!jsonData) {
      throw new Error('No valid JSON found in response');
    }
    
    return {
      serverCode: jsonData.serverCode || '',
      packageJson: jsonData.packageJson,
      readme: jsonData.readme,
      installInstructions: jsonData.installInstructions,
      usageExample: jsonData.usageExample,
      dependencies: jsonData.dependencies,
      devDependencies: jsonData.devDependencies,
      scripts: jsonData.scripts,
      additionalFiles: jsonData.additionalFiles
    };
  }
}

/**
 * Parser for markdown-formatted responses
 */
export class MarkdownResponseParser extends BaseResponseParser {
  parse(response: string): ParsedResponse {
    const codeBlocks = this.extractCodeBlocks(response);
    const sections = this.extractSections(response);
    
    // Extract code from the Server Code section
    let serverCode = '';
    const serverCodeMatch = response.match(/##\s+Server\s+Code\s*([\s\S]*?)(?=##|$)/);
    if (serverCodeMatch) {
      const codeBlockMatch = serverCodeMatch[1].match(/```(?:typescript|javascript|python)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        serverCode = codeBlockMatch[1];
      }
    }
    
    // If no server code found, try other methods
    if (!serverCode) {
      if (sections.server_code) {
        serverCode = sections.server_code;
      } else if (sections.server) {
        serverCode = sections.server;
      } else if (codeBlocks.typescript || codeBlocks.javascript || codeBlocks.python) {
        serverCode = codeBlocks.typescript || codeBlocks.javascript || codeBlocks.python || '';
      } else if (codeBlocks.unknown) {
        serverCode = codeBlocks.unknown;
      }
    }
    
    // Extract README content
    let readme = sections.readme || sections.read_me || '';
    if (!readme && sections.overview) {
      readme = sections.overview;
    }
    
    // Extract installation instructions
    const installInstructions = sections.installation || sections.setup || sections.install;
    
    // Extract usage example
    const usageExample = sections.usage || sections.example || sections.how_to_use;
    
    // Extract additional files if present
    let additionalFiles: Record<string, string> | undefined;
    if (sections.files) {
      try {
        additionalFiles = JSON.parse(sections.files);
      } catch (error) {
        // Ignore parsing errors for additional files
      }
    }
    
    return {
      serverCode,
      readme,
      installInstructions,
      usageExample,
      additionalFiles
    };
  }
}

/**
 * Parser for plain text responses
 */
export class TextResponseParser extends BaseResponseParser {
  parse(response: string): ParsedResponse {
    // For plain text, assume the entire response is server code
    const serverCode = response.trim();
    
    return {
      serverCode,
      readme: this.generateBasicReadme('MCP Server', 'A Model Context Protocol server'),
      installInstructions: this.generateBasicInstallInstructions('typescript'),
      usageExample: this.generateBasicUsageExample()
    };
  }
}

/**
 * Parser for mixed format responses (combination of JSON, markdown, and code)
 */
export class MixedResponseParser extends BaseResponseParser {
  parse(response: string): ParsedResponse {
    const result: ParsedResponse = {
      serverCode: '',
      readme: '',
      installInstructions: '',
      usageExample: ''
    };
    
    // First try to extract JSON
    const jsonData = this.extractJson(response);
    if (jsonData) {
      result.serverCode = jsonData.serverCode || '';
      result.packageJson = jsonData.packageJson;
      result.readme = jsonData.readme;
      result.installInstructions = jsonData.installInstructions;
      result.usageExample = jsonData.usageExample;
      result.dependencies = jsonData.dependencies;
      result.devDependencies = jsonData.devDependencies;
      result.scripts = jsonData.scripts;
      result.additionalFiles = jsonData.additionalFiles;
    }
    
    // Then extract code blocks
    const codeBlocks = this.extractCodeBlocks(response);
    if (!result.serverCode && (codeBlocks.typescript || codeBlocks.javascript || codeBlocks.python)) {
      result.serverCode = codeBlocks.typescript || codeBlocks.javascript || codeBlocks.python || '';
    }
    
    // Then extract sections
    const sections = this.extractSections(response);
    if (!result.readme) {
      result.readme = sections.readme || sections.read_me || sections.overview || '';
    }
    
    if (!result.installInstructions) {
      result.installInstructions = sections.installation || sections.setup || sections.install || '';
    }
    
    if (!result.usageExample) {
      result.usageExample = sections.usage || sections.example || sections.how_to_use || '';
    }
    
    // If still no server code, try to extract it from the response
    if (!result.serverCode) {
      // Look for any code-like content
      const codeMatch = response.match(/(?:import|const|function|class|def|export)\s+[\s\S]{50,}/);
      if (codeMatch) {
        result.serverCode = codeMatch[0];
      } else {
        // Last resort: use the entire response as server code
        result.serverCode = response;
      }
    }
    
    // Generate fallback content if needed
    if (!result.readme) {
      result.readme = this.generateBasicReadme('MCP Server', 'A Model Context Protocol server');
    }
    
    if (!result.installInstructions) {
      result.installInstructions = this.generateBasicInstallInstructions('typescript');
    }
    
    if (!result.usageExample) {
      result.usageExample = this.generateBasicUsageExample();
    }
    
    return result;
  }
}

/**
 * Factory for creating response parsers
 */
export class ResponseParserFactory {
  private static parsers: Map<string, () => BaseResponseParser> = new Map([
    ['json', () => new JsonResponseParser()],
    ['markdown', () => new MarkdownResponseParser()],
    ['text', () => new TextResponseParser()],
    ['mixed', () => new MixedResponseParser()]
  ]);
  
  /**
   * Get a parser by type
   */
  static getParser(type: string): BaseResponseParser {
    const parserFactory = this.parsers.get(type);
    if (!parserFactory) {
      throw new Error(`Unknown parser type: ${type}`);
    }
    return parserFactory();
  }
  
  /**
   * Auto-detect the best parser for a response
   */
  static autoDetectParser(response: string): BaseResponseParser {
    // Check if response contains structured JSON
    if (response.includes('```json') || response.match(/^\s*\{[\s\S]*\}\s*$/m)) {
      return new JsonResponseParser();
    }
    
    // Check if response contains markdown formatting
    if (response.includes('##') || response.includes('```')) {
      return new MixedResponseParser();
    }
    
    // Default to text parser
    return new TextResponseParser();
  }
  
  /**
   * Parse a response using auto-detected parser
   */
  static parse(response: string): ParsedResponse {
    const parser = this.autoDetectParser(response);
    return parser.parse(response);
  }
}