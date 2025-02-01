import { RowMetadataViewModel, MetadataType, RowStoredMetadata, TaskMetadataViewModel, TaskStoredMetadata, CardStoredMetadata } from "../dataTypes/CardMetadata";
import taskStorage, { ICardStorage } from "../services/CardStorage";
import kanbanBoardStorage, { KanbanBoardStorage } from "../services/KanbanBoardStorage";
import { generateSyncId } from "../tools/syncTools";
import { Id, KanbanDataContainer } from "../types";

export class CardMetadataViewModels {

    constructor(private boardStorage: KanbanBoardStorage, private cardStorage: ICardStorage) {
    }

    public async getRowMetadataViewModel(rowId: Id): Promise<RowMetadataViewModel | undefined> {
        const metadata = await this.cardStorage.getRowMetadata(rowId);

        if (!metadata) {
            return {
                id: rowId,
                title: 'Row ' + rowId,
                type: MetadataType.Row,
                syncId: generateSyncId()
            };
        }

        if (metadata?.type != MetadataType.Row) {
            throw new Error('Wrong type');
        }

        const boardState = await this.boardStorage.getKanbanState();
        const extendedRow = this.addBoardContextToRow(metadata, boardState);

        return extendedRow;
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

    public async getTaskMetadataViewModel(taskId: Id): Promise<TaskMetadataViewModel | undefined> {
        const metadata = await this.cardStorage.getTaskMetadata(taskId);

        if (metadata?.type != MetadataType.Task) {
            throw new Error('Wrong type');
        }

        if (!metadata) {
            return {
                id: taskId,
                title: 'Task ' + taskId,
                columnId: undefined,
                rowId: undefined,
                type: MetadataType.Task,
                syncId: generateSyncId()
            };
        }

        const boardState = await kanbanBoardStorage.getKanbanState();
        const extendedTask = this.addBoardContextToTask(metadata, boardState);

        return extendedTask;
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

    public async getMetadataOfUnknownType(cardId: Id): Promise<TaskMetadataViewModel | RowMetadataViewModel | undefined> {
        const metadata = await this.cardStorage.getCardMetadata<CardStoredMetadata>(cardId);

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
}

const cardMetadataViewModelsBuilder = new CardMetadataViewModels(kanbanBoardStorage, taskStorage);

export default cardMetadataViewModelsBuilder;