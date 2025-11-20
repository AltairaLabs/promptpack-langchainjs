# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in @promptpack/langchain, please report it responsibly:

### Private Disclosure

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please email us directly at:

**[security@altairalabs.ai](mailto:security@altairalabs.ai)**

Include in your report:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact information

### What to Expect

1. **Acknowledgment**: We'll acknowledge receipt within 48 hours
2. **Investigation**: We'll investigate and validate the report
3. **Updates**: We'll keep you informed of our progress
4. **Fix**: We'll develop and test a fix
5. **Release**: We'll release a patched version
6. **Credit**: We'll credit you in the security advisory (unless you prefer anonymity)

### Timeline

- Initial response: Within 48 hours
- Status update: Within 7 days
- Fix timeline: Depends on severity
  - Critical: Within 7 days
  - High: Within 14 days
  - Medium: Within 30 days
  - Low: Next regular release

## Security Best Practices

When using @promptpack/langchain:

### 1. Validate Input Variables

Always validate and sanitize user input before passing to templates:

```typescript
// ❌ Don't do this
const result = await template.invoke({ userInput: req.body.input });

// ✅ Do this
const sanitized = sanitizeInput(req.body.input);
const result = await template.invoke({ userInput: sanitized });
```

### 2. Use Validators

Enable response validators to catch unsafe outputs:

```typescript
const validators = template.getValidators();
const validationRunnable = template.createValidationRunnable(
  customValidators,
  { strict: true }
);
```

### 3. Restrict Tool Access

Use tool filtering and policies to limit tool access:

```typescript
const template = new PromptPackTemplate({
  pack,
  promptId: 'support',
});

// Only bind allowed tools
const filteredTools = template.filterTools(allTools);
const model = llm.bindTools(filteredTools);
```

### 4. Protect Sensitive Data

- Never include API keys or secrets in PromptPack files
- Use environment variables for sensitive configuration
- Sanitize logs and error messages

### 5. Keep Dependencies Updated

```bash
npm audit
npm update
```

## Known Security Considerations

### Template Injection

PromptPack templates use variable substitution. While the engine escapes variables by default, be cautious with:

- User-provided template strings
- Dynamic template generation
- Unvalidated variable values

### LLM-Specific Risks

- **Prompt Injection**: Users may attempt to override system instructions
- **Data Exfiltration**: LLMs may be tricked into revealing sensitive data
- **Tool Abuse**: Unrestricted tool access can be exploited

Use validators and tool policies to mitigate these risks.

## Automated Security Scanning

This repository uses multiple automated security tools:

### Dependabot

- **Dependency Updates**: Weekly automated PRs for outdated dependencies
- **Security Alerts**: Automatic alerts for known vulnerabilities
- **Auto-merge**: Security patches can be auto-merged after CI passes

View alerts: [Security → Dependabot alerts](https://github.com/AltairaLabs/promptpack-langchainjs/security/dependabot)

### CodeQL Analysis

- **Static Analysis**: Weekly code scanning for security vulnerabilities
- **Pull Request Scans**: Automatic analysis on all PRs
- **Security Queries**: Extended security and quality checks

View results: [Security → Code scanning](https://github.com/AltairaLabs/promptpack-langchainjs/security/code-scanning)

### npm audit

- **CI Integration**: Runs on every commit
- **Dependency Scanning**: Checks for known vulnerabilities in dependencies
- **Audit Level**: Fails on moderate and above vulnerabilities

## Security Updates

Security updates are distributed through:

- **GitHub Releases**: Tagged releases with security fixes
- **Security Advisories**: GitHub security advisories for critical issues
- **npm**: Updated package versions
- **Dependabot PRs**: Automated dependency updates
- **Documentation**: Updated security documentation and guidelines

Subscribe to repository notifications to stay informed.

## Scope

This security policy covers:

- The @promptpack/langchain npm package
- Example configurations in this repository
- Documentation and guides

It does not cover:

- Third-party LLM providers
- User-created PromptPack files
- Dependencies (report to respective projects)

## Contact

For security-related questions or concerns:

- **Email**: [security@altairalabs.ai](mailto:security@altairalabs.ai)
- **General Issues**: [GitHub Issues](https://github.com/AltairaLabs/promptpack-langchainjs/issues)

---

**Last Updated**: November 20, 2025  
**Next Review**: February 20, 2026

Thank you for helping keep @promptpack/langchain secure!
