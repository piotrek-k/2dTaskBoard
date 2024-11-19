export type CardStoredMetadata = {
    id: number;
    title: string;
    type: MetadataType;
}

export enum MetadataType {
    Unknown = 0,
    Task = 1,
    Row = 2,
}

export type TaskStoredMetadata = CardStoredMetadata;

export type TaskMetadataViewModel = TaskStoredMetadata & {
    columnId: number;
    rowId: number;
}

export type RowStoredMetadata = CardStoredMetadata;

export type RowMetadataViewModel = RowStoredMetadata;