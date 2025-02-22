import { describe, it, expect, beforeEach, vi, should, TaskContext } from 'vitest';
import { NewBoardStorage } from '../../../src/services/NewBoardStorage';
import { IStorageHandler } from '../../../src/services/IStorageHandler';
import { anyArray, mock } from 'vitest-mock-extended';
import { RowInStorage, TaskInStorage } from '../../../src/types';

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

    it('should return state from file if file is found', async () => {
        const boardState = {
            columns: [
                { id: 1, title: 'To Do' },
                { id: 2, title: 'In Progress' },
                { id: 3, title: 'Done' }
            ],
            rows: [
                { id: 1, title: 'Row 1' } as RowInStorage
            ],
            tasks: [
                { id: 1, title: 'Task 1', columnId: 1, rowId: 1 } as TaskInStorage
            ]
        };

        const storageHandlerMock = mock<IStorageHandler>();
        storageHandlerMock.listFilesInDirectory.mockResolvedValue(['board.json']);
        storageHandlerMock.getContentFromDirectory.calledWith('board.json', anyArray()).mockReturnValue(
            Promise.resolve(
                JSON.stringify(boardState)
            )
        );

        const boardStorage = new NewBoardStorage(storageHandlerMock);

        const result = await boardStorage.getKanbanState();

        expect(result).toEqual(boardState);
    });
});