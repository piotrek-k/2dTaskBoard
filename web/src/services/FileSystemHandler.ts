import { openDB } from "idb";
import { IStorageHandler } from "./IStorageHandler";
import { EventWatcher } from "./EventWatcher";
import settingsProvider, { SettingsProvider } from "./SettingsProvider";
import { FileSystemDirectory, recursivelyLoadDirectoryTree } from "../tools/filesystemTree";
import { ComparisionType, FolderToFollow } from "../dataTypes/FileSystemStructures";

class FileSystemHandler implements IStorageHandler {
    directoryHandle: FileSystemDirectoryHandle | undefined;

    readinessWatcher: EventWatcher<boolean> = new EventWatcher<boolean>();

    constructor(private settings: SettingsProvider) {
    }

    public getNameOfStorage(): string {
        return this.directoryHandle?.name ?? '';
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

    public async checkIfFileSystemHasAlreadyBeenAccessed(): Promise<boolean> {
        const db = await this.getDbInstance();

        const handle = await db.get('handles', 'directoryHandle');

        return handle != null;
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

        try {
            if ((await (handle as any).requestPermission(opts)) === "granted") {
                this.registerPossibleSourceChange(true);
                return true;
            }
            else {
                this.registerPossibleSourceChange(false);
                console.error("Requesting for permission failed");
            }
        } catch (error) {
            console.error(error);
            return false;
        }

        return false;
    }

    public async chooseDifferentSource(): Promise<FileSystemDirectoryHandle> {
        const db = await this.getDbInstance();

        try {
            this.directoryHandle = await (window as any).showDirectoryPicker() as FileSystemDirectoryHandle;
        } catch (error) {
            this.directoryHandle = undefined;
            this.isHandleActive = false;
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
        return this.getContentFromDirectoryComplexFolderPath(
            dataContainerName,
            folderNames.map(name => (
                {
                    name,
                    comparisionType: ComparisionType.Exact
                }
            ))
        );
    }

    public async getContentFromDirectoryComplexFolderPath(dataContainerName: string, folderNames: FolderToFollow[]): Promise<string> {
        if (this.settings.debugModeEnabled) {
            console.log("Getting content from: ", dataContainerName, folderNames);
        }

        if (this.directoryHandle == null) {
            this.directoryHandle = await this.restoreHandle();
        }

        if (this.directoryHandle == null) {
            throw new Error("Directory handle not set up");
        }

        const targetDir = await this.followDirectoriesComplex(folderNames);

        if (targetDir == null) {
            throw new Error("Directory not found");
        }

        const fileHandle = await targetDir.getFileHandle(dataContainerName, { create: true });

        const file = await fileHandle.getFile();
        return await file.text();
    }

    public async saveJsonContentToDirectory<Type>(dataContainerName: string, dataContainer: Type, folderNames: string[]): Promise<void> {
        await this.saveJsonContentToDirectoryWithDynamicPath(dataContainerName, dataContainer, folderNames.map(name => (
            {
                name,
                comparisionType: ComparisionType.Exact
            }
        )));
    }

    public async saveJsonContentToDirectoryWithDynamicPath<Type>(dataContainerName: string, dataContainer: Type, folderNames: FolderToFollow[]): Promise<void> {
        const dataToSave = JSON.stringify(dataContainer);

        await this.saveTextContentToDirectoryWithDynamicPath(dataContainerName, dataToSave, folderNames);
    }

    public async saveTextContentToDirectory(dataContainerName: string, dataContainer: string, folderNames: string[]): Promise<void> {
        await this.saveTextContentToDirectoryWithDynamicPath(dataContainerName, dataContainer, folderNames.map(name => (
            {
                name,
                comparisionType: ComparisionType.Exact
            }
        )));
    }

    public async saveTextContentToDirectoryWithDynamicPath(dataContainerName: string, dataContainer: string, folderNames: FolderToFollow[]) {
        if (this.settings.debugModeEnabled) {
            console.log("Saving content to ", dataContainerName, folderNames);
        }

        if (this.directoryHandle == null) {
            this.directoryHandle = await this.restoreHandle();
        }

        if (this.directoryHandle == null) {
            throw new Error("Directory handle not set up");
        }

        const targetDir = await this.followDirectoriesComplex(folderNames);

        if (targetDir == null) {
            throw new Error("Directory not found");
        }

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

        if (targetDir == null) {
            throw new Error("Directory not found");
        }

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
        return (await this.listElementsFromDirectory(folderNames, 'file'));
    }

    public async listDirectoriesInDirectory(folderNames: string[]): Promise<string[]> {
        return (await this.listElementsFromDirectory(folderNames, 'directory'));
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

        const directory = await this.followDirectories(folderNames, false);

        if (directory == null) {
            return [];
        }

        const files: string[] = [];
        for await (const entry of (directory as any).values()) {
            if (entry.kind === dataKind && !this.reservedFileNames.includes(entry.name) && !entry.name.endsWith('.crswap')) {
                files.push(entry.name);
            }
        }

        return files;
    }

    public async loadEntireTree(folderNames: string[]): Promise<FileSystemDirectory> {
        const handle = await this.followDirectories(folderNames, false);

        if (handle == null) {
            return new FileSystemDirectory('');
        }

        return await recursivelyLoadDirectoryTree(handle);
    }

    public async removeDirectory(directoryName: string, folderNames: string[]): Promise<void> {
        if (this.settings.debugModeEnabled) {
            console.log('Removed directory: ', directoryName);
        }

        const handle = await this.followDirectories(folderNames);

        await handle?.removeEntry(directoryName, { recursive: true });
    }

    public async createEmptyFiles(fileNames: string[], folderNames: string[]): Promise<void> {
        if (this.settings.debugModeEnabled) {
            console.log('Creating files: ', fileNames);
        }

        const directory = await this.followDirectories(folderNames);

        if (directory == null) {
            throw new Error("Directory not found");
        }

        for (const fileName of fileNames) {
            await directory.getFileHandle(fileName, { create: true });
        }
    }

    private async followDirectoriesComplex(folderNames: FolderToFollow[], createIfNotExist: boolean = true): Promise<FileSystemDirectoryHandle | null> {
        if (this.directoryHandle == null) {
            this.directoryHandle = await this.restoreHandle();
        }

        if (this.directoryHandle == null) {
            throw new Error("Directory handle not set up");
        }

        let targetDir = this.directoryHandle;

        for (const folderName of folderNames) {
            if (folderName.comparisionType == ComparisionType.Exact) {
                try {
                    targetDir = await targetDir.getDirectoryHandle(folderName.name, { create: createIfNotExist });
                } catch (error) {
                    return null;
                }
            }
            else if (folderName.comparisionType == ComparisionType.Regex) {
                const entries = await (targetDir as any).values();

                let found = false;
                for await (const entry of entries) {
                    if (entry.kind === 'directory' && new RegExp(folderName.name).test(entry.name)) {
                        targetDir = await targetDir.getDirectoryHandle(entry.name, { create: createIfNotExist });
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    return null;
                }
            }
        }

        return targetDir;
    }

    private async followDirectories(folderNames: string[], createIfNotExist: boolean = true): Promise<FileSystemDirectoryHandle | null> {
        return await this.followDirectoriesComplex(
            folderNames.map(name => (
                {
                    name,
                    comparisionType: ComparisionType.Exact
                })),
            createIfNotExist
        );
    }

    public async createDirectory(folderNames: string[]): Promise<void> {
        if (this.settings.debugModeEnabled) {
            console.log('Creating directory: ', folderNames);
        }

        await this.followDirectories(folderNames, true);
    }

    public async getLinkToFile(fileName: string, folderNames: string[]): Promise<string> {
        const directory = await this.followDirectories(folderNames, false);

        if (directory == null) {
            throw new Error("Directory not found");
        }

        const fileHandle = await directory.getFileHandle(fileName);
        const file = await fileHandle.getFile();

        return URL.createObjectURL(file);
    }

    public async deleteFile(fileName: string, folderNames: string[]): Promise<void> {
        const directory = await this.followDirectories(folderNames, false);

        if (directory == null) {
            throw new Error(`Directory ${folderNames.join('/')} ${fileName} not found`);
        }

        try {
            await directory.removeEntry(fileName);
        } catch (error) {
            console.error(`${folderNames.join('/')} ${fileName}`, error);
        }
    }

    public async renameDirectory(pathToDirectory: FolderToFollow[], newName: string): Promise<void> {

        const parentDirectory = await this.followDirectoriesComplex(pathToDirectory.slice(0, -1), false);
        const oldDirectory = await this.followDirectoriesComplex(pathToDirectory, false);
        const newDirectory = await parentDirectory?.getDirectoryHandle(newName, { create: true });
        const oldDirectoryName = oldDirectory?.name;

        if (oldDirectory == null) {
            throw new Error(`Couldn't find old directory`);
        }

        if (newDirectory == null) {
            throw new Error(`Couldn't create new directory`);
        }

        if (parentDirectory == null) {
            throw new Error(`Couldn't find parent directory`);
        }

        if (oldDirectoryName == null) {
            throw new Error(`Couldn't find old directory name`);
        }

        await this.copyDirectory(oldDirectory, newDirectory);

        await parentDirectory.removeEntry(oldDirectoryName, { recursive: true });
    }

    private async copyDirectory(sourceHandle: FileSystemDirectoryHandle, targetHandle: FileSystemDirectoryHandle) {
        for await (const entry of (sourceHandle as any).values()) {
            if (entry.kind === 'file') {
                const file = await entry.getFile();
                const newFileHandle = await targetHandle.getFileHandle(entry.name, { create: true });
                const writable = await newFileHandle.createWritable();
                await writable.write(await file.arrayBuffer());
                await writable.close();
            } else if (entry.kind === 'directory') {
                const newSubDir = await targetHandle.getDirectoryHandle(entry.name, { create: true });
                await this.copyDirectory(entry, newSubDir);
            }
        }
    }
}

const fileSystemHandler = new FileSystemHandler(settingsProvider);

export default fileSystemHandler;