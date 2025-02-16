import { TASKS_DIRECTORY_NAME } from "../constants";
import { ContentMdFile } from "../converters/ContentMdFile";
import { CardStoredMetadata, TaskStoredMetadata, RowStoredMetadata, MetadataType } from "../dataTypes/CardMetadata";
import { ComparisionType, FolderToFollow } from "../dataTypes/FileSystemStructures";
import { generateSyncId } from "../tools/syncTools";
import { Id } from "../types";
import fileSystemHandler from "./FileSystemHandler";
import { IStorageHandler } from "./IStorageHandler";
import settingsProvider, { SettingsProvider } from "./SettingsProvider";

export interface ICardStorage {
    getCardContent(cardId: Id): Promise<ContentMdFile>;
    getCardMetadata<T extends CardStoredMetadata>(cardId: Id): Promise<T | undefined>;
    getRowMetadata(rowId: Id): Promise<RowStoredMetadata | undefined>;
    getTaskMetadata(taskId: Id): Promise<TaskStoredMetadata | undefined>;
    saveCardContent(cardId: Id, contentWithoutProperties: string, cardStoredMetadata: CardStoredMetadata): Promise<void>;
    saveCardMetadata<T extends CardStoredMetadata>(card: T): Promise<void>;
    createNewRowMetadata(id: Id, title: string): Promise<void>;
    removeCard(cardId: Id): Promise<void>;
}

export class CardStorage implements ICardStorage {
    readonly cache: { [key: Id]: object } = {};

    constructor(private storageHandler: IStorageHandler, private settingsProvider: SettingsProvider) {
    }

    public async getCardContent(cardId: Id): Promise<ContentMdFile> {
        let fileContents = '';

        try {
            fileContents = await this.storageHandler.getContentFromDirectoryComplexFolderPath(
                'content.md',
                this.getPathToCard(cardId)
            );
        } catch (e) {
            console.log("couldn't find content for ", cardId);

            fileContents = await this.storageHandler.getContentFromDirectory(
                'content.md',
                [TASKS_DIRECTORY_NAME, `${cardId}`]
            );
        }

        return new ContentMdFile(fileContents);
    }

    private getPathToCard(cardId: Id): FolderToFollow[] {
        return [{
            name: TASKS_DIRECTORY_NAME,
            comparisionType: ComparisionType.Exact
        },
        {
            name: `${cardId}` + '\\s+\\((.*)\\)',
            comparisionType: ComparisionType.Regex
        }];
    }

    public async removeCard(cardId: Id): Promise<void> {
        await this.storageHandler.removeDirectory(`${cardId}`, [TASKS_DIRECTORY_NAME]);
    }

    public async getCardMetadata<T extends CardStoredMetadata>(cardId: Id): Promise<T | undefined> {

        if (cardId in this.cache) {
            if (this.settingsProvider.debugModeEnabled) {
                console.log("Used cache when loading metadata for ", cardId);
            }

            return this.cache[cardId] as T;
        }

        let content = '';

        try {
            content = await this.storageHandler.getContentFromDirectoryComplexFolderPath(
                'metadata.md',
                this.getPathToCard(cardId)
            );
        }
        catch (e) {
            console.log("couldn't find medatada for ", cardId);
        }

        if (content.length == 0 || content == undefined) {
            content = await this.storageHandler.getContentFromDirectory(
                'metadata.md',
                [TASKS_DIRECTORY_NAME, `${cardId}`]
            );
        }

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

    public async saveCardContent(cardId: Id, contentWithoutProperties: string, cardStoredMetadata: CardStoredMetadata) {
        const contentMdFile = await this.getCardContent(cardId);
        contentMdFile.setJustMarkdownContent(contentWithoutProperties);

        const content = contentMdFile.getRawContentMdFileReadyToSave(cardStoredMetadata);

        await this.storageHandler.createDirectory([TASKS_DIRECTORY_NAME, `${cardId} (${cardStoredMetadata.syncId})`]);

        await this.storageHandler.saveTextContentToDirectoryWithDynamicPath('content.md', content, this.getPathToCard(cardId));
    }

    public async saveCardMetadata<T extends CardStoredMetadata>(card: T): Promise<void> {
        delete this.cache[card.id];

        await this.storageHandler.createDirectory([TASKS_DIRECTORY_NAME, `${card.id} (${card.syncId})`]);

        await this.storageHandler.saveJsonContentToDirectoryWithDynamicPath<T>('metadata.md', card, this.getPathToCard(card.id));
    }

    public async createNewRowMetadata(id: Id, title: string) {
        const rowMetadata: RowStoredMetadata = {
            id: id,
            title: title,
            type: MetadataType.Row,
            syncId: generateSyncId()
        }

        await taskStorage.saveCardMetadata(rowMetadata);
    }
}

const taskStorage = new CardStorage(fileSystemHandler, settingsProvider);

export default taskStorage;