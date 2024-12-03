import { KanbanDataContainer, RowInStorage, TaskInStorage } from "../types";
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

        const fileContents = await this.storageHandler.getContent(this.fileName);

        const test = await this.getNewKanbanState();
        console.dir(test);

        let result: KanbanDataContainer;

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

        this.cache = result;

        return result;
    }

    public async getNewKanbanState(): Promise<KanbanDataContainer> {
        const rowsAsFileNames = await this.storageHandler.listDirectoriesInDirectory(['board']);

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

        return {
            columns: [
                { id: 1, title: 'To Do' },
                { id: 2, title: 'In Progress' },
                { id: 3, title: 'Done' }
            ],
            rows: extractedRowsInfo,
            tasks: extractedTasksInfo
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

    private convertRowFileNameToRowElement(fileName: string): RowInStorage {
        const regex = /\((\d+),\s*([^)]+)\)/;
        const match = fileName.match(regex);

        return {
            id: match ? parseInt(match[1]) : 0
        };
    }

    private convertTaskFileNameToTaskElement(fileName: string, knownColumnId: number, knownRowId: number): TaskInStorage {
        const regex = /\((\d+),\s*([^)]+)\)/;
        const match = fileName.match(regex);

        return {
            id: match ? parseInt(match[1]) : 0,
            columnId: knownColumnId,
            rowId: knownRowId
        };
    }

    public async saveKanbanState(boardStateContainer: KanbanDataContainer) {

        const dataContainer = {
            tasks: boardStateContainer.tasks,
            rows: boardStateContainer.rows,
            columns: boardStateContainer.columns
        }

        await this.storageHandler.saveJsonContentToDirectory<KanbanDataContainer>(this.fileName, dataContainer, []);
    }

    public async addRowToBoard(row: RowInStorage, tasks: TaskInStorage[]) {
        const currentBoardState = await this.getKanbanState();

        currentBoardState?.rows.unshift(row);
        currentBoardState?.tasks.push(...tasks);

        await kanbanBoardStorage.saveKanbanState(currentBoardState);
    }

}

const kanbanBoardStorage = new KanbanBoardStorage(fileSystemHandler);

export default kanbanBoardStorage;