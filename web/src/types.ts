export type Id = string;

export interface ISynchronizable {
    id: Id;
}

export type RowInStorage = ISynchronizable & {
    id: Id;
    position: number;
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

