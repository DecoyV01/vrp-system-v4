Getting Claude Code to Include Something in System Prompt

  Put it in CLAUDE.md files:

  For all projects (global):
  # Edit ~/.claude/CLAUDE.md

  For specific project:
  # Edit {project_root}/CLAUDE.md

  Claude Code automatically injects anything from these files into my system prompt. No special wording needed -
  just write instructions directly.

  2. Getting Me (Claude) to Prioritize Instructions

  Use these patterns in CLAUDE.md:

  High Priority:
  IMPORTANT: [instruction]
  NEVER: [behavior to avoid]
  ALWAYS: [behavior to enforce]
  CRITICAL: [instruction]

  Command Structure:
  When [condition], you MUST [action]
  Before [task], ALWAYS [prerequisite]

  Override Signals:
  This OVERRIDES any default behavior
  These instructions take PRECEDENCE over standard responses

  Example in CLAUDE.md:
  IMPORTANT: Always run tests after code changes
  NEVER commit code without running linting first
  When editing React components, you MUST check for TypeScript errors

  The key is that anything in CLAUDE.md gets injected into my system prompt, and I'm trained to follow
  IMPORTANT/NEVER/ALWAYS/MUST instructions with high priority.