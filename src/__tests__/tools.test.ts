/**
 * Tests for tools utilities
 */

import { filterToolsForPrompt, convertTools, getToolChoice, ToolExecutionManager } from '../tools';
import type { Tool } from '../types';

describe('tools utilities', () => {
  const mockTools: Record<string, Tool> = {
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
    tool3: {
      name: 'tool3',
      description: 'Tool 3',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  };

  describe('convertTools', () => {
    it('should convert tools to LangChain format', () => {
      const converted = convertTools(mockTools);

      expect(converted).toHaveLength(3);
      expect(converted[0]).toHaveProperty('name');
      expect(converted[0]).toHaveProperty('description');
      expect(converted[0]).toHaveProperty('parameters');
    });
  });

  describe('filterToolsForPrompt', () => {
    it('should filter tools based on allowed list', () => {
      const filtered = filterToolsForPrompt(
        mockTools,
        ['tool1', 'tool2']
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.map(t => t.name)).toEqual(['tool1', 'tool2']);
    });

    it('should return empty array if no allowed list', () => {
      const filtered = filterToolsForPrompt(
        mockTools,
        undefined
      );

      expect(filtered).toHaveLength(0);
    });

    it('should return empty array for empty list', () => {
      const filtered = filterToolsForPrompt(
        mockTools,
        []
      );

      expect(filtered).toHaveLength(0);
    });

    it('should filter out tools not in pack', () => {
      const filtered = filterToolsForPrompt(
        mockTools,
        ['tool1', 'nonexistent']
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('tool1');
    });

    it('should apply blocklist from policy', () => {
      const filtered = filterToolsForPrompt(
        mockTools,
        ['tool1', 'tool2', 'tool3'],
        { blocklist: ['tool2'] }
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.map(t => t.name)).toEqual(['tool1', 'tool3']);
    });

    it('should handle empty blocklist', () => {
      const filtered = filterToolsForPrompt(
        mockTools,
        ['tool1', 'tool2'],
        { blocklist: [] }
      );

      expect(filtered).toHaveLength(2);
    });
  });

  describe('getToolChoice', () => {
    it('should return auto by default', () => {
      expect(getToolChoice()).toBe('auto');
    });

    it('should return auto when no policy', () => {
      expect(getToolChoice({})).toBe('auto');
    });

    it('should return policy tool_choice', () => {
      const policy = { tool_choice: 'required' as const };
      expect(getToolChoice(policy)).toBe('required');
    });
  });

  describe('ToolExecutionManager', () => {
    it('should initialize with default policy', () => {
      const manager = new ToolExecutionManager();
      
      const status = manager.getStatus();
      expect(status.maxRounds).toBe(5);
      expect(status.maxCalls).toBe(10);
      expect(status.roundCount).toBe(0);
      expect(status.callCount).toBe(0);
    });

    it('should initialize with custom policy', () => {
      const policy = {
        tool_choice: 'auto' as const,
        max_rounds: 3,
        max_tool_calls_per_turn: 5,
      };
      const manager = new ToolExecutionManager(policy);
      
      const status = manager.getStatus();
      expect(status.maxRounds).toBe(3);
      expect(status.maxCalls).toBe(5);
    });

    it('should track round execution', () => {
      const manager = new ToolExecutionManager({ max_rounds: 2 });
      
      expect(manager.canExecuteRound()).toBe(true);
      manager.startRound();
      expect(manager.getStatus().roundCount).toBe(1);
      
      expect(manager.canExecuteRound()).toBe(true);
      manager.startRound();
      expect(manager.getStatus().roundCount).toBe(2);
      
      expect(manager.canExecuteRound()).toBe(false);
    });

    it('should track call execution', () => {
      const manager = new ToolExecutionManager({ max_tool_calls_per_turn: 2 });
      
      expect(manager.canExecuteCall()).toBe(true);
      manager.recordCall();
      expect(manager.getStatus().callCount).toBe(1);
      
      expect(manager.canExecuteCall()).toBe(true);
      manager.recordCall();
      expect(manager.getStatus().callCount).toBe(2);
      
      expect(manager.canExecuteCall()).toBe(false);
    });

    it('should reset counters', () => {
      const manager = new ToolExecutionManager();
      
      manager.startRound();
      manager.recordCall();
      manager.recordCall();
      
      expect(manager.getStatus().roundCount).toBe(1);
      expect(manager.getStatus().callCount).toBe(2);
      
      manager.reset();
      
      expect(manager.getStatus().roundCount).toBe(0);
      expect(manager.getStatus().callCount).toBe(0);
    });

    it('should handle multiple rounds and calls', () => {
      const manager = new ToolExecutionManager({
        max_rounds: 3,
        max_tool_calls_per_turn: 5,
      });
      
      // First round
      manager.startRound();
      manager.recordCall();
      manager.recordCall();
      
      // Second round
      manager.startRound();
      manager.recordCall();
      
      const status = manager.getStatus();
      expect(status.roundCount).toBe(2);
      expect(status.callCount).toBe(3);
      
      // Should still allow more rounds and calls
      expect(manager.canExecuteRound()).toBe(true);
      expect(manager.canExecuteCall()).toBe(true);
    });
  });
});
