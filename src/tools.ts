/**
 * Tool and function calling integration for PromptPack
 */

import { Tool as PromptPackTool, ToolPolicy } from './types';

/**
 * Convert PromptPack tool definition to LangChain tool format
 */
export interface LangChainTool {
  name: string;
  description: string;
  parameters?: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Convert PromptPack tools to LangChain format
 */
export function convertTools(tools: Record<string, PromptPackTool>): LangChainTool[] {
  return Object.values(tools).map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));
}

/**
 * Filter tools based on a prompt's allowed tools list
 */
export function filterToolsForPrompt(
  allTools: Record<string, PromptPackTool>,
  promptTools: string[] | undefined,
  policy?: ToolPolicy
): LangChainTool[] {
  if (!promptTools || promptTools.length === 0) {
    return [];
  }
  
  // Filter to only allowed tools
  let allowedTools = promptTools
    .map((name) => allTools[name])
    .filter((tool): tool is PromptPackTool => tool !== undefined);
  
  // Apply blocklist if present
  if (policy?.blocklist && policy.blocklist.length > 0) {
    allowedTools = allowedTools.filter(
      (tool) => !policy.blocklist?.includes(tool.name)
    );
  }
  
  return convertTools(
    Object.fromEntries(allowedTools.map((tool) => [tool.name, tool]))
  );
}

/**
 * Get tool choice configuration for LangChain
 */
export function getToolChoice(policy?: ToolPolicy): string {
  if (!policy?.tool_choice) {
    return 'auto';
  }
  
  return policy.tool_choice;
}

/**
 * Tool execution manager that enforces policy
 */
export class ToolExecutionManager {
  private readonly policy: ToolPolicy;
  private roundCount = 0;
  private callCount = 0;
  
  constructor(policy?: ToolPolicy) {
    this.policy = policy || {
      tool_choice: 'auto',
      max_rounds: 5,
      max_tool_calls_per_turn: 10,
    };
  }
  
  /**
   * Check if another tool round is allowed
   */
  canExecuteRound(): boolean {
    const maxRounds = this.policy.max_rounds || 5;
    return this.roundCount < maxRounds;
  }
  
  /**
   * Check if more tool calls are allowed in this turn
   */
  canExecuteCall(): boolean {
    const maxCalls = this.policy.max_tool_calls_per_turn || 10;
    return this.callCount < maxCalls;
  }
  
  /**
   * Record a new round
   */
  startRound(): void {
    this.roundCount++;
  }
  
  /**
   * Record a tool call
   */
  recordCall(): void {
    this.callCount++;
  }
  
  /**
   * Reset counters for a new turn
   */
  reset(): void {
    this.roundCount = 0;
    this.callCount = 0;
  }
  
  /**
   * Get current status
   */
  getStatus(): {
    roundCount: number;
    callCount: number;
    maxRounds: number;
    maxCalls: number;
  } {
    return {
      roundCount: this.roundCount,
      callCount: this.callCount,
      maxRounds: this.policy.max_rounds || 5,
      maxCalls: this.policy.max_tool_calls_per_turn || 10,
    };
  }
}
