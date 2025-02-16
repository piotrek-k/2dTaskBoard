import { TASKS_DIRECTORY_NAME } from "../constants";
import { ComparisionType } from "../dataTypes/FileSystemStructures";
import { FileSystemChangeTracker } from "../tools/filesystemChangeTracker";
import { FileSystemDirectory } from "../tools/filesystemTree";
import { Id, KanbanDataContainer, RowInStorage, TaskInStorage } from "../types";
import { IArchiveStorage } from "./ArchiveStorage";
import taskStorage, { ICardStorage } from "./CardStorage";
import fileSystemHandler from "./FileSystemHandler";
import { IStorageHandler } from "./IStorageHandler";
import { Mutex } from 'async-mutex';

type TreeRowContainer = {
    id: number;
    columns: { [key: number]: TreeColumnContianer };
}

type TreeColumnContianer = {
    id: number;
    tasks: TaskInStorage[];
};

export class KanbanBoardStorage {
    private cache: KanbanDataContainer | null = null;

    private synchronizationLock = new Mutex();

    constructor(private storageHandler: IStorageHandler, private cardMetadataStorage: ICardStorage, private archiveStorage: IArchiveStorage) {
    }

    public static readonly knownColumns = [
        { id: 1, title: 'To Do' },
        { id: 2, title: 'In Progress' },
        { id: 3, title: 'Done' }
    ];

    public async getKanbanState(): Promise<KanbanDataContainer> {
        let result: KanbanDataContainer = {} as KanbanDataContainer;

        await this.synchronizationLock.runExclusive(async () => {
            if (this.cache !== null) {
                result = this.cache;
            }

            let boardState = await this.getNewKanbanState();

            if (boardState !== undefined) {
                this.cache = boardState;
            }

            if (boardState == undefined) {
                this.storageHandler.createDirectory(['board']);

                boardState = {
                    columns: [
                        { id: 1, title: 'To Do' },
                        { id: 2, title: 'In Progress' },
                        { id: 3, title: 'Done' }
                    ],
                    tasks: [],
                    rows: []
                } as KanbanDataContainer;
            }

            result = boardState;
        });

        return result;
    }

    public async getNewKanbanState(): Promise<KanbanDataContainer | undefined> {
        const directoriesRepresentingRows = await this.storageHandler.loadEntireTree(['board']);
        const directoryWasEmpty = directoriesRepresentingRows.getChildDirectories().length == 0;

        if (directoryWasEmpty) {
            return undefined;
        }

        const extractedRowsInfo: RowInStorage[] = [];
        const extractedTasksInfo: TaskInStorage[] = [];

        const syncIdsOfElementsAlreadyAdded = new Set<string>();
        const idMappedToSyncId = new Map<Id, string>();

        const rowsThatNeedIdChange: { dirName: string, details: RowInStorage }[] = [];
        const tasksThatNeedIdChange: { dirName: string, details: TaskInStorage }[] = [];

        let nextFreeId = this.getNextIdFromDirectoryTree(directoriesRepresentingRows);

        for (const rowFileName of directoriesRepresentingRows.getChildDirectories()) {
            const rowInfo = this.convertRowFileNameToRowElement(rowFileName.getName());
            const directoriesRepresentingColumns = rowFileName.getChildDirectories();

            if (idMappedToSyncId.has(rowInfo.id)) {
                rowInfo.id = nextFreeId;
                nextFreeId += 1;
                rowsThatNeedIdChange.push({
                    dirName: rowFileName.getName(),
                    details: rowInfo
                });
            }
            else {
                extractedRowsInfo.push(rowInfo);
                idMappedToSyncId.set(rowInfo.id, rowInfo.syncId);
            }

            for (const columnDirectory of directoriesRepresentingColumns) {
                const columnName = columnDirectory.getName();
                const columnId = this.covertColumnNameToId(columnName);
                const filesRepresentingTasks = columnDirectory.getChildFiles();

                for (const task of filesRepresentingTasks) {
                    const taskInfo = this.convertTaskFileNameToTaskElement(task.getName(), columnId, rowInfo.id);

                    if (syncIdsOfElementsAlreadyAdded.has(taskInfo.syncId)) {
                        continue;
                    }

                    if (idMappedToSyncId.has(taskInfo.id)) {
                        taskInfo.id = nextFreeId;
                        nextFreeId += 1;
                        tasksThatNeedIdChange.push({
                            dirName: task.getName(),
                            details: taskInfo
                        });
                    }
                    else {
                        extractedTasksInfo.push(taskInfo);
                        idMappedToSyncId.set(taskInfo.id, taskInfo.syncId);
                    }

                    syncIdsOfElementsAlreadyAdded.add(taskInfo.syncId);
                }
            }
        }

        for (const row of rowsThatNeedIdChange) {

            const rowInfo = this.convertRowFileNameToRowElement(row.dirName);
            const extractedNameMatch = row.dirName.match(/(.+)\s\(/);
            const extractedName = extractedNameMatch ? extractedNameMatch[1] : '';

            if (extractedName === '')
                throw new Error('Row name does not match expected pattern');

            this.storageHandler.renameDirectory(
                [
                    {
                        name: 'board',
                        comparisionType: ComparisionType.Exact
                    },
                    {
                        name: row.dirName,
                        comparisionType: ComparisionType.Exact
                    }
                ],
                this.getDirectoryNameForRow(extractedName, row.details.id, rowInfo.syncId, row.details.position)
            );
            extractedRowsInfo.push(row.details);
        }

        for (const task of tasksThatNeedIdChange) {
            extractedTasksInfo.push(task.details);
        }

        const orderedRowsInfo = extractedRowsInfo.sort((a, b) => a.position - b.position);
        const orderedExtractedTasksInfo = extractedTasksInfo.sort((a, b) => a.position - b.position);

        return {
            columns: KanbanBoardStorage.knownColumns,
            rows: orderedRowsInfo,
            tasks: orderedExtractedTasksInfo
        }
    }

    private getNextIdFromDirectoryTree(directoryTree: FileSystemDirectory): number {
        const result: number[] = [];

        for (const rowFileName of directoryTree.getChildDirectories()) {
            const rowInfo = this.convertRowFileNameToRowElement(rowFileName.getName());
            const directoriesRepresentingColumns = rowFileName.getChildDirectories();

            result.push(rowInfo.id);

            for (const columnDirectory of directoriesRepresentingColumns) {
                const columnName = columnDirectory.getName();
                const columnId = this.covertColumnNameToId(columnName);
                const filesRepresentingTasks = columnDirectory.getChildFiles();

                for (const task of filesRepresentingTasks) {
                    const taskInfo = this.convertTaskFileNameToTaskElement(task.getName(), columnId, rowInfo.id);

                    result.push(taskInfo.id);
                }
            }
        }

        return this.getNewId(result);
    }

    public async generateId(tasks: TaskInStorage[], rows: RowInStorage[]): Promise<number> {
        const archive = await this.archiveStorage.getArchive();

        return this.getNewId([
            ...tasks.map(task => task.id),
            ...rows.map(row => row.id),
            ...archive.rows.map(row => row.id),
            ...archive.rows.flatMap(row => row.columns.flatMap(column => column.tasks)).map(taskId => taskId)
        ]);
    }

    private getNewId(listOfReserverIds: number[]): number {
        const maxId = Math.max(...listOfReserverIds);
        return maxId + 1;
    }


    public async saveNewKanbanState(boardStateToSave: KanbanDataContainer) {
        const changeTracker = new FileSystemChangeTracker();

        const fileSystemTree = await this.storageHandler.loadEntireTree(['board']);

        if (fileSystemTree !== undefined) {
            changeTracker.loadExistingDataFromFileSystemTree(fileSystemTree, ['board']);
        }

        const rowsToSave = new Map<number, TreeRowContainer>();

        for (const row of boardStateToSave.rows) {
            const columnAsTree: { [key: number]: TreeColumnContianer } = [];

            for (const column of KanbanBoardStorage.knownColumns) {
                columnAsTree[column.id] = {
                    id: column.id,
                    tasks: []
                };
            }

            if (!rowsToSave.has(row.id)) {
                rowsToSave.set(row.id, {
                    id: row.id,
                    columns: columnAsTree
                });
            }
        }

        for (const task of boardStateToSave.tasks) {

            if (!rowsToSave.get(task.rowId)?.columns[task.columnId]) {
                throw Error('Task without row or column found');
            }

            rowsToSave.get(task.rowId)?.columns[task.columnId].tasks.push(task);
        }

        let rowCounter = 1;
        for (const [, row] of rowsToSave) {
            const rowMetadata = await this.cardMetadataStorage.getRowMetadata(row.id);

            if (rowMetadata === undefined) {
                throw new Error('Row metadata not found');
            }

            for (const column of Object.values(row.columns)) {

                const rowName = this.getDirectoryNameForRow(rowMetadata.title, row.id, rowMetadata.syncId, rowCounter);
                const columnName = this.convertColumnIdToName(column.id);

                if (column.tasks.length === 0) {
                    changeTracker.registerNewDirectory(
                        {
                            fileName: columnName,
                            syncId: undefined
                        },
                        [
                            {
                                fileName: 'board',
                                syncId: undefined
                            },
                            {
                                fileName: rowName,
                                syncId: rowMetadata.syncId
                            }
                        ]
                    );

                    continue;
                }

                let taskCounter = 1;
                for (const task of column.tasks) {

                    const taskMetadata = await this.cardMetadataStorage.getTaskMetadata(task.id);

                    if (taskMetadata === undefined) {
                        throw new Error('Task metadata not found');
                    }

                    const taskFileName = `${this.sanitizeFilename(taskMetadata.title)} (${task.id}, ${taskMetadata.syncId}, ${taskCounter}).md`;

                    const fileContent = `![[${this.storageHandler.getNameOfStorage()}/${TASKS_DIRECTORY_NAME}/${task.id}/content]]`;

                    changeTracker.registerNewFile(
                        {
                            fileName: taskFileName,
                            syncId: taskMetadata.syncId
                        },
                        [
                            {
                                fileName: 'board',
                                syncId: undefined
                            },
                            {
                                fileName: rowName,
                                syncId: rowMetadata.syncId
                            },
                            {
                                fileName: columnName,
                                syncId: undefined
                            }
                        ],
                        fileContent
                    );

                    taskCounter += 1;
                }
            }

            rowCounter += 1;
        }

        await changeTracker.createAll(
            async (fileDetails, filePath) => await this.storageHandler.saveTextContentToDirectory(fileDetails.name, fileDetails.content, filePath),
            async (directoryName, filePath) => await this.storageHandler.createDirectory([...filePath, directoryName])
        );

        await changeTracker.removeUnneeded(
            async (fileName, filePath) => await this.storageHandler.deleteFile(fileName, filePath),
            async (directoryName, filePath) => await this.storageHandler.removeDirectory(directoryName, filePath)
        );
    }

    private getDirectoryNameForRow(title: string, id: Id, syncId: string, position: number): string {
        return `${this.sanitizeFilename(title)} (${id}, ${syncId}, ${position})`;
    }

    private covertColumnNameToId(columnName: string): number {
        const column = KanbanBoardStorage.knownColumns.find(col => col.title === columnName);
        if (!column) {
            throw new Error(`Unknown column name: ${columnName}`);
        }
        return column.id;
    }

    private convertColumnIdToName(columnId: number): string {
        const column = KanbanBoardStorage.knownColumns.find(col => col.id === columnId);
        if (!column) {
            throw new Error(`Unknown column id: ${columnId}`);
        }
        return column.title;
    }

    private convertRowFileNameToRowElement(fileName: string): RowInStorage {
        const regex = /\((\d+),\s*(.+),\s*(\d+)\)/;
        const match = fileName.match(regex);

        if (match === null) {
            throw new Error('Row file name does not match expected pattern');
        }

        return {
            id: match ? parseInt(match[1]) : 0,
            syncId: match ? match[2] : '',
            position: match ? parseInt(match[3]) : 0
        };
    }

    private convertTaskFileNameToTaskElement(fileName: string, knownColumnId: number, knownRowId: number): TaskInStorage {
        const regex = /\((\d+),\s*(.+),\s*(\d+)\)/;
        const match = fileName.match(regex);

        if (match === null) {
            throw new Error('Task file name does not match expected pattern');
        }

        return {
            columnId: knownColumnId,
            rowId: knownRowId,
            id: match ? parseInt(match[1]) : 0,
            syncId: match ? match[2] : '',
            position: match ? parseInt(match[3]) : 0
        };
    }

    public async saveKanbanState(boardStateContainer: KanbanDataContainer) {
        await this.synchronizationLock.runExclusive(async () => {
            await this.saveNewKanbanState(boardStateContainer);

            this.cache = boardStateContainer;
        });
    }

    public async addRowToBoard(row: RowInStorage, tasks: TaskInStorage[]) {
        const currentBoardState = await this.getKanbanState();

        currentBoardState?.rows.unshift(row);
        currentBoardState?.tasks.push(...tasks);

        await kanbanBoardStorage.saveKanbanState(currentBoardState);
    }

    private sanitizeFilename(input: string, replacement: string = "_"): string {
        const matchAnythingNotBeingNumberOrLetter = /[^a-z0-9]/gi;
        const trimmedInput = input.trim().replace(/^\.+|\.+$/g, "");

        const sanitized = trimmedInput.replace(matchAnythingNotBeingNumberOrLetter, replacement);

        const maxLength = 100;
        return sanitized.slice(0, maxLength) || "untitled";
    }
}

const kanbanBoardStorage = new KanbanBoardStorage(fileSystemHandler, taskStorage);

export default kanbanBoardStorage;