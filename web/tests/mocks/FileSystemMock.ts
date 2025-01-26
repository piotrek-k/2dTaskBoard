import { vi, Mock } from 'vitest';
import { IStorageHandler } from '../../src/services/IStorageHandler';
import { FileSystemDirectory } from '../../src/tools/filesystemTree';

export const mockStorageHandler: IStorageHandler = {
    storageReady: vi.fn().mockImplementation(() => { throw new Error('Not implemented'); }),
    getReadinessWatcher: vi.fn().mockImplementation(() => { throw new Error('Not implemented'); }),
    getContent: vi.fn().mockImplementation(() => { throw new Error('Not implemented'); }),
    getContentFromDirectory: vi.fn().mockImplementation(() => { throw new Error('Not implemented'); }),
    saveJsonContentToDirectory: vi.fn().mockImplementation(() => { throw new Error('Not implemented'); }),
    saveTextContentToDirectory: vi.fn().mockImplementation(() => { throw new Error('Not implemented'); }),
    uploadFile: vi.fn().mockImplementation(() => { throw new Error('Not implemented'); }),
    deleteFile: vi.fn().mockImplementation(() => { throw new Error('Not implemented'); }),
    listFilesInDirectory: vi.fn().mockImplementation(() => { throw new Error('Not implemented'); }),
    listDirectoriesInDirectory: vi.fn().mockImplementation(() => { throw new Error('Not implemented'); }),
    loadEntireTree: vi.fn().mockImplementation(() => { throw new Error('Not implemented'); }),
    getLinkToFile: vi.fn().mockImplementation(() => { throw new Error('Not implemented'); }),
    removeDirectory: vi.fn().mockImplementation(() => { throw new Error('Not implemented'); }),
    createEmptyFiles: vi.fn().mockImplementation(() => { throw new Error('Not implemented'); }),
    createDirectory: vi.fn().mockImplementation(() => { throw new Error('Not implemented'); }),
};

// const exampleFileSystemTree = {
//     'board': {
//         'row1 (1, abc123, 1)': {
//             'To Do': {
//                 '[files]': ['task1 (2, abc123, 1)']
//             }
//         }
//     }
// };

function convertToFileSystemTree(directoryName, fileSystemDictionaryRepresentation): FileSystemDirectory {
    const asFileSystemDirectory = new FileSystemDirectory(directoryName);

    for (const key in fileSystemDictionaryRepresentation) {
        if (key === '[files]') {
            for (const file of fileSystemDictionaryRepresentation[key]) {
                asFileSystemDirectory.addChildFile(file);
            }

            continue;
        }

        if (typeof fileSystemDictionaryRepresentation[key] === 'object' && fileSystemDictionaryRepresentation[key] !== null) {
            const childDir = convertToFileSystemTree(key, fileSystemDictionaryRepresentation[key]);
            asFileSystemDirectory.addChildDirectory(childDir);
        }
    }

    return asFileSystemDirectory;
}


export function mockFileSystemTree(mockStorageHandler: IStorageHandler, exampleFileSystemTree) {

    (mockStorageHandler.listDirectoriesInDirectory as Mock).mockImplementation((folderNames) => {
        let currentElement = exampleFileSystemTree;

        for (const folder of folderNames) {
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

    (mockStorageHandler.loadEntireTree as Mock).mockImplementation((folderNames) => {
        let convertedTree = convertToFileSystemTree('', exampleFileSystemTree);

        for (const folder of folderNames) {
            const foundFolder = convertedTree.getChildDirectories().find((dir) => dir.getName() === folder);

            if (foundFolder === undefined) {
                throw new Error('Folder not found');
            }

            convertedTree = foundFolder;
        }

        return Promise.resolve(convertedTree);
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

    (mockStorageHandler.createDirectory as Mock).mockImplementation((folderNames) => {
        let currentElement = exampleFileSystemTree;

        for (const folder of folderNames) {
            if (!currentElement[folder]) {
                currentElement[folder] = {};
            }
            currentElement = currentElement[folder];
        }

        return Promise.resolve();
    });

    (mockStorageHandler.removeDirectory as Mock).mockImplementation((folderName) => {
        delete exampleFileSystemTree[folderName];

        return Promise.resolve();
    });
}