import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CardMetadataViewModels } from '../../src/viewModelBuilders/CardMetadataViewModels';
import { ICardStorage } from '../../src/services/CardStorage';
import boardStorage, { BoardStorage } from '../../src/services/BoardStorage';
import { mock } from 'vitest-mock-extended';
import { MetadataType, RowStoredMetadata, TaskStoredMetadata } from '../../src/dataTypes/CardMetadata';
import { KanbanDataContainer } from '../../src/types';

const TASK_ID = 'task-1';
const ROW_ID = 'row-1';

const TASK_METADATA: TaskStoredMetadata = {
    id: TASK_ID,
    title: 'Build login page',
    type: MetadataType.Task
};

const ROW_METADATA: RowStoredMetadata = {
    id: ROW_ID,
    title: 'Feature Work',
    type: MetadataType.Row
};

const BOARD_STATE: KanbanDataContainer = {
    columns: [
        { id: '1', title: 'To Do' }
    ],
    rows: [
        { id: ROW_ID, title: 'Feature Work', position: 0, lastModificationDate: new Date('2026-01-01') }
    ],
    tasks: [
        {
            id: TASK_ID,
            title: 'Build login page',
            columnId: '1',
            rowId: ROW_ID,
            position: 0,
            lastModificationDate: new Date('2026-01-01')
        }
    ]
};

describe('CardMetadataViewModels', () => {
    let cardStorageMock: ReturnType<typeof mock<ICardStorage>>;
    let boardStorageMock: ReturnType<typeof mock<BoardStorage>>;
    let viewModels: CardMetadataViewModels;

    beforeEach(() => {
        cardStorageMock = mock<ICardStorage>();
        boardStorageMock = mock<BoardStorage>();
        viewModels = new CardMetadataViewModels(boardStorageMock, cardStorageMock);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return a fallback row view model when row metadata is missing', async () => {
        cardStorageMock.getRowMetadata.mockResolvedValue(undefined);

        const result = await viewModels.getRowMetadataViewModel(ROW_ID);

        expect(result).toEqual({
            id: ROW_ID,
            title: 'Row ' + ROW_ID,
            type: MetadataType.Row
        });
        expect(boardStorageMock.getKanbanState).not.toHaveBeenCalled();
    });

    it('should attach board context to a row when metadata exists', async () => {
        cardStorageMock.getRowMetadata.mockResolvedValue({ ...ROW_METADATA });
        boardStorageMock.getKanbanState.mockResolvedValue(BOARD_STATE);

        const result = await viewModels.getRowMetadataViewModel(ROW_ID);

        expect(result).toEqual({
            id: ROW_ID,
            title: 'Feature Work',
            type: MetadataType.Row
        });
    });

    it('should return a fallback task view model when task metadata is missing', async () => {
        cardStorageMock.getTaskMetadata.mockResolvedValue(undefined);

        const result = await viewModels.getTaskMetadataViewModel(TASK_ID);

        expect(result).toEqual({
            id: TASK_ID,
            title: 'Task ' + TASK_ID,
            columnId: undefined,
            rowId: undefined,
            type: MetadataType.Task
        });
    });

    it('should attach column and row ids from board state to a task', async () => {
        cardStorageMock.getTaskMetadata.mockResolvedValue({ ...TASK_METADATA });
        vi.spyOn(boardStorage, 'getKanbanState').mockResolvedValue(BOARD_STATE);

        const result = await viewModels.getTaskMetadataViewModel(TASK_ID);

        expect(result).toEqual({
            id: TASK_ID,
            title: 'Build login page',
            type: MetadataType.Task,
            columnId: '1',
            rowId: ROW_ID
        });
    });
});
