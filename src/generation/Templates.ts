/**
 * Template definitions for common MCP server patterns
 */

export interface TemplateVariables {
  SERVER_NAME: string;
  DESCRIPTION: string;
  TRANSPORT: string;
  SERVER_CODE?: string;
  TOOLS?: string;
  RESOURCES?: string;
  PROMPTS?: string;
  CUSTOM_CODE?: string;
}

export interface Template {
  name: string;
  description: string;
  language: 'typescript' | 'javascript' | 'python';
  category: 'basic' | 'tools' | 'resources' | 'prompts' | 'advanced';
  template: string;
  variables: string[];
}

export class TemplateRegistry {
  private templates: Map<string, Template> = new Map();
  
  constructor() {
    this.initializeTemplates();
  }
  
  /**
   * Get a template by name
   */
  getTemplate(name: string): Template | undefined {
    return this.templates.get(name);
  }
  
  /**
   * Get all templates
   */
  getAllTemplates(): Template[] {
    return Array.from(this.templates.values());
  }
  
  /**
   * Get templates by language
   */
  getTemplatesByLanguage(language: 'typescript' | 'javascript' | 'python'): Template[] {
    return this.getAllTemplates().filter(template => template.language === language);
  }
  
  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: 'basic' | 'tools' | 'resources' | 'prompts' | 'advanced'): Template[] {
    return this.getAllTemplates().filter(template => template.category === category);
  }
  
  /**
   * Render a template with variables
   */
  renderTemplate(templateName: string, variables: TemplateVariables): string {
    const template = this.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    let rendered = template.template;

    // Replace all variables in the template
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, String(value || ''));
    }

    // Check for any unreplaced variables and warn about them
    const unreplacedVars = rendered.match(/{{\s*[^}]+\s*}}/g);
    if (unreplacedVars) {
      console.warn(`Unreplaced variables in template ${templateName}:`, unreplacedVars);
      // Replace unreplaced variables with empty strings to prevent template syntax from appearing in output
      for (const varMatch of unreplacedVars) {
        const varName = varMatch.replace(/{{\s*|\s*}}/g, '');
        // If it's a known optional variable, replace with empty string
        if (['TOOLS', 'RESOURCES', 'PROMPTS', 'CUSTOM_CODE', 'USAGE_EXAMPLE'].includes(varName)) {
          rendered = rendered.replace(varMatch, '');
        } else {
          // For unknown variables, keep a placeholder but warn
          console.warn(`Unknown or missing variable in template ${templateName}: ${varName}`);
          rendered = rendered.replace(varMatch, `/* TODO: Replace ${varName} */`);
        }
      }
    }

    return rendered;
  }
  
  /**
   * Initialize all templates
   */
  private initializeTemplates(): void {
    // TypeScript Templates
    this.addTemplate(this.getTypeScriptBasicTemplate());
    this.addTemplate(this.getTypeScriptToolsTemplate());
    this.addTemplate(this.getTypeScriptResourcesTemplate());
    this.addTemplate(this.getTypeScriptPromptsTemplate());
    this.addTemplate(this.getTypeScriptAdvancedTemplate());
    
    // JavaScript Templates
    this.addTemplate(this.getJavaScriptBasicTemplate());
    this.addTemplate(this.getJavaScriptToolsTemplate());
    this.addTemplate(this.getJavaScriptResourcesTemplate());
    this.addTemplate(this.getJavaScriptPromptsTemplate());
    this.addTemplate(this.getJavaScriptAdvancedTemplate());
    
    // Python Templates
    this.addTemplate(this.getPythonBasicTemplate());
    this.addTemplate(this.getPythonToolsTemplate());
    this.addTemplate(this.getPythonResourcesTemplate());
    this.addTemplate(this.getPythonPromptsTemplate());
    this.addTemplate(this.getPythonAdvancedTemplate());
  }
  
  /**
   * Add a template to the registry
   */
  private addTemplate(template: Template): void {
    this.templates.set(template.name, template);
  }
  
  // TypeScript Templates
  
  private getTypeScriptBasicTemplate(): Template {
    return {
      name: 'typescript-basic',
      description: 'Basic TypeScript MCP server with minimal setup',
      language: 'typescript',
      category: 'basic',
      template: `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * {{DESCRIPTION}}
 */

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
  console.error('{{SERVER_NAME}} MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});`,
      variables: ['SERVER_NAME', 'DESCRIPTION', 'SERVER_CODE']
    };
  }
  
  private getTypeScriptToolsTemplate(): Template {
    return {
      name: 'typescript-tools',
      description: 'TypeScript MCP server focused on providing tools',
      language: 'typescript',
      category: 'tools',
      template: `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
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

{{TOOLS}}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    const tool = tools.find(t => t.name === name);
    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, \`Unknown tool: \${name}\`);
    }
    
    return await tool.handler(args);
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
});`,
      variables: ['SERVER_NAME', 'DESCRIPTION', 'SERVER_CODE', 'TOOLS']
    };
  }
  
  private getTypeScriptResourcesTemplate(): Template {
    return {
      name: 'typescript-resources',
      description: 'TypeScript MCP server focused on providing resources',
      language: 'typescript',
      category: 'resources',
      template: `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
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
      resources: {},
    },
  }
);

{{RESOURCES}}

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: resources.map(resource => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType,
    })),
  };
});

// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  try {
    const resource = resources.find(r => r.uri === uri);
    if (!resource) {
      throw new McpError(ErrorCode.InvalidRequest, \`Resource not found: \${uri}\`);
    }
    
    return {
      contents: [
        {
          uri,
          mimeType: resource.mimeType,
          text: await resource.getContent(),
        },
      ],
    };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, \`Failed to read resource: \${error instanceof Error ? error.message : 'Unknown error'}\`);
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
});`,
      variables: ['SERVER_NAME', 'DESCRIPTION', 'SERVER_CODE', 'RESOURCES']
    };
  }
  
  private getTypeScriptPromptsTemplate(): Template {
    return {
      name: 'typescript-prompts',
      description: 'TypeScript MCP server focused on providing prompts',
      language: 'typescript',
      category: 'prompts',
      template: `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
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
      prompts: {},
    },
  }
);

{{PROMPTS}}

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: prompts.map(prompt => ({
      name: prompt.name,
      description: prompt.description,
      arguments: prompt.arguments,
    })),
  };
});

// Get prompt content
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    const prompt = prompts.find(p => p.name === name);
    if (!prompt) {
      throw new McpError(ErrorCode.InvalidRequest, \`Prompt not found: \${name}\`);
    }
    
    return await prompt.getContent(args);
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, \`Failed to get prompt: \${error instanceof Error ? error.message : 'Unknown error'}\`);
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
});`,
      variables: ['SERVER_NAME', 'DESCRIPTION', 'SERVER_CODE', 'PROMPTS']
    };
  }
  
  private getTypeScriptAdvancedTemplate(): Template {
    return {
      name: 'typescript-advanced',
      description: 'Advanced TypeScript MCP server with tools, resources, and prompts',
      language: 'typescript',
      category: 'advanced',
      template: `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
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
      resources: {},
      prompts: {},
    },
  }
);

{{TOOLS}}
{{RESOURCES}}
{{PROMPTS}}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    const tool = tools.find(t => t.name === name);
    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, \`Unknown tool: \${name}\`);
    }
    
    return await tool.handler(args);
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, \`Tool execution failed: \${error instanceof Error ? error.message : 'Unknown error'}\`);
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: resources.map(resource => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType,
    })),
  };
});

// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  try {
    const resource = resources.find(r => r.uri === uri);
    if (!resource) {
      throw new McpError(ErrorCode.InvalidRequest, \`Resource not found: \${uri}\`);
    }
    
    return {
      contents: [
        {
          uri,
          mimeType: resource.mimeType,
          text: await resource.getContent(),
        },
      ],
    };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, \`Failed to read resource: \${error instanceof Error ? error.message : 'Unknown error'}\`);
  }
});

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: prompts.map(prompt => ({
      name: prompt.name,
      description: prompt.description,
      arguments: prompt.arguments,
    })),
  };
});

// Get prompt content
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    const prompt = prompts.find(p => p.name === name);
    if (!prompt) {
      throw new McpError(ErrorCode.InvalidRequest, \`Prompt not found: \${name}\`);
    }
    
    return await prompt.getContent(args);
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, \`Failed to get prompt: \${error instanceof Error ? error.message : 'Unknown error'}\`);
  }
});

{{CUSTOM_CODE}}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('{{SERVER_NAME}} MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});`,
      variables: ['SERVER_NAME', 'DESCRIPTION', 'SERVER_CODE', 'TOOLS', 'RESOURCES', 'PROMPTS', 'CUSTOM_CODE']
    };
  }
  
  // JavaScript Templates
  
  private getJavaScriptBasicTemplate(): Template {
    return {
      name: 'javascript-basic',
      description: 'Basic JavaScript MCP server with minimal setup',
      language: 'javascript',
      category: 'basic',
      template: `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
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
  console.error('{{SERVER_NAME}} MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});`,
      variables: ['SERVER_NAME', 'DESCRIPTION', 'SERVER_CODE']
    };
  }
  
  private getJavaScriptToolsTemplate(): Template {
    return {
      name: 'javascript-tools',
      description: 'JavaScript MCP server focused on providing tools',
      language: 'javascript',
      category: 'tools',
      template: `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
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

{{TOOLS}}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    const tool = tools.find(t => t.name === name);
    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, \`Unknown tool: \${name}\`);
    }
    
    return await tool.handler(args);
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
});`,
      variables: ['SERVER_NAME', 'DESCRIPTION', 'SERVER_CODE', 'TOOLS']
    };
  }
  
  private getJavaScriptResourcesTemplate(): Template {
    return {
      name: 'javascript-resources',
      description: 'JavaScript MCP server focused on providing resources',
      language: 'javascript',
      category: 'resources',
      template: `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
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
      resources: {},
    },
  }
);

{{RESOURCES}}

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: resources.map(resource => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType,
    })),
  };
});

// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  try {
    const resource = resources.find(r => r.uri === uri);
    if (!resource) {
      throw new McpError(ErrorCode.InvalidRequest, \`Resource not found: \${uri}\`);
    }
    
    return {
      contents: [
        {
          uri,
          mimeType: resource.mimeType,
          text: await resource.getContent(),
        },
      ],
    };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, \`Failed to read resource: \${error instanceof Error ? error.message : 'Unknown error'}\`);
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
});`,
      variables: ['SERVER_NAME', 'DESCRIPTION', 'SERVER_CODE', 'RESOURCES']
    };
  }
  
  private getJavaScriptPromptsTemplate(): Template {
    return {
      name: 'javascript-prompts',
      description: 'JavaScript MCP server focused on providing prompts',
      language: 'javascript',
      category: 'prompts',
      template: `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
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
      prompts: {},
    },
  }
);

{{PROMPTS}}

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: prompts.map(prompt => ({
      name: prompt.name,
      description: prompt.description,
      arguments: prompt.arguments,
    })),
  };
});

// Get prompt content
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    const prompt = prompts.find(p => p.name === name);
    if (!prompt) {
      throw new McpError(ErrorCode.InvalidRequest, \`Prompt not found: \${name}\`);
    }
    
    return await prompt.getContent(args);
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, \`Failed to get prompt: \${error instanceof Error ? error.message : 'Unknown error'}\`);
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
});`,
      variables: ['SERVER_NAME', 'DESCRIPTION', 'SERVER_CODE', 'PROMPTS']
    };
  }
  
  private getJavaScriptAdvancedTemplate(): Template {
    return {
      name: 'javascript-advanced',
      description: 'Advanced JavaScript MCP server with tools, resources, and prompts',
      language: 'javascript',
      category: 'advanced',
      template: `import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
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
      resources: {},
      prompts: {},
    },
  }
);

{{TOOLS}}
{{RESOURCES}}
{{PROMPTS}}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    const tool = tools.find(t => t.name === name);
    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, \`Unknown tool: \${name}\`);
    }
    
    return await tool.handler(args);
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, \`Tool execution failed: \${error instanceof Error ? error.message : 'Unknown error'}\`);
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: resources.map(resource => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType,
    })),
  };
});

// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  try {
    const resource = resources.find(r => r.uri === uri);
    if (!resource) {
      throw new McpError(ErrorCode.InvalidRequest, \`Resource not found: \${uri}\`);
    }
    
    return {
      contents: [
        {
          uri,
          mimeType: resource.mimeType,
          text: await resource.getContent(),
        },
      ],
    };
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, \`Failed to read resource: \${error instanceof Error ? error.message : 'Unknown error'}\`);
  }
});

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: prompts.map(prompt => ({
      name: prompt.name,
      description: prompt.description,
      arguments: prompt.arguments,
    })),
  };
});

// Get prompt content
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    const prompt = prompts.find(p => p.name === name);
    if (!prompt) {
      throw new McpError(ErrorCode.InvalidRequest, \`Prompt not found: \${name}\`);
    }
    
    return await prompt.getContent(args);
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, \`Failed to get prompt: \${error instanceof Error ? error.message : 'Unknown error'}\`);
  }
});

{{CUSTOM_CODE}}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('{{SERVER_NAME}} MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});`,
      variables: ['SERVER_NAME', 'DESCRIPTION', 'SERVER_CODE', 'TOOLS', 'RESOURCES', 'PROMPTS', 'CUSTOM_CODE']
    };
  }
  
  // Python Templates
  
  private getPythonBasicTemplate(): Template {
    return {
      name: 'python-basic',
      description: 'Basic Python MCP server with minimal setup',
      language: 'python',
      category: 'basic',
      template: `#!/usr/bin/env python3
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
        Tool(
            name="example_tool",
            description="An example tool that demonstrates the basic structure",
            inputSchema={
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "description": "A message to process",
                    },
                },
                "required": ["message"],
            },
        )
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """Handle tool calls."""
    try:
        if name == "example_tool":
            return [TextContent(type="text", text=f"Processed message: {arguments['message']}")]
        
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
    asyncio.run(main())`,
      variables: ['SERVER_NAME', 'DESCRIPTION', 'SERVER_CODE']
    };
  }
  
  private getPythonToolsTemplate(): Template {
    return {
      name: 'python-tools',
      description: 'Python MCP server focused on providing tools',
      language: 'python',
      category: 'tools',
      template: `#!/usr/bin/env python3
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

{{TOOLS}}

@server.list_tools()
async def handle_list_tools() -> List[Tool]:
    """List available tools."""
    return [
        Tool(
            name=tool["name"],
            description=tool["description"],
            inputSchema=tool["inputSchema"]
        )
        for tool in tools
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """Handle tool calls."""
    try:
        tool = next((t for t in tools if t["name"] == name), None)
        if not tool:
            raise ValueError(f"Unknown tool: {name}")
        
        return await tool["handler"](arguments)
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
    asyncio.run(main())`,
      variables: ['SERVER_NAME', 'DESCRIPTION', 'SERVER_CODE', 'TOOLS']
    };
  }
  
  private getPythonResourcesTemplate(): Template {
    return {
      name: 'python-resources',
      description: 'Python MCP server focused on providing resources',
      language: 'python',
      category: 'resources',
      template: `#!/usr/bin/env python3
"""
{{SERVER_NAME}} - {{DESCRIPTION}}
"""

import asyncio
import json
import sys
from typing import Any, Dict, List

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Resource, TextContent

{{SERVER_CODE}}

server = Server("{{SERVER_NAME}}")

{{RESOURCES}}

@server.list_resources()
async def handle_list_resources() -> List[Resource]:
    """List available resources."""
    return [
        Resource(
            uri=resource["uri"],
            name=resource["name"],
            description=resource["description"],
            mimeType=resource["mimeType"]
        )
        for resource in resources
    ]

@server.read_resource()
async def handle_read_resource(uri: str) -> List[TextContent]:
    """Read resource content."""
    try:
        resource = next((r for r in resources if r["uri"] == uri), None)
        if not resource:
            raise ValueError(f"Resource not found: {uri}")
        
        content = await resource["getContent"]()
        return [TextContent(type="text", text=content, uri=uri)]
    except Exception as e:
        raise ValueError(f"Failed to read resource: {str(e)}")

async def main():
    """Run the server."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())`,
      variables: ['SERVER_NAME', 'DESCRIPTION', 'SERVER_CODE', 'RESOURCES']
    };
  }
  
  private getPythonPromptsTemplate(): Template {
    return {
      name: 'python-prompts',
      description: 'Python MCP server focused on providing prompts',
      language: 'python',
      category: 'prompts',
      template: `#!/usr/bin/env python3
"""
{{SERVER_NAME}} - {{DESCRIPTION}}
"""

import asyncio
import json
import sys
from typing import Any, Dict, List

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Prompt, GetPromptResult

{{SERVER_CODE}}

server = Server("{{SERVER_NAME}}")

{{PROMPTS}}

@server.list_prompts()
async def handle_list_prompts() -> List[Prompt]:
    """List available prompts."""
    return [
        Prompt(
            name=prompt["name"],
            description=prompt["description"],
            arguments=prompt["arguments"]
        )
        for prompt in prompts
    ]

@server.get_prompt()
async def handle_get_prompt(name: str, arguments: Dict[str, Any]) -> GetPromptResult:
    """Get prompt content."""
    try:
        prompt = next((p for p in prompts if p["name"] == name), None)
        if not prompt:
            raise ValueError(f"Prompt not found: {name}")
        
        return await prompt["getContent"](arguments)
    except Exception as e:
        raise ValueError(f"Failed to get prompt: {str(e)}")

async def main():
    """Run the server."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())`,
      variables: ['SERVER_NAME', 'DESCRIPTION', 'SERVER_CODE', 'PROMPTS']
    };
  }
  
  private getPythonAdvancedTemplate(): Template {
    return {
      name: 'python-advanced',
      description: 'Advanced Python MCP server with tools, resources, and prompts',
      language: 'python',
      category: 'advanced',
      template: `#!/usr/bin/env python3
"""
{{SERVER_NAME}} - {{DESCRIPTION}}
"""

import asyncio
import json
import sys
from typing import Any, Dict, List

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, Resource, Prompt, TextContent, GetPromptResult

{{SERVER_CODE}}

server = Server("{{SERVER_NAME}}")

{{TOOLS}}
{{RESOURCES}}
{{PROMPTS}}

@server.list_tools()
async def handle_list_tools() -> List[Tool]:
    """List available tools."""
    return [
        Tool(
            name=tool["name"],
            description=tool["description"],
            inputSchema=tool["inputSchema"]
        )
        for tool in tools
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """Handle tool calls."""
    try:
        tool = next((t for t in tools if t["name"] == name), None)
        if not tool:
            raise ValueError(f"Unknown tool: {name}")
        
        return await tool["handler"](arguments)
    except Exception as e:
        raise ValueError(f"Tool execution failed: {str(e)}")

@server.list_resources()
async def handle_list_resources() -> List[Resource]:
    """List available resources."""
    return [
        Resource(
            uri=resource["uri"],
            name=resource["name"],
            description=resource["description"],
            mimeType=resource["mimeType"]
        )
        for resource in resources
    ]

@server.read_resource()
async def handle_read_resource(uri: str) -> List[TextContent]:
    """Read resource content."""
    try:
        resource = next((r for r in resources if r["uri"] == uri), None)
        if not resource:
            raise ValueError(f"Resource not found: {uri}")
        
        content = await resource["getContent"]()
        return [TextContent(type="text", text=content, uri=uri)]
    except Exception as e:
        raise ValueError(f"Failed to read resource: {str(e)}")

@server.list_prompts()
async def handle_list_prompts() -> List[Prompt]:
    """List available prompts."""
    return [
        Prompt(
            name=prompt["name"],
            description=prompt["description"],
            arguments=prompt["arguments"]
        )
        for prompt in prompts
    ]

@server.get_prompt()
async def handle_get_prompt(name: str, arguments: Dict[str, Any]) -> GetPromptResult:
    """Get prompt content."""
    try:
        prompt = next((p for p in prompts if p["name"] == name), None)
        if not prompt:
            raise ValueError(f"Prompt not found: {name}")
        
        return await prompt["getContent"](arguments)
    except Exception as e:
        raise ValueError(f"Failed to get prompt: {str(e)}")

{{CUSTOM_CODE}}

async def main():
    """Run the server."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())`,
      variables: ['SERVER_NAME', 'DESCRIPTION', 'SERVER_CODE', 'TOOLS', 'RESOURCES', 'PROMPTS', 'CUSTOM_CODE']
    };
  }
}