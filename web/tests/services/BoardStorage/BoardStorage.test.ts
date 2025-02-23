import { describe, it, expect } from 'vitest';
import { BoardStorage } from '../../../src/services/BoardStorage';
import { IStorageHandler } from '../../../src/services/IStorageHandler';
import { anyArray, mock } from 'vitest-mock-extended';
import { RowInStorage, TaskInStorage } from '../../../src/types';

describe('NewBoardStorage', () => {

    it('should return default state if no files are found', async () => {
        const storageHandlerMock = mock<IStorageHandler>();
        storageHandlerMock.listFilesInDirectory.mockResolvedValue([]);

        const boardStorage = new BoardStorage(storageHandlerMock);

        const result = await boardStorage.getKanbanState();

        expect(result).toEqual({
            columns: [
                { id: '1', title: 'To Do' },
                { id: '2', title: 'In Progress' },
                { id: '3', title: 'Done' }
            ],
            rows: [],
            tasks: []
        });
    });

    it('should return state from file if file is found', async () => {
        const boardState = {
            columns: [
                { id: '1', title: 'To Do' },
                { id: '2', title: 'In Progress' },
                { id: '3', title: 'Done' }
            ],
            rows: [
                { id: '1', title: 'Row 1' } as RowInStorage
            ],
            tasks: [
                { id: '1', title: 'Task 1', columnId: '1', rowId: '1' } as TaskInStorage
            ]
        };

        const storageHandlerMock = mock<IStorageHandler>();
        storageHandlerMock.listFilesInDirectory.mockResolvedValue(['board.json']);
        storageHandlerMock.getContentFromDirectory.calledWith('board.json', anyArray()).mockReturnValue(
            Promise.resolve(
                JSON.stringify(boardState)
            )
        );

        const boardStorage = new BoardStorage(storageHandlerMock);

        const result = await boardStorage.getKanbanState();

        expect(result).toEqual(boardState);
    });

    it('should remove duplicate values when merging state from multiple files', async () => {
        const boardState1 = {
            columns: [
                { id: '1', title: 'To Do' },
                { id: '2', title: 'In Progress' },
                { id: '3', title: 'Done' }
            ],
            rows: [
                { id: 'abc123', title: 'Row 1' } as RowInStorage
            ],
            tasks: [
                { id: 'ddd123', title: 'Task 1', columnId: '1', rowId: 'abc123' } as TaskInStorage
            ]
        };

        const boardState2 = {
            columns: [
                { id: '1', title: 'To Do' },
                { id: '2', title: 'In Progress' },
                { id: '3', title: 'Done' }
            ],
            rows: [
                { id: 'abc123', title: 'Row 1' } as RowInStorage
            ],
            tasks: [
                { id: 'ddd123', title: 'Task 1', columnId: '1', rowId: 'abc123' } as TaskInStorage
            ]
        };

        const storageHandlerMock = mock<IStorageHandler>();
        storageHandlerMock.listFilesInDirectory.mockResolvedValue(['board1.json', 'board2.json']);
        storageHandlerMock.getContentFromDirectory.calledWith('board1.json', anyArray()).mockReturnValue(
            Promise.resolve(
                JSON.stringify(boardState1)
            )
        );
        storageHandlerMock.getContentFromDirectory.calledWith('board2.json', anyArray()).mockReturnValue(
            Promise.resolve(
                JSON.stringify(boardState2)
            )
        );

        const boardStorage = new BoardStorage(storageHandlerMock);

        const result = await boardStorage.getKanbanState();

        expect(result).toEqual(boardState1);
    });

    it('should remove redundant files from board folder', async () => {
        const storageHandlerMock = mock<IStorageHandler>();

        const boardState1 = {
            columns: [
                { id: '1', title: 'To Do' },
                { id: '2', title: 'In Progress' },
                { id: '3', title: 'Done' }
            ],
            rows: [
                { id: 'abc123', title: 'Row 1' } as RowInStorage
            ],
            tasks: [
                { id: 'ddd123', title: 'Task 1', columnId: '1', rowId: 'abc123' } as TaskInStorage
            ]
        };
        storageHandlerMock.listFilesInDirectory.mockResolvedValue(['board.json', 'board2.json', 'board3.json.conflict']);
        storageHandlerMock.getContentFromDirectory.mockReturnValue(
            Promise.resolve(
                JSON.stringify(boardState1)
            )
        );

        const boardStorage = new BoardStorage(storageHandlerMock);

        await boardStorage.getKanbanState();

        expect(storageHandlerMock.deleteFile).toHaveBeenCalledWith('board2.json', ['board']);
        expect(storageHandlerMock.deleteFile).toHaveBeenCalledWith('board3.json.conflict', ['board']);
    });

    it('should keep the newest change in row when merging state from multiple files', async () => {
        const olderBoardState = {
            columns: [
                { id: '1', title: 'To Do' },
                { id: '2', title: 'In Progress' },
                { id: '3', title: 'Done' }
            ],
            rows: [
                {
                    id: 'abc123',
                    title: 'Row 1',
                    lastModificationDate: new Date("2025-02-23T10:15:21.817Z"),
                    position: 1
                } as RowInStorage
            ],
            tasks: [
                { id: 'ddd123', title: 'Task 1', columnId: '1', rowId: 'abc123' } as TaskInStorage
            ]
        };

        const newerBoardState = {
            columns: [
                { id: '1', title: 'To Do' },
                { id: '2', title: 'In Progress' },
                { id: '3', title: 'Done' }
            ],
            rows: [
                {
                    id: 'abc123',
                    title: 'Row 1',
                    lastModificationDate: new Date("2025-02-23T11:15:21.817Z"),
                    position: 2 // position changed
                } as RowInStorage
            ],
            tasks: [
                { id: 'ddd123', title: 'Task 1', columnId: '1', rowId: 'abc123' } as TaskInStorage
            ]
        };

        const storageHandlerMock = mock<IStorageHandler>();
        storageHandlerMock.listFilesInDirectory.mockResolvedValue(['board1.json', 'board2.json']);
        storageHandlerMock.getContentFromDirectory.calledWith('board1.json', anyArray()).mockReturnValue(
            Promise.resolve(
                JSON.stringify(olderBoardState)
            )
        );
        storageHandlerMock.getContentFromDirectory.calledWith('board2.json', anyArray()).mockReturnValue(
            Promise.resolve(
                JSON.stringify(newerBoardState)
            )
        );

        const boardStorage = new BoardStorage(storageHandlerMock);

        const result = await boardStorage.getKanbanState();

        expect(result).toEqual(newerBoardState);
    });

    it('should keep the newest change in task when merging state from multiple files', async () => {
        const olderBoardState = {
            columns: [
                { id: '1', title: 'To Do' },
                { id: '2', title: 'In Progress' },
                { id: '3', title: 'Done' }
            ],
            rows: [],
            tasks: [
                {
                    id: 'ddd123',
                    title: 'Task 1',
                    columnId: '1',
                    rowId: 'abc123',
                    lastModificationDate: new Date("2025-02-23T10:15:21.817Z"),
                    position: 1
                } as TaskInStorage
            ]
        };

        const newerBoardState = {
            columns: [
                { id: '1', title: 'To Do' },
                { id: '2', title: 'In Progress' },
                { id: '3', title: 'Done' }
            ],
            rows: [],
            tasks: [
                {
                    id: 'ddd123',
                    title: 'Task 1',
                    columnId: '1',
                    rowId: 'xxx123', // row changed
                    lastModificationDate: new Date("2025-02-23T11:15:21.817Z"),
                    position: 2 // position changed
                } as TaskInStorage
            ]
        };

        const storageHandlerMock = mock<IStorageHandler>();
        storageHandlerMock.listFilesInDirectory.mockResolvedValue(['board1.json', 'board2.json']);
        storageHandlerMock.getContentFromDirectory.calledWith('board1.json', anyArray()).mockReturnValue(
            Promise.resolve(
                JSON.stringify(olderBoardState)
            )
        );
        storageHandlerMock.getContentFromDirectory.calledWith('board2.json', anyArray()).mockReturnValue(
            Promise.resolve(
                JSON.stringify(newerBoardState)
            )
        );

        const boardStorage = new BoardStorage(storageHandlerMock);

        const result = await boardStorage.getKanbanState();

        expect(result).toEqual(newerBoardState);
    });
});