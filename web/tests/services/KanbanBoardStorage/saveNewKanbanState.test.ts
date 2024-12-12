import { describe, it, expect, vi } from 'vitest';
import { KanbanBoardStorage } from '../../../src/services/KanbanBoardStorage';
import { mockFileSystemTree, mockStorageHandler } from '../../mocks/FileSystemMock';
import { ICardMetadataStorage } from '../../../src/services/CardMetadataStorage'; import { KanbanDataContainer } from '../../../src/types';
import { MetadataType, RowMetadataViewModel, RowStoredMetadata, TaskMetadataViewModel, TaskStoredMetadata } from '../../../src/dataTypes/CardMetadata';


describe('KanbanBoardStorage saveNewKanbanState', () => {
    const mockCardMetadataStorage: ICardMetadataStorage = {
        getCardContent: vi.fn().mockResolvedValue(''),
        getRowMetadata: vi.fn().mockResolvedValue({ id: 1, title: 'row1', type: MetadataType.Row, syncId: 'abc123' } as RowStoredMetadata),
        getRowMetadataViewModel: vi.fn().mockResolvedValue({ id: 1, title: 'Row 1', type: MetadataType.Row, syncId: 'abc123' } as RowMetadataViewModel),
        getTaskMetadata: vi.fn().mockResolvedValue({ id: 1, title: 'task1', type: MetadataType.Task, syncId: 'abc123' } as TaskStoredMetadata),
        getTaskMetadataViewModel: vi.fn().mockResolvedValue({ id: 2, title: 'Task 2', columnId: 1, rowId: 1, type: MetadataType.Task, syncId: 'abc123' } as TaskMetadataViewModel),
        getMetadataOfUnknownType: vi.fn().mockResolvedValue(undefined),
        saveCardContent: vi.fn().mockResolvedValue(undefined),
        saveCardMetadata: vi.fn().mockResolvedValue(undefined),
    };

    const kanbanBoardStorage = new KanbanBoardStorage(mockStorageHandler, mockCardMetadataStorage);

    it('should correctly save state of board to filesystem', async () => {
        const boardStateBeingSaved = {
            columns: [
                { id: 1, title: 'To Do' },
                { id: 2, title: 'In Progress' },
                { id: 3, title: 'Done' }
            ],
            rows: [
                { id: 1, position: 1 }
            ],
            tasks: [
                { id: 1, position: 1, columnId: 1, rowId: 1 }
            ]
        } as KanbanDataContainer;

        const fakeFileSystemTree = {};

        mockFileSystemTree(mockStorageHandler, fakeFileSystemTree);

        await kanbanBoardStorage.saveNewKanbanState(boardStateBeingSaved);

        expect(fakeFileSystemTree).toEqual({
            'board': {
                'row1 (1, abc123, 1)': {
                    'To Do': {
                        '[files]': [
                            'task1 (1, abc123, 1)'
                        ]
                    }
                }
            }
        });
    });
});