---
name: review
description: Review uncommitted Loom changes against the project's architecture and style rules before committing.
disable-model-invocation: true
context: fork
agent: code-reviewer
---

Review the current uncommitted changes in this repository (`git diff` and `git status`) against Loom's architecture and style rules. Report Critical / Warning / Suggestion issues with specific file references and concrete fixes.
