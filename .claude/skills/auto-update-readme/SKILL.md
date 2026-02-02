---
name: auto-update-readme
description: Automatically analyze project and update README with current information
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Auto-Update README Skill

Automatically analyze project structure and update README.md content.

## Important: README Purpose

**README.md should only answer two questions:**
1. What can this project do? (Features)
2. How to use this project? (Usage instructions)

**README.md should NOT contain:**
- ❌ Component library list
- ❌ Project structure documentation
- ❌ Recent updates/changelog
- ❌ Development progress
- ❌ Technical implementation details (unless relevant to usage)

## When to Use

This skill should only be invoked automatically by the stop hook when there are git changes.

## What to Update

Only update the following sections related to **features** and **usage**:

1. **Features** - Scan pages under the app/ directory and list functionalities available to users
2. **Available Pages** - Update page routing table (extracted from app/*/page.tsx) to help users understand which pages they can access
3. **Tech Stack** - Only list major frameworks (Next.js, React versions, etc.), no need to list all dependencies
4. **Configuration** - Configuration items users need to know (e.g., environment variables, data source locations, etc.)

**Absolutely DO NOT add:**
- Component library documentation (developers should check the components/ directory)
- Project directory structure (developers should check the file system)
- Recent updates (should use CHANGELOG.md or Git commit history)
- Version details (except for major frameworks)

## Process

1. Check for git changes (via pre-hook check)
2. Scan the app/ directory to get accessible pages
3. Read package.json to get major framework versions (only core dependencies like Next.js, React, TypeScript, etc.)
4. Update sections in README.md related to features and usage
5. Remove any content that doesn't belong to feature descriptions or usage guides
