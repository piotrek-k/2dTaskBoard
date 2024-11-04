import { KanbanDataContainer } from "../types";
import { IStorageHandler } from "./IStorageHandler";

export class KanbanBoardStorage {
    private fileName = 'data.json';

    constructor(private storageHandler: IStorageHandler) {
    }

    public async getKanbanState(): Promise<KanbanDataContainer> {
        const fileContents = await this.storageHandler.getContent(this.fileName);

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

        return result;
    }

    public async saveKanbanState(boardStateContainer: KanbanDataContainer) {

        const dataContainer = {
            tasks: boardStateContainer.tasks,
            rows: boardStateContainer.rows,
            columns: boardStateContainer.columns
        }

        await this.storageHandler.saveContent(this.fileName, dataContainer);
    }
}