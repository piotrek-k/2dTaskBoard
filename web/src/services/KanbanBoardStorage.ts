import { KanbanDataContainer, RowInStorage, TaskInStorage } from "../types";
import taskStorage, { ICardMetadataStorage } from "./CardMetadataStorage";
import fileSystemHandler from "./FileSystemHandler";
import { IStorageHandler } from "./IStorageHandler";

type TreeRowContainer = {
    id: number;
    columns: { [key: number]: TreeColumnContianer };
}

type TreeColumnContianer = {
    id: number;
    tasks: TaskInStorage[];
};

export class KanbanBoardStorage {
    private fileName = 'data.json';

    private cache: KanbanDataContainer | null = null;

    constructor(private storageHandler: IStorageHandler, private cardMetadataStorage: ICardMetadataStorage) {
    }

    public static readonly knownColumns = [
        { id: 1, title: 'To Do' },
        { id: 2, title: 'In Progress' },
        { id: 3, title: 'Done' }
    ];

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
                    ],
                    tasks: [],
                    rows: []
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

        const orderedRowsInfo = extractedRowsInfo.sort((a, b) => a.position - b.position);
        const orderedExtractedTasksInfo = extractedTasksInfo.sort((a, b) => a.position - b.position);

        return {
            columns: KanbanBoardStorage.knownColumns,
            rows: orderedRowsInfo,
            tasks: orderedExtractedTasksInfo
        }
    }



    public async saveNewKanbanState(boardStateContainer: KanbanDataContainer) {
        const deferredSaveOperations: (() => Promise<void>)[] = [];

        const rowsAsTree: { [key: number]: TreeRowContainer } = {};

        for (const row of boardStateContainer.rows) {
            const columnAsTree: { [key: number]: TreeColumnContianer } = [];

            for (const column of KanbanBoardStorage.knownColumns) {
                columnAsTree[column.id] = {
                    id: column.id,
                    tasks: []
                };
            }

            if (!rowsAsTree[row.id]) {
                rowsAsTree[row.id] = {
                    id: row.id,
                    columns: columnAsTree
                };
            }
        }

        for (const task of boardStateContainer.tasks) {

            if (!rowsAsTree[task.rowId].columns[task.columnId]) {
                throw Error('Task without row or column found');
            }

            rowsAsTree[task.rowId].columns[task.columnId].tasks.push(task);
        }

        let rowCounter = 1;
        for (const row of Object.values(rowsAsTree)) {
            const rowMetadata = await this.cardMetadataStorage.getRowMetadata(row.id);

            if (rowMetadata === undefined) {
                throw new Error('Row metadata not found');
            }

            for (const column of Object.values(row.columns)) {

                const rowName = `${this.sanitizeFilename(rowMetadata.title)} (${row.id}, ${rowMetadata.syncId}, ${rowCounter})`;
                const columnName = this.convertColumnIdToName(column.id);

                if (column.tasks.length === 0) {
                    await this.storageHandler.createDirectory(['board', rowName, columnName]);

                    continue;
                }

                let taskCounter = 1;
                for (const task of column.tasks) {

                    const taskMetadata = await this.cardMetadataStorage.getTaskMetadata(task.id);

                    if (taskMetadata === undefined) {
                        throw new Error('Task metadata not found');
                    }

                    const taskName = `${this.sanitizeFilename(taskMetadata.title)} (${task.id}, ${taskMetadata.syncId}, ${taskCounter})`;

                    deferredSaveOperations.push(async () => {
                        await this.storageHandler.createEmptyFiles([taskName], ['board', rowName, columnName]);
                    });

                    taskCounter += 1;
                }
            }

            rowCounter += 1;
        }

        await this.storageHandler.removeDirectory('board');

        await Promise.all(deferredSaveOperations.map(func => func()));
    }

    private covertColumnNameToId(columnName: string): number {
        const column = KanbanBoardStorage.knownColumns.find(col => col.title === columnName);
        if (!column) {
            throw new Error(`Unknown column name: ${columnName}`);
        }
        return column.id;
    }

    private convertColumnIdToName(columnId: number): string {
        const column = KanbanBoardStorage.knownColumns.find(col => col.id === columnId);
        if (!column) {
            throw new Error(`Unknown column id: ${columnId}`);
        }
        return column.title;
    }

    private convertRowFileNameToRowElement(fileName: string): RowInStorage {
        const regex = /\((\d+),\s*(.+),\s*(\d+)\)/;
        const match = fileName.match(regex);

        if (match === null) {
            throw new Error('Row file name does not match expected pattern');
        }

        return {
            id: match ? parseInt(match[1]) : 0,
            position: match ? parseInt(match[3]) : 0
        };
    }

    private convertTaskFileNameToTaskElement(fileName: string, knownColumnId: number, knownRowId: number): TaskInStorage {
        const regex = /\((\d+),\s*(.+),\s*(\d+)\)/;
        const match = fileName.match(regex);

        if (match === null) {
            throw new Error('Task file name does not match expected pattern');
        }

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

const kanbanBoardStorage = new KanbanBoardStorage(fileSystemHandler, taskStorage);

export default kanbanBoardStorage;