import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NewBoardStorage } from '../../../src/services/NewBoardStorage';
import { IStorageHandler } from '../../../src/services/IStorageHandler';
import { mock } from 'vitest-mock-extended';

describe('NewBoardStorage', () => {

    it('should return default state if no files are found', async () => {
        const storageHandlerMock = mock<IStorageHandler>();
        storageHandlerMock.listFilesInDirectory.mockResolvedValue([]);

        const boardStorage = new NewBoardStorage(storageHandlerMock);

        const result = await boardStorage.getKanbanState();

        expect(result).toEqual({
            columns: [
                { id: 1, title: 'To Do' },
                { id: 2, title: 'In Progress' },
                { id: 3, title: 'Done' }
            ],
            rows: [],
            tasks: []
        });
    });

    
});