export type Id = number;

export enum WorkUnitType {
    Task = 0,
    Row = 1,
}

export type WorkUnit = {
    id: Id;
    type: WorkUnitType;
}

export type Row = {
    isVisible: boolean;
} & WorkUnit;

export type RowViewModel = {
    id: Id;
    title: string;
}

export type Column = {
    id: Id;
    title: string;
}

export type Task = {
    columnId: Id;
    rowId: Id;
} & WorkUnit;

export type TaskViewModel = {
    id: Id;
    title: string;
};

export interface KanbanDataContainer {
    tasks: Task[];
    rows: Row[];
    columns: Column[];
}

