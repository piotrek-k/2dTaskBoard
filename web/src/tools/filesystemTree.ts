export class FileSystemDirectory {
    private childDirectories: FileSystemDirectory[] = [];
    private childFiles: FileSystemFile[] = [];

    constructor(public directoryName: string) {

    }

    public addChildDirectory(directory: FileSystemDirectory) {
        this.childDirectories.push(directory);
    }

    public addChildFile(fileName : string) {
        this.childFiles.push(new FileSystemFile(fileName));
    }

    public getChildDirectories() {
        return this.childDirectories;
    }

    public getChildFiles() {
        return this.childFiles;
    }

    public getName() {
        return this.directoryName;
    }
}

export class FileSystemFile {
    constructor(public fileName: string) {

    }

    public getName() {
        return this.fileName;
    }
}

export async function recursivelyLoadDirectoryTree(handle: FileSystemDirectoryHandle): Promise<FileSystemDirectory> {
    const directory = new FileSystemDirectory(handle.name);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const entry of (handle as any).values()) {
        if (entry.kind === 'file') {
            directory.addChildFile(entry.name);
        }
        else if (entry.kind === 'directory') {
            const childDirectory = await recursivelyLoadDirectoryTree(entry as FileSystemDirectoryHandle);

            directory.addChildDirectory(childDirectory);
        }
    }

    return directory;
}