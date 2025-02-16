export type Id = number;

export type RowInStorage = {
    id: Id;
    position: number;
};

export type RowViewModel = {
    id: Id;
    title: string;
}

export type ColumnInStorage = {
    id: Id;
    title: string;
}

export type TaskInStorage = {
    id: Id;
    columnId: Id;
    rowId: Id;
    position: number;
    syncId: string;
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

