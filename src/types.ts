export type Id = string | number;

export type Row = {
    id: Id;
    title: string;
}

export type Column = {
    id: Id;
    title: string;
}

export type Task = {
    id: Id;
    columnId: Id;
    rowId: Id;
    content: string;
}