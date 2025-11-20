/**
 * Core TypeScript types for PromptPack specification v1.1.0
 * Generated from promptpack.schema.json
 */

/**
 * Complete PromptPack specification
 */
export interface PromptPack {
  $schema?: string;
  id: string;
  name: string;
  version: string;
  description?: string;
  template_engine: TemplateEngine;
  prompts: Record<string, Prompt>;
  fragments?: Record<string, string>;
  tools?: Record<string, Tool>;
  metadata?: PackMetadata;
  compilation?: CompilationInfo;
}

/**
 * Template engine configuration
 */
export interface TemplateEngine {
  version: string;
  syntax: string;
  features?: TemplateFeature[];
}

export type TemplateFeature =
  | 'basic_substitution'
  | 'fragments'
  | 'conditionals'
  | 'loops'
  | 'filters';

/**
 * Individual prompt configuration
 */
export interface Prompt {
  id: string;
  name: string;
  description?: string;
  version: string;
  system_template: string;
  variables?: Variable[];
  tools?: string[];
  tool_policy?: ToolPolicy;
  pipeline?: PipelineConfig;
  parameters?: Parameters;
  validators?: Validator[];
  tested_models?: TestedModel[];
  model_overrides?: Record<string, ModelOverride>;
  media?: MediaConfig;
}

/**
 * Variable definition with validation
 */
export interface Variable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  default?: unknown;
  description?: string;
  example?: unknown;
  validation?: VariableValidation;
}

/**
 * Variable validation rules
 */
export interface VariableValidation {
  pattern?: string;
  min_length?: number;
  max_length?: number;
  minimum?: number;
  maximum?: number;
  enum?: unknown[];
}

/**
 * Tool definition (OpenAI function calling format)
 */
export interface Tool {
  name: string;
  description: string;
  parameters?: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Tool usage policy
 */
export interface ToolPolicy {
  tool_choice?: 'auto' | 'required' | 'none';
  max_rounds?: number;
  max_tool_calls_per_turn?: number;
  blocklist?: string[];
}

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  stages: string[];
  middleware?: MiddlewareConfig[];
}

/**
 * Middleware configuration
 */
export interface MiddlewareConfig {
  type: string;
  config?: Record<string, unknown>;
}

/**
 * LLM generation parameters
 */
export interface Parameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number | null;
  frequency_penalty?: number;
  presence_penalty?: number;
}

/**
 * Validation rule (guardrail)
 */
export interface Validator {
  type:
    | 'banned_words'
    | 'max_length'
    | 'min_length'
    | 'regex_match'
    | 'json_schema'
    | 'sentiment'
    | 'toxicity'
    | 'pii_detection'
    | 'custom';
  enabled: boolean;
  fail_on_violation?: boolean;
  params?: Record<string, unknown>;
}

/**
 * Tested model information
 */
export interface TestedModel {
  provider: string;
  model: string;
  date: string;
  success_rate?: number;
  avg_tokens?: number;
  avg_cost?: number;
  avg_latency_ms?: number;
  notes?: string;
}

/**
 * Model-specific overrides
 */
export interface ModelOverride {
  system_template_prefix?: string;
  system_template_suffix?: string;
  system_template?: string;
  parameters?: Parameters;
}

/**
 * Multimodal content configuration
 */
export interface MediaConfig {
  enabled: boolean;
  supported_types?: string[];
  image?: ImageConfig;
  audio?: AudioConfig;
  video?: VideoConfig;
  document?: DocumentConfig;
  examples?: MultimodalExample[];
  [key: string]: unknown; // Allow custom media types
}

/**
 * Image-specific configuration
 */
export interface ImageConfig {
  max_size_mb?: number;
  allowed_formats?: ('jpeg' | 'jpg' | 'png' | 'webp' | 'gif' | 'bmp')[];
  default_detail?: 'low' | 'high' | 'auto';
  require_caption?: boolean;
  max_images_per_msg?: number;
}

/**
 * Audio-specific configuration
 */
export interface AudioConfig {
  max_size_mb?: number;
  allowed_formats?: ('mp3' | 'wav' | 'opus' | 'flac' | 'm4a' | 'aac')[];
  max_duration_sec?: number;
  require_metadata?: boolean;
}

/**
 * Video-specific configuration
 */
export interface VideoConfig {
  max_size_mb?: number;
  allowed_formats?: ('mp4' | 'webm' | 'mov' | 'avi' | 'mkv')[];
  max_duration_sec?: number;
  require_metadata?: boolean;
}

/**
 * Document-specific configuration
 */
export interface DocumentConfig {
  max_size_mb?: number;
  allowed_formats?: string[];
  max_pages?: number;
  require_metadata?: boolean;
  extraction_mode?: 'text' | 'structured' | 'raw';
}

/**
 * Generic media type configuration
 */
export interface GenericMediaTypeConfig {
  max_size_mb?: number;
  allowed_formats?: string[];
  require_metadata?: boolean;
  validation_params?: Record<string, unknown>;
}

/**
 * Multimodal example message
 */
export interface MultimodalExample {
  name: string;
  description?: string;
  role: 'user' | 'assistant' | 'system';
  parts: ContentPart[];
}

/**
 * Content part (text or media)
 */
export interface ContentPart {
  type: string;
  text?: string;
  media?: MediaReference;
}

/**
 * Media file reference
 */
export interface MediaReference {
  file_path?: string;
  url?: string;
  base64?: string;
  mime_type: string;
  detail?: 'low' | 'high' | 'auto';
  caption?: string;
}

/**
 * Pack metadata
 */
export interface PackMetadata {
  domain?: string;
  language?: string;
  tags?: string[];
  cost_estimate?: {
    min_cost_usd?: number;
    max_cost_usd?: number;
    avg_cost_usd?: number;
  };
  [key: string]: unknown;
}

/**
 * Compilation information
 */
export interface CompilationInfo {
  compiled_with: string;
  created_at: string;
  schema: string;
  source?: string;
}
