import { test, expect } from '@playwright/test';
import { seedBoard } from './helpers/seedOpfs';

test('displays tasks loaded from seeded directory', async ({ page }) => {
    await seedBoard(page, {
        columns: [
            { id: '1', title: 'To Do' },
            { id: '2', title: 'In Progress' },
            { id: '3', title: 'Done' },
        ],
        rows: [
            { id: 'row-1', title: 'Feature Work', position: 0, lastModificationDate: new Date('2026-01-01') },
        ],
        tasks: [
            { id: 'task-1', title: 'Build login page', columnId: '1', rowId: 'row-1', position: 0, lastModificationDate: new Date('2026-01-01') },
        ],
    });

    await page.goto('/2dTaskBoard/board');

    await expect(page.getByText('Feature Work')).toBeVisible();
    await expect(page.getByText('Build login page')).toBeVisible();
});

