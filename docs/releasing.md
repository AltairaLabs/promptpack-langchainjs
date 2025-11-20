# Release Process

This document describes how to publish new versions of `@promptpack/langchain` to npm.

## Automated Release Process

We use GitHub Actions to automate npm publishing. There are two workflows:

### 1. Version Bump Workflow (Manual)

This workflow helps you create a new version and GitHub release.

**How to use:**
1. Go to **Actions** → **Version Bump** in GitHub
2. Click **Run workflow**
3. Select the version bump type:
   - `patch` - Bug fixes (0.1.0 → 0.1.1)
   - `minor` - New features (0.1.0 → 0.2.0)
   - `major` - Breaking changes (0.1.0 → 1.0.0)
4. Optionally check **prerelease** for beta versions
5. Click **Run workflow**

The workflow will:
- Bump the version in `package.json`
- Commit and push the changes
- Create a Git tag
- Create a GitHub release (draft)

### 2. Publish Workflow (Automatic)

This workflow automatically publishes to npm when you publish a GitHub release.

**How it works:**
1. After the Version Bump workflow creates a release, edit the release notes
2. Click **Publish release** on GitHub
3. The workflow automatically:
   - Runs tests and linting
   - Builds the package
   - Publishes to npm with provenance

## Setup Requirements

### NPM Token

You need to configure an NPM access token as a GitHub secret:

1. **Generate NPM Token:**
   - Go to [npmjs.com](https://www.npmjs.com/)
   - Navigate to **Account → Access Tokens**
   - Click **Generate New Token** → **Automation**
   - Copy the token

2. **Add to GitHub Secrets:**
   - Go to your repository **Settings → Secrets and variables → Actions**
   - Click **New repository secret**
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token
   - Click **Add secret**

### GitHub Token

The `GITHUB_TOKEN` is automatically provided by GitHub Actions, no setup needed.

## Manual Release Process (Alternative)

If you prefer to publish manually:

### 1. Update Version

```bash
# For patch release (0.1.0 → 0.1.1)
npm version patch

# For minor release (0.1.0 → 0.2.0)
npm version minor

# For major release (0.1.0 → 1.0.0)
npm version major

# For prerelease (0.1.0 → 0.1.1-beta.0)
npm version prerelease --preid=beta
```

### 2. Run Tests

```bash
npm run lint
npm test -- --coverage
npm run build
```

### 3. Publish to npm

```bash
# Public package
npm publish --access public

# With provenance (recommended)
npm publish --provenance --access public
```

### 4. Push Changes

```bash
git push
git push --tags
```

### 5. Create GitHub Release

1. Go to **Releases** → **Create a new release**
2. Select the tag you just created
3. Write release notes
4. Click **Publish release**

## Release Checklist

Before publishing a release:

- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Coverage is above 80% (`npm test -- --coverage`)
- [ ] Documentation is up to date
- [ ] CHANGELOG.md is updated (if you have one)
- [ ] Examples work with the new version
- [ ] Breaking changes are documented (for major versions)

## Version Guidelines

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes to the API
- **MINOR** (0.X.0): New features, backwards compatible
- **PATCH** (0.0.X): Bug fixes, backwards compatible

### What constitutes a breaking change?

- Removing or renaming exported functions/classes
- Changing function signatures
- Removing support for Node.js versions
- Changing behavior that could break existing code

## Troubleshooting

### "You do not have permission to publish"

Make sure:
1. You're logged into npm: `npm login`
2. You have publish rights to the `@promptpack` scope
3. The `NPM_TOKEN` secret is correctly configured in GitHub

### "Tag already exists"

If a git tag already exists:
```bash
git tag -d v0.1.1  # Delete local tag
git push origin :refs/tags/v0.1.1  # Delete remote tag
```

### "This package has been published with provenance"

Once you publish with `--provenance`, all future versions should also use it. This is automatically handled in the GitHub Actions workflow.

## Best Practices

1. **Test before publishing**: Always run the full test suite
2. **Use prereleases**: For experimental features, use beta versions
3. **Document changes**: Keep good release notes for users
4. **Coordinate releases**: Communicate with team members before major releases
5. **Monitor npm**: Check that the package appears correctly after publishing

## Example Release Flow

```bash
# 1. Create a feature branch
git checkout -b feature/new-validator

# 2. Make changes and commit
git add .
git commit -m "feat: add new validator type"

# 3. Push and create PR
git push origin feature/new-validator

# 4. After PR is merged, use GitHub Actions:
#    - Go to Actions → Version Bump
#    - Select "minor" (new feature)
#    - Run workflow

# 5. Edit the created release notes on GitHub

# 6. Publish the release
#    - The publish workflow automatically runs
#    - Package is published to npm
```

## Support

If you encounter issues with the release process:
1. Check the GitHub Actions logs
2. Review npm publish logs
3. Contact the maintainers
