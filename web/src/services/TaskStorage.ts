import { Id, WorkUnit } from "../types";
import fileSystemHandler from "./FileSystemHandler";
import { IStorageHandler } from "./IStorageHandler";

class TaskStorage {
    constructor(private storageHandler: IStorageHandler) {
    }

    async getTaskContent(taskId: Id): Promise<string> {
        const fileContents = await this.storageHandler.getContentFromDirectory('content.md', ['tasks', `${taskId}`]);

        return fileContents;
    }

    async getCardMetadata(cardId: Id): Promise<WorkUnit | undefined> {
        const content = await this.storageHandler.getContentFromDirectory('metadata.md', ['tasks', `${cardId}`]);

        if(content.length === 0) {
            return undefined;
        }

        return JSON.parse(content);
    }

    async saveTaskContent(taskId: Id, content: string) {
        this.storageHandler.saveTextContentToDirectory('content.md', content, ['tasks', `${taskId}`]);
    }

    async saveCardMetadata(card: WorkUnit): Promise<void> {
        this.storageHandler.saveJsonContentToDirectory<WorkUnit>('content.md', card, ['tasks', `${card.id}`]);
    }
}

const taskStorage = new TaskStorage(fileSystemHandler);

export default taskStorage;