/**
 * Tests for PromptPackTemplateEngine
 */

import { PromptPackTemplateEngine, TemplateError, ValidationError } from '../template-engine';
import { TemplateEngine, Variable } from '../types';

describe('PromptPackTemplateEngine', () => {
  const engine: TemplateEngine = {
    version: 'v1',
    syntax: '{{variable}}',
  };

  describe('render', () => {
    it('should substitute variables correctly', () => {
      const templateEngine = new PromptPackTemplateEngine(engine);
      const result = templateEngine.render('Hello {{name}}!', {
        variables: { name: 'World' },
      });
      expect(result).toBe('Hello World!');
    });

    it('should substitute multiple variables', () => {
      const templateEngine = new PromptPackTemplateEngine(engine);
      const result = templateEngine.render('{{greeting}} {{name}}, welcome to {{company}}!', {
        variables: { greeting: 'Hello', name: 'Alice', company: 'TechCorp' },
      });
      expect(result).toBe('Hello Alice, welcome to TechCorp!');
    });

    it('should substitute fragments', () => {
      const templateEngine = new PromptPackTemplateEngine(engine);
      const result = templateEngine.render('System: {{intro}}\nTask: {{task}}', {
        variables: { task: 'Help the user' },
        fragments: { intro: 'You are a helpful assistant.' },
      });
      expect(result).toBe('System: You are a helpful assistant.\nTask: Help the user');
    });

    it('should throw error for undefined variables when not allowed', () => {
      const templateEngine = new PromptPackTemplateEngine(engine);
      expect(() => {
        templateEngine.render('Hello {{name}}!', { variables: {} });
      }).toThrow(TemplateError);
    });

    it('should allow undefined variables when configured', () => {
      const templateEngine = new PromptPackTemplateEngine(engine);
      const result = templateEngine.render('Hello {{name}}!', {
        variables: {},
        allowUndefined: true,
      });
      expect(result).toBe('Hello {{name}}!');
    });
  });

  describe('validateVariables', () => {
    it('should validate required variables', () => {
      const templateEngine = new PromptPackTemplateEngine(engine);
      const variables: Variable[] = [
        { name: 'name', type: 'string', required: true },
      ];

      expect(() => {
        templateEngine.validateVariables(variables, {});
      }).toThrow(ValidationError);

      expect(() => {
        templateEngine.validateVariables(variables, { name: 'Alice' });
      }).not.toThrow();
    });

    it('should validate variable types', () => {
      const templateEngine = new PromptPackTemplateEngine(engine);
      const variables: Variable[] = [
        { name: 'age', type: 'number', required: true },
      ];

      expect(() => {
        templateEngine.validateVariables(variables, { age: 'not a number' });
      }).toThrow(ValidationError);

      expect(() => {
        templateEngine.validateVariables(variables, { age: 25 });
      }).not.toThrow();
    });

    it('should validate string patterns', () => {
      const templateEngine = new PromptPackTemplateEngine(engine);
      const variables: Variable[] = [
        {
          name: 'email',
          type: 'string',
          required: true,
          validation: {
            pattern: String.raw`^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$`,
          },
        },
      ];

      expect(() => {
        templateEngine.validateVariables(variables, { email: 'invalid' });
      }).toThrow(ValidationError);

      expect(() => {
        templateEngine.validateVariables(variables, { email: 'test@example.com' });
      }).not.toThrow();
    });

    it('should validate string length', () => {
      const templateEngine = new PromptPackTemplateEngine(engine);
      const variables: Variable[] = [
        {
          name: 'name',
          type: 'string',
          required: true,
          validation: {
            min_length: 3,
            max_length: 10,
          },
        },
      ];

      expect(() => {
        templateEngine.validateVariables(variables, { name: 'ab' });
      }).toThrow(ValidationError);

      expect(() => {
        templateEngine.validateVariables(variables, { name: 'verylongname' });
      }).toThrow(ValidationError);

      expect(() => {
        templateEngine.validateVariables(variables, { name: 'alice' });
      }).not.toThrow();
    });

    it('should validate number range', () => {
      const templateEngine = new PromptPackTemplateEngine(engine);
      const variables: Variable[] = [
        {
          name: 'age',
          type: 'number',
          required: true,
          validation: {
            minimum: 0,
            maximum: 150,
          },
        },
      ];

      expect(() => {
        templateEngine.validateVariables(variables, { age: -1 });
      }).toThrow(ValidationError);

      expect(() => {
        templateEngine.validateVariables(variables, { age: 200 });
      }).toThrow(ValidationError);

      expect(() => {
        templateEngine.validateVariables(variables, { age: 25 });
      }).not.toThrow();
    });

    it('should validate enum values', () => {
      const templateEngine = new PromptPackTemplateEngine(engine);
      const variables: Variable[] = [
        {
          name: 'priority',
          type: 'string',
          required: true,
          validation: {
            enum: ['low', 'medium', 'high'],
          },
        },
      ];

      expect(() => {
        templateEngine.validateVariables(variables, { priority: 'urgent' });
      }).toThrow(ValidationError);

      expect(() => {
        templateEngine.validateVariables(variables, { priority: 'high' });
      }).not.toThrow();
    });
  });

  describe('applyDefaults', () => {
    it('should apply default values', () => {
      const templateEngine = new PromptPackTemplateEngine(engine);
      const variables: Variable[] = [
        { name: 'role', type: 'string', required: true },
        { name: 'style', type: 'string', required: false, default: 'professional' },
      ];

      const result = templateEngine.applyDefaults(variables, { role: 'assistant' });
      expect(result).toEqual({ role: 'assistant', style: 'professional' });
    });

    it('should not override provided values', () => {
      const templateEngine = new PromptPackTemplateEngine(engine);
      const variables: Variable[] = [
        { name: 'style', type: 'string', required: false, default: 'professional' },
      ];

      const result = templateEngine.applyDefaults(variables, { style: 'casual' });
      expect(result).toEqual({ style: 'casual' });
    });
  });

  describe('extractVariables', () => {
    it('should extract variable names from template', () => {
      const templateEngine = new PromptPackTemplateEngine(engine);
      const variables = templateEngine.extractVariables('Hello {{name}}, welcome to {{company}}!');
      expect(variables).toEqual(['name', 'company']);
    });

    it('should handle duplicate variables', () => {
      const templateEngine = new PromptPackTemplateEngine(engine);
      const variables = templateEngine.extractVariables('{{name}} {{name}} {{name}}');
      expect(variables).toEqual(['name']);
    });
  });
});
