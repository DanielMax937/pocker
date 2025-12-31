# Claude Code Skills Reference

A comprehensive list of all 42 available Claude Code skills organized by category.

## Overview
Skills extend Claude Code's capabilities with specialized knowledge and workflows. Invoke them using `/<skill-name>` (e.g., `/commit`, `/pdf`).

---

## User Skills (5)

| Skill | Description |
|-------|-------------|
| **commit-helper** | Generates commit messages from git diffs |
| **notion-knowledge-capture** | Transform conversations into Notion documentation |
| **notion-meeting-intelligence** | Prepare meeting materials from Notion |
| **notion-research-documentation** | Search and synthesize Notion findings |
| **notion-spec-to-implementation** | Turn Notion specs into implementation tasks |

---

## Plugin Skills

### Code Review (1)
| Skill | Description |
|-------|-------------|
| **code-review** | Code review a pull request |

### Commit Commands (3)
| Skill | Description |
|-------|-------------|
| **commit** | Create a git commit |
| **commit-push-pr** | Commit, push, and open a PR |
| **clean_gone** | Clean up git branches marked as [gone] |

### Agent SDK Development (1)
| Skill | Description |
|-------|-------------|
| **new-sdk-app** | Create a new Claude Agent SDK application |

### Document Skills (16)
| Skill | Description |
|-------|-------------|
| **algorithmic-art** | Create generative art with p5.js using seeded randomness and interactive parameters |
| **brand-guidelines** | Apply Anthropic brand colors and typography to artifacts |
| **canvas-design** | Create beautiful visual art in PNG/PDF documents |
| **doc-coauthoring** | Guide users through structured workflow for co-authoring documentation |
| **docx** | Create, edit, and analyze Word documents with tracked changes and comments |
| **frontend-design** | Create distinctive, production-grade frontend interfaces with high design quality |
| **internal-comms** | Write internal communications (status reports, updates, newsletters, FAQs) |
| **mcp-builder** | Guide for creating high-quality MCP (Model Context Protocol) servers |
| **pdf** | PDF manipulation toolkit (extract, create, merge, split, forms) |
| **pptx** | Create, edit, and analyze PowerPoint presentations |
| **skill-creator** | Guide for creating effective new skills |
| **slack-gif-creator** | Create animated GIFs optimized for Slack |
| **theme-factory** | Apply 10 pre-set themes or generate new themes for artifacts |
| **web-artifacts-builder** | Create elaborate, multi-component HTML artifacts with React and Tailwind |
| **webapp-testing** | Test local web applications using Playwright |
| **xlsx** | Create, edit, and analyze Excel spreadsheets with formulas and formatting |

### Example Skills (16)
*Note: These duplicate the document-skills for demonstration purposes*

| Skill | Description |
|-------|-------------|
| **algorithmic-art** | Create generative art with p5.js |
| **brand-guidelines** | Apply Anthropic brand colors/typography |
| **canvas-design** | Create visual art in PNG/PDF |
| **doc-coauthoring** | Co-author documentation with structured workflow |
| **docx** | Create/edit Word documents |
| **frontend-design** | Create production-grade frontend interfaces |
| **internal-comms** | Write internal communications |
| **mcp-builder** | Guide for creating MCP servers |
| **pdf** | PDF manipulation toolkit |
| **pptx** | Create/edit PowerPoint presentations |
| **skill-creator** | Guide for creating new skills |
| **slack-gif-creator** | Create animated GIFs for Slack |
| **theme-factory** | Apply themes to artifacts |
| **web-artifacts-builder** | Create multi-component HTML artifacts |
| **webapp-testing** | Test web apps with Playwright |
| **xlsx** | Create/edit Excel spreadsheets |

---

## Quick Reference by Use Case

### Git & Version Control
- `/commit` - Create a git commit
- `/commit-push-pr` - Commit, push, and open a PR
- `/clean_gone` - Clean up deleted branches
- `/commit-helper` - Generate commit messages
- `/code-review` - Review pull requests

### Document Creation
- `/docx` - Word documents
- `/pptx` - PowerPoint presentations
- `/xlsx` - Excel spreadsheets
- `/pdf` - PDF manipulation

### Design & Frontend
- `/frontend-design` - Web interfaces and components
- `/canvas-design` - Visual art and posters
- `/algorithmic-art` - Generative art with code
- `/brand-guidelines` - Anthropic branding
- `/theme-factory` - Theme styling

### Communication
- `/internal-comms` - Status reports, updates, FAQs
- `/slack-gif-creator` - Animated GIFs for Slack
- `/doc-coauthoring` - Collaborative documentation

### Development Tools
- `/new-sdk-app` - Claude Agent SDK projects
- `/mcp-builder` - MCP server development
- `/skill-creator` - Create new skills
- `/webapp-testing` - Playwright testing

### Notion Integration
- `/notion-knowledge-capture` - Save conversations to Notion
- `/notion-meeting-intelligence` - Prepare meeting materials
- `/notion-research-documentation` - Research and documentation
- `/notion-spec-to-implementation` - Specs to tasks

### Web Artifacts
- `/web-artifacts-builder` - Multi-component HTML artifacts with React

---

## How to Use Skills

### Invoking a Skill
Simply type the skill name with a forward slash:
```
/commit
/pdf
/frontend-design
```

### Skills with Arguments
Some skills accept arguments:
```
/commit -m "Fix bug"
/code-review 123
```

### Built-in CLI Commands
These are NOT skills but built-in commands:
- `/help` - Show help
- `/clear` - Clear conversation

---

## Skill Locations

- **User Skills** - Custom skills you've created
- **Plugin Skills** - Installed from plugin repositories:
  - `@claude-code-plugins` - Official plugins
  - `@anthropic-agent-skills` - Anthropic skill collections

---

*Last updated: December 21, 2025*

## Additional Resources

For more information about creating skills, use `/skill-creator` to learn the skill creation workflow.

For MCP server development, use `/mcp-builder` to access comprehensive guides for Python (FastMCP) or Node/TypeScript implementations.
