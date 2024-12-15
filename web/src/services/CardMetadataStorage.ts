import { CardStoredMetadata, TaskStoredMetadata, RowStoredMetadata, MetadataType } from "../dataTypes/CardMetadata";
import { generateSyncId } from "../tools/syncTools";
import { Id } from "../types";
import fileSystemHandler from "./FileSystemHandler";
import { IStorageHandler } from "./IStorageHandler";
import settingsProvider, { SettingsProvider } from "./SettingsProvider";

export interface ICardMetadataStorage {
    getCardContent(cardId: Id): Promise<string>;
    getCardMetadata<T extends CardStoredMetadata>(cardId: Id): Promise<T | undefined>;
    getRowMetadata(rowId: Id): Promise<RowStoredMetadata | undefined>;
    getTaskMetadata(taskId: Id): Promise<TaskStoredMetadata | undefined>;
    saveCardContent(cardId: Id, content: string): Promise<void>;
    saveCardMetadata<T extends CardStoredMetadata>(card: T): Promise<void>;
    createNewRowMetadata(id: Id, title: string): Promise<void>;
}

export class CardMetadataStorage implements ICardMetadataStorage {
    readonly cache: { [key: Id]: object } = {};

    constructor(private storageHandler: IStorageHandler, private settingsProvider: SettingsProvider) {
    }

    public async getCardContent(cardId: Id): Promise<string> {
        const fileContents = await this.storageHandler.getContentFromDirectory('content.md', ['tasks', `${cardId}`]);

        return fileContents;
    }

    public async getCardMetadata<T extends CardStoredMetadata>(cardId: Id): Promise<T | undefined> {

        if (cardId in this.cache) {
            if (this.settingsProvider.debugModeEnabled) {
                console.log("Used cache when loading metadata for ", cardId);
            }

            return this.cache[cardId] as T;
        }

        const content = await this.storageHandler.getContentFromDirectory('metadata.md', ['tasks', `${cardId}`]);

        if (content.length === 0) {
            return undefined;
        }

        const parsedContent = JSON.parse(content) as T;

        if (parsedContent.syncId === undefined) {
            parsedContent.syncId = generateSyncId();

            this.saveCardMetadata(parsedContent);
        }

        this.cache[cardId] = parsedContent;

        return parsedContent;
    }

    public getRowMetadata(rowId: Id): Promise<RowStoredMetadata | undefined> {
        return this.getCardMetadata<RowStoredMetadata>(rowId);
    }

    public async getTaskMetadata(taskId: Id): Promise<TaskStoredMetadata | undefined> {
        return await this.getCardMetadata<TaskStoredMetadata>(taskId);
    }

    public async saveCardContent(cardId: Id, content: string) {
        await this.storageHandler.saveTextContentToDirectory('content.md', content, ['tasks', `${cardId}`]);
    }

    public async saveCardMetadata<T extends CardStoredMetadata>(card: T): Promise<void> {
        delete this.cache[card.id];

        await this.storageHandler.saveJsonContentToDirectory<T>('metadata.md', card, ['tasks', `${card.id}`]);
    }

    public async createNewRowMetadata(id: Id, title: string){
        const rowMetadata: RowStoredMetadata = {
            id: id,
            title: title,
            type: MetadataType.Row,
            syncId: generateSyncId()
        }

        await taskStorage.saveCardMetadata(rowMetadata);
    }
}

const taskStorage = new CardMetadataStorage(fileSystemHandler, settingsProvider);

export default taskStorage;