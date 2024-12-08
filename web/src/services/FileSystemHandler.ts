import { openDB } from "idb";
import { IStorageHandler } from "./IStorageHandler";
import { EventWatcher } from "./EventWatcher";
import settingsProvider, { SettingsProvider } from "./SettingsProvider";

class FileSystemHandler implements IStorageHandler {
    directoryHandle: FileSystemDirectoryHandle | undefined;

    readinessWatcher: EventWatcher<boolean> = new EventWatcher<boolean>();
    
    constructor(private settings: SettingsProvider) {
    }

    private readonly reservedFileNames: string[] = ['content.md'];

    public getReadinessWatcher(): EventWatcher<boolean> {
        return this.readinessWatcher;
    }

    private isHandleActive: boolean = false;
    private registerPossibleSourceChange(newState: boolean) {
        if (this.isHandleActive != newState) {
            this.readinessWatcher.notify(newState);
        }

        this.isHandleActive = newState;
    }

    public storageReady(): boolean {
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

        try {
            this.directoryHandle = await (window as any).showDirectoryPicker() as FileSystemDirectoryHandle;
        } catch (error) {
            this.readinessWatcher.notify(false);

            throw error;
        }

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

    public async getContent(dataContainerName: string): Promise<string> {
        return this.getContentFromDirectory(dataContainerName, []);
    }

    public async getContentFromDirectory(dataContainerName: string, folderNames: string[]): Promise<string> {
        if (this.settings.debugModeEnabled) {
            console.log("Getting content from: ", dataContainerName, folderNames);
        }

        if (this.directoryHandle == null) {
            this.directoryHandle = await this.restoreHandle();
        }

        if (this.directoryHandle == null) {
            throw new Error("Directory handle not set up");
        }

        const targetDir = await this.followDirectories(folderNames);

        const fileHandle = await targetDir.getFileHandle(dataContainerName, { create: true });

        const file = await fileHandle.getFile();
        return await file.text();
    }

    public async saveJsonContentToDirectory<Type>(dataContainerName: string, dataContainer: Type, folderNames: string[]): Promise<void> {
        const dataToSave = JSON.stringify(dataContainer);

        await this.saveTextContentToDirectory(dataContainerName, dataToSave, folderNames);
    }

    public async saveTextContentToDirectory(dataContainerName: string, dataContainer: string, folderNames: string[]) {
        if (this.settings.debugModeEnabled) {
            console.log("Saving content to ", dataContainerName, folderNames);
        }

        if (this.directoryHandle == null) {
            this.directoryHandle = await this.restoreHandle();
        }

        if (this.directoryHandle == null) {
            throw new Error("Directory handle not set up");
        }

        const targetDir = await this.followDirectories(folderNames);

        const fileHandle = await targetDir.getFileHandle(dataContainerName, { create: true });

        const writable = await fileHandle.createWritable();

        await writable.write(dataContainer);
        await writable.close();
    }

    public async uploadFile(file: File, targetFileName: string, folderNames: string[], ensureUniqueName: boolean = true): Promise<string> {
        if (this.directoryHandle == null) {
            throw new Error("Directory handle not set up");
        }

        const targetDir = await this.followDirectories(folderNames);

        if (ensureUniqueName) {
            targetFileName = await this.generateUniqueFileName(targetDir, targetFileName);
        }

        const fileHandle = await targetDir.getFileHandle(targetFileName, { create: true });

        const writable = await fileHandle.createWritable();
        await writable.write(file);
        await writable.close();

        return targetFileName;
    }

    private async generateUniqueFileName(directoryHandle: FileSystemDirectoryHandle, originalName: string): Promise<string> {
        function extractFileInfo(filename: string): { baseFilename: string; counter: number | null; extension: string } {
            const match = filename.match(/^(.+?)(?:_(\d+))?\.([^.]+)$/);

            if (!match) {
                return { baseFilename: filename, counter: null, extension: '' };
            }

            const [, baseName, counterStr, extension] = match;
            const counter = counterStr ? parseInt(counterStr, 10) : null;
            const baseFilename = baseName;

            return { baseFilename, counter, extension };
        }

        const { baseFilename, counter: initialCounter, extension } = extractFileInfo(originalName);
        let counter = initialCounter ?? 0;

        const fileExists = async (name: string) => {
            try {
                await directoryHandle.getFileHandle(name);
                return true;
            } catch {
                return false;
            }
        };

        let fileName = originalName;
        while (this.reservedFileNames.includes(fileName) || await fileExists(fileName)) {
            counter++;
            fileName = `${baseFilename}_${counter}.${extension}`;
        }

        return fileName;
    }

    public async listFilesInDirectory(folderNames: string[]): Promise<string[]> {
        return this.listElementsFromDirectory(folderNames, 'file');
    }

    public async listDirectoriesInDirectory(folderNames: string[]): Promise<string[]> {
        return this.listElementsFromDirectory(folderNames, 'directory');
    }

    private async listElementsFromDirectory(folderNames: string[], dataKind: string): Promise<string[]> {
        if (this.settings.debugModeEnabled) {
            console.log("Listing directory elements ", folderNames, dataKind);
        }

        if (this.directoryHandle == null) {
            this.directoryHandle = await this.restoreHandle();
        }

        if (this.directoryHandle == null) {
            throw new Error("Directory handle not set up");
        }

        const directory = await this.followDirectories(folderNames);

        const files: string[] = [];
        for await (const entry of (directory as any).values()) {
            if (entry.kind === dataKind && !this.reservedFileNames.includes(entry.name) && !entry.name.endsWith('.crswap')) {
                files.push(entry.name);
            }
        }

        return files;
    }

    public async removeDirectory(directoryName: string): Promise<void> {
        await this.directoryHandle?.removeEntry(directoryName, { recursive: true });
    }

    public async createEmptyFiles(fileNames: string[], folderNames: string[]): Promise<void> {
        const directory = await this.followDirectories(folderNames);

        for (const fileName of fileNames) {
            await directory.getFileHandle(fileName, { create: true });
        }
    }

    private async followDirectories(folderNames: string[]): Promise<FileSystemDirectoryHandle> {
        if (this.directoryHandle == null) {
            throw new Error("Directory handle not set up");
        }

        let targetDir = this.directoryHandle;

        for (const folderName of folderNames) {
            targetDir = await targetDir.getDirectoryHandle(folderName, { create: true });
        }

        return targetDir;
    }

    public async getLinkToFile(fileName: string, folderNames: string[]): Promise<string> {
        const directory = await this.followDirectories(folderNames);

        const fileHandle = await directory.getFileHandle(fileName);
        const file = await fileHandle.getFile();

        return URL.createObjectURL(file);
    }

    public async deleteFile(fileName: string, folderNames: string[]): Promise<void> {
        const directory = await this.followDirectories(folderNames);

        await directory.removeEntry(fileName);
    }


}

const fileSystemHandler = new FileSystemHandler(settingsProvider);

export default fileSystemHandler;