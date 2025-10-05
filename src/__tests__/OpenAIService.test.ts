const mockCreate = jest.fn();

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate
      }
    }
  }))
}));

import { OpenAIService } from '../services/OpenAIService';
import { GenerationRequest } from '../types';

const OpenAIFactory = require('openai').default as jest.Mock;

const request: GenerationRequest = {
  description: 'Provide weather data for a requested city',
  language: 'typescript',
  transport: 'stdio'
};

describe('OpenAIService', () => {
  beforeEach(() => {
    OpenAIFactory.mockClear();
    mockCreate.mockReset();
  });

  it('sends generation request and returns trimmed content', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '  generated content  ' } }]
    });

    const service = new OpenAIService('sk-test');
    const result = await service.generateServerSpecification(request);

    expect(OpenAIFactory).toHaveBeenCalledWith({ apiKey: 'sk-test' });
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const args = mockCreate.mock.calls[0][0];
    expect(args.model).toBe('gpt-4o-mini');
    expect(args.messages[1].content).toContain(request.description);
    expect(result).toBe('generated content');
  });

  it('throws when OpenAI returns empty content', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '' } }]
    });

    const service = new OpenAIService('sk-test');

    await expect(service.generateServerSpecification(request)).rejects.toThrow(
      'Received empty response from OpenAI.'
    );
  });

  it('wraps OpenAI failures with actionable message', async () => {
    mockCreate.mockRejectedValue(new Error('network down'));

    const service = new OpenAIService('sk-test');

    await expect(service.generateServerSpecification(request)).rejects.toThrow(
      'OpenAI request failed: network down'
    );
  });
});
