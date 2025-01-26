export class FileSystemDirectory {
    private childDirectories: FileSystemDirectory[] = [];
    private childFiles: FileSystemFile[] = [];

    constructor(public directory: FileSystemDirectoryHandle) {

    }

    public addChildDirectory(directory: FileSystemDirectory) {
        this.childDirectories.push(directory);
    }

    public addChildFile(file: FileSystemHandle) {
        this.childFiles.push(new FileSystemFile(file));
    }

    public getChildDirectories() {
        return this.childDirectories;
    }

    public getChildFiles() {
        return this.childFiles;
    }

    public getName() {
        return this.directory.name;
    }
}

export class FileSystemFile {
    constructor(public file: FileSystemHandle) {

    }

    public getName() {
        return this.file.name;
    }
}

export async function recursivelyLoadDirectoryTree(handle: FileSystemDirectoryHandle): Promise<FileSystemDirectory> {
    const directory = new FileSystemDirectory(handle);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const entry of (handle as any).values()) {
        if (entry.kind === 'file') {
            directory.addChildFile(entry as FileSystemHandle);
        }
        else if (entry.kind === 'directory') {
            const childDirectory = await recursivelyLoadDirectoryTree(entry as FileSystemDirectoryHandle);

            directory.addChildDirectory(childDirectory);
        }
    }

    return directory;
}