import { Archive, ArchivedColumn, ArchivedRow, Column, Row, Task } from "../types";
import fileSystemHandler from "./FileSystemHandler";
import { IStorageHandler } from "./IStorageHandler";

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

    async addToArchive(archivedRow: ArchivedRow): Promise<void> {
        const jsonl = JSON.stringify(archivedRow) + '\n';

        let existingContent = await this.storageHandler.getContent('archive.jsonl');
        existingContent = existingContent.endsWith('\n') ? existingContent + '\n' : existingContent;

        const newContent = existingContent + jsonl;

        this.storageHandler.saveTextContentToDirectory('archive.jsonl', newContent, []);
    }

    createArchiveRow(row: Row, tasks: Task[], columns: Column[]): ArchivedRow {
        const archivedColumns: ArchivedColumn[] = [];

        for (const column of columns) {
            archivedColumns.push({
                id: column.id,
                tasks: tasks.filter(task => task.columnId === column.id)
            });
        }

        const result: ArchivedRow = {
            row: row,
            columns: archivedColumns
        };

        return result;
    }
}

const archiveStorage = new ArchiveStorage(fileSystemHandler);

export default archiveStorage;