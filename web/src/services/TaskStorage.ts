import { CardStoredMetadata, TaskStoredMetadata, TaskMetadataViewModel, RowMetadataViewModel, MetadataType } from "../dataTypes/CardMetadata";
import { Id, KanbanDataContainer } from "../types";
import fileSystemHandler from "./FileSystemHandler";
import { IStorageHandler } from "./IStorageHandler";
import kanbanBoardStorage from "./KanbanBoardStorage";

class TaskStorage {
    constructor(private storageHandler: IStorageHandler) {
    }

    async getCardContent(cardId: Id): Promise<string> {
        const fileContents = await this.storageHandler.getContentFromDirectory('content.md', ['tasks', `${cardId}`]);

        return fileContents;
    }

    async getCardMetadata<T extends CardStoredMetadata>(cardId: Id): Promise<T | undefined> {
        const content = await this.storageHandler.getContentFromDirectory('metadata.md', ['tasks', `${cardId}`]);

        if (content.length === 0) {
            return undefined;
        }

        return JSON.parse(content) as T;
    }

    async addBoardContextToCard(task: TaskStoredMetadata): Promise<TaskMetadataViewModel | RowMetadataViewModel | undefined> {
        const boardState = await kanbanBoardStorage.getKanbanState();

        return this.addBoardContextToUnknownCardGivenBoardState(boardState, task);
    }

    addBoardContextToUnknownCardGivenBoardState(boardState: KanbanDataContainer, card: CardStoredMetadata): TaskMetadataViewModel | RowMetadataViewModel | undefined {
        const boardTask = boardState.tasks.find(t => t.id == card.id);

        if (boardTask) {
            const extendedTask = card as TaskMetadataViewModel;
            extendedTask.columnId = boardTask.columnId;
            extendedTask.rowId = boardTask.rowId;
            extendedTask.type = MetadataType.Task;

            return extendedTask;
        }

        if (card.type == MetadataType.Task) {
            return card as TaskMetadataViewModel;
        }

        const boardRow = boardState.rows.find(t => t.id == card.id);

        if (boardRow) {
            const extendedRow = card as RowMetadataViewModel;

            return extendedRow;
        }

        if (card.type == MetadataType.Row) {
            return card as RowMetadataViewModel;
        }

        return undefined;
    }

    async saveCardContent(cardId: Id, content: string) {
        this.storageHandler.saveTextContentToDirectory('content.md', content, ['tasks', `${cardId}`]);
    }

    async saveCardMetadata<T extends CardStoredMetadata>(card: T): Promise<void> {
        this.storageHandler.saveJsonContentToDirectory<T>('metadata.md', card, ['tasks', `${card.id}`]);
    }
}

const taskStorage = new TaskStorage(fileSystemHandler);

export default taskStorage;