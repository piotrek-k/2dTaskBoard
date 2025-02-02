import { ATTACHMENTS_DIRECTORY_NAME } from "../constants";
import { Id } from "../types";
import fileSystemHandler from "./FileSystemHandler";
import { IStorageHandler } from "./IStorageHandler";

class AttachmentsStorage {
    constructor(private storageHandler: IStorageHandler) {
    }

    public async uploadFileForTask(taskId: Id, file: File): Promise<string> {
        const fileName = await this.storageHandler.uploadFile(file, file.name, [ATTACHMENTS_DIRECTORY_NAME, `${taskId}`]);

        return fileName;
    }

    async deleteFileForTask(taskId: Id, fileName: string): Promise<void> {
        await this.storageHandler.deleteFile(fileName, [ATTACHMENTS_DIRECTORY_NAME, `${taskId}`]);
    }

    public async getFileNamesForTask(taskId: Id): Promise<string[]> {
        return await this.storageHandler.listFilesInDirectory([ATTACHMENTS_DIRECTORY_NAME, `${taskId}`]);
    }

    public async getLinkForAttachment(taskId: Id, fileName: string): Promise<string> {
        return await this.storageHandler.getLinkToFile(fileName, [ATTACHMENTS_DIRECTORY_NAME, `${taskId}`]);
    }

    public async deleteEntireContainer(cardId: Id): Promise<void> {
        return await this.storageHandler.removeDirectory(`${cardId}`, [ATTACHMENTS_DIRECTORY_NAME]);
    }

}

const attachmentsStorage = new AttachmentsStorage(fileSystemHandler);

export default attachmentsStorage;