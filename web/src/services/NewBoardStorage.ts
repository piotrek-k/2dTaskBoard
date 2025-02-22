import { KanbanDataContainer } from "../types";
import fileSystemHandler from "./FileSystemHandler";
import { IStorageHandler } from "./IStorageHandler";

export class NewBoardStorage {
    private readonly defaultFileName = 'board.json';
    private readonly pathToStorage = ['board'];

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

            result.columns = [...result.columns, ...parsedFileContents.columns];
            result.rows = [...result.rows, ...parsedFileContents.rows];
            result.tasks = [...result.tasks, ...parsedFileContents.tasks];
        }

        if (result.columns.length === 0 && result.rows.length === 0 && result.tasks.length === 0) {
            const newKanbanState = {
                columns: [
                    { id: 1, title: 'To Do' },
                    { id: 2, title: 'In Progress' },
                    { id: 3, title: 'Done' }
                ],
                rows: [],
                tasks: []
            } as KanbanDataContainer;

            await this.saveKanbanState(newKanbanState);

            return newKanbanState
        }

        return result;
    }

    public async saveKanbanState(boardStateContainer: KanbanDataContainer) {
        await this.storageHandler.saveJsonContentToDirectory<KanbanDataContainer>(
            this.defaultFileName,
            boardStateContainer,
            this.pathToStorage
        );
    }
}

const boardStorage = new NewBoardStorage(fileSystemHandler);

export default boardStorage;