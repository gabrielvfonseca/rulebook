# Rulebook Skills

Reusable agent capabilities for working with the Rulebook registry:

| Skill               | Purpose                                       |
| ------------------- | --------------------------------------------- |
| `rulebook-curator`  | Add, validate, and grade new registry entries |
| `rulebook-reviewer` | Review entries and pull requests              |
| `rulebook-grader`   | Machine-grade a local agent config            |

Each skill lives in its own directory with a `SKILL.md` describing when to use it
and what it can do. Invoke a skill by name in Claude Code (e.g. `@rulebook-curator`).
