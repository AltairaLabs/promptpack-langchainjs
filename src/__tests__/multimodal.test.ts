/**
 * Tests for multimodal content support
 */

import {
  convertContentPart,
  validateMediaContent,
  createMultimodalContent,
  MediaValidationError,
} from '../multimodal';
import type { ContentPart, MediaConfig } from '../types';

describe('convertContentPart', () => {
  it('should convert text content', () => {
    const part: ContentPart = {
      type: 'text',
      text: 'Hello world',
    };

    const result = convertContentPart(part);
    expect(result).toEqual({
      type: 'text',
      text: 'Hello world',
    });
  });

  it('should convert image with URL', () => {
    const part: ContentPart = {
      type: 'image',
      media: {
        url: 'https://example.com/image.jpg',
        mime_type: 'image/jpeg',
        detail: 'high',
      },
    };

    const result = convertContentPart(part);
    expect(result).toEqual({
      type: 'image_url',
      image_url: {
        url: 'https://example.com/image.jpg',
        detail: 'high',
      },
    });
  });

  it('should convert image with base64', () => {
    const part: ContentPart = {
      type: 'image',
      media: {
        base64: 'abc123',
        mime_type: 'image/png',
      },
    };

    const result = convertContentPart(part);
    expect(result).toEqual({
      type: 'image_url',
      image_url: {
        url: 'data:image/png;base64,abc123',
        detail: 'auto',
      },
    });
  });

  it('should throw if image has no URL or base64', () => {
    const part: ContentPart = {
      type: 'image',
      media: {
        mime_type: 'image/jpeg',
      },
    };

    expect(() => convertContentPart(part)).toThrow(MediaValidationError);
    expect(() => convertContentPart(part)).toThrow('must have either url or base64');
  });

  it('should convert other media types as text description', () => {
    const part: ContentPart = {
      type: 'audio',
      media: {
        url: 'https://example.com/audio.mp3',
        mime_type: 'audio/mpeg',
        caption: 'Test audio',
      },
    };

    const result = convertContentPart(part);
    expect(result).toEqual({
      type: 'text',
      text: '[audio content]: Test audio',
    });
  });

  it('should handle media without caption', () => {
    const part: ContentPart = {
      type: 'video',
      media: {
        url: 'https://example.com/video.mp4',
        mime_type: 'video/mp4',
      },
    };

    const result = convertContentPart(part);
    expect(result).toEqual({
      type: 'text',
      text: '[video content]',
    });
  });
});

describe('validateMediaContent', () => {
  const basicConfig: MediaConfig = {
    enabled: true,
    supported_types: ['image', 'audio'],
  };

  it('should pass validation for text-only content', () => {
    const parts: ContentPart[] = [
      { type: 'text', text: 'Hello' },
    ];

    expect(() => validateMediaContent(parts, basicConfig)).not.toThrow();
  });

  it('should throw if multimodal is disabled but media present', () => {
    const parts: ContentPart[] = [
      { type: 'text', text: 'Hello' },
      {
        type: 'image',
        media: {
          url: 'https://example.com/image.jpg',
          mime_type: 'image/jpeg',
        },
      },
    ];

    const disabledConfig: MediaConfig = {
      enabled: false,
    };

    expect(() => validateMediaContent(parts, disabledConfig)).toThrow(MediaValidationError);
    expect(() => validateMediaContent(parts, disabledConfig)).toThrow('not enabled');
  });

  it('should allow text when multimodal is disabled', () => {
    const parts: ContentPart[] = [
      { type: 'text', text: 'Hello' },
    ];

    const disabledConfig: MediaConfig = {
      enabled: false,
    };

    expect(() => validateMediaContent(parts, disabledConfig)).not.toThrow();
  });

  it('should throw if media type not supported', () => {
    const parts: ContentPart[] = [
      {
        type: 'video',
        media: {
          url: 'https://example.com/video.mp4',
          mime_type: 'video/mp4',
        },
      },
    ];

    expect(() => validateMediaContent(parts, basicConfig)).toThrow(MediaValidationError);
    expect(() => validateMediaContent(parts, basicConfig)).toThrow('not supported');
  });

  it('should validate image count', () => {
    const parts: ContentPart[] = [
      {
        type: 'image',
        media: { url: 'https://example.com/1.jpg', mime_type: 'image/jpeg' },
      },
      {
        type: 'image',
        media: { url: 'https://example.com/2.jpg', mime_type: 'image/jpeg' },
      },
      {
        type: 'image',
        media: { url: 'https://example.com/3.jpg', mime_type: 'image/jpeg' },
      },
    ];

    const configWithLimit: MediaConfig = {
      enabled: true,
      supported_types: ['image'],
      image: {
        max_images_per_msg: 2,
      },
    };

    expect(() => validateMediaContent(parts, configWithLimit)).toThrow(MediaValidationError);
    expect(() => validateMediaContent(parts, configWithLimit)).toThrow('Too many images');
  });

  it('should throw if MIME type is invalid', () => {
    const parts: ContentPart[] = [
      {
        type: 'image',
        media: {
          url: 'https://example.com/image.jpg',
          mime_type: 'invalid',
        },
      },
    ];

    expect(() => validateMediaContent(parts, basicConfig)).toThrow(MediaValidationError);
    expect(() => validateMediaContent(parts, basicConfig)).toThrow('Invalid MIME type');
  });

  it('should validate image format', () => {
    const parts: ContentPart[] = [
      {
        type: 'image',
        media: {
          url: 'https://example.com/image.bmp',
          mime_type: 'image/bmp',
        },
      },
    ];

    const configWithFormats: MediaConfig = {
      enabled: true,
      supported_types: ['image'],
      image: {
        allowed_formats: ['jpeg', 'png'],
      },
    };

    expect(() => validateMediaContent(parts, configWithFormats)).toThrow(MediaValidationError);
    expect(() => validateMediaContent(parts, configWithFormats)).toThrow('not allowed');
  });

  it('should validate audio format', () => {
    const parts: ContentPart[] = [
      {
        type: 'audio',
        media: {
          url: 'https://example.com/audio.wav',
          mime_type: 'audio/wav',
        },
      },
    ];

    const configWithFormats: MediaConfig = {
      enabled: true,
      supported_types: ['audio'],
      audio: {
        allowed_formats: ['mp3', 'aac'],
      },
    };

    expect(() => validateMediaContent(parts, configWithFormats)).toThrow(MediaValidationError);
    expect(() => validateMediaContent(parts, configWithFormats)).toThrow('not allowed');
  });

  it('should validate video format', () => {
    const parts: ContentPart[] = [
      {
        type: 'video',
        media: {
          url: 'https://example.com/video.avi',
          mime_type: 'video/avi',
        },
      },
    ];

    const configWithFormats: MediaConfig = {
      enabled: true,
      supported_types: ['video'],
      video: {
        allowed_formats: ['mp4', 'webm'],
      },
    };

    expect(() => validateMediaContent(parts, configWithFormats)).toThrow(MediaValidationError);
    expect(() => validateMediaContent(parts, configWithFormats)).toThrow('not allowed');
  });

  it('should validate document format', () => {
    const parts: ContentPart[] = [
      {
        type: 'document',
        media: {
          url: 'https://example.com/doc.doc',
          mime_type: 'application/doc',
        },
      },
    ];

    const configWithFormats: MediaConfig = {
      enabled: true,
      supported_types: ['document'],
      document: {
        allowed_formats: ['pdf', 'docx'],
      },
    };

    expect(() => validateMediaContent(parts, configWithFormats)).toThrow(MediaValidationError);
    expect(() => validateMediaContent(parts, configWithFormats)).toThrow('not allowed');
  });

  it('should require caption if configured', () => {
    const parts: ContentPart[] = [
      {
        type: 'image',
        media: {
          url: 'https://example.com/image.jpg',
          mime_type: 'image/jpeg',
        },
      },
    ];

    const configWithCaption: MediaConfig = {
      enabled: true,
      supported_types: ['image'],
      image: {
        require_caption: true,
      },
    };

    expect(() => validateMediaContent(parts, configWithCaption)).toThrow(MediaValidationError);
    expect(() => validateMediaContent(parts, configWithCaption)).toThrow('Caption is required');
  });

  it('should pass if caption provided when required', () => {
    const parts: ContentPart[] = [
      {
        type: 'image',
        media: {
          url: 'https://example.com/image.jpg',
          mime_type: 'image/jpeg',
          caption: 'Test caption',
        },
      },
    ];

    const configWithCaption: MediaConfig = {
      enabled: true,
      supported_types: ['image'],
      image: {
        require_caption: true,
      },
    };

    expect(() => validateMediaContent(parts, configWithCaption)).not.toThrow();
  });
});

describe('createMultimodalContent', () => {
  it('should return string for single text part', () => {
    const parts: ContentPart[] = [
      { type: 'text', text: 'Hello world' },
    ];

    const result = createMultimodalContent(parts);
    expect(result).toBe('Hello world');
  });

  it('should return array for multiple parts', () => {
    const parts: ContentPart[] = [
      { type: 'text', text: 'Check this image:' },
      {
        type: 'image',
        media: {
          url: 'https://example.com/image.jpg',
          mime_type: 'image/jpeg',
        },
      },
    ];

    const result = createMultimodalContent(parts);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('should handle mixed content types', () => {
    const parts: ContentPart[] = [
      { type: 'text', text: 'Text' },
      {
        type: 'image',
        media: {
          url: 'https://example.com/image.jpg',
          mime_type: 'image/jpeg',
        },
      },
      {
        type: 'audio',
        media: {
          url: 'https://example.com/audio.mp3',
          mime_type: 'audio/mpeg',
          caption: 'Audio',
        },
      },
    ];

    const result = createMultimodalContent(parts);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(3);
  });
});
