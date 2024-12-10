import { vi, Mock } from 'vitest';
import { IStorageHandler } from '../../src/services/IStorageHandler';

export const mockStorageHandler: IStorageHandler = {
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

// const exampleFileSystemTree = {
//     'board': {
//         'row1 (1, abc123, 1)': {
//             'To Do': [
//                 'task1 (2, abc123, 1)'
//             ]
//         }
//     }
// };

export function mockFileSystemTree(mockStorageHandler: IStorageHandler, exampleFileSystemTree) {

    (mockStorageHandler.listDirectoriesInDirectory as Mock).mockImplementation((folderNames) => {
        let currentElement = exampleFileSystemTree;

        for (const folder of folderNames) {
            console.log('entering ', folder)

            currentElement = currentElement[folder];
        }

        return Promise.resolve(Object.keys(currentElement));
    });

    (mockStorageHandler.listFilesInDirectory as Mock).mockImplementation((folderNames) => {
        let currentElement = exampleFileSystemTree;

        for (const folder of folderNames) {
            currentElement = currentElement[folder];
        }

        if (!Array.isArray(currentElement)) {
            throw new Error('Expected array');
        }

        return Promise.resolve(currentElement);
    });
}