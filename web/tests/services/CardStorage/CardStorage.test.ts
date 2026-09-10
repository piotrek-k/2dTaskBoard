import { describe, it, expect, beforeEach } from 'vitest';
import { CardStorage } from '../../../src/services/CardStorage';
import { IStorageHandler } from '../../../src/services/IStorageHandler';
import { SettingsProvider } from '../../../src/services/SettingsProvider';
import { mock } from 'vitest-mock-extended';
import { MetadataType, TaskStoredMetadata } from '../../../src/dataTypes/CardMetadata';
import { ComparisionType } from '../../../src/dataTypes/FileSystemStructures';
import { TASKS_DIRECTORY_NAME } from '../../../src/constants';

const TASK_ID = 'task-1';

const TASK_METADATA: TaskStoredMetadata = {
    id: TASK_ID,
    title: 'Build login page',
    type: MetadataType.Task
};

const SEARCH_PATH = [
    { name: TASKS_DIRECTORY_NAME, comparisionType: ComparisionType.Exact },
    { name: TASK_ID, comparisionType: ComparisionType.Exact }
];

describe('CardStorage', () => {
    let storageHandlerMock: ReturnType<typeof mock<IStorageHandler>>;
    let settingsProviderMock: SettingsProvider;
    let cardStorage: CardStorage;

    beforeEach(() => {
        storageHandlerMock = mock<IStorageHandler>();
        settingsProviderMock = { debugModeEnabled: false } as SettingsProvider;
        cardStorage = new CardStorage(storageHandlerMock, settingsProviderMock);
    });

    it('should parse metadata.md from the complex folder path', async () => {
        storageHandlerMock.getContentFromDirectoryComplexFolderPath.mockResolvedValue(
            JSON.stringify(TASK_METADATA)
        );

        const result = await cardStorage.getCardMetadata<TaskStoredMetadata>(TASK_ID);

        expect(result).toEqual(TASK_METADATA);
        expect(storageHandlerMock.getContentFromDirectoryComplexFolderPath).toHaveBeenCalledWith(
            'metadata.md',
            SEARCH_PATH
        );
        expect(storageHandlerMock.getContentFromDirectory).not.toHaveBeenCalled();
    });

    it('should not call storage again when metadata is already cached', async () => {
        storageHandlerMock.getContentFromDirectoryComplexFolderPath.mockResolvedValue(
            JSON.stringify(TASK_METADATA)
        );

        await cardStorage.getCardMetadata<TaskStoredMetadata>(TASK_ID);
        const result = await cardStorage.getCardMetadata<TaskStoredMetadata>(TASK_ID);

        expect(result).toEqual(TASK_METADATA);
        expect(storageHandlerMock.getContentFromDirectoryComplexFolderPath).toHaveBeenCalledTimes(1);
        expect(storageHandlerMock.getContentFromDirectory).not.toHaveBeenCalled();
    });

    it('should return undefined when metadata.md is empty', async () => {
        storageHandlerMock.getContentFromDirectoryComplexFolderPath.mockResolvedValue('');
        storageHandlerMock.getContentFromDirectory.mockResolvedValue('');

        const result = await cardStorage.getCardMetadata<TaskStoredMetadata>(TASK_ID);

        expect(result).toBeUndefined();
    });

    it('should clear cached metadata when saving so the next read hits storage', async () => {
        storageHandlerMock.getContentFromDirectoryComplexFolderPath.mockResolvedValue(
            JSON.stringify(TASK_METADATA)
        );
        storageHandlerMock.createDirectory.mockResolvedValue();
        storageHandlerMock.saveJsonContentToDirectoryWithDynamicPath.mockResolvedValue();

        await cardStorage.getCardMetadata<TaskStoredMetadata>(TASK_ID);

        const updatedMetadata: TaskStoredMetadata = {
            ...TASK_METADATA,
            title: 'Updated title'
        };

        await cardStorage.saveCardMetadata(updatedMetadata);

        expect(storageHandlerMock.createDirectory).toHaveBeenCalledWith([TASKS_DIRECTORY_NAME, TASK_ID]);
        expect(storageHandlerMock.saveJsonContentToDirectoryWithDynamicPath).toHaveBeenCalledWith(
            'metadata.md',
            updatedMetadata,
            SEARCH_PATH
        );

        storageHandlerMock.getContentFromDirectoryComplexFolderPath.mockResolvedValue(
            JSON.stringify(updatedMetadata)
        );

        const result = await cardStorage.getCardMetadata<TaskStoredMetadata>(TASK_ID);

        expect(result).toEqual(updatedMetadata);
        expect(storageHandlerMock.getContentFromDirectoryComplexFolderPath).toHaveBeenCalledTimes(2);
    });
});
