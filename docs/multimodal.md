# Multimodal Support

PromptPack supports multimodal AI interactions including images, audio, and video through standardized message formatting.

## Overview

Multimodal content is represented using structured message parts that work seamlessly with LangChain's message types and modern LLM APIs.

## Image Support

### Base64 Images

```typescript
import { HumanMessage } from '@langchain/core/messages';

const message = new HumanMessage({
  content: [
    { type: 'text', text: 'What is in this image?' },
    {
      type: 'image_url',
      image_url: {
        url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
        detail: 'high' // or 'low', 'auto'
      }
    }
  ]
});
```

### Image URLs

```typescript
const message = new HumanMessage({
  content: [
    { type: 'text', text: 'Describe this image' },
    {
      type: 'image_url',
      image_url: {
        url: 'https://example.com/image.jpg'
      }
    }
  ]
});
```

### Multiple Images

```typescript
const message = new HumanMessage({
  content: [
    { type: 'text', text: 'Compare these images' },
    { type: 'image_url', image_url: { url: imageUrl1 } },
    { type: 'image_url', image_url: { url: imageUrl2 } },
    { type: 'image_url', image_url: { url: imageUrl3 } }
  ]
});
```

## Audio Support

### Audio Input

```typescript
const message = new HumanMessage({
  content: [
    {
      type: 'input_audio',
      input_audio: {
        data: base64AudioData,
        format: 'mp3' // or 'wav', 'ogg', etc.
      }
    }
  ]
});
```

## Video Support

Video frames can be provided as sequences of images:

```typescript
const frames = extractVideoFrames(videoFile); // Your implementation

const message = new HumanMessage({
  content: [
    { type: 'text', text: 'Describe what happens in this video' },
    ...frames.map(frame => ({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${frame}` }
    }))
  ]
});
```

## Using Multimodal with PromptPack

### Basic Example

```typescript
import { PromptPackTemplate } from '@promptpack/langchain';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { readFileSync } from 'fs';

// 1. Load pack
const pack = PromptPackRegistry.loadFromFile('./pack.json');
const template = new PromptPackTemplate({ 
  pack, 
  promptId: 'image_analyzer' 
});

// 2. Format system prompt
const messages = await template.format({
  task: 'detailed analysis',
  output_format: 'JSON'
});

// 3. Load image
const imageBuffer = readFileSync('./photo.jpg');
const base64Image = imageBuffer.toString('base64');

// 4. Add user message with image
messages.push(new HumanMessage({
  content: [
    { type: 'text', text: 'Analyze this image' },
    {
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${base64Image}`,
        detail: 'high'
      }
    }
  ]
}));

// 5. Invoke model
const model = new ChatOpenAI({ model: 'gpt-4o' }); // Vision models
const response = await model.invoke(messages);

console.log(response.content);
```

### With Variables

```json
{
  "prompts": {
    "image_analyzer": {
      "id": "image_analyzer",
      "system_template": "You are an image analysis expert. Focus on: {{analysis_type}}",
      "variables": {
        "analysis_type": {
          "type": "string",
          "description": "Type of analysis to perform",
          "default": "general description"
        }
      }
    }
  }
}
```

```typescript
const messages = await template.format({
  analysis_type: 'object detection and counting'
});

messages.push(new HumanMessage({
  content: [
    { type: 'text', text: 'Count the objects in this image' },
    { type: 'image_url', image_url: { url: imageUrl } }
  ]
}));
```

## Image Detail Levels

Control cost and processing with detail parameter:

```typescript
// High detail - best for fine-grained analysis
{
  type: 'image_url',
  image_url: {
    url: imageUrl,
    detail: 'high' // More tokens, better accuracy
  }
}

// Low detail - faster, cheaper
{
  type: 'image_url',
  image_url: {
    url: imageUrl,
    detail: 'low' // Fewer tokens, faster
  }
}

// Auto - let model decide
{
  type: 'image_url',
  image_url: {
    url: imageUrl,
    detail: 'auto' // Balanced
  }
}
```

## Conversation with Images

```typescript
import { AIMessage, HumanMessage } from '@langchain/core/messages';

// System prompt
const messages = await template.format({ /* variables */ });

// Turn 1: User sends image
messages.push(new HumanMessage({
  content: [
    { type: 'text', text: 'What breed is this dog?' },
    { type: 'image_url', image_url: { url: dogImageUrl } }
  ]
}));

const response1 = await model.invoke(messages);
messages.push(new AIMessage({ content: response1.content }));

// Turn 2: Follow-up question (no image needed)
messages.push(new HumanMessage({
  content: 'What are common health issues for this breed?'
}));

const response2 = await model.invoke(messages);
messages.push(new AIMessage({ content: response2.content }));

// Turn 3: Another image
messages.push(new HumanMessage({
  content: [
    { type: 'text', text: 'Is this the same breed?' },
    { type: 'image_url', image_url: { url: anotherDogImageUrl } }
  ]
}));

const response3 = await model.invoke(messages);
```

## Helper Functions

### Load Image from File

```typescript
import { readFileSync } from 'fs';

function imageToBase64DataUrl(filePath: string): string {
  const buffer = readFileSync(filePath);
  const base64 = buffer.toString('base64');
  const mimeType = getMimeType(filePath); // 'image/jpeg', 'image/png', etc.
  return `data:${mimeType};base64,${base64}`;
}

function getMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp'
  };
  return types[ext || ''] || 'image/jpeg';
}
```

### Fetch Image from URL

```typescript
async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  return `data:${contentType};base64,${base64}`;
}
```

## Complete Example

See `examples/langchain-multimodal.ts` for a working example:

```typescript
import { PromptPackTemplate, PromptPackRegistry } from '@promptpack/langchain';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';

const pack = PromptPackRegistry.loadFromFile('./examples/packs/multimodal.json');
const template = new PromptPackTemplate({ pack, promptId: 'image_analyzer' });

// Format with variables
const messages = await template.format({
  analysis_focus: 'architecture and design elements'
});

// Add image
messages.push(new HumanMessage({
  content: [
    { type: 'text', text: 'Describe this building' },
    {
      type: 'image_url',
      image_url: {
        url: 'https://example.com/building.jpg',
        detail: 'high'
      }
    }
  ]
}));

// Invoke with vision model
const model = new ChatOpenAI({ model: 'gpt-4o' });
const response = await model.invoke(messages);

console.log(response.content);
```

## Model Support

Not all models support multimodal input. Check compatibility:

| Provider | Models | Image | Audio | Video |
|----------|--------|-------|-------|-------|
| OpenAI | gpt-4o, gpt-4o-mini, gpt-4-turbo | ✅ | ✅ | Via frames |
| OpenAI | gpt-4, gpt-3.5-turbo | ❌ | ❌ | ❌ |
| Anthropic | claude-3-opus, claude-3-sonnet, claude-3-haiku | ✅ | ❌ | Via frames |
| Google | gemini-pro-vision, gemini-1.5-pro | ✅ | ✅ | ✅ |

## Best Practices

1. **Use appropriate detail levels** - High for detailed analysis, low for simple tasks
2. **Compress images** - Large images increase cost and latency
3. **Batch similar images** - Process multiple images in one request when possible
4. **Cache base64** - Don't re-encode images for every request
5. **Handle errors** - Not all models support all image formats
6. **Test with real images** - Mock data doesn't catch format issues
7. **Monitor costs** - Multimodal requests use more tokens

## Limitations

- **Image size limits** - Typically 20MB per image (varies by provider)
- **Token costs** - Images consume many tokens (varies by size and detail)
- **Format support** - JPEG, PNG, GIF, WebP commonly supported
- **Context limits** - Multiple large images may exceed context window
- **Processing time** - Multimodal requests take longer than text-only

## Next Steps

- **[Validators](./validators.md)** - Validate multimodal responses
- **[Advanced](./advanced.md)** - Model overrides and fragments
- **[Examples](./examples.md)** - See complete code examples
