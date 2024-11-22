import { useCallback, useState } from "react";
import { ColumnInStorage, Id, RowInStorage, TaskInStorage } from "../types";

export enum FocusDirection {
    DOWN = "DOWN",
}

export interface FocusRequest {
    rowId?: Id;
    columnId?: Id;
}

export function useBoardFocusManager(rows: RowInStorage[], columns: ColumnInStorage[], tasks: TaskInStorage[]) {
    const [currentyActiveRowId, setCurrentlyActiveRowId] = useState<Id | undefined>(undefined);
    const [currentyActiveColumnId, setCurrentlyActiveColumnId] = useState<Id | undefined>(undefined);

    const [focusRequest, setFocusRequest] = useState<FocusRequest>({} as FocusRequest);

    const handleRowFocusChange = useCallback((rowId?: Id) => {
        if (rowId !== currentyActiveRowId) {
            setCurrentlyActiveRowId(rowId);
        }
    }, [currentyActiveRowId]);

    const moveToNextElement = useCallback(function <T extends HasId>(
        arrayToNavigateOn: T[],
        activeId: Id | undefined,
        modifierNumber: number,
        stopMethod?: (element: T) => boolean
    ): T | undefined {
        const currentRowId = activeId;

        let indexOfRow = currentRowId ? arrayToNavigateOn.findIndex((element) => element.id === currentRowId) : -1;
        let nextRow: T = arrayToNavigateOn[indexOfRow];
        const initialIndexOfRow = indexOfRow;
        let canMoveOn = false;

        do {
            canMoveOn = modifierNumber > 0 ? indexOfRow < arrayToNavigateOn.length - 1 : indexOfRow > 0;

            if (canMoveOn) {
                nextRow = arrayToNavigateOn[indexOfRow + modifierNumber];
            }
            else {
                break;
            }

            indexOfRow += modifierNumber;
        } while (stopMethod && !stopMethod(nextRow));

        if (nextRow == undefined || (stopMethod && !stopMethod(nextRow))) {
            return arrayToNavigateOn[initialIndexOfRow];
        }

        return nextRow;
    }, []);

    const checkIfColumnHasTasks = useCallback((element: ColumnInStorage) => {
        let result = false;

        if (currentyActiveRowId !== undefined) {
            result = tasks.some((task) => task.columnId === element.id && task.rowId === currentyActiveRowId);
        }

        console.log("Check if column has tasks: ", result, " column id: ", element.id);

        return result;
    }, [tasks, currentyActiveRowId]);

    const focusNextRow = useCallback(() => {
        const nextRow = moveToNextElement(rows, currentyActiveRowId, 1);

        setCurrentlyActiveColumnId(undefined);
        setCurrentlyActiveRowId(nextRow?.id);

        setFocusRequest({
            rowId: nextRow?.id
        });
    }, [currentyActiveRowId, rows, moveToNextElement]);

    const focusPreviousRow = useCallback(() => {
        const nextRow = moveToNextElement(rows, currentyActiveRowId, -1);

        setCurrentlyActiveColumnId(undefined);
        setCurrentlyActiveRowId(nextRow?.id);

        setFocusRequest({
            rowId: nextRow?.id
        });
    }, [currentyActiveRowId, rows, moveToNextElement]);

    const focusNextColumn = useCallback(() => {
        const columnWithAddTaskButton = columns[0];
        const nextRow = moveToNextElement(columns, currentyActiveColumnId, 1, (element) => checkIfColumnHasTasks(element) || element.id === columnWithAddTaskButton.id);

        console.log("Moving focus to ", nextRow?.id);

        setCurrentlyActiveColumnId(nextRow?.id);

        setFocusRequest({
            rowId: currentyActiveRowId,
            columnId: nextRow?.id
        });
    }, [currentyActiveColumnId, columns, moveToNextElement, checkIfColumnHasTasks, currentyActiveRowId]);

    const focusPreviousColumn = useCallback(() => {
        const columnWithAddTaskButton = columns[0];
        const nextRow = moveToNextElement(columns, currentyActiveColumnId, -1, (element) => checkIfColumnHasTasks(element) || element.id === columnWithAddTaskButton.id);

        console.log("Moving focus to ", nextRow?.id);

        if (nextRow?.id === currentyActiveColumnId) {
            setFocusRequest({
                rowId: currentyActiveRowId
            });

            setCurrentlyActiveColumnId(undefined);

            return;
        }

        setCurrentlyActiveColumnId(nextRow?.id);

        setFocusRequest({
            rowId: currentyActiveRowId,
            columnId: nextRow?.id
        });
    }, [currentyActiveColumnId, columns, moveToNextElement, checkIfColumnHasTasks, currentyActiveRowId]);

    interface HasId {
        id: Id;
    }

    return [
        handleRowFocusChange,
        currentyActiveRowId,
        focusNextRow,
        focusPreviousRow,
        focusNextColumn,
        focusPreviousColumn,
        currentyActiveColumnId,
        focusRequest,
        setFocusRequest
    ] as const;
}