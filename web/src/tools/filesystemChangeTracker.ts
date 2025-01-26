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
    }

    public registerNewFile(fileName: string, filePath: string[]) {
        this.registerNewElement(fileName, filePath, ChangeTrackerDataType.File);
    }

    public registerNewDirectory(directoryName: string, filePath: string[]) {
        this.registerNewElement(directoryName, filePath, ChangeTrackerDataType.Directory);
    }

    private registerNewElement(name: string, filePath: string[], type: ChangeTrackerDataType) {
        const data = new DataInChangeTracker(name, filePath, type);

        this.newData[data.getKey()] = data;
    }

    public createAll(
        createFileCallback: (fileName: string, filePath: string[]) => void,
        createDirectoryCallback: (directoryName: string, filePath: string[]) => void
    ) {
        for (const key in this.newData) {
            const data = this.newData[key];

            if (key in this.existingData) {
                continue;
            }

            if (data.dataType === ChangeTrackerDataType.File) {
                createFileCallback(data.fileName, data.filePath);
            }
            else if (data.dataType === ChangeTrackerDataType.Directory) {
                createDirectoryCallback(data.fileName, data.filePath);
            }
        }
    }

    public removeUnneeded(
        removeFileCallback: (fileName: string, filePath: string[]) => void,
        removeDirectoryCallback: (directoryName: string, filePath: string[]) => void
    ) {
        for (const key in this.existingData) {
            if (!(key in this.newData)) {
                const data = this.existingData[key];

                if (data.dataType === ChangeTrackerDataType.File) {
                    removeFileCallback(data.fileName, data.filePath);
                }
                else if (data.dataType === ChangeTrackerDataType.Directory) {
                    removeDirectoryCallback(data.fileName, data.filePath);
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
    constructor(public fileName: string, public filePath: string[], public dataType: ChangeTrackerDataType) {

    }

    public getKey() {
        return this.filePath.join('/') + '/' + this.fileName;
    }
}