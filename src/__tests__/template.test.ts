/**
 * Tests for PromptPackTemplate (LangChain integration)
 */

import { PromptPackTemplate, createPromptPackTemplate } from '../template';
import type { PromptPack } from '../types';

describe('PromptPackTemplate', () => {
  const mockPack: PromptPack = {
    id: 'test-pack',
    name: 'Test Pack',
    version: '1.0.0',
    template_engine: {
      version: 'v1',
      syntax: '{{variable}}',
    },
    prompts: {
      basic: {
        id: 'basic',
        name: 'Basic Prompt',
        version: '1.0.0',
        system_template: 'You are a {{role}} assistant.',
        variables: [
          {
            name: 'role',
            type: 'string',
            required: true,
          },
        ],
      },
      withParams: {
        id: 'withParams',
        name: 'With Parameters',
        version: '1.0.0',
        system_template: 'You are an assistant.',
        parameters: {
          temperature: 0.7,
          max_tokens: 1000,
        },
      },
      withValidators: {
        id: 'withValidators',
        name: 'With Validators',
        version: '1.0.0',
        system_template: 'You are an assistant.',
        validators: [
          {
            type: 'banned_words',
            enabled: true,
            fail_on_violation: false,
            params: {
              words: ['bad', 'evil'],
            },
          },
        ],
      },
      withTools: {
        id: 'withTools',
        name: 'With Tools',
        version: '1.0.0',
        system_template: 'You are an assistant.',
        tools: ['tool1', 'tool2'],
      },
      withMedia: {
        id: 'withMedia',
        name: 'With Media',
        version: '1.0.0',
        system_template: 'You are an assistant.',
        media: {
          enabled: true,
          supported_types: ['image', 'audio'],
        },
      },
      withModelOverrides: {
        id: 'withModelOverrides',
        name: 'With Model Overrides',
        version: '1.0.0',
        system_template: 'You are an assistant.',
        parameters: {
          temperature: 0.7,
        },
        model_overrides: {
          'gpt-4': {
            system_template: 'You are a GPT-4 assistant.',
            parameters: {
              temperature: 0.9,
            },
          },
          'claude-3': {
            system_template_prefix: '[Claude Mode] ',
            system_template_suffix: ' Be helpful.',
            parameters: {
              temperature: 0.8,
            },
          },
        },
      },
    },
    tools: {
      tool1: {
        name: 'tool1',
        description: 'Tool 1',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      tool2: {
        name: 'tool2',
        description: 'Tool 2',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },
  };

  describe('constructor', () => {
    it('should create a template with pack and promptId', () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'basic',
      });

      expect(template).toBeDefined();
    });

    it('should throw if prompt not found', () => {
      expect(() => {
        new PromptPackTemplate({
          pack: mockPack,
          promptId: 'nonexistent',
        });
      }).toThrow();
    });
  });

  describe('format', () => {
    it('should format a basic prompt', async () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'basic',
      });

      const result = await template.format({ role: 'helpful' });
      expect(result).toBe('You are a helpful assistant.');
    });

    it('should handle missing required variables', async () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'basic',
      });

      await expect(template.format({})).rejects.toThrow();
    });
  });

  describe('formatPromptValue', () => {
    it('should return ChatPromptValue', async () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'basic',
      });

      const result = await template.formatPromptValue({ role: 'helpful' });
      expect(result.toChatMessages).toBeDefined();
      
      const messages = result.toChatMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0]._getType()).toBe('system');
    });
  });

  describe('getParameters', () => {
    it('should return prompt parameters', () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'withParams',
      });

      const params = template.getParameters();
      expect(params).toEqual({
        temperature: 0.7,
        max_tokens: 1000,
      });
    });

    it('should return undefined if no parameters', () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'basic',
      });

      const params = template.getParameters();
      expect(params).toBeUndefined();
    });

    it('should apply model-specific parameter overrides', () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'withModelOverrides',
        modelId: 'gpt-4',
      });

      const params = template.getParameters();
      expect(params).toBeDefined();
      expect(params?.temperature).toBe(0.9);
    });

    it('should merge model-specific parameters with base parameters', () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'withModelOverrides',
        modelId: 'claude-3',
      });

      const params = template.getParameters();
      expect(params).toBeDefined();
      expect(params?.temperature).toBe(0.8);
    });
  });

  describe('getValidators', () => {
    it('should return validators', () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'withValidators',
      });

      const validators = template.getValidators();
      expect(validators).toHaveLength(1);
      expect(validators[0].type).toBe('banned_words');
    });

    it('should return empty array if no validators', () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'basic',
      });

      const validators = template.getValidators();
      expect(validators).toEqual([]);
    });
  });

  describe('getSystemTemplate', () => {
    it('should return system template string', () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'basic',
      });

      const systemTemplate = template.getSystemTemplate();
      expect(systemTemplate).toBe('You are a {{role}} assistant.');
    });

    it('should apply model-specific system template override', () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'withModelOverrides',
        modelId: 'gpt-4',
      });

      const systemTemplate = template.getSystemTemplate();
      expect(systemTemplate).toBe('You are a GPT-4 assistant.');
    });

    it('should apply system template prefix and suffix', () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'withModelOverrides',
        modelId: 'claude-3',
      });

      const systemTemplate = template.getSystemTemplate();
      expect(systemTemplate).toBe('[Claude Mode] You are an assistant. Be helpful.');
    });

    it('should use base template when no model override exists', () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'withModelOverrides',
        modelId: 'other-model',
      });

      const systemTemplate = template.getSystemTemplate();
      expect(systemTemplate).toBe('You are an assistant.');
    });
  });

  describe('filterTools', () => {
    it('should filter tools based on prompt allowed list', () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'withTools',
      });

      const allTools = [
        { name: 'tool1', description: 'Tool 1' },
        { name: 'tool2', description: 'Tool 2' },
        { name: 'tool3', description: 'Tool 3' },
      ] as Array<{ name: string; description: string }>;

      const filtered = template.filterTools(allTools);
      expect(filtered).toHaveLength(2);
      expect(filtered.map(t => t.name)).toEqual(['tool1', 'tool2']);
    });

    it('should return all tools if no allowlist', () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'basic',
      });

      const allTools = [
        { name: 'tool1', description: 'Tool 1' },
        { name: 'tool2', description: 'Tool 2' },
      ] as Array<{ name: string; description: string }>;

      const filtered = template.filterTools(allTools);
      expect(filtered).toHaveLength(2);
    });
  });

  describe('createValidationRunnable', () => {
    it('should create validation runnable with validators from pack', () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'withValidators',
      });

      const runnable = template.createValidationRunnable({});
      expect(runnable).toBeDefined();
      expect(runnable.invoke).toBeDefined();
    });

    it('should create validation runnable in strict mode', () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'withValidators',
      });

      const runnable = template.createValidationRunnable({}, { strict: true });
      expect(runnable).toBeDefined();
    });
  });



  describe('partial', () => {
    it('should create partial template with pre-filled values', async () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'basic',
      });

      const partial = await template.partial({ role: 'helpful' });
      expect(partial).toBeInstanceOf(PromptPackTemplate);
    });

    it('should preserve existing partial variables', async () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'basic',
        partialVariables: { role: 'assistant' },
      });

      const partial = await template.partial({ role: 'helpful' });
      expect(partial).toBeInstanceOf(PromptPackTemplate);
    });
  });

  describe('serialize', () => {
    it('should serialize template configuration', () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'basic',
      });

      const serialized = template.serialize();
      expect(serialized).toHaveProperty('_type');
      expect(serialized).toHaveProperty('pack_id');
      expect(serialized).toHaveProperty('prompt_id');
      expect(serialized.prompt_id).toBe('basic');
    });

    it('should include model overrides in serialization', () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'basic',
        modelId: 'gpt-4',
      });

      const serialized = template.serialize();
      expect(serialized.model_id).toBe('gpt-4');
    });
  });

  describe('multimodal support', () => {
    it('should detect multimodal support', () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'withMedia',
      });

      expect(template.isMultimodal()).toBe(true);
    });

    it('should return false for non-multimodal prompts', () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'basic',
      });

      expect(template.isMultimodal()).toBe(false);
    });

    it('should get media config', () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'withMedia',
      });

      const config = template.getMediaConfig();
      expect(config).toBeDefined();
      expect(config?.enabled).toBe(true);
    });
  });

  describe('getPromptConfig and getPack', () => {
    it('should get prompt config', () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'basic',
      });

      const config = template.getPromptConfig();
      expect(config.id).toBe('basic');
      expect(config.name).toBe('Basic Prompt');
    });

    it('should get full pack', () => {
      const template = new PromptPackTemplate({
        pack: mockPack,
        promptId: 'basic',
      });

      const pack = template.getPack();
      expect(pack.id).toBe('test-pack');
      expect(pack.name).toBe('Test Pack');
    });
  });

  describe('createPromptPackTemplate helper', () => {
    it('should create template using helper function', () => {
      const template = createPromptPackTemplate(mockPack, 'basic');
      
      expect(template).toBeInstanceOf(PromptPackTemplate);
      expect(template.getPromptConfig().id).toBe('basic');
    });

    it('should accept options in helper function', () => {
      const template = createPromptPackTemplate(mockPack, 'basic', {
        modelId: 'gpt-4',
      });
      
      expect(template).toBeInstanceOf(PromptPackTemplate);
    });
  });
});
