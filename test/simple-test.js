// Simple test to verify the fixes
const { CodeGenerator } = require('../out/generation/CodeGenerator');
const { ResponseParserFactory } = require('../out/generation/ResponseParser');

console.log('Testing JSON parsing fix...');

const jsonResponse = `
\`\`\`json
{
  "serverCode": "// Test server code",
  "readme": "# Test README",
  "usageExample": "// Test usage"
}
\`\`\`
`;

try {
  const parsed = ResponseParserFactory.parse(jsonResponse);
  console.log('✓ JSON parsing works:', parsed.serverCode === '// Test server code');
} catch (error) {
  console.log('✗ JSON parsing failed:', error.message);
}

console.log('Testing CodeGenerator...');

try {
  const generator = new CodeGenerator();
  const options = {
    description: 'Test server',
    language: 'typescript',
    transport: 'stdio',
    outputPath: '/tmp/test',
    serverName: 'test-server'
  };

  const structure = generator.generateProjectStructure(options, parsed);
  console.log('✓ CodeGenerator works:', structure.files['server.ts'] !== undefined);
} catch (error) {
  console.log('✗ CodeGenerator failed:', error.message);
}

console.log('Tests completed.');