---
name: Bug Report
about: Report a bug or unexpected behavior
title: '[Bug]: '
labels: bug
assignees: ''
---

## Describe the Bug

A clear and concise description of what the bug is.

## To Reproduce

Steps to reproduce the behavior:

1. Load promptpack from '...'
2. Create template with '...'
3. Call invoke with '...'
4. See error

**Code Sample:**

```typescript
// Minimal code to reproduce the issue
const template = new PromptPackTemplate({
  pack,
  promptId: 'example',
});

const result = await template.invoke({ variable: 'value' });
```

## Expected Behavior

A clear and concise description of what you expected to happen.

## Actual Behavior

What actually happened. Include error messages and stack traces.

```
Error message here
```

## Environment

- **Node.js version**: [e.g. 20.10.0]
- **@promptpack/langchain version**: [e.g. 0.1.0]
- **@langchain/core version**: [e.g. 0.3.0]
- **langchain version**: [e.g. 0.3.0]
- **OS**: [e.g. macOS 14.0, Ubuntu 22.04]
- **Package manager**: [e.g. npm 10.2.0, yarn 4.0.0]

## Additional Context

Add any other context about the problem here. This might include:

- PromptPack configuration (if relevant)
- LLM provider being used
- Any workarounds you've found
- Related issues or discussions

## Possible Solution

If you have suggestions on how to fix the bug, please describe them here.
