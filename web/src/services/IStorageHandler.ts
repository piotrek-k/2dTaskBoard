import { FileSystemDirectory } from "../tools/filesystemTree";
import { EventWatcher } from "./EventWatcher";

export interface IStorageHandler {
    storageReady(): boolean;
    getReadinessWatcher(): EventWatcher<boolean>;

    getContent(dataContainerName: string): Promise<string>;
    getContentFromDirectory(dataContainerName: string, folderNames: string[]): Promise<string>;
    saveJsonContentToDirectory<Type>(dataContainerName: string, dataContainer: Type, folderNames: string[]): Promise<void>;
    saveTextContentToDirectory(dataContainerName: string, dataContainer: string, folderNames: string[]): Promise<void>;

    uploadFile(file: File, targetFileName: string, folderNames: string[]): Promise<string>;
    deleteFile(fileName: string, folderNames: string[]): Promise<void>;
    listFilesInDirectory(folderNames: string[]): Promise<string[]>;
    listDirectoriesInDirectory(folderNames: string[]): Promise<string[]>;
    loadEntireTree(folderNames: string[]): Promise<FileSystemDirectory>;
    getLinkToFile(fileName: string, folderNames: string[]): Promise<string>;
    removeDirectory(directoryName: string, folderNames: string[]): Promise<void>;
    createEmptyFiles(fileNames: string[], folderNames: string[]): Promise<void>;
    createDirectory(folderNames: string[]): Promise<void>;

    getNameOfStorage(): string;
}