import { openDB } from "idb";
import { ArchivedRow, Id, Row, Task } from "../types";

export interface IAppStorageAccessor {
    storageIsReady(): boolean;
    restoreHandle(): Promise<FileSystemDirectoryHandle>;

    removeFromArchive(rowId: Id): Promise<void>;

    unpackFromArchiveRow(archivedRow: ArchivedRow): { row: Row, tasks: Task[] };
}

export class FileSystemStorage implements IAppStorageAccessor {
    directoryHandle: FileSystemDirectoryHandle | undefined;

    private onDirectoryHandleChange: ((newState: boolean) => void) | null = null;

    public registerOnChangeCallback(callback: (newState: boolean) => void) {
        this.onDirectoryHandleChange = callback;
    }

    private isHandleActive: boolean = false;
    private registerPossibleSourceChange(newState: boolean) {
        if (this.onDirectoryHandleChange != null && this.isHandleActive != newState) {
            this.onDirectoryHandleChange(newState);
        }

        this.isHandleActive = newState;
    }

    public storageIsReady(): boolean {
        return this.isHandleActive;
    }

    public async restoreHandle(): Promise<FileSystemDirectoryHandle> {
        const db = await getDbInstance();

        let handle = await db.get('handles', 'directoryHandle');

        if (handle) {
            console.log("Handle exists:", handle);

            let stateOfHandle = await this.verifyExistingHandle(handle);

            console.log("State of handle:", stateOfHandle);

            if (stateOfHandle) {
                this.directoryHandle = handle;

                this.registerPossibleSourceChange(true);

                return handle;
            }
        }

        console.log("Handle does not exist. Letting user choose source...");

        handle = await this.chooseDifferentSource();

        this.directoryHandle = handle;

        this.registerPossibleSourceChange(true);

        return handle;
    }

    private async verifyExistingHandle(handle: FileSystemDirectoryHandle): Promise<boolean> {
        let opts = { mode: 'readwrite' };

        if (await this.checkIfHandleStillHasPermission(handle)) {
            return true;
        }
        else {
            console.log("Handle exists, but lost permission. Requesting for permission...");
        }

        if ((await (handle as any).requestPermission(opts)) === "granted") {
            this.registerPossibleSourceChange(true);
            return true;
        }
        else {
            this.registerPossibleSourceChange(false);
            console.error("Requesting for permission failed");
        }

        return false;
    }


    public async chooseDifferentSource(): Promise<FileSystemDirectoryHandle> {
        const db = await getDbInstance();

        this.directoryHandle = await (window as any).showDirectoryPicker() as FileSystemDirectoryHandle;

        let stateOfHandle = await this.verifyExistingHandle(this.directoryHandle);

        if (stateOfHandle) {
            await db.put('handles', this.directoryHandle, 'directoryHandle');

            this.registerPossibleSourceChange(true);

            return this.directoryHandle;
        }

        throw new Error("No valid directory handle selected");
    }

    private async checkIfHandleStillHasPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
        let opts = { mode: 'readwrite' };

        if (await (handle as any).queryPermission(opts) === "granted") {
            return true;
        }

        return false;
    }

    private async getArchiveFileHandle(): Promise<FileSystemFileHandle> {
        if (this.directoryHandle == null) {
            this.directoryHandle = await this.restoreHandle();
        }

        if (this.directoryHandle == null) {
            throw new Error("Directory handle not set up");
        }

        return await this.directoryHandle.getFileHandle('archive.jsonl', { create: true });
    }

    async removeFromArchive(rowId: Id): Promise<void> {
        const fileHandle = await this.getArchiveFileHandle();

        const file = await fileHandle.getFile();
        const existingContent = await file.text();

        const rows = existingContent.split('\n').filter(line => line.trim() !== '');

        const updatedRows = rows.filter(line => {
            try {
                const row: ArchivedRow = JSON.parse(line);
                return row.row.id !== rowId;
            } catch (e) {
                console.error('Error parsing JSON line:', e);
                return true;
            }
        });

        const newContent = updatedRows.join('\n') + '\n';

        const writable = await fileHandle.createWritable();
        await writable.write(newContent);
        await writable.close();
    }

   

    unpackFromArchiveRow(archivedRow: ArchivedRow): { row: Row, tasks: Task[] } {
        const row = archivedRow.row;
        const tasks: Task[] = [];

        for (const column of archivedRow.columns) {
            tasks.push(...column.tasks);
        }

        return { row, tasks };
    }
}


async function getDbInstance() {
    return await openDB('file-handles-db', 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('handles')) {
                db.createObjectStore('handles');
            }
        },
    });
}
