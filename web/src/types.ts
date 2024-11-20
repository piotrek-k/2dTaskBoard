export type Id = number;

export enum WorkUnitType {
    Task = 0,
    Row = 1,
}

export type WorkUnit = {
    id: Id;
    title: string;
    type: WorkUnitType;
}

export type Row = {
    isVisible: boolean;
} & WorkUnit;

export type Column = {
    id: Id;
    title: string;
}

export type Task = {
    columnId: Id;
    rowId: Id;
} & WorkUnit;

export interface KanbanDataContainer {
    tasks: Task[];
    rows: Row[];
    columns: Column[];
}

export interface Archive { //Remove
    rows: ArchivedRow[];
}

export interface ArchivedRow { //Remove
    // row: Row;
    rowId: Id;
    columns: ArchivedColumn[];
}

export interface ArchivedColumn { //Remove
    id: Id;
    tasks: Id[];
}

export interface ArchiveStored {
    rows: ArchivedStoredRow[];
}

export interface ArchivedStoredRow {
    rowId: Id;
    columns: ArchivedStoredColumn[];
}

export interface ArchivedStoredColumn {
    id: Id;
    tasks: Id[];
}

export interface ArchiveViewModel {
    rows: ArchivedRowViewModel[];
}

export interface ArchivedRowViewModel {
    rowId: Id;
    columns: ArchivedColumnViewModel[];
}

export interface ArchivedColumnViewModel {
    id: Id;
    tasks: ArchivedTaskViewModel[];
}

export interface ArchivedTaskViewModel {
    id: Id;
    title: string;
}