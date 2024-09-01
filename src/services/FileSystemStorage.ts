import { openDB } from "idb";
import { Id, KanbanDataContainer } from "../types";

export interface IAppStorageAccessor {
    getKanbanState(): Promise<KanbanDataContainer>;
    saveKanbanState(boardStateContainer: KanbanDataContainer): Promise<KanbanDataContainer>;
    getTaskContent(taskId: Id): Promise<string>;
    saveTaskContent(taskId: Id, content: string): Promise<void>;
}

export class FileSystemStorage implements IAppStorageAccessor {
    directoryHandle: FileSystemDirectoryHandle | undefined;

    private onDirectoryHandleChange: ((newState: boolean) => void) | null = null;

    public registerOnChangeCallback(callback: (newState: boolean) => void) {
        this.onDirectoryHandleChange = callback;
    }

    private async restoreHandle(): Promise<FileSystemDirectoryHandle> {
        const db = await openDB('file-handles-db', 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('handles')) {
                    db.createObjectStore('handles');
                }
            },
        });

        let handle = await db.get('handles', 'directoryHandle');

        if (handle) {
            console.log("Handle exists:", handle);

            let opts = { mode: 'readwrite' };

            if (await this.checkHandle(handle) && (await handle.requestPermission(opts)) !== "granted") {
                throw new Error("Cannot create handle");
            }
        } else {
            handle = await (window as any).showDirectoryPicker() as FileSystemDirectoryHandle;
            await db.put('handles', handle, 'directoryHandle');
        }

        await this.checkHandle(handle, true);

        this.directoryHandle = handle;

        return handle;
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
            return await this.saveKanbanState({} as KanbanDataContainer);
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
}

