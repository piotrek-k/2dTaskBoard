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

test('moves a task between rows via drag and drop', async ({ page }) => {
    await seedBoard(page, {
        columns: COLUMNS,
        rows: [
            { id: 'tm-row-3', title: 'Source Row', position: 0, lastModificationDate: new Date('2026-01-01') },
            { id: 'tm-row-4', title: 'Target Row', position: 1, lastModificationDate: new Date('2026-01-01') },
        ],
        tasks: [
            { id: 'tm-task-4', title: 'Row Movable Task', columnId: '1', rowId: 'tm-row-3', position: 0, lastModificationDate: new Date('2026-01-01') },
            { id: 'tm-task-5', title: 'Row Anchor Task', columnId: '1', rowId: 'tm-row-4', position: 0, lastModificationDate: new Date('2026-01-01') },
        ],
    });

    await page.goto('/2dTaskBoard/board');

    await expect(page.getByText('Row Movable Task')).toBeVisible();
    await expect(page.getByText('Row Anchor Task')).toBeVisible();

    const source = page.locator('.task').filter({ hasText: 'Row Movable Task' }).first();
    const target = page.locator('.task').filter({ hasText: 'Row Anchor Task' }).first();

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

    // Row Movable Task should now be in Target Row (same column), no longer in Source Row
    const targetRowColumn1 = page.getByTestId('column-1').nth(1);
    await expect(targetRowColumn1.locator('.task').filter({ hasText: 'Row Movable Task' })).toBeVisible();

    const sourceRowColumn1 = page.getByTestId('column-1').nth(0);
    await expect(sourceRowColumn1.locator('.task').filter({ hasText: 'Row Movable Task' })).not.toBeVisible();

    // Wait for OPFS save to complete before reloading
    await page.waitForFunction(async () => {
        try {
            const root = await navigator.storage.getDirectory();
            const boardDir = await root.getDirectoryHandle('board');
            const boardFile = await boardDir.getFileHandle('board.json');
            const file = await boardFile.getFile();
            const board = JSON.parse(await file.text());
            return board.tasks.some((t: { id: string; rowId: string }) => t.id === 'tm-task-4' && t.rowId === 'tm-row-4');
        } catch {
            return false;
        }
    });

    // Reload and verify persistence
    await page.reload();

    await expect(page.getByTestId('column-1').nth(1).locator('.task').filter({ hasText: 'Row Movable Task' })).toBeVisible();
    await expect(page.getByTestId('column-1').nth(0).locator('.task').filter({ hasText: 'Row Movable Task' })).not.toBeVisible();
});

test('reorders tasks within a column via drag and drop', async ({ page }) => {
    await seedBoard(page, {
        columns: COLUMNS,
        rows: [
            { id: 'tm-row-5', title: 'Order Row', position: 0, lastModificationDate: new Date('2026-01-01') },
        ],
        tasks: [
            { id: 'tm-task-6', title: 'First Task', columnId: '1', rowId: 'tm-row-5', position: 0, lastModificationDate: new Date('2026-01-01') },
            { id: 'tm-task-7', title: 'Second Task', columnId: '1', rowId: 'tm-row-5', position: 1, lastModificationDate: new Date('2026-01-01') },
        ],
    });

    await page.goto('/2dTaskBoard/board');

    await expect(page.getByText('First Task')).toBeVisible();
    await expect(page.getByText('Second Task')).toBeVisible();

    const column1 = page.getByTestId('column-1').first();
    const tasks = column1.locator('.task');

    // Verify initial order: First Task appears before Second Task (lower X in flex-row layout)
    const firstTaskBox = await tasks.filter({ hasText: 'First Task' }).boundingBox();
    const secondTaskBox = await tasks.filter({ hasText: 'Second Task' }).boundingBox();
    expect(firstTaskBox!.x).toBeLessThan(secondTaskBox!.x);

    // Drag Second Task to the left of First Task
    const sourceX = secondTaskBox!.x + secondTaskBox!.width / 2;
    const sourceY = secondTaskBox!.y + secondTaskBox!.height / 2;
    const targetX = firstTaskBox!.x + firstTaskBox!.width / 2;
    const targetY = firstTaskBox!.y + firstTaskBox!.height / 2;

    await page.mouse.move(sourceX, sourceY);
    await page.mouse.down();
    await page.mouse.move(sourceX + 5, sourceY, { steps: 5 });
    await page.mouse.move(targetX, targetY, { steps: 20 });
    await page.mouse.up();

    // After drag, Second Task should appear before First Task (lower X)
    const updatedFirstTaskBox = await tasks.filter({ hasText: 'First Task' }).boundingBox();
    const updatedSecondTaskBox = await tasks.filter({ hasText: 'Second Task' }).boundingBox();
    expect(updatedSecondTaskBox!.x).toBeLessThan(updatedFirstTaskBox!.x);

    // Wait for OPFS save to complete before reloading
    await page.waitForFunction(async () => {
        try {
            const root = await navigator.storage.getDirectory();
            const boardDir = await root.getDirectoryHandle('board');
            const boardFile = await boardDir.getFileHandle('board.json');
            const file = await boardFile.getFile();
            const board = JSON.parse(await file.text());
            const task6Index = board.tasks.findIndex((t: { id: string }) => t.id === 'tm-task-6');
            const task7Index = board.tasks.findIndex((t: { id: string }) => t.id === 'tm-task-7');
            return task7Index < task6Index;
        } catch {
            return false;
        }
    });

    // Reload and verify the new order persists
    await page.reload();

    const reloadedColumn1 = page.getByTestId('column-1').first();
    const reloadedTasks = reloadedColumn1.locator('.task');
    const reloadedFirstTaskBox = await reloadedTasks.filter({ hasText: 'First Task' }).boundingBox();
    const reloadedSecondTaskBox = await reloadedTasks.filter({ hasText: 'Second Task' }).boundingBox();
    expect(reloadedSecondTaskBox!.x).toBeLessThan(reloadedFirstTaskBox!.x);
});
