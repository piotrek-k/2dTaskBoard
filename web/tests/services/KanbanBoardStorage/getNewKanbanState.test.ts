import { describe, it, expect, Mock, vi } from 'vitest';
import { KanbanBoardStorage } from '../../../src/services/KanbanBoardStorage';
import { mockFileSystemTree, mockStorageHandler } from '../../mocks/FileSystemMock';
import taskStorage from '../../../src/services/CardStorage';
import { FileSystemDirectory } from '../../../src/tools/filesystemTree';
import { IArchiveStorage } from '../../../src/services/ArchiveStorage';

describe('KanbanBoardStorage getNewKanbanState', () => {
    const archiveStorageMock: IArchiveStorage = {
        getArchive: vi.fn().mockImplementation(() => { throw new Error('Not implemented'); }),
    };

    const kanbanBoardStorage = new KanbanBoardStorage(mockStorageHandler, taskStorage, archiveStorageMock);

    it('should return undefined when directory is empty', async () => {
        (mockStorageHandler.listDirectoriesInDirectory as Mock).mockResolvedValue([]);
        (mockStorageHandler.loadEntireTree as Mock).mockResolvedValue(new FileSystemDirectory(''));
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
                    'To Do': {
                        '[files]': [
                            `task2 (${expectedTaskId}, def345, ${expectedTaskPosition})`
                        ]
                    }
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
            tasks: [{ id: expectedTaskId, position: expectedTaskPosition, columnId: 1, rowId: exprectedRowId, syncId: 'def345' }]
        });
    });

    it('should retrieve also empty rows', async () => {
        const exprectedRowId = 1;
        const expectedRowPosition = 1;

        mockFileSystemTree(mockStorageHandler, {
            'board': {
                [`row1 (${exprectedRowId}, abc123, ${expectedRowPosition})`]: {
                    'To Do': []
                },
                [`row2 (2, abc123, 2)`]: {
                    'To Do': []
                }
            }
        });

        const result = await kanbanBoardStorage.getNewKanbanState();

        expect(result).not.toBeUndefined();
        expect(result?.rows).toHaveLength(2);
        expect(result?.rows).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: 1 }),
                expect.objectContaining({ id: 2 })
            ])
        );
    });

    it('should sort tasks by position', async () => {

        const firstTaskId = 3;
        const secondTaskId = 4;

        mockFileSystemTree(mockStorageHandler, {
            'board': {
                [`row1 (1, abc123, 1)`]: {
                    'To Do': {
                        '[files]': [
                            `task2 (${firstTaskId}, abc123, 1)`,
                            `task1 (${secondTaskId}, def345, 2)`
                        ]
                    }
                }
            }
        });

        const result = await kanbanBoardStorage.getNewKanbanState();

        expect(result?.tasks[0]).toEqual(expect.objectContaining({ id: firstTaskId }));
        expect(result?.tasks[1]).toEqual(expect.objectContaining({ id: secondTaskId }));
    });

    it('should remove duplicate tasks with the same syncId', async () => {

        mockFileSystemTree(mockStorageHandler, {
            'board': {
                [`row1 (1, abc123, 1)`]: {
                    'To Do': {
                        '[files]': [
                            `task1 (1, abc123, 1)`,
                            `task1 (1, abc123, 2)`
                        ]
                    }
                }
            }
        });

        const result = await kanbanBoardStorage.getNewKanbanState();

        expect(result?.tasks).toHaveLength(1);
        expect(result?.tasks[0]).toEqual(expect.objectContaining({ id: 1 }));
    });

    it('should move assing task different id if conflict happens', async () => {

        mockFileSystemTree(mockStorageHandler, {
            'board': {
                [`row1 (1, aaaaaa, 1)`]: {
                    'To Do': {
                        '[files]': [
                            `task1 (3, cccccc, 1)`
                        ]
                    }
                },
                [`row2 (2, bbbbbb, 1)`]: {
                    'To Do': {
                        '[files]': [
                            `task2 (3, dddddd, 1)`
                        ]
                    }
                }
            }
        });

        (archiveStorageMock.getArchive as Mock).mockResolvedValue(undefined);

        const result = await kanbanBoardStorage.getNewKanbanState();

        expect(result?.tasks).toHaveLength(2);
        expect(result?.tasks[0]).toEqual(expect.objectContaining({ id: 3, syncId: 'cccccc' }));
        expect(result?.tasks[1]).toEqual(expect.objectContaining({ id: 4, syncId: 'dddddd' }));
    });

    it('should assign row different id if conflict happens', async () => {

        mockFileSystemTree(mockStorageHandler, {
            'board': {
                [`row1 (1, aaaaaa, 1)`]: {
                    'To Do': {
                        '[files]': [
                            `task1 (2, cccccc, 1)`
                        ]
                    }
                },
                [`row1 (1, aaaaaa, 2)`]: {
                    'To Do': {
                        '[files]': [
                            `task2 (3, dddddd, 1)`
                        ]
                    }
                }
            }
        });

        (archiveStorageMock.getArchive as Mock).mockResolvedValue(undefined);

        const result = await kanbanBoardStorage.getNewKanbanState();

        expect(result?.rows).toHaveLength(2);
        expect(result?.rows[0]).toEqual(expect.objectContaining({ id: 1 }));
        expect(result?.rows[1]).toEqual(expect.objectContaining({ id: 4 }));
        expect(result?.tasks[0]).toEqual(expect.objectContaining({ id: 2, syncId: 'cccccc', rowId: 1 }));
        expect(result?.tasks[1]).toEqual(expect.objectContaining({ id: 3, syncId: 'dddddd', rowId: 4 }));
    });

    it('should sort rows by position', async () => {
        const firstRowId = 1;
        const secondRowId = 2;

        mockFileSystemTree(mockStorageHandler, {
            'board': {
                [`row2 (${secondRowId}, abc123, 2)`]: {
                    'To Do': []
                },
                [`row1 (${firstRowId}, abc123, 1)`]: {
                    'To Do': []
                }
            }
        });

        const result = await kanbanBoardStorage.getNewKanbanState();

        expect(result?.rows[0]).toEqual(expect.objectContaining({ id: firstRowId }));
        expect(result?.rows[1]).toEqual(expect.objectContaining({ id: secondRowId }));
    });

    it('should correctly handle multiple rows and columns', async () => {
        const firstRowId = 1;
        const secondRowId = 2;
        const firstTaskId = 3;
        const secondTaskId = 4;

        mockFileSystemTree(mockStorageHandler, {
            'board': {
                [`row1 (${firstRowId}, abc123, 1)`]: {
                    'To Do': {
                        '[files]': [
                            `task1 (${secondTaskId}, abc456, 2)`,
                            `task2 (${firstTaskId}, abc123, 1)`
                        ]
                    }
                },
                [`row2 (${secondRowId}, abc123, 2)`]: {
                    'In Progress': []
                }
            }
        });

        const result = await kanbanBoardStorage.getNewKanbanState();

        expect(result?.rows).toHaveLength(2);
        expect(result?.rows).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: firstRowId }),
                expect.objectContaining({ id: secondRowId })
            ])
        );

        expect(result?.tasks).toHaveLength(2);
        expect(result?.tasks).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: firstTaskId }),
                expect.objectContaining({ id: secondTaskId })
            ])
        );
    });

    it('should throw an error when any task name is invalid', async () => {
        mockFileSystemTree(mockStorageHandler, {
            'board': {
                [`row1 (1, abc123, 1)`]: {
                    'To Do': {
                        '[files]': [
                            `task1 (abc123, 1)`
                        ]
                    }
                }
            }
        });

        await expect(kanbanBoardStorage.getNewKanbanState()).rejects.toThrow();
    });

    it('should return undefined when any row name is invalid', async () => {
        mockFileSystemTree(mockStorageHandler, {
            'board': {
                [`row1 (abc123, 1)`]: {
                    'To Do': {
                        '[files]': [
                            `task1 (1, abc123, 1)`
                        ]
                    }
                }
            }
        });

        await expect(kanbanBoardStorage.getNewKanbanState()).rejects.toThrow();
    });

    it('should throw an error when any column name is unknown', async () => {
        mockFileSystemTree(mockStorageHandler, {
            'board': {
                [`row1 (1, abc123, 1)`]: {
                    'To Do': {
                        "[files]": [
                            `task1 (1, abc123, 1)`
                        ]
                    },
                    'Tttodo': {
                        "[files]": [
                            `task2 (1, abc123, 1)`
                        ]
                    }
                }
            }
        });

        await expect(kanbanBoardStorage.getNewKanbanState()).rejects.toThrow();
    });
});

