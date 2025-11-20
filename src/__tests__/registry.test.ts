/**
 * Tests for PromptPackRegistry
 */

import { PromptPackRegistry, NotFoundError } from '../registry';
import { PromptPack } from '../types';

describe('PromptPackRegistry', () => {
  const mockPack: PromptPack = {
    id: 'test-pack',
    name: 'Test Pack',
    version: '1.0.0',
    template_engine: {
      version: 'v1',
      syntax: '{{variable}}',
    },
    prompts: {
      test: {
        id: 'test',
        name: 'Test Prompt',
        version: '1.0.0',
        system_template: 'Test template',
      },
    },
  };

  describe('register and get', () => {
    it('should register and retrieve a pack', () => {
      const registry = new PromptPackRegistry();
      registry.register(mockPack);

      const pack = registry.getPack('test-pack');
      expect(pack).toEqual(mockPack);
    });

    it('should throw NotFoundError for unknown pack', () => {
      const registry = new PromptPackRegistry();
      expect(() => registry.getPack('unknown')).toThrow(NotFoundError);
    });

    it('should register multiple packs', () => {
      const registry = new PromptPackRegistry();
      const pack2 = { ...mockPack, id: 'pack2', name: 'Pack 2' };

      registry.registerMany([mockPack, pack2]);
      expect(registry.size()).toBe(2);
    });
  });

  describe('getPrompt', () => {
    it('should retrieve a specific prompt', () => {
      const registry = new PromptPackRegistry();
      registry.register(mockPack);

      const prompt = registry.getPrompt('test-pack', 'test');
      expect(prompt.id).toBe('test');
      expect(prompt.name).toBe('Test Prompt');
    });

    it('should throw NotFoundError for unknown prompt', () => {
      const registry = new PromptPackRegistry();
      registry.register(mockPack);

      expect(() => registry.getPrompt('test-pack', 'unknown')).toThrow(NotFoundError);
    });
  });

  describe('hasPack and hasPrompt', () => {
    it('should check if pack exists', () => {
      const registry = new PromptPackRegistry();
      registry.register(mockPack);

      expect(registry.hasPack('test-pack')).toBe(true);
      expect(registry.hasPack('unknown')).toBe(false);
    });

    it('should check if prompt exists', () => {
      const registry = new PromptPackRegistry();
      registry.register(mockPack);

      expect(registry.hasPrompt('test-pack', 'test')).toBe(true);
      expect(registry.hasPrompt('test-pack', 'unknown')).toBe(false);
    });
  });

  describe('list methods', () => {
    it('should list all pack IDs', () => {
      const registry = new PromptPackRegistry();
      const pack2 = { ...mockPack, id: 'pack2' };

      registry.registerMany([mockPack, pack2]);
      const packs = registry.listPacks();

      expect(packs).toContain('test-pack');
      expect(packs).toContain('pack2');
      expect(packs.length).toBe(2);
    });

    it('should list prompt IDs in a pack', () => {
      const registry = new PromptPackRegistry();
      const packWithMultiplePrompts: PromptPack = {
        ...mockPack,
        prompts: {
          prompt1: { id: 'prompt1', name: 'P1', version: '1.0.0', system_template: 'T1' },
          prompt2: { id: 'prompt2', name: 'P2', version: '1.0.0', system_template: 'T2' },
        },
      };

      registry.register(packWithMultiplePrompts);
      const prompts = registry.listPrompts('test-pack');

      expect(prompts).toContain('prompt1');
      expect(prompts).toContain('prompt2');
      expect(prompts.length).toBe(2);
    });
  });

  describe('unregister and clear', () => {
    it('should unregister a pack', () => {
      const registry = new PromptPackRegistry();
      registry.register(mockPack);

      expect(registry.hasPack('test-pack')).toBe(true);
      registry.unregister('test-pack');
      expect(registry.hasPack('test-pack')).toBe(false);
    });

    it('should clear all packs', () => {
      const registry = new PromptPackRegistry();
      registry.registerMany([mockPack, { ...mockPack, id: 'pack2' }]);

      expect(registry.size()).toBe(2);
      registry.clear();
      expect(registry.size()).toBe(0);
    });
  });

  describe('loadFromString', () => {
    it('should load a pack from JSON string', () => {
      const json = JSON.stringify(mockPack);
      const pack = PromptPackRegistry.loadFromString(json);

      expect(pack.id).toBe('test-pack');
      expect(pack.name).toBe('Test Pack');
    });

    it('should validate pack if requested', () => {
      const invalidPack = { id: 'test' }; // Missing required fields
      const json = JSON.stringify(invalidPack);

      expect(() => {
        PromptPackRegistry.loadFromString(json, { validate: true });
      }).toThrow();
    });
  });

  describe('getPackMetadata', () => {
    it('should return pack metadata', () => {
      const registry = new PromptPackRegistry();
      registry.register(mockPack);

      const metadata = registry.getPackMetadata('test-pack');
      expect(metadata.id).toBe('test-pack');
      expect(metadata.name).toBe('Test Pack');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.promptCount).toBe(1);
    });
  });

  describe('loadAndRegister', () => {
    it('should load from file and register', () => {
      const registry = new PromptPackRegistry();
      const pack = registry.loadAndRegister('examples/packs/customer-support.json');
      
      expect(registry.hasPack(pack.id)).toBe(true);
      expect(pack.name).toBeDefined();
    });
  });



  describe('loadFromString validation', () => {
    it('should throw on invalid JSON', () => {
      expect(() => {
        PromptPackRegistry.loadFromString('invalid json');
      }).toThrow();
    });

    it('should validate pack with missing id', () => {
      const invalidPack = {
        name: 'Test',
        version: '1.0.0',
        template_engine: { version: 'v1', syntax: '{{}}' },
        prompts: { test: { id: 'test', name: 'T', version: '1.0', system_template: 'T' } },
      };
      
      expect(() => {
        PromptPackRegistry.loadFromString(JSON.stringify(invalidPack), { validate: true });
      }).toThrow('must have a valid id');
    });

    it('should validate pack with missing name', () => {
      const invalidPack = {
        id: 'test',
        version: '1.0.0',
        template_engine: { version: 'v1', syntax: '{{}}' },
        prompts: { test: { id: 'test', name: 'T', version: '1.0', system_template: 'T' } },
      };
      
      expect(() => {
        PromptPackRegistry.loadFromString(JSON.stringify(invalidPack), { validate: true });
      }).toThrow('must have a valid name');
    });

    it('should validate pack with missing version', () => {
      const invalidPack = {
        id: 'test',
        name: 'Test',
        template_engine: { version: 'v1', syntax: '{{}}' },
        prompts: { test: { id: 'test', name: 'T', version: '1.0', system_template: 'T' } },
      };
      
      expect(() => {
        PromptPackRegistry.loadFromString(JSON.stringify(invalidPack), { validate: true });
      }).toThrow('must have a valid version');
    });

    it('should validate pack with missing template_engine', () => {
      const invalidPack = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        prompts: { test: { id: 'test', name: 'T', version: '1.0', system_template: 'T' } },
      };
      
      expect(() => {
        PromptPackRegistry.loadFromString(JSON.stringify(invalidPack), { validate: true });
      }).toThrow('must have a template_engine');
    });

    it('should validate pack with missing prompts', () => {
      const invalidPack = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        template_engine: { version: 'v1', syntax: '{{}}' },
      };
      
      expect(() => {
        PromptPackRegistry.loadFromString(JSON.stringify(invalidPack), { validate: true });
      }).toThrow('must have a prompts object');
    });

    it('should validate pack with empty prompts', () => {
      const invalidPack = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        template_engine: { version: 'v1', syntax: '{{}}' },
        prompts: {},
      };
      
      expect(() => {
        PromptPackRegistry.loadFromString(JSON.stringify(invalidPack), { validate: true });
      }).toThrow('must have at least one prompt');
    });

    it('should validate prompt with missing required fields', () => {
      const invalidPack = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        template_engine: { version: 'v1', syntax: '{{}}' },
        prompts: {
          test: { id: 'test', name: 'T' }, // Missing version and system_template
        },
      };
      
      expect(() => {
        PromptPackRegistry.loadFromString(JSON.stringify(invalidPack), { validate: true });
      }).toThrow('missing required fields');
    });
  });

  describe('fromDirectory', () => {
    it('should create registry from directory', () => {
      const registry = PromptPackRegistry.fromDirectory('examples/packs');
      expect(registry.size()).toBeGreaterThan(0);
    });

    it('should validate packs from directory if requested', () => {
      const registry = PromptPackRegistry.fromDirectory('examples/packs', { validate: true });
      expect(registry.size()).toBeGreaterThan(0);
    });
  });
});
