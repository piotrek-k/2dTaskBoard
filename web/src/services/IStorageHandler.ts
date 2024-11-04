import { EventWatcher } from "./EventWatcher";

export interface IStorageHandler {
    storageReady(): boolean;
    getReadinessWatcher() : EventWatcher<boolean>;

    getContent(dataContainerName: string): Promise<string>;
    saveContent<Type>(dataContainerName: string, dataContainer: Type): Promise<void>;
}