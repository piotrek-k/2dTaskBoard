import { Id } from "../types";

export interface ArchiveStored {
    rows: ArchivedStoredRow[];
}

export interface ArchivedStoredRow {
    id: Id;
    columns: ArchivedStoredColumn[];
}

export interface ArchivedStoredColumn {
    id: Id;
    tasks: Id[];
}

export interface ArchiveViewModel {
    archiveStored: ArchiveStored;
}

export interface ArchivedRowViewModel {
    id: Id;
    title: string;
}

export interface ArchivedTaskViewModel {
    id: Id;
    title: string;
}