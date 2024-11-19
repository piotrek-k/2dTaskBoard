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

export interface Archive {
    rows: ArchivedRow[];
}

export interface ArchivedRow {
    row: Row;
    rowId: Id;
    columns: ArchivedColumn[];
}

export interface ArchivedColumn {
    id: Id;
    tasks: Id[];
}