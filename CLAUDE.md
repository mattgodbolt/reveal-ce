# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

reveal-ce is a plugin for reveal.js that transforms C++ code blocks into presentation-ready Compiler Explorer-linked
snippets. It allows users to:

- Control-click on code to open the code in Compiler Explorer
- Hide regions of code in the presentation view while keeping them in the Compiler Explorer link
- Define setup regions
- Configure the Compiler Explorer instance

## Repository Structure

- `index.js` - The main plugin file containing all the functionality
- `package.json` - Basic npm configuration with prettier for code formatting

## Development Commands

- **Format code**: `npx prettier --write .`
- **Check code formatting**: `npx prettier --check .`
- **Create commit**: `npm run commit` (uses commitizen for conventional commits)
- **Run tests**: `npm test`
- **Run tests with coverage**: `npm run test:coverage`

## Commit Guidelines

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for standardized commit messages, which enable automated versioning via semantic-release. The format is:

```
<type>(<optional scope>): <description>

<optional body>

<optional footer>
```

Common types:
- `feat:` - A new feature (triggers MINOR version bump: 1.0.0 → 1.1.0)
- `fix:` - A bug fix (triggers PATCH version bump: 1.0.0 → 1.0.1)
- `docs:` - Documentation changes (no version bump)
- `style:` - Code style changes (no version bump)
- `refactor:` - Code changes that neither fix bugs nor add features (no version bump)
- `test:` - Adding or modifying tests (no version bump)
- `chore:` - Changes to the build process or auxiliary tools (no version bump)
- `ci:` - Changes to CI configuration (no version bump)

Breaking changes are indicated with an exclamation mark after the type/scope or with a footer:
- `feat!:` or `BREAKING CHANGE:` in footer - (triggers MAJOR version bump: 1.0.0 → 2.0.0)

To create a commit:
1. Stage your changes with `git add`
2. Run `npm run commit` (instead of `git commit`)
3. Follow the interactive prompts to create a proper conventional commit

The commit hook will validate your commit message format using commitlint.

## Architecture Notes

The plugin consists of several key functions:

1. `trim()` - Handles whitespace in code blocks and supports undenting
2. `parseCodeBlock()` - Processes code blocks with special markers for hiding/setup regions
3. `createCompilerExplorerLink()` - Generates properly formatted links to Compiler Explorer
4. `initializeConfig()` - Sets up configuration with defaults and user overrides
5. `attachEventListeners()` - Handles click events to open Compiler Explorer

The plugin exports a reveal.js plugin interface with an `id` and `init` function that processes all code blocks with the
`data-ce` attribute.

## Formatting and Style

- The project uses Prettier for code formatting
- JavaScript with ES modules is used throughout
- Current code style uses 4-space indentation

## Usage in Presentations

The plugin is designed to be integrated into reveal.js presentations, either as a submodule or copied directly into the
project. It must be loaded before the Highlight plugin in the reveal.js configuration.

## Testing

Testing is primarily manual by integrating the plugin into a reveal.js presentation and verifying the functionality.
