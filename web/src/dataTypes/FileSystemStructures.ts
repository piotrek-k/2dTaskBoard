export type FileToCreate = {
    name: string;
    content: string;
}

export type FolderToFollow = {
    name: string;
    comparisionType: ComparisionType;
}

export enum ComparisionType {
    Exact,
    Regex
}