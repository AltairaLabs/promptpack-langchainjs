/**
 * Multimodal content support for PromptPack
 */

import { MessageContent, ContentBlock } from '@langchain/core/messages';
import { ContentPart, MediaReference, MediaConfig } from './types';

/**
 * Error thrown when media validation fails
 */
export class MediaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MediaValidationError';
  }
}

/**
 * Convert PromptPack ContentPart to LangChain message content
 */
export function convertContentPart(part: ContentPart): ContentBlock {
  if (part.type === 'text' && part.text) {
    return {
      type: 'text',
      text: part.text,
    };
  }
  
  if (part.type === 'image' && part.media) {
    return convertImageMedia(part.media);
  }
  
  // For other media types, return as text description
  return {
    type: 'text',
    text: `[${part.type} content]${part.media?.caption ? ': ' + part.media.caption : ''}`,
  };
}

/**
 * Convert PromptPack MediaReference to LangChain image content
 */
function convertImageMedia(media: MediaReference): ContentBlock {
  if (media.url) {
    return {
      type: 'image_url',
      image_url: {
        url: media.url,
        detail: media.detail || 'auto',
      },
    };
  }
  
  if (media.base64) {
    return {
      type: 'image_url',
      image_url: {
        url: `data:${media.mime_type};base64,${media.base64}`,
        detail: media.detail || 'auto',
      },
    };
  }
  
  throw new MediaValidationError('Image media must have either url or base64 data');
}

/**
 * Validate media content against configuration
 */
export function validateMediaContent(
  parts: ContentPart[],
  config: MediaConfig
): void {
  if (!config.enabled) {
    // Check if there's any non-text content
    const hasMedia = parts.some((part) => part.type !== 'text');
    if (hasMedia) {
      throw new MediaValidationError('Multimodal content is not enabled for this prompt');
    }
    return;
  }
  
  const supportedTypes = config.supported_types || [];
  
  for (const part of parts) {
    if (part.type === 'text') {
      continue; // Text is always allowed
    }
    
    // Check if media type is supported
    if (!supportedTypes.includes(part.type)) {
      throw new MediaValidationError(
        `Media type '${part.type}' is not supported. Supported types: ${supportedTypes.join(', ')}`
      );
    }
    
    // Validate specific media types
    if (part.media) {
      validateMediaReference(part.type, part.media, config);
    }
  }
  
  // Validate image count if applicable
  if (config.image?.max_images_per_msg) {
    const imageCount = parts.filter((p) => p.type === 'image').length;
    if (imageCount > config.image.max_images_per_msg) {
      throw new MediaValidationError(
        `Too many images: ${imageCount} (max: ${config.image.max_images_per_msg})`
      );
    }
  }
}

/**
 * Validate a media reference against type-specific configuration
 */
function validateMediaReference(
  type: string,
  media: MediaReference,
  config: MediaConfig
): void {
  // Validate MIME type format
  if (!media.mime_type?.includes('/')) {
    throw new MediaValidationError('Invalid MIME type');
  }
  
  // Type-specific validation
  switch (type) {
    case 'image':
      if (config.image) {
        validateImageMedia(media, config.image);
      }
      break;
    case 'audio':
      if (config.audio) {
        validateAudioMedia(media, config.audio);
      }
      break;
    case 'video':
      if (config.video) {
        validateVideoMedia(media, config.video);
      }
      break;
    case 'document':
      if (config.document) {
        validateDocumentMedia(media, config.document);
      }
      break;
  }
  
  // Check caption requirement
  const typeConfig = (config as Record<string, unknown>)[type];
  if (
    typeConfig &&
    typeof typeConfig === 'object' &&
    'require_caption' in typeConfig &&
    typeConfig.require_caption &&
    !media.caption
  ) {
    throw new MediaValidationError(`Caption is required for ${type} media`);
  }
}

/**
 * Validate image media
 */
function validateImageMedia(
  media: MediaReference,
  config: { allowed_formats?: string[] }
): void {
  if (config.allowed_formats) {
    const format = media.mime_type.split('/')[1];
    if (!config.allowed_formats.includes(format)) {
      throw new MediaValidationError(
        `Image format '${format}' not allowed. Allowed: ${config.allowed_formats.join(', ')}`
      );
    }
  }
}

/**
 * Validate audio media
 */
function validateAudioMedia(
  media: MediaReference,
  config: { allowed_formats?: string[] }
): void {
  if (config.allowed_formats) {
    const format = media.mime_type.split('/')[1];
    if (!config.allowed_formats.includes(format)) {
      throw new MediaValidationError(
        `Audio format '${format}' not allowed. Allowed: ${config.allowed_formats.join(', ')}`
      );
    }
  }
}

/**
 * Validate video media
 */
function validateVideoMedia(
  media: MediaReference,
  config: { allowed_formats?: string[] }
): void {
  if (config.allowed_formats) {
    const format = media.mime_type.split('/')[1];
    if (!config.allowed_formats.includes(format)) {
      throw new MediaValidationError(
        `Video format '${format}' not allowed. Allowed: ${config.allowed_formats.join(', ')}`
      );
    }
  }
}

/**
 * Validate document media
 */
function validateDocumentMedia(
  media: MediaReference,
  config: { allowed_formats?: string[] }
): void {
  if (config.allowed_formats) {
    const format = media.mime_type.split('/')[1];
    if (!config.allowed_formats.includes(format)) {
      throw new MediaValidationError(
        `Document format '${format}' not allowed. Allowed: ${config.allowed_formats.join(', ')}`
      );
    }
  }
}

/**
 * Create a multimodal message with text and media content
 */
export function createMultimodalContent(parts: ContentPart[]): MessageContent {
  if (parts.length === 1 && parts[0].type === 'text') {
    // Simple text message
    return parts[0].text || '';
  }
  
  // Complex multimodal message
  return parts.map(convertContentPart) as MessageContent;
}
