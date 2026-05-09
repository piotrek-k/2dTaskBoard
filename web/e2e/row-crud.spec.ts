import { test, expect } from '@playwright/test';
import { seedBoard } from './helpers/seedOpfs';

const COLUMNS = [
    { id: '1', title: 'To Do' },
    { id: '2', title: 'In Progress' },
    { id: '3', title: 'Done' },
];

test('creates a row via Add Row button and shows it on the board', async ({ page }) => {
    await seedBoard(page, {
        columns: COLUMNS,
        rows: [],
        tasks: [],
    });

    await page.goto('/2dTaskBoard/board');

    await page.getByRole('button', { name: 'Add Row' }).first().click();

    await expect(page.getByText('Row 1')).toBeVisible();
});

test('edits a row title and reflects the update on the board', async ({ page }) => {
    await seedBoard(page, {
        columns: COLUMNS,
        rows: [
            { id: 'rc-row-1', title: 'Old Row', position: 0, lastModificationDate: new Date('2026-01-01') },
        ],
        tasks: [],
    });

    await page.goto('/2dTaskBoard/board');
    await expect(page.getByText('Old Row')).toBeVisible();

    await page.getByText('Old Row').click();

    await page.getByRole('heading', { name: 'Old Row' }).click();
    await page.getByRole('textbox').fill('Updated Row');

    await page.getByRole('button', { name: 'Save Changes' }).click();

    await page.getByLabel('Close modal').click();

    await expect(page.getByTestId('row-title').filter({ hasText: 'Updated Row' })).toBeVisible();
});

test('deletes a row after confirmation and removes it and its tasks from the board', async ({ page }) => {
    await seedBoard(page, {
        columns: COLUMNS,
        rows: [
            { id: 'rc-row-2', title: 'Row To Delete', position: 0, lastModificationDate: new Date('2026-01-01') },
        ],
        tasks: [
            { id: 'rc-task-1', title: 'Task In Row', columnId: '1', rowId: 'rc-row-2', position: 0, lastModificationDate: new Date('2026-01-01') },
        ],
    });

    await page.goto('/2dTaskBoard/board');
    await expect(page.getByText('Row To Delete')).toBeVisible();
    await expect(page.getByText('Task In Row')).toBeVisible();

    await page.getByText('Row To Delete').click();

    await page.getByTestId('delete-card-btn').click();
    await page.getByTestId('confirm-accept').click();

    await expect(page.getByText('Row To Delete')).not.toBeVisible();
    await expect(page.getByText('Task In Row')).not.toBeVisible();
});

test('changes row order via the move down button', async ({ page }) => {
    await seedBoard(page, {
        columns: COLUMNS,
        rows: [
            { id: 'rc-row-3', title: 'Row Alpha', position: 0, lastModificationDate: new Date('2026-01-01') },
            { id: 'rc-row-4', title: 'Row Beta', position: 1, lastModificationDate: new Date('2026-01-01') },
        ],
        tasks: [],
    });

    await page.goto('/2dTaskBoard/board');

    const rowTitles = page.getByTestId('row-title');
    await expect(rowTitles.first()).toContainText('Row Alpha');
    await expect(rowTitles.nth(1)).toContainText('Row Beta');

    // Click the move-down button on Row Alpha — it should move below Row Beta
    const rowAlphaNavButtons = rowTitles.filter({ hasText: 'Row Alpha' }).locator('xpath=..').locator('[data-testid="move-row-down-btn"]');
    await rowAlphaNavButtons.click();

    await expect(rowTitles.first()).toContainText('Row Beta');
    await expect(rowTitles.nth(1)).toContainText('Row Alpha');
});

test('changes row order via the move up button', async ({ page }) => {
    await seedBoard(page, {
        columns: COLUMNS,
        rows: [
            { id: 'rc-row-5', title: 'Row First', position: 0, lastModificationDate: new Date('2026-01-01') },
            { id: 'rc-row-6', title: 'Row Second', position: 1, lastModificationDate: new Date('2026-01-01') },
        ],
        tasks: [],
    });

    await page.goto('/2dTaskBoard/board');

    const rowTitles = page.getByTestId('row-title');
    await expect(rowTitles.first()).toContainText('Row First');
    await expect(rowTitles.nth(1)).toContainText('Row Second');

    // Click the move-up button on Row Second — it should move above Row First
    const rowSecondNavButtons = rowTitles.filter({ hasText: 'Row Second' }).locator('xpath=..').locator('[data-testid="move-row-up-btn"]');
    await rowSecondNavButtons.click();

    await expect(rowTitles.first()).toContainText('Row Second');
    await expect(rowTitles.nth(1)).toContainText('Row First');
});
