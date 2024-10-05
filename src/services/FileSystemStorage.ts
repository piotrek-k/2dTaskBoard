import { openDB } from "idb";
import { Id, KanbanDataContainer } from "../types";

export interface IAppStorageAccessor {
    getKanbanState(): Promise<KanbanDataContainer>;
    saveKanbanState(boardStateContainer: KanbanDataContainer): Promise<KanbanDataContainer>;
    getTaskContent(taskId: Id): Promise<string>;
    saveTaskContent(taskId: Id, content: string): Promise<void>;
    uploadFileForTask(taskId: Id, file: File): Promise<{ fileHandle: FileSystemFileHandle }>;
    getFilesForTask(taskId: Id): Promise<File[]>;
}

export class FileSystemStorage implements IAppStorageAccessor {
    directoryHandle: FileSystemDirectoryHandle | undefined;
    private onDirectoryHandleChange: ((newState: boolean) => void) | null = null;
    private readonly reservedFileNames: string[] = ['content.md'];

    public registerOnChangeCallback(callback: (newState: boolean) => void) {
        this.onDirectoryHandleChange = callback;
    }

    private async restoreHandle(): Promise<FileSystemDirectoryHandle> {
        const db = await getDbInstance();

        let handle = await db.get('handles', 'directoryHandle');

        if (handle) {
            console.log("Handle exists:", handle);

            let opts = { mode: 'readwrite' };

            if (await this.checkHandle(handle) && (await handle.requestPermission(opts)) !== "granted") {
                throw new Error("Cannot create handle");
            }
        } else {
            handle = await this.chooseDifferentSource();
        }

        await this.checkHandle(handle, true);

        this.directoryHandle = handle;

        return handle;
    }

    public async chooseDifferentSource(): Promise<FileSystemDirectoryHandle> {
        const db = await getDbInstance();

        this.directoryHandle = await (window as any).showDirectoryPicker() as FileSystemDirectoryHandle;
        await db.put('handles', this.directoryHandle, 'directoryHandle');

        if (this.onDirectoryHandleChange != null) {
            await this.onDirectoryHandleChange(true);
        }

        return this.directoryHandle;
    }

    private async checkHandle(handle: FileSystemDirectoryHandle, notifyAboutChanges: boolean = false): Promise<boolean> {
        let opts = { mode: 'readwrite' };

        if (await (handle as any).queryPermission(opts) === "granted") {
            if (notifyAboutChanges && this.onDirectoryHandleChange != null) {
                this.onDirectoryHandleChange(true);
            }
            return true;
        }

        if (notifyAboutChanges && this.onDirectoryHandleChange != null) {
            this.onDirectoryHandleChange(false);
        }

        return false;
    }

    private async getMainFileHandle(): Promise<FileSystemFileHandle> {
        if (this.directoryHandle == null) {
            await this.restoreHandle();
        }

        if (this.directoryHandle == null) {
            throw new Error("Directory handle not set up");
        }

        return await this.directoryHandle.getFileHandle('data.json', { create: true });
    }

    async getKanbanState(): Promise<KanbanDataContainer> {
        const fileHandle = await this.getMainFileHandle();
        const file = await fileHandle.getFile();
        const fileContents = await file.text();

        if (fileContents.length === 0) {
            return await this.saveKanbanState({
                columns: [
                    { id: '1', title: 'To Do' },
                    { id: '2', title: 'In Progress' },
                    { id: '3', title: 'Done' }
                ]
            } as KanbanDataContainer);
        }
        else {
            return JSON.parse(fileContents) as KanbanDataContainer;
        }
    }

    async saveKanbanState(boardStateContainer: KanbanDataContainer) {
        const fileHandle = await this.getMainFileHandle();

        const dataContainer = {
            tasks: boardStateContainer.tasks,
            rows: boardStateContainer.rows,
            columns: boardStateContainer.columns
        }

        const writable = await fileHandle.createWritable();
        const dataToSave = JSON.stringify(dataContainer);

        await writable.write(dataToSave);

        await writable.close();

        return dataContainer;
    }

    private async getTaskFileHandle(taskId: Id): Promise<FileSystemFileHandle> {
        if (this.directoryHandle == null) {
            throw new Error("Directory handle not set up");
        }

        const subDir = await this.directoryHandle.getDirectoryHandle('tasks', { create: true });
        const taskDir = await subDir.getDirectoryHandle(`${taskId}`, { create: true });

        return await taskDir.getFileHandle(`content.md`, { create: true });
    }

    async getTaskContent(taskId: Id): Promise<string> {

        const file = await this.getTaskFileHandle(taskId);

        return (await file.getFile()).text();
    }

    async saveTaskContent(taskId: Id, content: string) {
        const file = await this.getTaskFileHandle(taskId);

        const writable = await file.createWritable();

        await writable.write(content);

        await writable.close();
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

    async uploadFileForTask(taskId: Id, file: File): Promise<{ fileHandle: FileSystemFileHandle }> {
        if (this.directoryHandle == null) {
            throw new Error("Directory handle not set up");
        }
        
        try {
            const tasksDir = await this.directoryHandle.getDirectoryHandle('tasks', { create: true });
            const taskDir = await tasksDir.getDirectoryHandle(`${taskId}`, { create: true });

            const fileName = await this.generateUniqueFileName(taskDir, file.name);

            const newFileHandle = await taskDir.getFileHandle(fileName, { create: true });

            const writable = await newFileHandle.createWritable();
            await writable.write(file);
            await writable.close();

            console.log(`File ${fileName} uploaded successfully for task ${taskId}`);
            return { fileHandle: newFileHandle };
        } catch (error) {
            console.error(`Error uploading file for task ${taskId}:`, error);
            throw error;
        }
    }

    async getFilesForTask(taskId: Id): Promise<File[]> {
        if (this.directoryHandle == null) {
            throw new Error("Directory handle not set up");
        }

        try {
            const tasksDir = await this.directoryHandle.getDirectoryHandle('tasks', { create: true });
            const taskDir = await tasksDir.getDirectoryHandle(`${taskId}`, { create: true });

            const files: File[] = [];
            for await (const entry of (taskDir as any).values()) {
                if (entry.kind === 'file' && !this.reservedFileNames.includes(entry.name)) {
                    const file = await entry.getFile();
                    files.push(file);
                }
            }

            return files;
        } catch (error) {
            console.error(`Error getting files for task ${taskId}:`, error);
            throw error;
        }
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
