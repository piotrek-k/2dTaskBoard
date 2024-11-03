import { openDB } from "idb";
import { IStorageHandler } from "./IStorageHandler";

class FileSystemHandler implements IStorageHandler {
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
        const db = await this.getDbInstance();

        let handle = await db.get('handles', 'directoryHandle');

        if (handle) {
            console.log("Handle exists:", handle);

            const stateOfHandle = await this.verifyExistingHandle(handle);

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
        const opts = { mode: 'readwrite' };

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
        const db = await this.getDbInstance();

        this.directoryHandle = await (window as any).showDirectoryPicker() as FileSystemDirectoryHandle;

        const stateOfHandle = await this.verifyExistingHandle(this.directoryHandle);

        if (stateOfHandle) {
            await db.put('handles', this.directoryHandle, 'directoryHandle');

            this.registerPossibleSourceChange(true);

            return this.directoryHandle;
        }

        throw new Error("No valid directory handle selected");
    }

    private async checkIfHandleStillHasPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
        const opts = { mode: 'readwrite' };

        if (await (handle as any).queryPermission(opts) === "granted") {
            return true;
        }

        return false;
    }

    private async getDbInstance() {
        return await openDB('file-handles-db', 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('handles')) {
                    db.createObjectStore('handles');
                }
            },
        });
    }

    public async getContent(dataContainerName: string) {
        if (this.directoryHandle == null) {
            this.directoryHandle = await this.restoreHandle();
        }

        if (this.directoryHandle == null) {
            throw new Error("Directory handle not set up");
        }

        const fileHandle = await this.directoryHandle.getFileHandle(dataContainerName, { create: true });

        const file = await fileHandle.getFile();
        return await file.text();
    }

    public async saveContent<Type>(dataContainerName: string, dataContainer: Type) {
        if (this.directoryHandle == null) {
            this.directoryHandle = await this.restoreHandle();
        }

        if (this.directoryHandle == null) {
            throw new Error("Directory handle not set up");
        }

        const fileHandle = await this.directoryHandle.getFileHandle(dataContainerName, { create: true });

        const writable = await fileHandle.createWritable();
        const dataToSave = JSON.stringify(dataContainer);

        await writable.write(dataToSave);

        await writable.close();
    }

}

const fileSystemHandler = new FileSystemHandler();

export default fileSystemHandler;