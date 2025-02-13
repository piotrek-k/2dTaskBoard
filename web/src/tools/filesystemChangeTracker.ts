import { FileToCreate } from "../dataTypes/FileSystemStructures";
import { FileSystemDirectory } from "./filesystemTree";

export class FileSystemChangeTracker {
    private existingData: { [key: string]: DataInChangeTracker } = {};
    private newData: { [key: string]: DataInChangeTracker } = {};

    public registerExistingFile(fileName: FilePathElement, filePath: FilePathElement[]) {
        this.registerExisitingElement(fileName, filePath, ChangeTrackerDataType.File);
    }

    public registerExistingDirectory(directoryName: FilePathElement, filePath: FilePathElement[]) {
        this.registerExisitingElement(directoryName, filePath, ChangeTrackerDataType.Directory);
    }

    private registerExisitingElement(elementDetails: FilePathElement, filePath: FilePathElement[], type: ChangeTrackerDataType) {
        const data = new DataInChangeTracker(elementDetails.fileName, filePath, type, undefined, elementDetails.syncId);

        this.existingData[data.getKey()] = data;

        if (filePath.length > 0) {
            this.registerExisitingElement(filePath[filePath.length - 1], filePath.slice(0, filePath.length - 1), ChangeTrackerDataType.Directory);
        }
    }

    public registerNewFile(fileName: FilePathElement, filePath: FilePathElement[], content?: string) {
        this.registerNewElement(fileName, filePath, ChangeTrackerDataType.File, content);
    }

    public registerNewDirectory(directoryName: FilePathElement, filePath: FilePathElement[]) {
        this.registerNewElement(directoryName, filePath, ChangeTrackerDataType.Directory);
    }

    private registerNewElement(elementDetails: FilePathElement, filePath: FilePathElement[], type: ChangeTrackerDataType, content?: string) {
        const data = new DataInChangeTracker(elementDetails.fileName, filePath, type, content, elementDetails.syncId);

        this.newData[data.getKey()] = data;

        if (filePath.length > 0) {
            this.registerNewElement(filePath[filePath.length - 1], filePath.slice(0, filePath.length - 1), ChangeTrackerDataType.Directory);
        }
    }

    public async createAll(
        createFileCallback: (fileName: FileToCreate, filePath: string[]) => Promise<void>,
        createDirectoryCallback: (directoryName: string, filePath: string[]) => Promise<void>
    ) {
        for (const key in this.newData) {
            const data = this.newData[key];

            if (key in this.existingData && data.fileName == this.existingData[key].fileName) {
                continue;
            }

            if (data.dataType === ChangeTrackerDataType.File) {
                await createFileCallback(
                    {
                        content: data.content,
                        name: data.fileName
                    } as FileToCreate,
                    data.filePath.map(x => x.fileName)
                );
            }
            else if (data.dataType === ChangeTrackerDataType.Directory) {
                await createDirectoryCallback(data.fileName, data.filePath.map(x => x.fileName));
            }
        }
    }

    public async removeUnneeded(
        removeFileCallback: (fileName: string, filePath: string[]) => Promise<void>,
        removeDirectoryCallback: (directoryName: string, filePath: string[]) => Promise<void>
    ) {
        const existingDataOrdered = Object.values(this.existingData).sort((a, b) => b.getPathLength() - a.getPathLength());

        for (const data of existingDataOrdered) {
            if (!(data.getKey() in this.newData) || (data.getKey() in this.newData && data.fileName !== this.newData[data.getKey()].fileName)) {
                if (data.dataType === ChangeTrackerDataType.File) {
                    await removeFileCallback(data.fileName, data.filePath.map(x => x.fileName));
                }
                else if (data.dataType === ChangeTrackerDataType.Directory) {
                    await removeDirectoryCallback(data.fileName, data.filePath.map(x => x.fileName));
                }
            }
        }
    }

    public loadExistingDataFromFileSystemTree(fileSystemDirectory: FileSystemDirectory, path: string[]) {
        for (const file of fileSystemDirectory.getChildFiles()) {
            this.registerExistingFile({
                fileName: file.getName(),
                syncId: this.extractSyncIdFromFileName(file.getName())
            }, path.map(x => ({
                fileName: x,
                syncId: this.extractSyncIdFromFileName(x)
            })));
        }

        for (const directory of fileSystemDirectory.getChildDirectories()) {
            this.registerExistingDirectory(
                {
                    fileName: directory.getName(),
                    syncId: this.extractSyncIdFromFileName(directory.getName())
                },
                path.map(x => ({
                    fileName: x,
                    syncId: this.extractSyncIdFromFileName(x)
                }))
            );

            this.loadExistingDataFromFileSystemTree(directory, [...path, directory.getName()]);
        }
    }

    private extractSyncIdFromFileName(fileName: string) {
        const match = fileName.match(/\((\d+),\s([a-fA-F0-9]{6}),/);
        return match ? match[2] : undefined;
    }
}

enum ChangeTrackerDataType {
    Directory,
    File
}

type FilePathElement = {
    fileName: string;
    syncId: string | undefined;
}

export class DataInChangeTracker {
    constructor(
        public fileName: string,
        public filePath: FilePathElement[],
        public dataType: ChangeTrackerDataType,
        public content?: string,
        public syncId?: string
    ) { }

    public getKey() {
        if (this.syncId !== undefined) {
            return this.syncId;
        }

        return this.filePath.map(x => x.fileName).join('/') + '/' + this.fileName;
    }

    public getPathLength() {
        return this.filePath.length;
    }
}