import type { Page } from '@playwright/test';
import type { KanbanDataContainer } from '../../src/types';
import { MetadataType } from '../../src/dataTypes/CardMetadata';

export async function seedBoard(page: Page, boardData: KanbanDataContainer): Promise<void> {
    const dataJson = JSON.stringify(boardData);

    const rowMetadataFiles: Record<string, string> = {};
    for (const row of boardData.rows) {
        rowMetadataFiles[row.id] = JSON.stringify({ id: row.id, title: row.title, type: MetadataType.Row });
    }

    const taskMetadataFiles: Record<string, string> = {};
    for (const task of boardData.tasks) {
        taskMetadataFiles[task.id] = JSON.stringify({ id: task.id, title: task.title, type: MetadataType.Task });
    }

    await page.addInitScript(`
        (() => {
            const seedingPromise = (async () => {
                const root = await navigator.storage.getDirectory();

                // Write board/board.json
                const boardDir = await root.getDirectoryHandle('board', { create: true });
                const boardFile = await boardDir.getFileHandle('board.json', { create: true });
                const boardWritable = await boardFile.createWritable();
                await boardWritable.write(${JSON.stringify(dataJson)});
                await boardWritable.close();

                // Write tasks/{id}/metadata.md for each row and task
                const tasksDir = await root.getDirectoryHandle('tasks', { create: true });

                const rowMetadata = ${JSON.stringify(rowMetadataFiles)};
                for (const [id, json] of Object.entries(rowMetadata)) {
                    const dir = await tasksDir.getDirectoryHandle(id, { create: true });
                    const fh = await dir.getFileHandle('metadata.md', { create: true });
                    const w = await fh.createWritable();
                    await w.write(json);
                    await w.close();
                }

                const taskMetadata = ${JSON.stringify(taskMetadataFiles)};
                for (const [id, json] of Object.entries(taskMetadata)) {
                    const dir = await tasksDir.getDirectoryHandle(id, { create: true });
                    const fh = await dir.getFileHandle('metadata.md', { create: true });
                    const w = await fh.createWritable();
                    await w.write(json);
                    await w.close();
                }

                // Polyfill permission methods so FileSystemHandler.verifyExistingHandle passes.
                // Must be on the real object (not a Proxy) so IndexedDB can serialize the handle.
                root.queryPermission = async () => 'granted';
                root.requestPermission = async () => 'granted';

                return root;
            })().catch(err => {
                console.error('[seed] OPFS seeding failed:', err);
                throw err;
            });

            window.showDirectoryPicker = async () => seedingPromise;
        })();
    `);
}

