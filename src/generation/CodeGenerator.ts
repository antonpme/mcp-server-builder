import * as fs from 'fs';
import * as path from 'path';
import { ResponseParserFactory } from './ResponseParser';
import { TemplateRegistry, TemplateVariables } from './Templates';

export interface GenerationOptions {
  description: string;
  language: 'typescript' | 'javascript' | 'python';
  transport: 'stdio' | 'sse';
  outputPath: string;
  serverName: string;
}

export interface ParsedResponse {
  serverCode: string;
  packageJson?: string;
  readme?: string;
  installInstructions?: string;
  usageExample?: string;
  dependencies?: string[];
  devDependencies?: string[];
  scripts?: Record<string, string>;
  additionalFiles?: Record<string, string>;
}

export interface ProjectStructure {
  directories: string[];
  files: Record<string, string>;
}

export class CodeGenerator {
  private templateRegistry: TemplateRegistry;
  private fileGenerators: Map<string, FileGenerator>;

  constructor() {
    this.templateRegistry = new TemplateRegistry();
    this.fileGenerators = new Map();

    this.initializeFileGenerators();
  }

  /**
   * Generate a complete MCP server project from OpenAI response
   */
  public async generateProject(options: GenerationOptions, openAIResponse: string): Promise<void> {
    try {
      // Validate inputs
      this.validateGenerationOptions(options);
      this.validateOpenAIResponse(openAIResponse);

      // Parse the OpenAI response
      const parsedResponse = this.parseResponse(openAIResponse);

      // Generate project structure
      const projectStructure = this.generateProjectStructure(options, parsedResponse);

      // Validate project structure
      this.validateProjectStructure(projectStructure);

      // Create directories
      this.createDirectories(options.outputPath, projectStructure.directories);

      // Create files
      await this.createFiles(options.outputPath, projectStructure.files);

      // Post-process generated files
      await this.postProcessFiles(options.outputPath, options.language);

    } catch (error) {
      throw new Error(`Failed to generate project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse OpenAI API response into structured data
   */
  public parseResponse(response: string): ParsedResponse {
    return ResponseParserFactory.parse(response);
  }

  /**
   * Generate project structure based on language and parsed response
   */
  public generateProjectStructure(options: GenerationOptions, parsedResponse: ParsedResponse): ProjectStructure {
    const fileGenerator = this.fileGenerators.get(options.language);
    if (!fileGenerator) {
      throw new Error(`No file generator found for language: ${options.language}`);
    }
    
    return fileGenerator.generateStructure(options, parsedResponse);
  }

  /**
   * Create project directories
   */
  private createDirectories(basePath: string, directories: string[]): void {
    directories.forEach(dir => {
      const fullPath = path.join(basePath, dir);
      try {
        if (!fs.existsSync(fullPath)) {
          fs.mkdirSync(fullPath, { recursive: true });
        }
      } catch (error) {
        throw new Error(`Failed to create directory ${fullPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }

  /**
   * Create project files
   */
  private async createFiles(basePath: string, files: Record<string, string>): Promise<void> {
    const createdFiles: string[] = [];
    const failedFiles: Array<{file: string, error: string}> = [];

    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(basePath, filePath);

      try {
        const dir = path.dirname(fullPath);

        // Ensure directory exists
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Validate content
        if (typeof content !== 'string') {
          throw new Error('File content must be a string');
        }

        // Write file
        fs.writeFileSync(fullPath, content, 'utf8');
        createdFiles.push(filePath);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        failedFiles.push({ file: filePath, error: errorMessage });
      }
    }

    // Report results
    if (failedFiles.length > 0) {
      const errorDetails = failedFiles.map(f => `${f.file}: ${f.error}`).join('\n');
      throw new Error(`Failed to create ${failedFiles.length} file(s):\n${errorDetails}`);
    }

    if (createdFiles.length > 0) {
      console.log(`Successfully created ${createdFiles.length} file(s)`);
    }
  }

  /**
   * Post-process generated files (formatting, etc.)
   */
  private async postProcessFiles(outputPath: string, language: string): Promise<void> {
    // Language-specific post-processing
    switch (language) {
      case 'typescript':
        await this.postProcessTypeScript(outputPath);
        break;
      case 'javascript':
        await this.postProcessJavaScript(outputPath);
        break;
      case 'python':
        await this.postProcessPython(outputPath);
        break;
    }
  }

  /**
   * Initialize file generators
   */
  private initializeFileGenerators(): void {
    this.fileGenerators.set('typescript', new TypeScriptFileGenerator(this.templateRegistry));
    this.fileGenerators.set('javascript', new JavaScriptFileGenerator(this.templateRegistry));
    this.fileGenerators.set('python', new PythonFileGenerator(this.templateRegistry));
  }

  /**
   * Post-process TypeScript files
   */
  private async postProcessTypeScript(outputPath: string): Promise<void> {
    // Could add Prettier formatting here
    // For now, just ensure proper file structure
  }

  /**
   * Post-process JavaScript files
   */
  private async postProcessJavaScript(outputPath: string): Promise<void> {
    // Could add Prettier formatting here
    // For now, just ensure proper file structure
  }

  /**
   * Post-process Python files
   */
  private async postProcessPython(outputPath: string): Promise<void> {
    // Could add Black formatting here
    // For now, just ensure proper file structure
  }

  /**
   * Validate generation options
   */
  private validateGenerationOptions(options: GenerationOptions): void {
    if (!options.description || options.description.trim().length === 0) {
      throw new Error('Server description cannot be empty.');
    }

    if (!options.outputPath || options.outputPath.trim().length === 0) {
      throw new Error('Output path cannot be empty.');
    }

    if (!options.serverName || options.serverName.trim().length === 0) {
      throw new Error('Server name cannot be empty.');
    }

    const validLanguages = ['typescript', 'javascript', 'python'];
    if (!validLanguages.includes(options.language)) {
      throw new Error(`Invalid language: ${options.language}. Must be one of: ${validLanguages.join(', ')}`);
    }

    const validTransports = ['stdio', 'sse'];
    if (!validTransports.includes(options.transport)) {
      throw new Error(`Invalid transport: ${options.transport}. Must be one of: ${validTransports.join(', ')}`);
    }

    // Check if output path exists and is accessible
    try {
      fs.accessSync(path.dirname(options.outputPath), fs.constants.W_OK);
    } catch (error) {
      throw new Error(`Output directory is not writable: ${path.dirname(options.outputPath)}`);
    }
  }

  /**
   * Validate OpenAI response
   */
  private validateOpenAIResponse(response: string): void {
    if (!response || response.trim().length === 0) {
      throw new Error('OpenAI response is empty.');
    }

    if (response.length < 10) {
      throw new Error('OpenAI response is too short to contain valid code.');
    }

    // Check for common error indicators
    const lowerResponse = response.toLowerCase();
    if (lowerResponse.includes('error') && lowerResponse.includes('failed')) {
      throw new Error('OpenAI response indicates an error occurred during generation.');
    }
  }

  /**
   * Validate project structure
   */
  private validateProjectStructure(structure: ProjectStructure): void {
    if (!structure.directories || !Array.isArray(structure.directories)) {
      throw new Error('Project structure must contain a directories array.');
    }

    if (!structure.files || typeof structure.files !== 'object') {
      throw new Error('Project structure must contain a files object.');
    }

    // Check if we have at least one file
    const fileCount = Object.keys(structure.files).length;
    if (fileCount === 0) {
      throw new Error('Project structure must contain at least one file.');
    }

    // Check for essential files based on language
    const hasServerFile = Object.keys(structure.files).some(file =>
      file.includes('server.') || file.includes('index.')
    );

    if (!hasServerFile) {
      throw new Error('Project structure must contain a main server file.');
    }
  }
}

/**
 * Response parser for JSON format
 */
class JsonResponseParser {
  parse(response: string): ParsedResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          serverCode: parsed.serverCode || '',
          packageJson: parsed.packageJson,
          readme: parsed.readme,
          installInstructions: parsed.installInstructions,
          usageExample: parsed.usageExample,
          dependencies: parsed.dependencies,
          devDependencies: parsed.devDependencies,
          scripts: parsed.scripts,
          additionalFiles: parsed.additionalFiles
        };
      }
      
      // Try to parse the entire response as JSON
      return JSON.parse(response);
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Response parser for markdown format
 */
class MarkdownResponseParser {
  parse(response: string): ParsedResponse {
    const result: ParsedResponse = {
      serverCode: '',
      readme: '',
      installInstructions: '',
      usageExample: ''
    };
    
    // Extract code blocks
    const codeBlockMatch = response.match(/```(?:typescript|javascript|python)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      result.serverCode = codeBlockMatch[1];
    }
    
    // Extract README content
    const readmeMatch = response.match(/## README\s*([\s\S]*?)(?=##|$)/);
    if (readmeMatch) {
      result.readme = readmeMatch[1].trim();
    }
    
    // Extract installation instructions
    const installMatch = response.match(/## Installation\s*([\s\S]*?)(?=##|$)/);
    if (installMatch) {
      result.installInstructions = installMatch[1].trim();
    }
    
    // Extract usage example
    const usageMatch = response.match(/## Usage\s*([\s\S]*?)(?=##|$)/);
    if (usageMatch) {
      result.usageExample = usageMatch[1].trim();
    }
    
    return result;
  }
}

/**
 * Response parser for plain text format
 */
class TextResponseParser {
  parse(response: string): ParsedResponse {
    return {
      serverCode: response,
      readme: this.generateBasicReadme(),
      installInstructions: this.generateBasicInstallInstructions(),
      usageExample: this.generateBasicUsageExample()
    };
  }
  
  private generateBasicReadme(): string {
    return `# MCP Server

A Model Context Protocol (MCP) server generated with MCP Server Builder.

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
  
  private generateBasicInstallInstructions(): string {
    return `1. Install dependencies: \`npm install\`
2. Configure the server in your MCP client
3. Start the server: \`npm start\``;
  }
  
  private generateBasicUsageExample(): string {
    return `// Example usage
const server = new MCPServer();
server.start();`;
  }
}

/**
 * Template engine for generating code
 */
class TemplateEngine {
  private templates: Map<string, string>;
  
  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }
  
  /**
   * Get a template by name
   */
  getTemplate(name: string): string {
    const template = this.templates.get(name);
    if (!template) {
      throw new Error(`Template not found: ${name}`);
    }
    return template;
  }
  
  /**
   * Render a template with variables
   */
  render(templateName: string, variables: Record<string, any>): string {
    const template = this.getTemplate(templateName);
    let rendered = template;
    
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value));
    }
    
    return rendered;
  }
  
  /**
   * Initialize templates
   */
  private initializeTemplates(): void {
    // TypeScript templates
    this.templates.set('typescript-server', this.getTypeScriptServerTemplate());
    this.templates.set('typescript-package', this.getTypeScriptPackageTemplate());
    this.templates.set('typescript-readme', this.getTypeScriptReadmeTemplate());
    
    // JavaScript templates
    this.templates.set('javascript-server', this.getJavaScriptServerTemplate());
    this.templates.set('javascript-package', this.getJavaScriptPackageTemplate());
    this.templates.set('javascript-readme', this.getJavaScriptReadmeTemplate());
    
    // Python templates
    this.templates.set('python-server', this.getPythonServerTemplate());
    this.templates.set('python-requirements', this.getPythonRequirementsTemplate());
    this.templates.set('python-readme', this.getPythonReadmeTemplate());
  }
  
  private getTypeScriptServerTemplate(): string {
    return `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

{{SERVER_CODE}}

const server = new Server(
  {
    name: '{{SERVER_NAME}}',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Tools will be defined here
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    // Tool implementations will be here
    throw new McpError(ErrorCode.MethodNotFound, \`Unknown tool: \${name}\`);
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, \`Tool execution failed: \${error instanceof Error ? error.message : 'Unknown error'}\`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('{{SERVER_NAME}} MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});`;
  }
  
  private getTypeScriptPackageTemplate(): string {
    return `{
  "name": "{{SERVER_NAME}}",
  "version": "1.0.0",
  "description": "{{DESCRIPTION}}",
  "main": "dist/server.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  },
  "keywords": ["mcp", "server", "model-context-protocol"],
  "author": "",
  "license": "MIT"
}`;
  }
  
  private getTypeScriptReadmeTemplate(): string {
    return `# {{SERVER_NAME}}

{{DESCRIPTION}}

## Installation

\`\`\`bash
npm install
npm run build
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## Configuration

Add this server to your MCP client configuration:

\`\`\`json
{
  "mcpServers": {
    "{{SERVER_NAME}}": {
      "command": "node",
      "args": ["dist/server.js"]
    }
  }
}
\`\`\`

{{USAGE_EXAMPLE}}

## License

MIT`;
  }
  
  private getJavaScriptServerTemplate(): string {
    return `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

{{SERVER_CODE}}

const server = new Server(
  {
    name: '{{SERVER_NAME}}',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Tools will be defined here
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    // Tool implementations will be here
    throw new McpError(ErrorCode.MethodNotFound, \`Unknown tool: \${name}\`);
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, \`Tool execution failed: \${error instanceof Error ? error.message : 'Unknown error'}\`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('{{SERVER_NAME}} MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});`;
  }
  
  private getJavaScriptPackageTemplate(): string {
    return `{
  "name": "{{SERVER_NAME}}",
  "version": "1.0.0",
  "description": "{{DESCRIPTION}}",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0"
  },
  "keywords": ["mcp", "server", "model-context-protocol"],
  "author": "",
  "license": "MIT"
}`;
  }
  
  private getJavaScriptReadmeTemplate(): string {
    return `# {{SERVER_NAME}}

{{DESCRIPTION}}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## Configuration

Add this server to your MCP client configuration:

\`\`\`json
{
  "mcpServers": {
    "{{SERVER_NAME}}": {
      "command": "node",
      "args": ["server.js"]
    }
  }
}
\`\`\`

{{USAGE_EXAMPLE}}

## License

MIT`;
  }
  
  private getPythonServerTemplate(): string {
    return `#!/usr/bin/env python3
"""
{{SERVER_NAME}} - {{DESCRIPTION}}
"""

import asyncio
import json
import sys
from typing import Any, Dict, List

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

{{SERVER_CODE}}

server = Server("{{SERVER_NAME}}")

@server.list_tools()
async def handle_list_tools() -> List[Tool]:
    """List available tools."""
    return [
        # Tools will be defined here
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """Handle tool calls."""
    try:
        # Tool implementations will be here
        raise ValueError(f"Unknown tool: {name}")
    except Exception as e:
        raise ValueError(f"Tool execution failed: {str(e)}")

async def main():
    """Run the server."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())`;
  }
  
  private getPythonRequirementsTemplate(): string {
    return `mcp>=1.0.0
asyncio
aiohttp
pydantic`;
  }
  
  private getPythonReadmeTemplate(): string {
    return `# {{SERVER_NAME}}

{{DESCRIPTION}}

## Installation

\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Usage

\`\`\`bash
python server.py
\`\`\`

## Configuration

Add this server to your MCP client configuration:

\`\`\`json
{
  "mcpServers": {
    "{{SERVER_NAME}}": {
      "command": "python",
      "args": ["server.py"]
    }
  }
}
\`\`\`

{{USAGE_EXAMPLE}}

## License

MIT`;
  }
}

/**
 * Base file generator interface
 */
interface FileGenerator {
  generateStructure(options: GenerationOptions, parsedResponse: ParsedResponse): ProjectStructure;
}

/**
 * TypeScript file generator
 */
class TypeScriptFileGenerator implements FileGenerator {
  constructor(private templateRegistry: TemplateRegistry) {}
  
  generateStructure(options: GenerationOptions, parsedResponse: ParsedResponse): ProjectStructure {
    const files: Record<string, string> = {};

    // Determine the best template to use
    const templateName = this.selectTemplate(options, parsedResponse);

    // Prepare template variables
    const variables: TemplateVariables = {
      SERVER_NAME: options.serverName,
      DESCRIPTION: options.description,
      TRANSPORT: options.transport,
      SERVER_CODE: parsedResponse.serverCode || '',
      TOOLS: parsedResponse.additionalFiles?.tools || '',
      RESOURCES: parsedResponse.additionalFiles?.resources || '',
      PROMPTS: parsedResponse.additionalFiles?.prompts || '',
      CUSTOM_CODE: parsedResponse.additionalFiles?.customCode || ''
    };

    // Generate main server file using the selected template
    const template = this.templateRegistry.getTemplate(templateName);
    if (template) {
      files['server.ts'] = this.templateRegistry.renderTemplate(templateName, variables);
    } else {
      // Fallback to basic template if not found
      files['server.ts'] = this.generateBasicServerCode(options, parsedResponse);
    }

    // Generate package.json
    files['package.json'] = this.generatePackageJson(options);

    // Generate tsconfig.json
    files['tsconfig.json'] = this.generateTypeScriptConfig();

    // Generate README.md
    files['README.md'] = this.generateReadme(options, parsedResponse);

    // Add additional files if provided
    if (parsedResponse.additionalFiles) {
      Object.assign(files, parsedResponse.additionalFiles);
    }

    return {
      directories: ['src', 'dist'],
      files
    };
  }
  
  private selectTemplate(options: GenerationOptions, parsedResponse: ParsedResponse): string {
    // Check if the response suggests a specific category
    const hasTools = parsedResponse.serverCode?.includes('tools') || parsedResponse.additionalFiles?.tools;
    const hasResources = parsedResponse.serverCode?.includes('resources') || parsedResponse.additionalFiles?.resources;
    const hasPrompts = parsedResponse.serverCode?.includes('prompts') || parsedResponse.additionalFiles?.prompts;
    
    if (hasTools && hasResources && hasPrompts) {
      return 'typescript-advanced';
    } else if (hasTools) {
      return 'typescript-tools';
    } else if (hasResources) {
      return 'typescript-resources';
    } else if (hasPrompts) {
      return 'typescript-prompts';
    }
    
    // Default to basic template
    return 'typescript-basic';
  }
  
  private generatePackageJson(options: GenerationOptions): string {
    return JSON.stringify({
      name: options.serverName,
      version: '1.0.0',
      description: options.description,
      main: 'dist/server.js',
      type: 'module',
      scripts: {
        build: 'tsc',
        start: 'node dist/server.js',
        dev: 'tsc --watch'
      },
      dependencies: {
        '@modelcontextprotocol/sdk': '^0.5.0'
      },
      devDependencies: {
        '@types/node': '^20.0.0',
        'typescript': '^5.0.0'
      },
      keywords: ['mcp', 'server', 'model-context-protocol'],
      author: '',
      license: 'MIT'
    }, null, 2);
  }
  
  private generateReadme(options: GenerationOptions, parsedResponse: ParsedResponse): string {
    return `# ${options.serverName}

${options.description}

## Installation

\`\`\`bash
npm install
npm run build
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## Configuration

Add this server to your MCP client configuration:

\`\`\`json
{
  "mcpServers": {
    "${options.serverName}": {
      "command": "node",
      "args": ["dist/server.js"]
    }
  }
}
\`\`\`

${parsedResponse.usageExample ? `## Usage Example\n\n${parsedResponse.usageExample}\n` : ''}
## License

MIT`;
  }
  
  private generateTypeScriptConfig(): string {
    return `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}`;
  }

  private generateBasicServerCode(options: GenerationOptions, parsedResponse: ParsedResponse): string {
    return `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * ${options.description}
 */

${parsedResponse.serverCode || '// Server implementation code goes here'}

const server = new Server(
  {
    name: '${options.serverName}',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'example_tool',
        description: 'An example tool that demonstrates the basic structure',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'A message to process',
            },
          },
          required: ['message'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'example_tool':
        return {
          content: [
            {
              type: 'text',
              text: \`Processed message: \${args.message}\`,
            },
          ],
        };

      default:
        throw new McpError(ErrorCode.MethodNotFound, \`Unknown tool: \${name}\`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, \`Tool execution failed: \${error instanceof Error ? error.message : 'Unknown error'}\`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('${options.serverName} MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});`;
  }
}

/**
 * JavaScript file generator
 */
class JavaScriptFileGenerator implements FileGenerator {
  constructor(private templateRegistry: TemplateRegistry) {}
  
  generateStructure(options: GenerationOptions, parsedResponse: ParsedResponse): ProjectStructure {
    const files: Record<string, string> = {};
    
    // Determine the best template to use
    const templateName = this.selectTemplate(options, parsedResponse);
    
    // Prepare template variables
    const variables: TemplateVariables = {
      SERVER_NAME: options.serverName,
      DESCRIPTION: options.description,
      TRANSPORT: options.transport,
      SERVER_CODE: parsedResponse.serverCode || '',
      TOOLS: parsedResponse.additionalFiles?.tools || '',
      RESOURCES: parsedResponse.additionalFiles?.resources || '',
      PROMPTS: parsedResponse.additionalFiles?.prompts || '',
      CUSTOM_CODE: parsedResponse.additionalFiles?.customCode || ''
    };
    
    // Generate main server file using the selected template
    files['server.js'] = this.templateRegistry.renderTemplate(templateName, variables);
    
    // Generate package.json
    files['package.json'] = this.generatePackageJson(options);
    
    // Generate README.md
    files['README.md'] = this.generateReadme(options, parsedResponse);
    
    // Add additional files if provided
    if (parsedResponse.additionalFiles) {
      Object.assign(files, parsedResponse.additionalFiles);
    }
    
    return {
      directories: ['src'],
      files
    };
  }
  
  private selectTemplate(options: GenerationOptions, parsedResponse: ParsedResponse): string {
    // Check if the response suggests a specific category
    const hasTools = parsedResponse.serverCode?.includes('tools') || parsedResponse.additionalFiles?.tools;
    const hasResources = parsedResponse.serverCode?.includes('resources') || parsedResponse.additionalFiles?.resources;
    const hasPrompts = parsedResponse.serverCode?.includes('prompts') || parsedResponse.additionalFiles?.prompts;
    
    if (hasTools && hasResources && hasPrompts) {
      return 'javascript-advanced';
    } else if (hasTools) {
      return 'javascript-tools';
    } else if (hasResources) {
      return 'javascript-resources';
    } else if (hasPrompts) {
      return 'javascript-prompts';
    }
    
    // Default to basic template
    return 'javascript-basic';
  }
  
  private generatePackageJson(options: GenerationOptions): string {
    return JSON.stringify({
      name: options.serverName,
      version: '1.0.0',
      description: options.description,
      main: 'server.js',
      type: 'module',
      scripts: {
        start: 'node server.js'
      },
      dependencies: {
        '@modelcontextprotocol/sdk': '^0.5.0'
      },
      keywords: ['mcp', 'server', 'model-context-protocol'],
      author: '',
      license: 'MIT'
    }, null, 2);
  }
  
  private generateReadme(options: GenerationOptions, parsedResponse: ParsedResponse): string {
    return `# ${options.serverName}

${options.description}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## Configuration

Add this server to your MCP client configuration:

\`\`\`json
{
  "mcpServers": {
    "${options.serverName}": {
      "command": "node",
      "args": ["server.js"]
    }
  }
}
\`\`\`

${parsedResponse.usageExample ? `## Usage Example\n\n${parsedResponse.usageExample}\n` : ''}
## License

MIT`;
  }
}

/**
 * Python file generator
 */
class PythonFileGenerator implements FileGenerator {
  constructor(private templateRegistry: TemplateRegistry) {}
  
  generateStructure(options: GenerationOptions, parsedResponse: ParsedResponse): ProjectStructure {
    const files: Record<string, string> = {};
    
    // Determine the best template to use
    const templateName = this.selectTemplate(options, parsedResponse);
    
    // Prepare template variables
    const variables: TemplateVariables = {
      SERVER_NAME: options.serverName,
      DESCRIPTION: options.description,
      TRANSPORT: options.transport,
      SERVER_CODE: parsedResponse.serverCode || '',
      TOOLS: parsedResponse.additionalFiles?.tools || '',
      RESOURCES: parsedResponse.additionalFiles?.resources || '',
      PROMPTS: parsedResponse.additionalFiles?.prompts || '',
      CUSTOM_CODE: parsedResponse.additionalFiles?.customCode || ''
    };
    
    // Generate main server file using the selected template
    files['server.py'] = this.templateRegistry.renderTemplate(templateName, variables);
    
    // Generate requirements.txt
    files['requirements.txt'] = this.generateRequirements();
    
    // Generate README.md
    files['README.md'] = this.generateReadme(options, parsedResponse);
    
    // Generate .gitignore
    files['.gitignore'] = this.generatePythonGitignore();
    
    // Add additional files if provided
    if (parsedResponse.additionalFiles) {
      Object.assign(files, parsedResponse.additionalFiles);
    }
    
    return {
      directories: ['src'],
      files
    };
  }
  
  private selectTemplate(options: GenerationOptions, parsedResponse: ParsedResponse): string {
    // Check if the response suggests a specific category
    const hasTools = parsedResponse.serverCode?.includes('tools') || parsedResponse.additionalFiles?.tools;
    const hasResources = parsedResponse.serverCode?.includes('resources') || parsedResponse.additionalFiles?.resources;
    const hasPrompts = parsedResponse.serverCode?.includes('prompts') || parsedResponse.additionalFiles?.prompts;
    
    if (hasTools && hasResources && hasPrompts) {
      return 'python-advanced';
    } else if (hasTools) {
      return 'python-tools';
    } else if (hasResources) {
      return 'python-resources';
    } else if (hasPrompts) {
      return 'python-prompts';
    }
    
    // Default to basic template
    return 'python-basic';
  }
  
  private generateRequirements(): string {
    return `mcp>=1.0.0
asyncio
aiohttp
pydantic`;
  }
  
  private generateReadme(options: GenerationOptions, parsedResponse: ParsedResponse): string {
    return `# ${options.serverName}

${options.description}

## Installation

\`\`\`bash
pip install -r requirements.txt
\`\`\`

## Usage

\`\`\`bash
python server.py
\`\`\`

## Configuration

Add this server to your MCP client configuration:

\`\`\`json
{
  "mcpServers": {
    "${options.serverName}": {
      "command": "python",
      "args": ["server.py"]
    }
  }
}
\`\`\`

${parsedResponse.usageExample ? `## Usage Example\n\n${parsedResponse.usageExample}\n` : ''}
## License

MIT`;
  }
  
  private generatePythonGitignore(): string {
    return `__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/
.pytest_cache/
.coverage
htmlcov/
.tox/
.cache
nosetests.xml
coverage.xml
*.cover
.hypothesis/
`;
  }
}