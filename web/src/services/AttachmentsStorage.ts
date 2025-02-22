import { ATTACHMENTS_DIRECTORY_NAME } from "../constants";
import { CardStoredMetadata } from "../dataTypes/CardMetadata";
import { Id } from "../types";
import taskStorage from "./CardStorage";
import fileSystemHandler from "./FileSystemHandler";
import { IStorageHandler } from "./IStorageHandler";

class AttachmentsStorage {
    constructor(private storageHandler: IStorageHandler) {
    }

    private getAttachmentsPath(cardId: Id): string[] {
        const pathToCard = taskStorage.getReadPathToCard(cardId);

        pathToCard.push(ATTACHMENTS_DIRECTORY_NAME);

        return pathToCard;
    }

    public async uploadFileForTask(cardStoredMetadata: CardStoredMetadata, file: File): Promise<string> {
        const fileName = await this.storageHandler.uploadFile(
            file,
            file.name,
            this.getAttachmentsPath(cardStoredMetadata.id)
        );

        return fileName;
    }

    async deleteFileForTask(cardStoredMetadata: CardStoredMetadata, fileName: string): Promise<void> {
        await this.storageHandler.deleteFile(
            fileName,
            this.getAttachmentsPath(cardStoredMetadata.id)
        );
    }

    public async getFileNamesForTask(cardStoredMetadata: CardStoredMetadata): Promise<string[]> {
        return await this.storageHandler.listFilesInDirectory(
            this.getAttachmentsPath(cardStoredMetadata.id)
        );
    }

    public async getLinkForAttachment(cardStoredMetadata: CardStoredMetadata, fileName: string): Promise<string> {
        return await this.storageHandler.getLinkToFile(
            fileName,
            this.getAttachmentsPath(cardStoredMetadata.id)
        );
    }
}

const attachmentsStorage = new AttachmentsStorage(fileSystemHandler);

export default attachmentsStorage;