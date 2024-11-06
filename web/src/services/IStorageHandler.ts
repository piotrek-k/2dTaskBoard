import { EventWatcher } from "./EventWatcher";

export interface IStorageHandler {
    storageReady(): boolean;
    getReadinessWatcher(): EventWatcher<boolean>;

    getContent(dataContainerName: string): Promise<string>;
    getContentFromDirectory(dataContainerName: string, folderNames: string[]): Promise<string>;
    saveJsonContentToDirectory<Type>(dataContainerName: string, dataContainer: Type, folderNames: string[]): Promise<void>;
    saveTextContentToDirectory(dataContainerName: string, dataContainer: string, folderNames: string[]): Promise<void>;

    uploadFile(file: File, targetFileName: string, folderNames: string[]): Promise<string>;
    listFilesInDirectory(folderNames: string[]): Promise<string[]>;
}