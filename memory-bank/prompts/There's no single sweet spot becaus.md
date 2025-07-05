There's no single "sweet spot" because it depends on context, but here are the practical considerations:

  For Claude (the AI):
  - Context window: ~200K tokens total (including system prompt, conversation, tool results)
  - Optimal single file: 1-10K lines for good comprehension
  - Large files: Can read 50K+ lines but may need chunking for analysis

  For Claude Code (the application):
  - Session files: Likely optimized for fast loading/parsing
  - Memory management: Probably keeps recent sessions in memory
  - Performance: Smaller files (1-5MB) load faster than large ones (50MB+)

  Practical sweet spots:
  - Small sessions (1-100KB): Quick tasks, simple questions
  - Medium sessions (100KB-1MB): Normal coding work, file edits
  - Large sessions (1-10MB): Complex multi-file projects, long conversations
  - Very large (10MB+): May impact performance, could benefit from --resume to continue rather than one massive
  session

  For optimal performance:
  - Break very long coding sessions into smaller focused sessions
  - Use --resume for continuity without bloating single files
  - Large files are fine for reading/analysis but may slow conversation loading

  The variation you see likely reflects different types of work - quick questions vs. extended development
  sessions.