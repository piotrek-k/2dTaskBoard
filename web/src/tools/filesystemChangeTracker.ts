import { FileToCreate } from "../dataTypes/FileSystemStructures";
import { FileSystemDirectory } from "./filesystemTree";

export class FileSystemChangeTracker {
    private existingData: { [key: string]: DataInChangeTracker } = {};
    private newData: { [key: string]: DataInChangeTracker } = {};

    public registerExistingFile(fileName: string, filePath: string[]) {
        this.registerExisitingElement(fileName, filePath, ChangeTrackerDataType.File);
    }

    public registerExistingDirectory(directoryName: string, filePath: string[]) {
        this.registerExisitingElement(directoryName, filePath, ChangeTrackerDataType.Directory);
    }

    private registerExisitingElement(name: string, filePath: string[], type: ChangeTrackerDataType) {
        const data = new DataInChangeTracker(name, filePath, type);

        this.existingData[data.getKey()] = data;

        if (filePath.length > 0) {
            this.registerExisitingElement(filePath[filePath.length - 1], filePath.slice(0, filePath.length - 1), ChangeTrackerDataType.Directory);
        }
    }

    public registerNewFile(fileName: string, filePath: string[], content?: string) {
        this.registerNewElement(fileName, filePath, ChangeTrackerDataType.File, content);
    }

    public registerNewDirectory(directoryName: string, filePath: string[]) {
        this.registerNewElement(directoryName, filePath, ChangeTrackerDataType.Directory);
    }

    private registerNewElement(name: string, filePath: string[], type: ChangeTrackerDataType, content?: string) {
        const data = new DataInChangeTracker(name, filePath, type, content);

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

            if (key in this.existingData) {
                continue;
            }

            if (data.dataType === ChangeTrackerDataType.File) {
                await createFileCallback(
                    {
                        content: data.content,
                        name: data.fileName
                    } as FileToCreate,
                    data.filePath
                );
            }
            else if (data.dataType === ChangeTrackerDataType.Directory) {
                await createDirectoryCallback(data.fileName, data.filePath);
            }
        }
    }

    public async removeUnneeded(
        removeFileCallback: (fileName: string, filePath: string[]) => Promise<void>,
        removeDirectoryCallback: (directoryName: string, filePath: string[]) => Promise<void>
    ) {
        const existingDataOrdered = Object.values(this.existingData).sort((a, b) => b.getPathLength() - a.getPathLength());

        for (const data of existingDataOrdered) {
            if (!(data.getKey() in this.newData)) {
                if (data.dataType === ChangeTrackerDataType.File) {
                    await removeFileCallback(data.fileName, data.filePath);
                }
                else if (data.dataType === ChangeTrackerDataType.Directory) {
                    await removeDirectoryCallback(data.fileName, data.filePath);
                }
            }
        }
    }

    public loadExistingDataFromFileSystemTree(fileSystemDirectory: FileSystemDirectory, path: string[]) {
        for (const file of fileSystemDirectory.getChildFiles()) {
            this.registerExistingFile(file.getName(), path);
        }

        for (const directory of fileSystemDirectory.getChildDirectories()) {
            this.registerExistingDirectory(directory.getName(), path);

            this.loadExistingDataFromFileSystemTree(directory, [...path, directory.getName()]);
        }
    }
}

enum ChangeTrackerDataType {
    Directory,
    File
}

export class DataInChangeTracker {
    constructor(public fileName: string, public filePath: string[], public dataType: ChangeTrackerDataType, public content?: string) {

    }

    public getKey() {
        return this.filePath.join('/') + '/' + this.fileName;
    }

    public getPathLength() {
        return this.filePath.length;
    }
}