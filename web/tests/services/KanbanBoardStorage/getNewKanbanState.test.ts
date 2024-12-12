import { describe, it, expect, Mock } from 'vitest';
import { KanbanBoardStorage } from '../../../src/services/KanbanBoardStorage';
import { mockFileSystemTree, mockStorageHandler } from '../../mocks/FileSystemMock';
import taskStorage from '../../../src/services/CardMetadataStorage'; 

describe('KanbanBoardStorage getNewKanbanState', () => {
    const kanbanBoardStorage = new KanbanBoardStorage(mockStorageHandler, taskStorage);

    it('should return undefined when directory is empty', async () => {
        (mockStorageHandler.listDirectoriesInDirectory as Mock).mockResolvedValue([]);
        const result = await kanbanBoardStorage.getNewKanbanState();
        expect(result).toBeUndefined();
    });

    it('should correctly retrieve info about row and task inside it', async () => {
        const exprectedRowId = 1;
        const expectedRowPosition = 1;
        const expectedTaskId = 2;
        const expectedTaskPosition = 1;

        mockFileSystemTree(mockStorageHandler, {
            'board': {
                [`row1 (${exprectedRowId}, abc123, ${expectedRowPosition})`]: {
                    'To Do': [
                        `task1 (${expectedTaskId}, abc123, ${expectedTaskPosition})`
                    ]
                }
            }
        });

        const result = await kanbanBoardStorage.getNewKanbanState();

        expect(result).toEqual({
            columns: [
                { id: 1, title: 'To Do' },
                { id: 2, title: 'In Progress' },
                { id: 3, title: 'Done' }
            ],
            rows: [{ id: exprectedRowId, position: expectedRowPosition }],
            tasks: [{ id: expectedTaskId, position: expectedTaskPosition, columnId: 1, rowId: exprectedRowId }]
        });
    });
});

