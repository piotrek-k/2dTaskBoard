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
//             'To Do': {
//                 '[files]': 'task1 (2, abc123, 1)'
//             }
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

    (mockStorageHandler.createEmptyFiles as Mock).mockImplementation((fileNames, folderNames) => {
        let currentElement = exampleFileSystemTree;

        for (const folder of folderNames) {
            if (!currentElement[folder]) {
                currentElement[folder] = {};
            }
            currentElement = currentElement[folder];
        }

        if (currentElement['[files]'] === undefined) {
            currentElement['[files]'] = [];
        }

        for (const fileName of fileNames) {
            currentElement['[files]'].push(fileName);
        }

        return Promise.resolve();
    });
}