export type Id = string | number;

export type WorkUnit = {
    id: Id;
    title: string;
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
    columns: ArchivedColumn[];
}

export interface ArchivedColumn {
    id: Id;
    tasks: Task[];
}