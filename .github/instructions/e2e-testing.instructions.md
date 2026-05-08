---
description: "Use when writing, editing, or reviewing E2E tests for this project. Covers test approach, OPFS seeding strategy, and Playwright setup."
---

# E2E Testing Conventions

## Goal

E2E tests verify the app is **releasable**: they run in a real Chromium browser against the real browser File System Access API and real OPFS storage. The tests must be as close to real user conditions as possible.

## What Is Mocked and What Is Not

- **Mocked**: `window.showDirectoryPicker` only — it's a system dialog that can't be automated.
- **Not mocked**: everything after the picker — `FileSystemDirectoryHandle`, OPFS reads/writes, `createWritable()`, IndexedDB handle persistence. All real.

## How Seeding Works

Each test calls `seedBoard(page, data)` from `e2e/helpers/seedOpfs.ts` **before** `page.goto()`. The helper:

1. Uses `page.addInitScript()` to inject a script before the page loads.
2. Writes fixture data into OPFS (`navigator.storage.getDirectory()`) — both `board/board.json` and `tasks/{id}/metadata.md` for every row and task.
3. Overrides `window.showDirectoryPicker` to return the seeded OPFS root.
4. Polyfills `queryPermission` / `requestPermission` directly on the OPFS root handle (not via Proxy — IndexedDB cannot serialize a Proxy).

## Critical: Two Files Must Be Seeded Per Row/Task

The UI title displayed in `RowContainer` and `TaskCard` comes from `tasks/{id}/metadata.md`, **not** from `board.json`. If you seed only `board.json`, the board will render with empty/fallback titles. Always seed both:

- `board/board.json` — structure (IDs, positions, column assignments)
- `tasks/{id}/metadata.md` — display title for each row and task

See the Data Storage Architecture section in `project-conventions.instructions.md` for the full storage layout.

## Stack

- **Framework**: Playwright (`@playwright/test`)
- **Browser**: Chromium only (required for File System Access API + OPFS)
- **Test directory**: `web/e2e/`
- **Config**: `web/playwright.config.ts`
- **Run command**: `npm run test:e2e` (from `web/`)
- **Web server**: `npm run build && npm run preview` (Vite preview, port 4173, base `/2dTaskBoard/`)

## Tooling

Check out `playwright-cli` skill to improve testing workflow. 

## Maing instructions up to date

If you figure out that this instruction file is outdated, propose an edit.