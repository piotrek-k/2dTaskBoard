import { describe, it, expect, vi, Mock, beforeEach } from 'vitest';
import { KanbanBoardStorage } from '../../../src/services/KanbanBoardStorage';
import { mockFileSystemTree, mockStorageHandler } from '../../mocks/FileSystemMock';
import { ICardMetadataStorage } from '../../../src/services/CardMetadataStorage'; import { KanbanDataContainer } from '../../../src/types';
import { MetadataType, RowMetadataViewModel, RowStoredMetadata, TaskMetadataViewModel, TaskStoredMetadata } from '../../../src/dataTypes/CardMetadata';


describe('KanbanBoardStorage saveNewKanbanState', () => {

    let mockCardMetadataStorage: ICardMetadataStorage;
    let kanbanBoardStorage: KanbanBoardStorage;
    const knownColumns = KanbanBoardStorage.knownColumns;

    beforeEach(() => {
        mockCardMetadataStorage = {
            getCardContent: vi.fn().mockImplementation(() => { throw new Error('Not implemented'); }),
            getCardMetadata: vi.fn().mockImplementation(() => { throw new Error('Not implemented'); }),
            getRowMetadata: vi.fn().mockResolvedValue({ id: 1, title: 'row1', type: MetadataType.Row, syncId: 'abc123' } as RowStoredMetadata),
            getTaskMetadata: vi.fn().mockResolvedValue({ id: 1, title: 'task1', type: MetadataType.Task, syncId: 'abc123' } as TaskStoredMetadata),
            saveCardContent: vi.fn().mockImplementation(() => { throw new Error('Not implemented'); }),
            saveCardMetadata: vi.fn().mockImplementation(() => { throw new Error('Not implemented'); }),
            createNewRowMetadata: vi.fn().mockImplementation(() => { throw new Error('Not implemented'); }),
        } as ICardMetadataStorage;

        kanbanBoardStorage = new KanbanBoardStorage(mockStorageHandler, mockCardMetadataStorage);
    });

    it('should correctly save state of board to filesystem', async () => {
        const boardStateBeingSaved = {
            columns: knownColumns,
            rows: [
                { id: 1, position: 1 }
            ],
            tasks: [
                { id: 2, position: 1, columnId: 1, rowId: 1 }
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
                            'task1 (2, abc123, 1)'
                        ]
                    },
                    'In Progress': {},
                    'Done': {}
                }
            }
        });
    });

    it('should throw an error when any it is not possible to get metadata for any row', async () => {
        const boardStateBeingSaved = {
            columns: knownColumns,
            rows: [
                { id: 1, position: 1 }
            ],
            tasks: [
                { id: 2, position: 1, columnId: 1, rowId: 1 }
            ]
        } as KanbanDataContainer;

        (mockCardMetadataStorage.getRowMetadata as Mock).mockResolvedValue(undefined);

        await expect(kanbanBoardStorage.saveNewKanbanState(boardStateBeingSaved)).rejects.toThrow('Row metadata not found');
    });

    it('should throw an error when any it is not possible to get metadata for any task', async () => {
        const boardStateBeingSaved = {
            columns: knownColumns,
            rows: [
                { id: 1, position: 1 }
            ],
            tasks: [
                { id: 2, position: 1, columnId: 1, rowId: 1 }
            ]
        } as KanbanDataContainer;

        (mockCardMetadataStorage.getTaskMetadata as Mock).mockResolvedValue(undefined);

        await expect(kanbanBoardStorage.saveNewKanbanState(boardStateBeingSaved)).rejects.toThrow('Task metadata not found');
    });

    it('should save empty rows even without tasks in it', async () => {
        const boardStateBeingSaved = {
            columns: knownColumns,
            rows: [
                { id: 1, position: 1 },
                { id: 2, position: 2 }
            ],
            tasks: []
        } as KanbanDataContainer;

        const fakeFileSystemTree = {};

        mockFileSystemTree(mockStorageHandler, fakeFileSystemTree);

        (mockCardMetadataStorage.getRowMetadata as Mock).mockImplementation((id: number) => {
            if (id === 1) {
                return Promise.resolve({ id: 1, title: 'row1', type: MetadataType.Row, syncId: 'abc123' } as RowStoredMetadata);
            } else if (id === 2) {
                return Promise.resolve({ id: 2, title: 'row2', type: MetadataType.Row, syncId: 'def456' } as RowStoredMetadata);
            } else {
                return Promise.resolve(undefined);
            }
        });

        await kanbanBoardStorage.saveNewKanbanState(boardStateBeingSaved);

        expect(Object.values(fakeFileSystemTree['board'])).toHaveLength(2);
        expect(fakeFileSystemTree['board']).toEqual(expect.objectContaining({ 'row1 (1, abc123, 1)': expect.anything() }));
        expect(fakeFileSystemTree['board']).toEqual(expect.objectContaining({ 'row2 (2, def456, 2)': expect.anything() }));
    });

    it('should save new positions based for rows, based on their location in rows array', async () => {
        const boardStateBeingSaved = {
            columns: knownColumns,
            rows: [
                { id: 3, position: 5 },
                { id: 1, position: 2 },
                { id: 2, position: 1 }
            ],
            tasks: []
        } as KanbanDataContainer;

        const fakeFileSystemTree = {};

        mockFileSystemTree(mockStorageHandler, fakeFileSystemTree);

        (mockCardMetadataStorage.getRowMetadata as Mock).mockImplementation((id: number) => {
            if (id === 1) {
                return Promise.resolve({ id: 1, title: 'row1', type: MetadataType.Row, syncId: 'abc123' } as RowStoredMetadata);
            } else if (id === 2) {
                return Promise.resolve({ id: 2, title: 'row2', type: MetadataType.Row, syncId: 'def456' } as RowStoredMetadata);
            } else if (id === 3) {
                return Promise.resolve({ id: 3, title: 'row3', type: MetadataType.Row, syncId: 'ghi789' } as RowStoredMetadata);
            } else {
                return Promise.resolve(undefined);
            }
        });

        await kanbanBoardStorage.saveNewKanbanState(boardStateBeingSaved);

        expect(Object.values(fakeFileSystemTree['board'])).toHaveLength(3);
        expect(fakeFileSystemTree['board']).toEqual(expect.objectContaining({ 'row3 (3, ghi789, 1)': expect.anything() }));
        expect(fakeFileSystemTree['board']).toEqual(expect.objectContaining({ 'row1 (1, abc123, 2)': expect.anything() }));
        expect(fakeFileSystemTree['board']).toEqual(expect.objectContaining({ 'row2 (2, def456, 3)': expect.anything() }));
    });

    it('should save new positions for tasks based on their location in tasks array', async () => {
        const boardStateBeingSaved = {
            columns: knownColumns,
            rows: [
                { id: 1, position: 1 }
            ],
            tasks: [
                { id: 4, position: 5, columnId: 1, rowId: 1 },
                { id: 2, position: 2, columnId: 1, rowId: 1 },
                { id: 3, position: 1, columnId: 1, rowId: 1 }
            ]
        } as KanbanDataContainer;

        const fakeFileSystemTree = {};

        mockFileSystemTree(mockStorageHandler, fakeFileSystemTree);

        (mockCardMetadataStorage.getRowMetadata as Mock).mockResolvedValue({ id: 1, title: 'row1', type: MetadataType.Row, syncId: 'abc123' } as RowStoredMetadata);
        (mockCardMetadataStorage.getTaskMetadata as Mock).mockImplementation((id: number) => {
            if (id === 2) {
                return Promise.resolve({ id: 2, title: 'task2', type: MetadataType.Task, syncId: 'def456' } as TaskStoredMetadata);
            } else if (id === 3) {
                return Promise.resolve({ id: 3, title: 'task3', type: MetadataType.Task, syncId: 'ghi789' } as TaskStoredMetadata);
            } else if (id === 4) {
                return Promise.resolve({ id: 4, title: 'task4', type: MetadataType.Task, syncId: 'ghi789' } as TaskStoredMetadata);
            } else {
                return Promise.resolve(undefined);
            }
        });

        await kanbanBoardStorage.saveNewKanbanState(boardStateBeingSaved);

        expect(fakeFileSystemTree['board']['row1 (1, abc123, 1)']['To Do']['[files]']).toEqual([
            'task4 (4, ghi789, 1)',
            'task2 (2, def456, 2)',
            'task3 (3, ghi789, 3)'
        ]);
    });
});
