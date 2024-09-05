export type Id = string | number;

export type Row = {
    id: Id;
    title: string;
    isVisible: boolean;
}

export type Column = {
    id: Id;
    title: string;
}

export type Task = {
    id: Id;
    columnId: Id;
    rowId: Id;
    title: string;
}

export interface KanbanDataContainer {
    tasks: Task[];
    rows: Row[];
    columns: Column[];
}