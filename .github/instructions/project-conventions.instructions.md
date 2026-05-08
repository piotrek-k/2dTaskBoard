---
description: "Use when writing, editing, or reviewing any code in this project. Covers app purpose, architecture, key patterns, and coding conventions."
applyTo: "web/src/**"
---

# KanbanApp — Project Conventions

## What This App Is

A 2D Kanban board (TaskBoard2D) where tasks are organized in a two-dimensional grid: **columns** (status) × **rows** (swimlanes). Data is persisted on the user's local file system — cards are stored as Markdown files with YAML frontmatter, and board state is stored as JSON.

The app ships as:
- A **web app** using the browser File System Access API (`FileSystemHandler`)
- A **desktop app** (Electron + Express) that wraps the same React codebase

Web app should work well on both desktop and mobile. Tasks data is stored in markdown files to be compatible with Obsidian and other markdown-based tools.

## Coding Conventions

### No Comments — Use Naming Instead
Do **not** add code comments. Express intent through well-named variables, functions, and types.

### No Vague or Single-Letter Names
Names must be descriptive and unambiguous. Single-letter names are only acceptable as loop counters (`i`, `j`) where the scope is immediately obvious.

### Split Long Blocks Into Named Methods
If a block of code does more than one logical thing, extract it into a method with a name that explains *what* it does (not *how*).

### Keep Files Small and Focused
Each file should have a single responsibility. If a component or service grows large, split it. Prefer more, smaller files over fewer, large ones.

### KISS — Keep It Simple
Implement the simplest solution that satisfies the requirement. Avoid abstractions, layers, or patterns that aren't justified by an immediate need.

### YAGNI — Implement Only What Is Needed
Do not add features, overloads, or configuration options that aren't required by the current task. Do not future-proof unnecessarily.

## TypeScript

- Abstract out code that interacts with external APIs (e.g., File System) behind interfaces (`IStorageHandler`) to allow for easier testing and future extensibility
