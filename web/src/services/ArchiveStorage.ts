import { Archive, ArchivedColumn, ArchivedRow, ArchivedRowViewModel, ArchivedStoredRow, ArchiveStored, Column, Id, Row, Task } from "../types";
import fileSystemHandler from "./FileSystemHandler";
import { IStorageHandler } from "./IStorageHandler";

export interface RowWithTasks {
    row: Row;
    tasks: Task[];
}

class ArchiveStorage {
    constructor(private storageHandler: IStorageHandler) {
    }

    async getArchive(): Promise<Archive> {
        const fileContents = await this.storageHandler.getContent('archive.jsonl');

        const lines = fileContents.trim().split('\n').reverse();
        const archive: Archive = { rows: [] };

        for (const line of lines) {
            if (line.trim() === '') {
                continue;
            }

            const data: ArchivedRow = JSON.parse(line);
            archive.rows.push(data);
        }

        return archive;
    }

    convertArchivedRowToBoardRow(archivedRow: ArchivedRowViewModel): RowWithTasks {
        const newRow = {
            id: archivedRow.rowId
        } as Row;

        const newTasks = archivedRow.columns.flatMap(column => column.tasks.map(task => {
            return {
                id: task.id,
                rowId: archivedRow.rowId,
                columnId: column.id
            } as Task;
        }));

        return { row: newRow, tasks: newTasks };
    }

    async addToArchive(archivedRow: ArchivedRow): Promise<void> {
        const jsonl = JSON.stringify(archivedRow) + '\n';

        let existingContent = await this.storageHandler.getContent('archive.jsonl');
        existingContent = existingContent.endsWith('\n') ? existingContent + '\n' : existingContent;

        const newContent = existingContent + jsonl;

        await this.storageHandler.saveTextContentToDirectory('archive.jsonl', newContent, []);
    }

    createArchiveRow(row: Row, tasks: Task[], columns: Column[]): ArchivedRow {
        const archivedColumns: ArchivedColumn[] = [];

        for (const column of columns) {
            archivedColumns.push({
                id: column.id,
                tasks: tasks.filter(task => task.columnId === column.id).map(task => task.id)
            });
        }

        const result: ArchivedRow = {
            row: row,
            rowId: row.id,
            columns: archivedColumns
        };

        return result;
    }

    async removeFromArchive(rowId: Id): Promise<void> {

        const existingContent = await this.storageHandler.getContent('archive.jsonl');

        const rows = existingContent.split('\n').filter(line => line.trim() !== '');

        const updatedRows = rows.filter(line => {
            try {
                const row: ArchivedRow = JSON.parse(line);
                return row.row.id !== rowId;
            } catch (e) {
                console.error('Error parsing JSON line:', e);
                return true;
            }
        });

        const newContent = updatedRows.join('\n') + '\n';

        await this.storageHandler.saveTextContentToDirectory('archive.jsonl', newContent, []);
    }

    // unpackFromArchiveRow(archivedRow: ArchivedRow): { row: Row, tasks: Task[] } {
    //     const row = archivedRow.row;
    //     const tasks: Task[] = [];

    //     for (const column of archivedRow.columns) {
    //         tasks.push(...column.tasks);
    //     }

    //     return { row, tasks };
    // }
}

const archiveStorage = new ArchiveStorage(fileSystemHandler);

export default archiveStorage;