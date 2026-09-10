import { describe, it, expect, beforeEach } from 'vitest';
import { ArchiveStorage } from '../../../src/services/ArchiveStorage';
import { IStorageHandler } from '../../../src/services/IStorageHandler';
import { mock } from 'vitest-mock-extended';
import { ArchivedStoredRow } from '../../../src/dataTypes/ArchiveStructures';

const ARCHIVED_ROW: ArchivedStoredRow = {
    id: 'row-1',
    columns: [
        { id: '1', tasks: ['task-1'] }
    ]
};

describe('ArchiveStorage', () => {
    let storageHandlerMock: ReturnType<typeof mock<IStorageHandler>>;
    let archiveStorage: ArchiveStorage;

    beforeEach(() => {
        storageHandlerMock = mock<IStorageHandler>();
        archiveStorage = new ArchiveStorage(storageHandlerMock);
    });

    it('should return an empty archive when archive.jsonl does not exist', async () => {
        storageHandlerMock.getContent.mockRejectedValue(new Error('File not found'));

        const result = await archiveStorage.getArchive();

        expect(result).toEqual({ rows: [] });
    });

    it('should create archive.jsonl when adding the first archived row', async () => {
        storageHandlerMock.getContent.mockRejectedValue(new Error('File not found'));
        storageHandlerMock.saveTextContentToDirectory.mockResolvedValue();

        await archiveStorage.addToArchive(ARCHIVED_ROW);

        expect(storageHandlerMock.saveTextContentToDirectory).toHaveBeenCalledWith(
            'archive.jsonl',
            JSON.stringify(ARCHIVED_ROW) + '\n',
            []
        );
    });
});
