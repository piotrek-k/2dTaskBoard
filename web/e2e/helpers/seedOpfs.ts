import type { Page } from '@playwright/test';
import type { KanbanDataContainer, ColumnInStorage, Id, RowInStorage, TaskInStorage } from '../../src/types';
import { MetadataType } from '../../src/dataTypes/CardMetadata';

type SeedTask = TaskInStorage & { content?: string };
type SeedRow = RowInStorage & { content?: string };

interface ArchivedSeedTask {
    id: Id;
    title?: string;
}

interface ArchivedSeedColumn {
    id: Id;
    tasks: ArchivedSeedTask[];
}

interface ArchivedSeedRow {
    id: Id;
    title?: string;
    columns: ArchivedSeedColumn[];
}

export interface SeedBoardData {
    columns: ColumnInStorage[];
    rows: SeedRow[];
    tasks: SeedTask[];
    archivedRows?: ArchivedSeedRow[];
}

export async function seedBoard(page: Page, boardData: SeedBoardData): Promise<void> {
    const boardJson: KanbanDataContainer = {
        columns: boardData.columns,
        rows: boardData.rows.map(({ content: _content, ...rest }) => rest),
        tasks: boardData.tasks.map(({ content: _content, ...rest }) => rest),
    };
    const dataJson = JSON.stringify(boardJson);

    const rowMetadataFiles: Record<string, string> = {};
    for (const row of boardData.rows) {
        rowMetadataFiles[row.id] = JSON.stringify({ id: row.id, title: row.title, type: MetadataType.Row });
    }

    const taskMetadataFiles: Record<string, string> = {};
    for (const task of boardData.tasks) {
        taskMetadataFiles[task.id] = JSON.stringify({ id: task.id, title: task.title, type: MetadataType.Task });
    }

    const rowContentFiles: Record<string, string> = {};
    for (const row of boardData.rows) {
        if (row.content !== undefined) {
            rowContentFiles[row.id] = row.content;
        }
    }

    const taskContentFiles: Record<string, string> = {};
    for (const task of boardData.tasks) {
        if (task.content !== undefined) {
            taskContentFiles[task.id] = task.content;
        }
    }

    const archivedRowsJsonl = (boardData.archivedRows ?? [])
        .map(row => JSON.stringify({
            id: row.id,
            columns: row.columns.map(col => ({
                id: col.id,
                tasks: col.tasks.map(t => t.id),
            })),
        }))
        .join('\n');

    const archivedRowMetadataFiles: Record<string, string> = {};
    const archivedTaskMetadataFiles: Record<string, string> = {};
    for (const row of boardData.archivedRows ?? []) {
        if (row.title !== undefined) {
            archivedRowMetadataFiles[row.id] = JSON.stringify({ id: row.id, title: row.title, type: MetadataType.Row });
        }
        for (const col of row.columns) {
            for (const task of col.tasks) {
                if (task.title !== undefined) {
                    archivedTaskMetadataFiles[task.id] = JSON.stringify({ id: task.id, title: task.title, type: MetadataType.Task });
                }
            }
        }
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

                // Write tasks/{id}/content.md for rows/tasks that have content
                const rowContentFiles = ${JSON.stringify(rowContentFiles)};
                for (const [id, content] of Object.entries(rowContentFiles)) {
                    const dir = await tasksDir.getDirectoryHandle(id, { create: true });
                    const fh = await dir.getFileHandle('content.md', { create: true });
                    const w = await fh.createWritable();
                    await w.write(content);
                    await w.close();
                }

                const taskContentFiles = ${JSON.stringify(taskContentFiles)};
                for (const [id, content] of Object.entries(taskContentFiles)) {
                    const dir = await tasksDir.getDirectoryHandle(id, { create: true });
                    const fh = await dir.getFileHandle('content.md', { create: true });
                    const w = await fh.createWritable();
                    await w.write(content);
                    await w.close();
                }

                // Write archive.jsonl if archived rows were provided
                const archivedRowsJsonl = ${JSON.stringify(archivedRowsJsonl)};
                if (archivedRowsJsonl) {
                    const archiveFh = await root.getFileHandle('archive.jsonl', { create: true });
                    const archiveWritable = await archiveFh.createWritable();
                    await archiveWritable.write(archivedRowsJsonl);
                    await archiveWritable.close();
                }

                // Write metadata.md for archived rows and tasks that include titles
                const archivedRowMetadata = ${JSON.stringify(archivedRowMetadataFiles)};
                for (const [id, json] of Object.entries(archivedRowMetadata)) {
                    const dir = await tasksDir.getDirectoryHandle(id, { create: true });
                    const fh = await dir.getFileHandle('metadata.md', { create: true });
                    const w = await fh.createWritable();
                    await w.write(json);
                    await w.close();
                }

                const archivedTaskMetadata = ${JSON.stringify(archivedTaskMetadataFiles)};
                for (const [id, json] of Object.entries(archivedTaskMetadata)) {
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

