import { test, expect } from '@playwright/test';
import { seedBoard } from './helpers/seedOpfs';

const COLUMNS = [
    { id: '1', title: 'To Do' },
    { id: '2', title: 'In Progress' },
    { id: '3', title: 'Done' },
];

test('archives a row — row disappears from board and appears in archive view', async ({ page }) => {
    await seedBoard(page, {
        columns: COLUMNS,
        rows: [
            { id: 'ar-row-1', title: 'Row To Archive', position: 0, lastModificationDate: new Date('2026-01-01') },
        ],
        tasks: [
            { id: 'ar-task-1', title: 'Task In Archived Row', columnId: '1', rowId: 'ar-row-1', position: 0, lastModificationDate: new Date('2026-01-01') },
        ],
    });

    await page.goto('/2dTaskBoard/board');
    await expect(page.getByText('Row To Archive')).toBeVisible();

    await page.getByTestId('archive-row-btn').click();

    await expect(page.getByText('Row To Archive')).not.toBeVisible();

    await page.getByRole('button', { name: /show archive/i }).first().click();

    await expect(page.getByText('Row To Archive')).toBeVisible();
});

test('restores an archived row back to the board', async ({ page }) => {
    await seedBoard(page, {
        columns: COLUMNS,
        rows: [],
        tasks: [],
        archivedRows: [
            {
                id: 'ar-row-2',
                title: 'Archived Row',
                columns: [
                    { id: '1', tasks: [{ id: 'ar-task-2', title: 'Archived Task' }] },
                    { id: '2', tasks: [] },
                    { id: '3', tasks: [] },
                ],
            },
        ],
    });

    await page.goto('/2dTaskBoard/board');

    await page.getByRole('button', { name: /show archive/i }).first().click();

    await expect(page.getByText('Archived Row')).toBeVisible();

    await page.getByRole('button', { name: /restore from archive/i }).click();

    await page.getByRole('button', { name: /hide archive/i }).first().click();

    await expect(page.getByText('Archived Row')).toBeVisible();
});
