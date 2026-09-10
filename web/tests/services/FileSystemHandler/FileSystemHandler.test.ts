import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileSystemHandler } from '../../../src/services/FileSystemHandler';
import { SettingsProvider } from '../../../src/services/SettingsProvider';

function createFileHandle(content: string) {
    return {
        getFile: vi.fn().mockResolvedValue({
            text: vi.fn().mockResolvedValue(content)
        })
    };
}

function createDirectoryHandle(name: string) {
    const childDirectories: Record<string, ReturnType<typeof createDirectoryHandle>> = {};
    const childFiles: Record<string, ReturnType<typeof createFileHandle>> = {};

    return {
        name,
        childDirectories,
        childFiles,
        getDirectoryHandle: vi.fn(async (childName: string) => {
            const childDirectory = childDirectories[childName];
            if (!childDirectory) {
                throw new Error(`Directory not found: ${childName}`);
            }
            return childDirectory;
        }),
        getFileHandle: vi.fn(async (fileName: string) => {
            const childFile = childFiles[fileName];
            if (!childFile) {
                throw new Error(`File not found: ${fileName}`);
            }
            return childFile;
        })
    };
}

describe('FileSystemHandler directory handle cache', () => {
    let fileSystemHandler: FileSystemHandler;
    let rootDirectory: ReturnType<typeof createDirectoryHandle>;
    let tasksDirectory: ReturnType<typeof createDirectoryHandle>;

    beforeEach(() => {
        const settingsProvider = { debugModeEnabled: false } as SettingsProvider;
        fileSystemHandler = new FileSystemHandler(settingsProvider);

        rootDirectory = createDirectoryHandle('vault');
        tasksDirectory = createDirectoryHandle('tasks');
        const firstTaskDirectory = createDirectoryHandle('task-1');
        const secondTaskDirectory = createDirectoryHandle('task-2');

        rootDirectory.childDirectories['tasks'] = tasksDirectory;
        tasksDirectory.childDirectories['task-1'] = firstTaskDirectory;
        tasksDirectory.childDirectories['task-2'] = secondTaskDirectory;
        firstTaskDirectory.childFiles['metadata.md'] = createFileHandle('{"title":"First"}');
        secondTaskDirectory.childFiles['metadata.md'] = createFileHandle('{"title":"Second"}');

        fileSystemHandler.directoryHandle = rootDirectory as unknown as FileSystemDirectoryHandle;
    });

    it('should reuse the tasks directory handle when reading two cards', async () => {
        await fileSystemHandler.getContentFromDirectory('metadata.md', ['tasks', 'task-1']);
        await fileSystemHandler.getContentFromDirectory('metadata.md', ['tasks', 'task-2']);

        expect(rootDirectory.getDirectoryHandle).toHaveBeenCalledTimes(1);
        expect(rootDirectory.getDirectoryHandle).toHaveBeenCalledWith('tasks', { create: true });
        expect(tasksDirectory.getDirectoryHandle).toHaveBeenCalledTimes(2);
        expect(tasksDirectory.getDirectoryHandle).toHaveBeenCalledWith('task-1', { create: true });
        expect(tasksDirectory.getDirectoryHandle).toHaveBeenCalledWith('task-2', { create: true });
    });
});
