import { Id } from "../types";
import fileSystemHandler from "./FileSystemHandler";
import { IStorageHandler } from "./IStorageHandler";

class AttachmentsStorage {
    constructor(private storageHandler: IStorageHandler) {
    }

    public async uploadFileForTask(taskId: Id, file: File): Promise<string> {
        const fileName = await this.storageHandler.uploadFile(file, file.name, ['attachments', `${taskId}`]);

        return fileName;
    }

    public async getFileNamesForTask(taskId: Id): Promise<string[]> {
        return await this.storageHandler.listFilesInDirectory(['attachments', `${taskId}`]);
    }

    public async getLinkForAttachment(taskId: Id, fileName: string): Promise<string> {
        return await this.storageHandler.getLinkToFile(fileName, ['attachments', `${taskId}`]);
    }
    
}

const attachmentsStorage = new AttachmentsStorage(fileSystemHandler);

export default attachmentsStorage;