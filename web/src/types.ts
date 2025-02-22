export type Id = number;

export interface ISynchronizable {
    syncId: string;
}

export type RowInStorage = ISynchronizable & {
    id: Id;
    position: number;
    syncId: string;
    title: string;
};

export type RowViewModel = {
    id: Id;
    title: string;
}

export type ColumnInStorage = {
    id: Id;
    title: string;
}

export type TaskInStorage = ISynchronizable & {
    id: Id;
    columnId: Id;
    rowId: Id;
    position: number;
    syncId: string;
    title: string;
};

export type TaskViewModel = {
    id: Id;
    title: string;
};

export interface KanbanDataContainer {
    tasks: TaskInStorage[];
    rows: RowInStorage[];
    columns: ColumnInStorage[];
}

