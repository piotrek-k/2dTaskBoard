import { ColumnInStorage, ISynchronizable, KanbanDataContainer, RowInStorage, TaskInStorage } from "../types";
import fileSystemHandler from "./FileSystemHandler";
import { IStorageHandler } from "./IStorageHandler";

export class NewBoardStorage {
    private readonly defaultFileName = 'board.json';
    private readonly pathToStorage = ['board'];

    private readonly defaultColumns = [
        { id: "1", title: 'To Do' },
        { id: "2", title: 'In Progress' },
        { id: "3", title: 'Done' }
    ] as ColumnInStorage[];

    constructor(private storageHandler: IStorageHandler) {
    }

    public async getKanbanState(): Promise<KanbanDataContainer> {
        const allFilesInDirectory = await this.storageHandler.listFilesInDirectory(this.pathToStorage);

        const result: KanbanDataContainer = {
            columns: [],
            rows: [],
            tasks: []
        };

        for (const fileName of allFilesInDirectory) {
            const fileContents = await this.storageHandler.getContentFromDirectory(fileName, this.pathToStorage);

            if (!fileContents) {
                continue;
            }

            const parsedFileContents = JSON.parse(fileContents) as KanbanDataContainer;

            result.rows = [...result.rows, ...parsedFileContents.rows];
            result.tasks = [...result.tasks, ...parsedFileContents.tasks];
        }

        if (result.columns.length === 0 && result.rows.length === 0 && result.tasks.length === 0) {
            const newKanbanState = {
                columns: this.defaultColumns,
                rows: [],
                tasks: []
            } as KanbanDataContainer;

            await this.saveKanbanState(newKanbanState);

            return newKanbanState
        }

        result.columns = this.defaultColumns;
        result.rows = this.removeDuplicateValues(result.rows) as RowInStorage[];
        result.tasks = this.removeDuplicateValues(result.tasks) as TaskInStorage[];

        return result;
    }

    private removeDuplicateValues(array: ISynchronizable[]): ISynchronizable[] {
        return array.filter((value, index, self) => {
            return self.findIndex(v => v.id === value.id) === index;
        });
    }

    public async saveKanbanState(boardStateContainer: KanbanDataContainer) {
        await this.storageHandler.saveJsonContentToDirectory<KanbanDataContainer>(
            this.defaultFileName,
            boardStateContainer,
            this.pathToStorage
        );
    }

    public async addRowToBoard(row: RowInStorage, tasks: TaskInStorage[]) {
        const currentBoardState = await this.getKanbanState();

        currentBoardState?.rows.unshift(row);
        currentBoardState?.tasks.push(...tasks);

        await this.saveKanbanState(currentBoardState);
    }

    public async generateId(): Promise<string> {
        return "dddddddd-dddd-dddd-dddd-dddddddddddd";
    }
}

const boardStorage = new NewBoardStorage(fileSystemHandler);

export default boardStorage;