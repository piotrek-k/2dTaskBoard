import { test, expect } from '@playwright/test';
import { seedBoard } from './helpers/seedOpfs';

const COLUMNS = [
    { id: '1', title: 'To Do' },
    { id: '2', title: 'In Progress' },
    { id: '3', title: 'Done' },
];

test('creates a task via + button and shows it on the board', async ({ page }) => {
    await seedBoard(page, {
        columns: COLUMNS,
        rows: [
            { id: 'tc-row-1', title: 'Feature Row', position: 0, lastModificationDate: new Date('2026-01-01') },
        ],
        tasks: [],
    });

    await page.goto('/2dTaskBoard/board');
    await expect(page.getByText('Feature Row')).toBeVisible();

    await page.getByTestId('add-task-btn').click();

    // After creation the task details modal opens automatically — the modal heading confirms it
    await expect(page.getByRole('heading', { name: 'Task 1' })).toBeVisible();
});

test('edits a task title and reflects the update on the board', async ({ page }) => {
    await seedBoard(page, {
        columns: COLUMNS,
        rows: [
            { id: 'tc-row-2', title: 'Feature Row', position: 0, lastModificationDate: new Date('2026-01-01') },
        ],
        tasks: [
            { id: 'tc-task-2', title: 'Old Title', columnId: '1', rowId: 'tc-row-2', position: 0, lastModificationDate: new Date('2026-01-01') },
        ],
    });

    await page.goto('/2dTaskBoard/board');
    await expect(page.getByText('Old Title')).toBeVisible();

    await page.getByText('Old Title').click();

    // Click the title to enter edit mode
    await page.getByRole('heading', { name: 'Old Title' }).click();
    await page.getByRole('textbox').fill('Updated Title');

    await page.getByRole('button', { name: 'Save Changes' }).click();

    await page.getByLabel('Close modal').click();

    await expect(page.getByText('Updated Title')).toBeVisible();
});

test('deletes a task after confirmation and removes it from the board', async ({ page }) => {
    await seedBoard(page, {
        columns: COLUMNS,
        rows: [
            { id: 'tc-row-3', title: 'Feature Row', position: 0, lastModificationDate: new Date('2026-01-01') },
        ],
        tasks: [
            { id: 'tc-task-3', title: 'Task To Delete', columnId: '1', rowId: 'tc-row-3', position: 0, lastModificationDate: new Date('2026-01-01') },
        ],
    });

    await page.goto('/2dTaskBoard/board');
    await expect(page.getByText('Task To Delete')).toBeVisible();

    await page.getByText('Task To Delete').click();

    await page.getByTestId('delete-card-btn').click();
    await page.getByTestId('confirm-accept').click();

    await expect(page.getByText('Task To Delete')).not.toBeVisible();
});
