import { openDB } from "idb";
import { KanbanDataContainer } from "../types";

export async function restoreHandle(): Promise<FileSystemDirectoryHandle> {
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

        if ((await handle.queryPermission(opts)) !== "granted" && (await handle.requestPermission(opts)) !== "granted") {
            throw new Error("Cannot create handle");
        }
    } else {
        handle = await (window as any).showDirectoryPicker() as FileSystemDirectoryHandle;
        await db.put('handles', handle, 'directoryHandle');
    }

    return handle;
}

export async function getMainFileHandle(directoryHandle: FileSystemDirectoryHandle): Promise<FileSystemFileHandle> {
    if (directoryHandle == null) {
        await restoreHandle();
    }

    if (directoryHandle == null) {
        throw new Error("Directory handle not set up");
    }

    return await directoryHandle.getFileHandle('data.json', { create: true });
}

export async function loadKanbanStateFromFile(directoryHandle: FileSystemDirectoryHandle) : Promise<KanbanDataContainer>{
    const fileHandle = await getMainFileHandle(directoryHandle);
    const file = await fileHandle.getFile();
    const fileContents = await file.text();

    if (fileContents.length === 0) {
        return await saveKanbanStateToFile(directoryHandle, {} as KanbanDataContainer);
    }
    else {
        return JSON.parse(fileContents) as KanbanDataContainer;
    }
}

export async function saveKanbanStateToFile(directoryHandle: FileSystemDirectoryHandle, boardStateContainer: KanbanDataContainer) {
    const fileHandle = await getMainFileHandle(directoryHandle);

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