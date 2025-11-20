/**
 * Registry for managing PromptPack collections
 */

import { PromptPack, Prompt } from './types';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Error thrown when a prompt or pack is not found
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Options for loading a PromptPack
 */
export interface LoadOptions {
  /**
   * Whether to validate the pack against the schema
   */
  validate?: boolean;
}

/**
 * Registry for storing and retrieving PromptPacks
 */
export class PromptPackRegistry {
  private readonly packs: Map<string, PromptPack> = new Map();
  
  /**
   * Register a PromptPack in the registry
   */
  register(pack: PromptPack): void {
    this.packs.set(pack.id, pack);
  }
  
  /**
   * Register multiple PromptPacks
   */
  registerMany(packs: PromptPack[]): void {
    for (const pack of packs) {
      this.register(pack);
    }
  }
  
  /**
   * Load a PromptPack from a JSON file and register it
   */
  loadAndRegister(filePath: string, options: LoadOptions = {}): PromptPack {
    const pack = PromptPackRegistry.loadFromFile(filePath, options);
    this.register(pack);
    return pack;
  }
  
  /**
   * Get a PromptPackTemplate from the registry
   */
  async getTemplate(
    packId: string,
    promptId: string,
    options?: Partial<import('./template.js').PromptPackTemplateOptions>
  ): Promise<import('./template.js').PromptPackTemplate> {
    const pack = this.getPack(packId);
    // Use dynamic import to avoid circular dependency
    const { PromptPackTemplate } = await import('./template.js');
    return new PromptPackTemplate({
      ...options,
      pack,
      promptId,
    });
  }
  
  /**
   * Get a PromptPack by ID
   */
  getPack(packId: string): PromptPack {
    const pack = this.packs.get(packId);
    if (!pack) {
      throw new NotFoundError(`PromptPack '${packId}' not found in registry`);
    }
    return pack;
  }
  
  /**
   * Get a specific prompt from a pack
   */
  getPrompt(packId: string, promptId: string): Prompt {
    const pack = this.getPack(packId);
    const prompt = pack.prompts[promptId];
    
    if (!prompt) {
      throw new NotFoundError(
        `Prompt '${promptId}' not found in pack '${packId}'`
      );
    }
    
    return prompt;
  }
  
  /**
   * Check if a pack exists in the registry
   */
  hasPack(packId: string): boolean {
    return this.packs.has(packId);
  }
  
  /**
   * Check if a prompt exists in a pack
   */
  hasPrompt(packId: string, promptId: string): boolean {
    try {
      this.getPrompt(packId, promptId);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * List all pack IDs in the registry
   */
  listPacks(): string[] {
    return Array.from(this.packs.keys());
  }
  
  /**
   * List all prompt IDs in a pack
   */
  listPrompts(packId: string): string[] {
    const pack = this.getPack(packId);
    return Object.keys(pack.prompts);
  }
  
  /**
   * Remove a pack from the registry
   */
  unregister(packId: string): boolean {
    return this.packs.delete(packId);
  }
  
  /**
   * Clear all packs from the registry
   */
  clear(): void {
    this.packs.clear();
  }
  
  /**
   * Get the number of packs in the registry
   */
  size(): number {
    return this.packs.size;
  }
  
  /**
   * Load a PromptPack from a JSON file
   */
  static loadFromFile(filePath: string, options: LoadOptions = {}): PromptPack {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const pack = JSON.parse(content) as PromptPack;
      
      if (options.validate) {
        this.validatePack(pack);
      }
      
      return pack;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load PromptPack from ${filePath}: ${error.message}`);
      }
      throw error;
    }
  }
  
  /**
   * Load a PromptPack from a JSON string
   */
  static loadFromString(json: string, options: LoadOptions = {}): PromptPack {
    try {
      const pack = JSON.parse(json) as PromptPack;
      
      if (options.validate) {
        this.validatePack(pack);
      }
      
      return pack;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse PromptPack JSON: ${error.message}`);
      }
      throw error;
    }
  }
  
  /**
   * Load all PromptPacks from a directory
   */
  static loadFromDirectory(
    dirPath: string,
    options: LoadOptions = {}
  ): PromptPack[] {
    const packs: PromptPack[] = [];
    
    try {
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(dirPath, file);
          try {
            const pack = this.loadFromFile(filePath, options);
            packs.push(pack);
          } catch (error) {
            console.warn(`Skipping file ${file}:`, error);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load from directory ${dirPath}: ${error.message}`);
      }
      throw error;
    }
    
    return packs;
  }
  
  /**
   * Basic validation of a PromptPack structure
   */
  private static validatePack(pack: PromptPack): void {
    if (!pack.id || typeof pack.id !== 'string') {
      throw new Error('PromptPack must have a valid id');
    }
    
    if (!pack.name || typeof pack.name !== 'string') {
      throw new Error('PromptPack must have a valid name');
    }
    
    if (!pack.version || typeof pack.version !== 'string') {
      throw new Error('PromptPack must have a valid version');
    }
    
    if (!pack.template_engine || typeof pack.template_engine !== 'object') {
      throw new Error('PromptPack must have a template_engine configuration');
    }
    
    if (!pack.prompts || typeof pack.prompts !== 'object') {
      throw new Error('PromptPack must have a prompts object');
    }
    
    if (Object.keys(pack.prompts).length === 0) {
      throw new Error('PromptPack must have at least one prompt');
    }
    
    // Validate each prompt
    for (const [key, prompt] of Object.entries(pack.prompts)) {
      if (!prompt.id || !prompt.name || !prompt.version || !prompt.system_template) {
        throw new Error(`Prompt '${key}' is missing required fields`);
      }
    }
  }
  
  /**
   * Create a registry and load packs from a directory
   */
  static fromDirectory(dirPath: string, options: LoadOptions = {}): PromptPackRegistry {
    const registry = new PromptPackRegistry();
    const packs = this.loadFromDirectory(dirPath, options);
    registry.registerMany(packs);
    return registry;
  }
  
  /**
   * Get pack metadata
   */
  getPackMetadata(packId: string): {
    id: string;
    name: string;
    version: string;
    description?: string;
    promptCount: number;
  } {
    const pack = this.getPack(packId);
    return {
      id: pack.id,
      name: pack.name,
      version: pack.version,
      description: pack.description,
      promptCount: Object.keys(pack.prompts).length,
    };
  }
}
