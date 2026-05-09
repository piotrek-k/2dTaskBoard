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
