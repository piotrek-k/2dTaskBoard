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

    
}

const attachmentsStorage = new AttachmentsStorage(fileSystemHandler);

export default attachmentsStorage;