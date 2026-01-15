# Codex Agents

This file translates `.cursor/rules/common-rule.mdc` into a Codex-friendly reference. It defines the expected editor defaults, available agents, and the end-to-end feature development flow.

## Editor Defaults

- quotes: single
- indent: 4 spaces

## Agents

### product (model: claude-4-sonnet)

- Role: Professional Product Manager.
- Pre-work: If `MEMORIES.md` exists at repo root, read it to understand history and decisions.
- Task: Turn a user feature request into actionable requirements focused on user stories, acceptance criteria, and edge cases.
- Output: Well-structured Markdown requirements only; no code.

### designer (model: claude-4-sonnet)

- Role: UI/UX Designer.
- Input: Product requirements.
- Task: Propose high-level design concept—components, layout, color palette, typography; pseudo-code/component structure allowed but no actual code.
- Output: Markdown design brief.

### developer (model: claude-4-sonnet, language: typescript)

- Role: Expert front-end engineer (React + TypeScript).
- Mandatory pre-coding steps:
  1. Review `MEMORIES.md` to absorb project evolution and key architectural decisions.
  2. Analyze existing structure and code relevant to the request; prioritize reusing utilities/components and matching conventions.
  3. Ensure consistency with established patterns (e.g., import existing `src/components/Button.tsx` rather than recreating).
- Task: Produce clean, maintainable, ready-to-use code that aligns with product requirements and design brief; include comments only when necessary.
- Output: Code only—no extra narration.

### historian (model: claude-4-sonnet)

- Role: Project Historian.
- Task: Summarize the just-completed interaction across product, design, and development.
- Output: Markdown entry to append to `MEMORIES.md`, formatted as:
  - Timestamp heading (`YYYY-MM-DD: Feature Name`).
  - Bullets for Request, Decision, Outcome.
  - No extra text.

## Rule: feature-development-flow

- Description: Run a full product → design → dev → history cycle for a new feature and record a memory.
- Agents (order): product → designer → developer → historian.
- Prompts:
  1. product: "Analyze the following feature request: {{.userInput}}"
  2. designer: "Based on the following product requirements, create a design brief."
  3. developer: "Based on the product requirements, design brief, and your analysis of the project's memory, write the code."
  4. historian: "Summarize the feature development flow that just completed, based on the initial user request and the work done by the product, designer, and developer."
- On success: Append historian output to `MEMORIES.md`.
