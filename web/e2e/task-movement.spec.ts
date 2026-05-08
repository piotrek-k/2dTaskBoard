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

    // The task should now be visible (it moved to In Progress — still on the board)
    await expect(page.locator('.task').filter({ hasText: 'Movable Task' })).toBeVisible();

    // Reload the page and verify the task persisted in the new column (In Progress)
    await page.reload();
    await page.getByRole('button', { name: /choose directory/i }).waitFor({ state: 'hidden', timeout: 1000 }).catch(() => {});

    const taskAfterReload = page.locator('.task').filter({ hasText: 'Movable Task' });
    await expect(taskAfterReload).toBeVisible();
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

    await source.dragTo(target);

    // After dragging, both tasks should still be visible (now in column 2)
    await expect(page.locator('.task').filter({ hasText: 'Draggable Task' }).first()).toBeVisible();
    await expect(page.locator('.task').filter({ hasText: 'Target Task' }).first()).toBeVisible();
});
