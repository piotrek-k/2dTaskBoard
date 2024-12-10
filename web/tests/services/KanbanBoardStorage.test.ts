import { describe, it, expect, vi, Mock } from 'vitest';
import { KanbanBoardStorage } from '../../src/services/KanbanBoardStorage';
import { IStorageHandler } from '../../src/services/IStorageHandler';

describe('KanbanBoardStorage', () => {
    const mockStorageHandler: IStorageHandler = {
        storageReady: vi.fn(),
        getReadinessWatcher: vi.fn(),
        getContent: vi.fn(),
        getContentFromDirectory: vi.fn(),
        saveJsonContentToDirectory: vi.fn(),
        saveTextContentToDirectory: vi.fn(),
        uploadFile: vi.fn(),
        deleteFile: vi.fn(),
        listFilesInDirectory: vi.fn(),
        listDirectoriesInDirectory: vi.fn(),
        getLinkToFile: vi.fn(),
        removeDirectory: vi.fn(),
        createEmptyFiles: vi.fn(),
    };

    const kanbanBoardStorage = new KanbanBoardStorage(mockStorageHandler);

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

        (mockStorageHandler.listDirectoriesInDirectory as Mock).mockImplementation((folderNames) => {
            if (folderNames.join() === 'board') {
                return Promise.resolve([`row1 (${exprectedRowId}, abc123, ${expectedRowPosition})`]);
            }
            else if(folderNames.join() === `board,row1 (${exprectedRowId}, abc123, ${expectedRowPosition})`){
                return Promise.resolve(['To Do']);
            }
            return Promise.resolve([]);
        });
        (mockStorageHandler.listFilesInDirectory as Mock).mockResolvedValue([`task1 (${expectedTaskId}, abc123, ${expectedTaskPosition})`]);
        
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