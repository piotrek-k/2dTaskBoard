import { Archive, ArchivedRow } from "../types";
import fileSystemHandler from "./FileSystemHandler";
import { IStorageHandler } from "./IStorageHandler";

class ArchiveStorage {
    constructor(private storageHandler: IStorageHandler) {
    }

    async getArchive(): Promise<Archive> {
        const fileContents = await this.storageHandler.getContent('archive.jsonl');

        const lines = fileContents.trim().split('\n').reverse();
        const archive: Archive = { rows: [] };

        for (const line of lines) {
            if (line.trim() === '') {
                continue;
            }

            const data: ArchivedRow = JSON.parse(line);
            archive.rows.push(data);
        }

        return archive;
    }
}

const archiveStorage = new ArchiveStorage(fileSystemHandler);

export default archiveStorage;