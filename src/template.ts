/**
 * LangChain integration for PromptPack
 */

import { BasePromptTemplate, BasePromptTemplateInput } from '@langchain/core/prompts';
import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { InputValues, PartialValues } from '@langchain/core/utils/types';
import { ChatPromptValue, type BasePromptValue as PromptValue } from '@langchain/core/prompt_values';
import type { Runnable } from '@langchain/core/runnables';
import { PromptPack, Prompt, Parameters } from './types';
import { PromptPackTemplateEngine, RenderOptions } from './template-engine';
import { PromptPackRegistry } from './registry';
import { createValidationRunnable, createStrictValidationRunnable } from './validation-runnable';

/**
 * Options for creating a PromptPackTemplate
 */
export interface PromptPackTemplateOptions extends Partial<BasePromptTemplateInput> {
  /**
   * The PromptPack to use
   */
  pack: PromptPack;
  
  /**
   * The prompt ID (task type) to use from the pack
   */
  promptId: string;
  
  /**
   * Optional model identifier for model-specific overrides
   */
  modelId?: string;
  
  /**
   * Additional template rendering options
   */
  renderOptions?: Partial<RenderOptions>;
}

/**
 * LangChain prompt template that uses PromptPack configuration
 */
export class PromptPackTemplate extends BasePromptTemplate {
  private readonly pack: PromptPack;
  private readonly promptConfig: Prompt;
  private readonly modelId?: string;
  private readonly engine: PromptPackTemplateEngine;
  private readonly renderOptions: Partial<RenderOptions>;
  
  lc_namespace = ['promptpack', 'prompts'];
  
  constructor(options: PromptPackTemplateOptions) {
    // Extract input variables from the prompt configuration
    const inputVariables = options.pack.prompts[options.promptId]?.variables
      ?.map((v) => v.name) || [];
    
    super({
      ...options,
      inputVariables,
    });
    
    this.pack = options.pack;
    this.promptConfig = this.pack.prompts[options.promptId];
    this.modelId = options.modelId;
    this.engine = new PromptPackTemplateEngine(this.pack.template_engine);
    this.renderOptions = options.renderOptions || {};
    
    if (!this.promptConfig) {
      throw new Error(
        `Prompt '${options.promptId}' not found in pack '${this.pack.id}'`
      );
    }
  }
  
  /**
   * Create a PromptPackTemplate from a registry
   */
  static fromRegistry(
    registry: PromptPackRegistry,
    packId: string,
    promptId: string,
    options?: Partial<PromptPackTemplateOptions>
  ): PromptPackTemplate {
    const pack = registry.getPack(packId);
    return new PromptPackTemplate({
      ...options,
      pack,
      promptId,
    });
  }
  
  /**
   * Get the template string (for compatibility)
   */
  get template(): string {
    return this.getSystemTemplate();
  }
  
  /**
   * Get the system template with model-specific overrides applied
   */
  getSystemTemplate(): string {
    let template = this.promptConfig.system_template;
    
    // Apply model-specific overrides if available
    if (this.modelId && this.promptConfig.model_overrides?.[this.modelId]) {
      const override = this.promptConfig.model_overrides[this.modelId];
      
      if (override.system_template) {
        // Complete replacement
        template = override.system_template;
      } else {
        // Apply prefix and suffix
        if (override.system_template_prefix) {
          template = override.system_template_prefix + template;
        }
        if (override.system_template_suffix) {
          template = template + override.system_template_suffix;
        }
      }
    }
    
    return template;
  }
  
  /**
   * Get LLM parameters with model-specific overrides
   */
  getParameters(): Parameters | undefined {
    let params = this.promptConfig.parameters;
    
    // Apply model-specific parameter overrides
    if (this.modelId && this.promptConfig.model_overrides?.[this.modelId]) {
      const override = this.promptConfig.model_overrides[this.modelId];
      if (override.parameters) {
        params = { ...params, ...override.parameters };
      }
    }
    
    return params;
  }
  
  /**
   * Format the prompt with the given input values.
   * Returns the rendered system prompt as a string.
   * 
   * Note: When using with LangChain chains, you don't need to call this directly.
   * The template will automatically format when used with `.pipe()`.
   */
  async format(values: InputValues): Promise<string> {
    // Apply default values
    const varsWithDefaults = this.engine.applyDefaults(
      this.promptConfig.variables,
      values
    );
    
    // Validate variables if requested
    if (this.renderOptions.validate !== false) {
      this.engine.validateVariables(this.promptConfig.variables, varsWithDefaults);
    }
    
    // Render the template
    const systemTemplate = this.getSystemTemplate();
    return this.engine.render(systemTemplate, {
      variables: varsWithDefaults,
      fragments: this.pack.fragments,
      ...this.renderOptions,
    });
  }
  
  /**
   * Format the prompt as a PromptValue (required by LangChain).
   * This is called automatically when the template is used in a chain.
   */
  async formatPromptValue(values: InputValues): Promise<PromptValue> {
    const formattedPrompt = await this.format(values);
    
    // Create messages array
    const messages: BaseMessage[] = [new SystemMessage(formattedPrompt)];
    
    // Add conversation history if provided
    if (values.messages && Array.isArray(values.messages)) {
      messages.push(...values.messages);
    }
    
    // Add user message if provided
    if (values.user_message) {
      messages.push(new HumanMessage(values.user_message));
    }
    
    return new ChatPromptValue(messages);
  }
  
  /**
   * Filter tools to only those allowed by this prompt's configuration.
   * Use this to filter a large toolset down to what the PromptPack allows.
   * 
   * @param tools - Array of tools to filter
   * @param options.warn - Whether to log warnings (default: true)
   * @returns Filtered array of tools allowed by this prompt
   * 
   * @example
   * ```typescript
   * const allTools = createAllTools();
   * const allowedTools = template.filterTools(allTools);
   * const model = new ChatOpenAI().bind({ tools: allowedTools });
   * ```
   */
  filterTools<T extends { name: string }>(
    tools: T[],
    options: { warn?: boolean } = {}
  ): T[] {
    const { warn = true } = options;
    const allowedToolNames = this.getTools();
    
    // If no tools specified in prompt, all tools are allowed
    if (!allowedToolNames || allowedToolNames.length === 0) {
      return tools;
    }
    
    // Filter to only allowed tools
    const filtered = tools.filter(tool => allowedToolNames.includes(tool.name));
    
    if (warn) {
      // Warn about missing tools
      const providedNames = new Set(tools.map(t => t.name));
      const missingTools = allowedToolNames.filter(name => !providedNames.has(name));
      if (missingTools.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(
          `[PromptPack] Tools defined in prompt '${this.promptConfig.id}' but not provided: ${missingTools.join(', ')}`
        );
      }
      
      // Warn about filtered tools
      const filteredOut = tools.filter(tool => !allowedToolNames.includes(tool.name));
      if (filteredOut.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(
          `[PromptPack] Filtered out ${filteredOut.length} tool(s) not allowed by prompt '${this.promptConfig.id}': ${filteredOut.map(t => t.name).join(', ')}`
        );
      }
    }
    
    return filtered;
  }
  
  /**
   * Override pipe to warn about tool mismatches when chaining with a model
   */
  override pipe<NewRunOutput>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    coerceable: any
  ): Runnable<InputValues, Exclude<NewRunOutput, Error>> {
    // Check if the next runnable has tools bound to it
    if (coerceable?.bound?.tools) {
      const modelTools = coerceable.bound.tools;
      const allowedToolNames = this.getTools();
      
      // Only validate if prompt specifies tools
      if (allowedToolNames && allowedToolNames.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const toolNames = modelTools.map((t: any) => t.name);
        const extraTools = toolNames.filter((name: string) => !allowedToolNames.includes(name));
        
        if (extraTools.length > 0) {
          // eslint-disable-next-line no-console
          console.warn(
            `[PromptPack] Model has ${extraTools.length} tool(s) not allowed by prompt '${this.promptConfig.id}': ${extraTools.join(', ')}. ` +
            `Consider using template.filterTools() to filter your tools before binding. ` +
            `Allowed: ${allowedToolNames.join(', ')}`
          );
        }
        
        // Check for missing tools
        const providedNames = new Set(toolNames);
        const missingTools = allowedToolNames.filter((name: string) => !providedNames.has(name));
        
        if (missingTools.length > 0) {
          // eslint-disable-next-line no-console
          console.warn(
            `[PromptPack] Prompt '${this.promptConfig.id}' expects tools that are not bound to model: ${missingTools.join(', ')}`
          );
        }
      }
    }
    
    // Call parent pipe
    return super.pipe(coerceable);
  }
  
  /**
   * Get partial prompt template (for partial variable substitution)
   */
  async partial(values: PartialValues): Promise<PromptPackTemplate> {
    // Create a new instance with partial values pre-filled
    const newOptions: PromptPackTemplateOptions = {
      pack: this.pack,
      promptId: this.promptConfig.id,
      modelId: this.modelId,
      renderOptions: this.renderOptions,
      partialVariables: { ...this.partialVariables, ...values },
    };
    
    return new PromptPackTemplate(newOptions);
  }
  
  /**
   * Serialize the template
   */
  serialize(): { [key: string]: unknown } {
    return {
      _type: 'promptpack',
      pack_id: this.pack.id,
      prompt_id: this.promptConfig.id,
      model_id: this.modelId,
    };
  }
  
  /**
   * Get the template type identifier
   */
  _getPromptType(): string {
    return 'promptpack';
  }
  
  /**
   * Get tools defined for this prompt
   */
  getTools(): string[] {
    return this.promptConfig.tools || [];
  }
  
  /**
   * Get tool policy for this prompt
   */
  getToolPolicy() {
    return this.promptConfig.tool_policy;
  }
  
  /**
   * Get validators (guardrails) for this prompt
   */
  getValidators() {
    return this.promptConfig.validators || [];
  }
  
  /**
   * Create a validation runnable with this prompt's validators.
   * Similar to filterTools(), this provides validators from the PromptPack.
   * 
   * @param customValidators - Registry of custom validator implementations
   * @param options.strict - Whether to throw on validation failure (default: false)
   * @returns ValidationRunnable configured with prompt's validators
   * 
   * @example
   * ```typescript
   * const customValidators = {
   *   sentiment: (response, validator) => ({ passed: true, validatorType: 'sentiment' }),
   *   pii_detection: (response, validator) => ({ passed: true, validatorType: 'pii_detection' })
   * };
   * 
   * const chain = template
   *   .pipe(model)
   *   .pipe(template.createValidationRunnable(customValidators));
   * ```
   */
  createValidationRunnable(
    customValidators?: Record<string, (response: string, validator: import('./types').Validator) => import('./validators').ValidationResult>,
    options: { strict?: boolean } = {}
  ) {
    const validators = this.getValidators();
    
    if (options.strict) {
      return createStrictValidationRunnable(validators, customValidators);
    }
    
    return createValidationRunnable(validators, customValidators);
  }
  
  /**
   * Get media configuration for this prompt
   */
  getMediaConfig() {
    return this.promptConfig.media;
  }
  
  /**
   * Check if this prompt supports multimodal content
   */
  isMultimodal(): boolean {
    return this.promptConfig.media?.enabled || false;
  }
  
  /**
   * Get the prompt configuration
   */
  getPromptConfig(): Prompt {
    return this.promptConfig;
  }
  
  /**
   * Get the full pack
   */
  getPack(): PromptPack {
    return this.pack;
  }
}

/**
 * Helper function to create a PromptPackTemplate
 */
export function createPromptPackTemplate(
  pack: PromptPack,
  promptId: string,
  options?: Partial<PromptPackTemplateOptions>
): PromptPackTemplate {
  return new PromptPackTemplate({
    ...options,
    pack,
    promptId,
  });
}
