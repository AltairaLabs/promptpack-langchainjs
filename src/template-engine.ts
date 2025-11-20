/**
 * Template engine for PromptPack variable substitution
 */

import { TemplateEngine, Variable, VariableValidation } from './types';

/**
 * Error thrown when template rendering fails
 */
export class TemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateError';
  }
}

/**
 * Error thrown when variable validation fails
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Options for template rendering
 */
export interface RenderOptions {
  /**
   * Variable values to substitute
   */
  variables?: Record<string, unknown>;
  
  /**
   * Fragment definitions for substitution
   */
  fragments?: Record<string, string>;
  
  /**
   * Whether to validate variables before rendering
   */
  validate?: boolean;
  
  /**
   * Whether to allow undefined variables (will be left as-is)
   */
  allowUndefined?: boolean;
}

/**
 * Template engine for rendering PromptPack templates
 */
export class PromptPackTemplateEngine {
  private readonly engine: TemplateEngine;
  
  constructor(engine: TemplateEngine) {
    this.engine = engine;
  }
  
  /**
   * Render a template with the given variables and fragments
   */
  render(template: string, options: RenderOptions = {}): string {
    const { variables = {}, fragments = {}, allowUndefined = false } = options;
    
    // First, substitute fragments
    let result = this.substituteFragments(template, fragments);
    
    // Then, substitute variables
    result = this.substituteVariables(result, variables, allowUndefined);
    
    return result;
  }
  
  /**
   * Validate variables against their definitions
   */
  validateVariables(
    variableDefinitions: Variable[] | undefined,
    values: Record<string, unknown>
  ): void {
    if (!variableDefinitions) {
      return;
    }
    
    for (const varDef of variableDefinitions) {
      const value = values[varDef.name];
      
      // Check required variables
      if (varDef.required && value === undefined) {
        throw new ValidationError(
          `Required variable '${varDef.name}' is missing`
        );
      }
      
      // Skip validation if value is undefined and variable is not required
      if (value === undefined) {
        continue;
      }
      
      // Type checking
      this.validateType(varDef.name, value, varDef.type);
      
      // Additional validation rules
      if (varDef.validation) {
        this.validateRules(varDef.name, value, varDef.validation, varDef.type);
      }
    }
  }
  
  /**
   * Get variable values with defaults applied
   */
  applyDefaults(
    variableDefinitions: Variable[] | undefined,
    values: Record<string, unknown>
  ): Record<string, unknown> {
    if (!variableDefinitions) {
      return values;
    }
    
    const result = { ...values };
    
    for (const varDef of variableDefinitions) {
      if (result[varDef.name] === undefined && varDef.default !== undefined) {
        result[varDef.name] = varDef.default;
      }
    }
    
    return result;
  }
  
  /**
   * Extract variable names from a template
   */
  extractVariables(template: string): string[] {
    const pattern = this.getSyntaxPattern();
    const matches = template.matchAll(pattern);
    const variables = new Set<string>();
    
    for (const match of matches) {
      if (match[1]) {
        variables.add(match[1]);
      }
    }
    
    return Array.from(variables);
  }
  
  private substituteFragments(
    template: string,
    fragments: Record<string, string>
  ): string {
    let result = template;
    
    // Recursively substitute fragments (fragments can reference other fragments)
    const maxDepth = 10;
    let depth = 0;
    let hasMore = true;
    
    while (hasMore && depth < maxDepth) {
      hasMore = false;
      const pattern = this.getSyntaxPattern();
      
      result = result.replace(pattern, (match, name) => {
        if (fragments[name] !== undefined) {
          hasMore = true;
          return fragments[name];
        }
        return match; // Leave as-is if not a fragment
      });
      
      depth++;
    }
    
    if (depth >= maxDepth) {
      throw new TemplateError('Maximum fragment substitution depth exceeded (possible circular reference)');
    }
    
    return result;
  }
  
  private substituteVariables(
    template: string,
    variables: Record<string, unknown>,
    allowUndefined: boolean
  ): string {
    const pattern = this.getSyntaxPattern();
    
    return template.replace(pattern, (match, name) => {
      const value = variables[name];
      
      if (value === undefined) {
        if (allowUndefined) {
          return match; // Leave the placeholder as-is
        }
        throw new TemplateError(`Variable '${name}' is not defined`);
      }
      
      return this.valueToString(value);
    });
  }
  
  private getSyntaxPattern(): RegExp {
    // Extract the variable name pattern from the syntax
    // Default syntax: {{variable}}
    const syntax = this.engine.syntax;
    
    // Escape special regex characters and create capture group
    const escaped = syntax.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    const pattern = escaped.replaceAll(/variable/gi, '([a-zA-Z_][a-zA-Z0-9_]*)');
    
    return new RegExp(pattern, 'g');
  }
  
  private validateType(name: string, value: unknown, expectedType: string): void {
    const actualType = typeof value;
    
    switch (expectedType) {
      case 'string':
        if (actualType !== 'string') {
          throw new ValidationError(
            `Variable '${name}' must be a string, got ${actualType}`
          );
        }
        break;
      case 'number':
        if (actualType !== 'number') {
          throw new ValidationError(
            `Variable '${name}' must be a number, got ${actualType}`
          );
        }
        break;
      case 'boolean':
        if (actualType !== 'boolean') {
          throw new ValidationError(
            `Variable '${name}' must be a boolean, got ${actualType}`
          );
        }
        break;
      case 'object':
        if (actualType !== 'object' || value === null || Array.isArray(value)) {
          throw new ValidationError(
            `Variable '${name}' must be an object, got ${actualType}`
          );
        }
        break;
      case 'array':
        if (!Array.isArray(value)) {
          throw new ValidationError(
            `Variable '${name}' must be an array, got ${actualType}`
          );
        }
        break;
    }
  }
  
  private validateRules(
    name: string,
    value: unknown,
    validation: VariableValidation,
    type: string
  ): void {
    if (type === 'string' && typeof value === 'string') {
      this.validateStringRules(name, value, validation);
    }
    
    if (type === 'number' && typeof value === 'number') {
      this.validateNumberRules(name, value, validation);
    }
    
    if (validation.enum !== undefined) {
      this.validateEnumRule(name, value, validation.enum);
    }
  }
  
  private validateStringRules(
    name: string,
    value: string,
    validation: VariableValidation
  ): void {
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        throw new ValidationError(
          `Variable '${name}' does not match pattern ${validation.pattern}`
        );
      }
    }
    
    if (validation.min_length !== undefined && value.length < validation.min_length) {
      throw new ValidationError(
        `Variable '${name}' must be at least ${validation.min_length} characters, got ${value.length}`
      );
    }
    
    if (validation.max_length !== undefined && value.length > validation.max_length) {
      throw new ValidationError(
        `Variable '${name}' must be at most ${validation.max_length} characters, got ${value.length}`
      );
    }
  }
  
  private validateNumberRules(
    name: string,
    value: number,
    validation: VariableValidation
  ): void {
    if (validation.minimum !== undefined && value < validation.minimum) {
      throw new ValidationError(
        `Variable '${name}' must be at least ${validation.minimum}, got ${value}`
      );
    }
    
    if (validation.maximum !== undefined && value > validation.maximum) {
      throw new ValidationError(
        `Variable '${name}' must be at most ${validation.maximum}, got ${value}`
      );
    }
  }
  
  private validateEnumRule(
    name: string,
    value: unknown,
    enumValues: unknown[]
  ): void {
    if (!enumValues.includes(value)) {
      throw new ValidationError(
        `Variable '${name}' must be one of: ${enumValues.join(', ')}`
      );
    }
  }
  
  private valueToString(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return String(value);
  }
}
