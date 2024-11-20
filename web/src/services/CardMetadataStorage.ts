import { CardStoredMetadata, TaskStoredMetadata, TaskMetadataViewModel, RowMetadataViewModel, MetadataType, RowStoredMetadata } from "../dataTypes/CardMetadata";
import { Id, KanbanDataContainer } from "../types";
import fileSystemHandler from "./FileSystemHandler";
import { IStorageHandler } from "./IStorageHandler";
import kanbanBoardStorage from "./KanbanBoardStorage";

class CardMetadataStorage {
    constructor(private storageHandler: IStorageHandler) {
    }

    public async getCardContent(cardId: Id): Promise<string> {
        const fileContents = await this.storageHandler.getContentFromDirectory('content.md', ['tasks', `${cardId}`]);

        return fileContents;
    }

    private async getCardMetadata<T extends CardStoredMetadata>(cardId: Id): Promise<T | undefined> {
        const content = await this.storageHandler.getContentFromDirectory('metadata.md', ['tasks', `${cardId}`]);

        if (content.length === 0) {
            return undefined;
        }

        return JSON.parse(content) as T;
    }

    private addBoardContextToRow(row: RowStoredMetadata, boardState: KanbanDataContainer): RowMetadataViewModel {
        const boardRow = boardState.rows.find(t => t.id == row.id);

        if (!boardRow) {
            return row;
        }

        const extendedRow = row as RowMetadataViewModel;
        extendedRow.type = MetadataType.Row;

        return extendedRow;
    }

    public getRowMetadata(rowId: Id): Promise<RowStoredMetadata | undefined> {
        return this.getCardMetadata<RowStoredMetadata>(rowId);
    }

    public async getRowMetadataViewModel(rowId: Id): Promise<RowMetadataViewModel | undefined> {
        const metadata = await this.getCardMetadata<RowMetadataViewModel>(rowId);

        if (!metadata) {
            return {
                id: rowId,
                title: 'Row ' + rowId,
                type: MetadataType.Row
            };
        }

        if (metadata?.type != MetadataType.Row) {
            throw new Error('Wrong type');
        }

        const boardState = await kanbanBoardStorage.getKanbanState();
        const extendedRow = this.addBoardContextToRow(metadata, boardState);

        return extendedRow;
    }

    private addBoardContextToTask(task: TaskStoredMetadata, boardState: KanbanDataContainer): TaskMetadataViewModel {
        const boardTask = boardState.tasks.find(t => t.id == task.id);

        if (!boardTask) {
            return task as TaskMetadataViewModel;
        }

        const extendedTask = task as TaskMetadataViewModel;
        extendedTask.columnId = boardTask.columnId;
        extendedTask.rowId = boardTask.rowId;
        extendedTask.type = MetadataType.Task;

        return extendedTask;
    }

    public async getTaskMetadata(taskId: Id): Promise<TaskStoredMetadata | undefined> {
        return await this.getCardMetadata<TaskStoredMetadata>(taskId);
    }

    public async getTaskMetadataViewModel(taskId: Id): Promise<TaskMetadataViewModel | undefined> {
        const metadata = await this.getCardMetadata<TaskMetadataViewModel>(taskId);

        if (metadata?.type != MetadataType.Task) {
            throw new Error('Wrong type');
        }

        if (!metadata) {
            return {
                id: taskId,
                title: 'Task ' + taskId,
                columnId: undefined,
                rowId: undefined,
                type: MetadataType.Task
            };
        }

        const boardState = await kanbanBoardStorage.getKanbanState();
        const extendedTask = this.addBoardContextToTask(metadata, boardState);

        return extendedTask;
    }

    public async getMetadataOfUnknownType(cardId: Id): Promise<TaskMetadataViewModel | RowMetadataViewModel | undefined> {
        const metadata = await this.getCardMetadata<CardStoredMetadata>(cardId);

        if (!metadata) {
            return undefined;
        }

        if (metadata.type == MetadataType.Task) {
            return await this.getTaskMetadataViewModel(cardId);
        }

        if (metadata.type == MetadataType.Row) {
            return await this.getRowMetadataViewModel(cardId);
        }

        throw new Error('Unknown type');
    }

    public async saveCardContent(cardId: Id, content: string) {
        this.storageHandler.saveTextContentToDirectory('content.md', content, ['tasks', `${cardId}`]);
    }

    public async saveCardMetadata<T extends CardStoredMetadata>(card: T): Promise<void> {
        this.storageHandler.saveJsonContentToDirectory<T>('metadata.md', card, ['tasks', `${card.id}`]);
    }
}

const taskStorage = new CardMetadataStorage(fileSystemHandler);

export default taskStorage;