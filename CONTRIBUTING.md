# Contributing to @promptpack/langchain

Thank you for your interest in contributing to @promptpack/langchain! This document provides comprehensive guidelines and instructions for contributing to our open source project.

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [conduct@altairalabs.ai](mailto:conduct@altairalabs.ai).

## Developer Certificate of Origin (DCO)

By contributing to this project, you certify that:

1. The contribution was created in whole or in part by you and you have the right to submit it under the open source license indicated in the file; or
2. The contribution is based upon previous work that, to the best of your knowledge, is covered under an appropriate open source license and you have the right under that license to submit that work with modifications; or
3. The contribution was provided directly to you by some other person who certified (1), (2) or (3) and you have not modified it.

Sign your commits with `git commit -s` to add your Signed-off-by line.

## How to Contribute

### Reporting Bugs

- Check [existing issues](https://github.com/AltairaLabs/promptpack-langchainjs/issues) first
- Provide clear reproduction steps
- Include version information (Node.js, package version, LangChain version)
- Share relevant configuration/code samples
- Include error messages and stack traces

**Bug Report Template:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Load promptpack '...'
2. Create template '...'
3. Run with variables '...'
4. See error

**Expected behavior**
What you expected to happen.

**Environment:**
- Node.js version: [e.g. 20.10.0]
- @promptpack/langchain version: [e.g. 0.1.0]
- @langchain/core version: [e.g. 0.3.0]
- OS: [e.g. macOS 14.0]

**Additional context**
Add any other context about the problem here.
```

### Suggesting Features

- Open an issue describing the feature
- Explain the use case and benefits
- Discuss implementation approach
- Consider backward compatibility

### Submitting Changes

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes**
4. **Write/update tests** (maintain 80%+ coverage)
5. **Run tests**: `npm test`
6. **Run linter**: `npm run lint`
7. **Build**: `npm run build`
8. **Commit your changes**: Use clear, descriptive commit messages
9. **Push to your fork**: `git push origin feature/your-feature-name`
10. **Open a Pull Request**

## Development Setup

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/promptpack-langchainjs.git
cd promptpack-langchainjs

# Install dependencies
npm install

# Run tests
npm test

# Build the package
npm run build

# Run linter
npm run lint
```

### Project Structure

```
promptpack-langchainjs/
├── src/                    # Source code
│   ├── index.ts           # Main exports
│   ├── registry.ts        # PromptPack registry
│   ├── template.ts        # LangChain template integration
│   ├── template-engine.ts # Template rendering engine
│   ├── validation-runnable.ts  # Validation logic
│   ├── validators.ts      # Built-in validators
│   ├── tools.ts          # Tool integration
│   ├── multimodal.ts     # Multimodal content support
│   ├── types.ts          # TypeScript type definitions
│   └── __tests__/        # Test files
├── examples/             # Example configurations
├── docs/                 # Documentation
└── .github/              # GitHub workflows and templates
```

## Component-Specific Guidelines

### Core Library (`src/`)

**Focus**: Registry, templates, and LangChain integration

**Key Areas for Contribution:**
- Template rendering and variable handling
- LangChain Runnable compatibility
- Type definitions and TypeScript support
- Performance optimizations
- Error handling and validation

**Testing Changes:**
```bash
# Run specific test file
npm test -- src/__tests__/template.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode during development
npm test -- --watch
```

### Validators (`src/validators.ts`, `src/validation-runnable.ts`)

**Focus**: Response validation and guardrails

**Key Areas for Contribution:**
- New OOTB validator types
- Custom validator patterns
- Validation performance
- Error messages and reporting

**Testing Validators:**
```bash
npm test -- src/__tests__/validators.test.ts
npm test -- src/__tests__/validation-runnable.test.ts
```

### Tools (`src/tools.ts`)

**Focus**: Tool calling and governance

**Key Areas for Contribution:**
- Tool filtering and conversion
- Policy enforcement
- Tool execution management
- LangChain tool format compatibility

**Testing Tools:**
```bash
npm test -- src/__tests__/tools.test.ts
```

### Multimodal (`src/multimodal.ts`)

**Focus**: Multimodal content handling (images, audio, video)

**Key Areas for Contribution:**
- Media type support
- Content conversion
- Validation logic
- Format compatibility

**Testing Multimodal:**
```bash
npm test -- src/__tests__/multimodal.test.ts
```

## Coding Guidelines

### TypeScript Style

- Follow TypeScript best practices
- Use strict type checking
- Avoid `any` types where possible
- Export types from `types.ts`
- Use meaningful, descriptive names
- Add JSDoc comments for public APIs

### Testing

- Write unit tests for new functionality
- Maintain test coverage above 80%
- Test edge cases and error conditions
- Use descriptive test names
- Mock external dependencies (LangChain, etc.)

**Test Structure:**
```typescript
describe('MyFeature', () => {
  describe('myFunction', () => {
    it('should handle valid input', () => {
      // Test implementation
    });

    it('should throw on invalid input', () => {
      expect(() => myFunction(invalidInput)).toThrow();
    });

    it('should handle edge case', () => {
      // Edge case test
    });
  });
});
```

### Documentation

- Update README.md if adding features
- Add inline comments for complex logic
- Update API documentation in `docs/`
- Add examples for new features
- Update TypeDoc comments

### Commit Messages

Use clear, descriptive commit messages following conventional commits:

```
feat: add support for custom validators
fix: resolve template variable escaping issue
docs: update validator documentation
test: add tests for multimodal content
chore: update dependencies
```

## Pull Request Process

1. **Ensure CI passes** - All tests, linter, and build checks must pass
2. **Update documentation** - README, inline docs, API reference
3. **Maintain coverage** - Tests must maintain 80%+ coverage
4. **Request review** - Tag maintainers for review
5. **Address feedback** - Respond to review comments
6. **Resolve conversations** - All review comments must be resolved
7. **Sign commits** - Use `git commit -s` for DCO compliance
8. **Keep branch updated** - Rebase or merge with latest `main`
9. **Squash merge** - Preferred for clean commit history

### PR Checklist

- [ ] Tests pass (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Coverage maintained/improved
- [ ] Documentation updated
- [ ] Examples updated (if applicable)
- [ ] Breaking changes documented
- [ ] Commits signed (`git commit -s`)

## Release Process

Maintainers handle releases through GitHub Actions. See [Releasing Documentation](./docs/releasing.md) for details.

## Questions?

- Open a [GitHub issue](https://github.com/AltairaLabs/promptpack-langchainjs/issues) for questions
- Check [existing documentation](./docs/)
- Review closed issues and PRs
- Join [GitHub Discussions](https://github.com/AltairaLabs/promptpack-langchainjs/discussions)

## Recognition

All contributors are recognized in our release notes and documentation. Thank you for helping make @promptpack/langchain better!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
