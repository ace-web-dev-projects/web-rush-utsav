# AGENTS.md

## Project Overview

Web Rush is a game-like web event application. The project is responsible for the event's frontend, backend, database, leaderboard, and admin functionality.

The application is being developed as a team project. Requirements and event-specific functionality may evolve during development, so do not assume requirements that have not been explicitly established.

## Tech Stack

### Frontend
- React
- Vite
- JavaScript

### Backend
- Node.js
- Express
- JavaScript

### Database
- PostgreSQL
- Prisma ORM

## Project Structure

The project is expected to be organized into separate frontend and backend applications.

```text
web-rush/
├── client/
├── server/
├── AGENTS.md
└── ...
```

The structure may evolve as the project develops. Do not introduce additional top-level directories or architectural layers unless there is a clear reason to do so.

## Development Principles

### 1. Prefer Understandable Code

Write code that is easy for the team to read, debug, modify, and explain.

Prefer:

- Simple solutions over unnecessarily sophisticated ones.
- Straightforward control flow over excessive abstraction.
- Explicit code when it improves readability.
- Familiar JavaScript and Express patterns.
- Small, understandable functions.

Do not optimize for theoretical elegance at the expense of maintainability.

If two approaches are reasonable and one is simpler but slightly longer or less optimal, prefer the simpler and more understandable approach.

### 2. Avoid Premature Abstraction

Do not introduce abstractions, design patterns, wrappers, utility layers, or architectural complexity without a concrete need.

Before creating a new abstraction, consider whether the existing straightforward approach is sufficient.

Avoid building infrastructure for hypothetical future requirements.

### 3. Keep Responsibilities Clear

Frontend code should primarily handle UI, user interaction, and communication with the backend.

Backend code should handle API routes, validation, application logic, authentication/authorization where required, and communication with the database.

Database access should use Prisma rather than manually constructing SQL queries unless there is a specific reason to use raw SQL.

Keep business logic out of UI components when it can reasonably be kept elsewhere.

### 4. Libraries Are Allowed When They Simplify the Project

Do not avoid libraries merely for the sake of avoiding dependencies.

If an established library makes a task significantly simpler, safer, or easier to maintain, it is reasonable to use it.

Examples include libraries such as:

- Multer for file uploads
- Axios for HTTP requests
- Zod or similar libraries for validation
- Other well-established libraries when they solve a real problem

However, do not add a dependency for functionality that is trivial to implement with the existing stack.

When introducing a library that materially affects the architecture or adds a significant dependency, explain to the team why it is useful before relying on it.

### 5. Explain Non-obvious Decisions

When implementing something that is not immediately obvious, briefly explain:

- Why the approach was chosen.
- What the relevant alternative was.
- Any important tradeoffs.

The goal is not only to make the application work, but also to keep the team capable of understanding and maintaining the code.

### 6. Do Not Invent Requirements

If a requirement has not been established, do not silently invent behavior for it.

Use the existing code and explicitly provided requirements as the source of truth.

If an implementation requires an important product or architectural decision that cannot reasonably be inferred, ask the team before proceeding.

For small implementation details, use reasonable defaults rather than unnecessarily blocking progress.

## Git

Agents must **not create commits, amend commits, reset branches, push changes, or otherwise manage Git history**.

All Git commits and repository history management will be handled manually by the development team.

Agents may inspect Git state when useful for understanding the project.

## Changes

Before modifying existing code:

1. Inspect the relevant files and understand the existing implementation.
2. Follow the project's existing conventions where they are reasonable.
3. Make the smallest change that correctly solves the task.
4. Avoid unrelated refactoring.
5. Check that the change does not unnecessarily break existing functionality.

Do not rewrite working code simply because another style is theoretically better.

## Current State

The project is still being designed and implemented. Not all event rules, database models, API endpoints, leaderboard behavior, or admin functionality have been finalized.

As these decisions become established, this document should be updated with stable project-wide rules rather than temporary implementation details.