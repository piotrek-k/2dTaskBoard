import { KanbanDataContainer, RowInStorage, TaskInStorage } from "../types";
import taskStorage from "./CardMetadataStorage";
import fileSystemHandler from "./FileSystemHandler";
import { IStorageHandler } from "./IStorageHandler";

export class KanbanBoardStorage {
    private fileName = 'data.json';

    private cache: KanbanDataContainer | null = null;

    constructor(private storageHandler: IStorageHandler) {
    }

    public async getKanbanState(): Promise<KanbanDataContainer> {
        if (this.cache !== null) {
            return this.cache;
        }

        let result = await this.getNewKanbanState();

        if (result == undefined) {
            const fileContents = await this.storageHandler.getContent(this.fileName);

            if (fileContents.length === 0) {
                const newKanbanState = {
                    columns: [
                        { id: 1, title: 'To Do' },
                        { id: 2, title: 'In Progress' },
                        { id: 3, title: 'Done' }
                    ]
                } as KanbanDataContainer;

                await this.saveKanbanState(newKanbanState);

                result = newKanbanState;
            }
            else {
                result = JSON.parse(fileContents) as KanbanDataContainer;
            }
        }

        if (result !== undefined) {
            this.cache = result;
        }

        return result;
    }

    public async getNewKanbanState(): Promise<KanbanDataContainer | undefined> {
        const rowsAsFileNames = await this.storageHandler.listDirectoriesInDirectory(['board']);
        const directoryWasEmpty = rowsAsFileNames.length == 0;

        if (directoryWasEmpty) {
            return undefined;
        }

        const extractedRowsInfo: RowInStorage[] = [];
        const extractedTasksInfo: TaskInStorage[] = [];

        for (const rowFileName of rowsAsFileNames) {
            const rowInfo = this.convertRowFileNameToRowElement(rowFileName);
            const extractedColumns = await this.storageHandler.listDirectoriesInDirectory(['board', rowFileName]);

            extractedRowsInfo.push(rowInfo);

            for (const columnName of extractedColumns) {
                const columnId = this.covertColumnNameToId(columnName);
                const tasks = await this.storageHandler.listFilesInDirectory(['board', rowFileName, columnName]);

                for (const task of tasks) {
                    const taskInfo = this.convertTaskFileNameToTaskElement(task, columnId, rowInfo.id);

                    extractedTasksInfo.push(taskInfo);
                }
            }
        }

        const orderedExtractedTasksInfo = extractedTasksInfo.sort((a, b) => a.position - b.position);

        return {
            columns: [
                { id: 1, title: 'To Do' },
                { id: 2, title: 'In Progress' },
                { id: 3, title: 'Done' }
            ],
            rows: extractedRowsInfo,
            tasks: orderedExtractedTasksInfo
        }
    }

    public async saveNewKanbanState(boardStateContainer: KanbanDataContainer) {
        await this.storageHandler.removeDirectory('board');

        const groupedTasks: { [key: string]: TaskInStorage[] } = {};
        for (const task of boardStateContainer.tasks) {
            const key = `(${task.rowId}, ${task.columnId})`;

            if (!groupedTasks[key]) {
                groupedTasks[key] = [];
            }

            groupedTasks[key].push(task);
        }

        for (const taskGroup of Object.values(groupedTasks)) {
            if (taskGroup.length === 0) {
                console.warn('Empty task group found, skipping');
                continue;
            }

            const rowMetadata = await taskStorage.getRowMetadata(taskGroup[0].rowId);

            if (rowMetadata === undefined) {
                console.warn('Row metadata not found, skipping');
                continue;
            }

            const rowName = `${this.sanitizeFilename(rowMetadata.title)} (${taskGroup[0].rowId}, ${rowMetadata.syncId})`;
            const columnName = this.convertColumnIdToName(taskGroup[0].columnId);
            const fileNames = [];

            const sortedTaskGroup = taskGroup.sort((a, b) => a.position - b.position);

            let counter = 1;
            for (const task of sortedTaskGroup) {
                const taskMetadata = await taskStorage.getTaskMetadata(task.id);

                if (taskMetadata === undefined) {
                    console.warn('Task metadata not found, skipping');
                    continue;
                }

                fileNames.push(`${this.sanitizeFilename(taskMetadata.title)} (${task.id}, ${taskMetadata.syncId}, ${counter})`);
                counter += 1;
            }

            await this.storageHandler.createEmptyFiles(fileNames, ['board', rowName, columnName]);
        }
    }

    private covertColumnNameToId(columnName: string): number {
        switch (columnName) {
            case 'To Do':
                return 1;
            case 'In Progress':
                return 2;
            case 'Done':
                return 3;
            default:
                return 0;
        }
    }

    private convertColumnIdToName(columnId: number): string {
        switch (columnId) {
            case 1:
                return 'To Do';
            case 2:
                return 'In Progress';
            case 3:
                return 'Done';
            default:
                return '';
        }
    }

    private convertRowFileNameToRowElement(fileName: string): RowInStorage {
        const regex = /\((\d+),\s*(.+),\s*(\d+)\)/;
        const match = fileName.match(regex);

        return {
            id: match ? parseInt(match[1]) : 0,
            position: match ? parseInt(match[3]) : 0
        };
    }

    private convertTaskFileNameToTaskElement(fileName: string, knownColumnId: number, knownRowId: number): TaskInStorage {
        const regex = /\((\d+),\s*(.+),\s*(\d+)\)/;
        const match = fileName.match(regex);

        return {
            id: match ? parseInt(match[1]) : 0,
            columnId: knownColumnId,
            rowId: knownRowId,
            position: match ? parseInt(match[3]) : 0
        };
    }

    public async saveKanbanState(boardStateContainer: KanbanDataContainer) {

        const dataContainer = {
            tasks: boardStateContainer.tasks,
            rows: boardStateContainer.rows,
            columns: boardStateContainer.columns
        }

        await this.storageHandler.saveJsonContentToDirectory<KanbanDataContainer>(this.fileName, dataContainer, []);

        await this.saveNewKanbanState(boardStateContainer);
    }

    public async addRowToBoard(row: RowInStorage, tasks: TaskInStorage[]) {
        const currentBoardState = await this.getKanbanState();

        currentBoardState?.rows.unshift(row);
        currentBoardState?.tasks.push(...tasks);

        await kanbanBoardStorage.saveKanbanState(currentBoardState);
    }

    private sanitizeFilename(input: string, replacement: string = "_"): string {
        const matchAnythingNotBeingNumberOrLetter = /[^a-z0-9]/gi;
        const trimmedInput = input.trim().replace(/^\.+|\.+$/g, "");

        const sanitized = trimmedInput.replace(matchAnythingNotBeingNumberOrLetter, replacement);

        const maxLength = 100;
        return sanitized.slice(0, maxLength) || "untitled";
    }
}

const kanbanBoardStorage = new KanbanBoardStorage(fileSystemHandler);

export default kanbanBoardStorage;