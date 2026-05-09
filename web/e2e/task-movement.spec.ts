import { test, expect } from '@playwright/test';
import { seedBoard } from './helpers/seedOpfs';

const COLUMNS = [
    { id: '1', title: 'To Do' },
    { id: '2', title: 'In Progress' },
    { id: '3', title: 'Done' },
];

test('moves a task to the next column via the M keyboard shortcut', async ({ page }) => {
    await seedBoard(page, {
        columns: COLUMNS,
        rows: [
            { id: 'tm-row-1', title: 'Feature Row', position: 0, lastModificationDate: new Date('2026-01-01') },
        ],
        tasks: [
            { id: 'tm-task-1', title: 'Movable Task', columnId: '1', rowId: 'tm-row-1', position: 0, lastModificationDate: new Date('2026-01-01') },
        ],
    });

    await page.goto('/2dTaskBoard/board');

    const taskCard = page.locator('.task').filter({ hasText: 'Movable Task' });
    await expect(taskCard).toBeVisible();

    // Focus the task card and press M to move it one column to the right
    await taskCard.focus();
    await page.keyboard.press('m');

    // The task should now be in the In Progress column
    const inProgressColumn = page.getByTestId('column-2');
    await expect(inProgressColumn.locator('.task').filter({ hasText: 'Movable Task' })).toBeVisible();
    await expect(page.getByTestId('column-1').locator('.task').filter({ hasText: 'Movable Task' })).not.toBeVisible();

    // Wait for the board save to complete in OPFS before reloading
    await page.waitForFunction(async () => {
        try {
            const root = await navigator.storage.getDirectory();
            const boardDir = await root.getDirectoryHandle('board');
            const boardFile = await boardDir.getFileHandle('board.json');
            const file = await boardFile.getFile();
            const board = JSON.parse(await file.text());
            return board.tasks.some((t: { id: string; columnId: string }) => t.id === 'tm-task-1' && t.columnId === '2');
        } catch {
            return false;
        }
    });

    // Reload the page and verify the task persisted in the In Progress column
    await page.reload();
    await page.getByRole('button', { name: /choose directory/i }).waitFor({ state: 'hidden', timeout: 1000 }).catch(() => {});

    await expect(page.getByTestId('column-2').locator('.task').filter({ hasText: 'Movable Task' })).toBeVisible();
    await expect(page.getByTestId('column-1').locator('.task').filter({ hasText: 'Movable Task' })).not.toBeVisible();
});

test('moves a task between columns via drag and drop', async ({ page }) => {
    await seedBoard(page, {
        columns: COLUMNS,
        rows: [
            { id: 'tm-row-2', title: 'Drag Row', position: 0, lastModificationDate: new Date('2026-01-01') },
        ],
        tasks: [
            { id: 'tm-task-2', title: 'Draggable Task', columnId: '1', rowId: 'tm-row-2', position: 0, lastModificationDate: new Date('2026-01-01') },
            { id: 'tm-task-3', title: 'Target Task', columnId: '2', rowId: 'tm-row-2', position: 0, lastModificationDate: new Date('2026-01-01') },
        ],
    });

    await page.goto('/2dTaskBoard/board');

    await expect(page.getByText('Draggable Task')).toBeVisible();
    await expect(page.getByText('Target Task')).toBeVisible();

    const source = page.locator('.task').filter({ hasText: 'Draggable Task' }).first();
    const target = page.locator('.task').filter({ hasText: 'Target Task' }).first();

    const sourceBounds = await source.boundingBox();
    const targetBounds = await target.boundingBox();

    const sourceX = sourceBounds!.x + sourceBounds!.width / 2;
    const sourceY = sourceBounds!.y + sourceBounds!.height / 2;
    const targetX = targetBounds!.x + targetBounds!.width / 2;
    const targetY = targetBounds!.y + targetBounds!.height / 2;

    await page.mouse.move(sourceX, sourceY);
    await page.mouse.down();
    await page.mouse.move(sourceX + 5, sourceY, { steps: 5 });
    await page.mouse.move(targetX, targetY, { steps: 20 });
    await page.mouse.up();

    // Draggable Task should now be in column 2 (In Progress), no longer in column 1
    await expect(page.getByTestId('column-2').locator('.task').filter({ hasText: 'Draggable Task' })).toBeVisible();
    await expect(page.getByTestId('column-1').locator('.task').filter({ hasText: 'Draggable Task' })).not.toBeVisible();
    // Target Task stays in column 2
    await expect(page.getByTestId('column-2').locator('.task').filter({ hasText: 'Target Task' })).toBeVisible();

    // Wait for OPFS save to complete before reloading
    await page.waitForFunction(async () => {
        try {
            const root = await navigator.storage.getDirectory();
            const boardDir = await root.getDirectoryHandle('board');
            const boardFile = await boardDir.getFileHandle('board.json');
            const file = await boardFile.getFile();
            const board = JSON.parse(await file.text());
            return board.tasks.some((t: { id: string; columnId: string }) => t.id === 'tm-task-2' && t.columnId === '2');
        } catch {
            return false;
        }
    });

    // Reload and verify persistence
    await page.reload();

    await expect(page.getByTestId('column-2').locator('.task').filter({ hasText: 'Draggable Task' })).toBeVisible();
    await expect(page.getByTestId('column-1').locator('.task').filter({ hasText: 'Draggable Task' })).not.toBeVisible();
    await expect(page.getByTestId('column-2').locator('.task').filter({ hasText: 'Target Task' })).toBeVisible();
});
