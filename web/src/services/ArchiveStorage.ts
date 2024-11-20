import { ArchiveStored, ArchivedStoredRow, ArchivedStoredColumn } from "../dataTypes/ArchiveStructures";
import { Column, Id, Row, Task } from "../types";
import fileSystemHandler from "./FileSystemHandler";
import { IStorageHandler } from "./IStorageHandler";

export interface RowWithTasks {
    row: Row;
    tasks: Task[];
}

class ArchiveStorage {
    constructor(private storageHandler: IStorageHandler) {
    }

    async getArchive(): Promise<ArchiveStored> {
        const fileContents = await this.storageHandler.getContent('archive.jsonl');

        const lines = fileContents.trim().split('\n').reverse();
        const archive: ArchiveStored = { rows: [] as ArchivedStoredRow[] };

        for (const line of lines) {
            if (line.trim() === '') {
                continue;
            }

            const data: ArchivedStoredRow = JSON.parse(line);
            archive.rows.push(data);
        }

        return archive;
    }

    convertArchivedRowToBoardRow(archivedRow: ArchivedStoredRow): RowWithTasks {
        const newRow = {
            id: archivedRow.id
        } as Row;

        const newTasks = archivedRow.columns.flatMap(column => column.tasks.map(id => {
            return {
                id: id,
                rowId: archivedRow.id,
                columnId: column.id
            } as Task;
        }));

        return { row: newRow, tasks: newTasks };
    }

    async addToArchive(archivedRow: ArchivedStoredRow): Promise<void> {
        const jsonl = JSON.stringify(archivedRow) + '\n';

        let existingContent = await this.storageHandler.getContent('archive.jsonl');
        existingContent = existingContent.endsWith('\n') ? existingContent + '\n' : existingContent;

        const newContent = existingContent + jsonl;

        await this.storageHandler.saveTextContentToDirectory('archive.jsonl', newContent, []);
    }

    createArchiveRow(row: Row, tasks: Task[], columns: Column[]): ArchivedStoredRow {
        const archivedColumns: ArchivedStoredColumn[] = [];

        for (const column of columns) {
            archivedColumns.push({
                id: column.id,
                tasks: tasks.filter(task => task.columnId === column.id).map(task => task.id)
            });
        }

        const result: ArchivedStoredRow = {
            id: row.id,
            columns: archivedColumns
        };

        return result;
    }

    async removeFromArchive(rowId: Id): Promise<void> {

        const existingContent = await this.storageHandler.getContent('archive.jsonl');

        const rows = existingContent.split('\n').filter(line => line.trim() !== '');

        const updatedRows = rows.filter(line => {
            try {
                const row: ArchivedStoredRow = JSON.parse(line);
                return row.id !== rowId;
            } catch (e) {
                console.error('Error parsing JSON line:', e);
                return true;
            }
        });

        const newContent = updatedRows.join('\n') + '\n';

        await this.storageHandler.saveTextContentToDirectory('archive.jsonl', newContent, []);
    }
}

const archiveStorage = new ArchiveStorage(fileSystemHandler);

export default archiveStorage;