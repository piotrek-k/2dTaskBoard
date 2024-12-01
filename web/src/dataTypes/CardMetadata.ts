export type CardStoredMetadata = {
    id: number;
    title: string;
    type: MetadataType;
    syncId: string;
}

export enum MetadataType {
    Unknown = 0,
    Task = 1,
    Row = 2,
}

export type TaskStoredMetadata = CardStoredMetadata;

export type TaskMetadataViewModel = TaskStoredMetadata & {
    columnId: number | undefined;
    rowId: number | undefined;
}

export type RowStoredMetadata = CardStoredMetadata;

export type RowMetadataViewModel = RowStoredMetadata;