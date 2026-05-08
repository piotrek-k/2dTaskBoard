import { test, expect } from '@playwright/test';
import { seedBoard } from './helpers/seedOpfs';

const COLUMNS = [
    { id: '1', title: 'To Do' },
    { id: '2', title: 'In Progress' },
    { id: '3', title: 'Done' },
];

test('opens task details modal showing the correct title and rendered content', async ({ page }) => {
    await seedBoard(page, {
        columns: COLUMNS,
        rows: [
            { id: 'cd-row-1', title: 'Feature Row', position: 0, lastModificationDate: new Date('2026-01-01') },
        ],
        tasks: [
            {
                id: 'cd-task-1',
                title: 'Detail Task',
                columnId: '1',
                rowId: 'cd-row-1',
                position: 0,
                lastModificationDate: new Date('2026-01-01'),
                content: '## Section Heading',
            },
        ],
    });

    await page.goto('/2dTaskBoard/board');
    await page.getByText('Detail Task').click();

    await expect(page.getByRole('heading', { name: 'Detail Task' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Section Heading' })).toBeVisible();
});

test('warns about unsaved changes when closing modal without saving', async ({ page }) => {
    await seedBoard(page, {
        columns: COLUMNS,
        rows: [
            { id: 'cd-row-2', title: 'Feature Row', position: 0, lastModificationDate: new Date('2026-01-01') },
        ],
        tasks: [
            { id: 'cd-task-2', title: 'Unchanged Task', columnId: '1', rowId: 'cd-row-2', position: 0, lastModificationDate: new Date('2026-01-01') },
        ],
    });

    await page.goto('/2dTaskBoard/board');
    await page.getByText('Unchanged Task').click();

    await page.getByRole('heading', { name: 'Unchanged Task' }).click();
    await page.getByRole('textbox').fill('Edited But Not Saved');

    // Dismiss the native browser confirm dialog that fires when closing with unsaved changes
    page.on('dialog', dialog => dialog.dismiss());

    await page.getByLabel('Close modal').click();

    // Modal should still be open because user dismissed the unsaved-changes confirmation
    await expect(page.getByRole('heading', { name: 'Edited But Not Saved' })).toBeVisible();
});

test('opens standalone card view in a new tab via the link icon', async ({ page }) => {
    await seedBoard(page, {
        columns: COLUMNS,
        rows: [
            { id: 'cd-row-3', title: 'Feature Row', position: 0, lastModificationDate: new Date('2026-01-01') },
        ],
        tasks: [
            { id: 'cd-task-3', title: 'Standalone Task', columnId: '1', rowId: 'cd-row-3', position: 0, lastModificationDate: new Date('2026-01-01') },
        ],
    });

    await page.goto('/2dTaskBoard/board');
    await page.getByText('Standalone Task').click();

    const [newTab] = await Promise.all([
        page.context().waitForEvent('page'),
        page.locator('a[href*="/card/cd-task-3"]').click(),
    ]);

    await newTab.waitForLoadState();

    await expect(newTab).toHaveURL(/\/card\/cd-task-3/);
    await expect(newTab.getByText('Standalone Task')).toBeVisible();
});
