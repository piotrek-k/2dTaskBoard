import { Id } from "../types";

export type CardStoredMetadata = {
    id: Id;
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
    columnId: Id | undefined;
    rowId: Id | undefined;
}

export type RowStoredMetadata = CardStoredMetadata;

export type RowMetadataViewModel = RowStoredMetadata;