import { Id } from "../types";

export interface RowNavigation {
    moveUp: (rowId: Id) => void;
    moveDown: (rowId: Id) => void;
    moveTop: (rowId: Id) => void;
    moveBottom: (rowId: Id) => void;
    archive: (rowId: Id) => void;
}