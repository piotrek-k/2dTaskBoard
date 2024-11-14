import { useCallback, useState } from "react";
import { Column, Id, Row, Task } from "../types";

export enum FocusDirection {
    DOWN = "DOWN",
}

export interface FocusRequest {
    rowId?: Id;
    columnId?: Id;
}

export function useBoardFocusManager(rows: Row[], columns: Column[], tasks: Task[]) {
    const [currentyActiveRowId, setCurrentlyActiveRowId] = useState<Id | undefined>(undefined);
    const [currentyActiveColumnId, setCurrentlyActiveColumnId] = useState<Id | undefined>(undefined);

    const [focusRequest, setFocusRequest] = useState<FocusRequest>({} as FocusRequest);

    const handleRowFocusChange = useCallback((rowId?: Id) => {
        if (rowId !== currentyActiveRowId) {
            setCurrentlyActiveRowId(rowId);
        }
    }, [currentyActiveRowId]);

    function shouldHighlightRow(rowId?: Id) {
        const result = currentyActiveRowId === rowId;// && taskWithFocus === undefined;

        return result;
    }

    const moveToNextElement = useCallback(function <T extends HasId>(
        arrayToNavigateOn: T[],
        activeId: Id | undefined,
        modifierNumber: number,
        stopMethod?: (element: T) => boolean
    ): T | undefined {
        const currentRowId = activeId;

        if (currentRowId === undefined) {
            let nextRow: T | null = null;
            let index = 0;
            do {
                nextRow = arrayToNavigateOn[index];
                index++;
            } while (stopMethod && !stopMethod(nextRow));

            return nextRow;
        }

        const indexOfRow = currentRowId ? arrayToNavigateOn.findIndex((element) => element.id === currentRowId) : 0;
        const checkedLimit = modifierNumber > 0 ? indexOfRow < arrayToNavigateOn.length - 1 : indexOfRow > 0;

        let nextRow = null;

        if (indexOfRow !== -1 && checkedLimit) {
            nextRow = arrayToNavigateOn[indexOfRow + modifierNumber];
        }
        else {
            nextRow = arrayToNavigateOn[indexOfRow];
        }

        if (stopMethod && !stopMethod(nextRow)) {
            return arrayToNavigateOn[indexOfRow];
        }

        return nextRow;
    }, []);

    const checkIfColumnHasTasks = useCallback((element: Column) => {
        let result = false;

        if (currentyActiveRowId !== undefined) {
            result = tasks.some((task) => task.columnId === element.id && task.rowId === currentyActiveRowId);
        }

        console.log("Check if column has tasks: ", result, " column id: ", element.id);

        return result;
    }, [tasks, currentyActiveRowId]);

    const focusNextRow = useCallback(() => {
        // console.log("focusNextRow", currentyActiveRowId, currentyActiveColumnId);

        const nextRow = moveToNextElement(rows, currentyActiveRowId, 1);

        setCurrentlyActiveColumnId(undefined);
        setCurrentlyActiveRowId(nextRow?.id);

        setFocusRequest({
            rowId: nextRow?.id
        });  
    }, [currentyActiveRowId, rows, moveToNextElement]);

    const focusPreviousRow = useCallback(() => {
        // console.log("focusPreviousRow", currentyActiveRowId, currentyActiveColumnId);

        const nextRow = moveToNextElement(rows, currentyActiveRowId, -1);

        setCurrentlyActiveColumnId(undefined);
        setCurrentlyActiveRowId(nextRow?.id);

        setFocusRequest({
            rowId: nextRow?.id
        });
    }, [currentyActiveRowId, rows, moveToNextElement]);

    const focusNextColumn = useCallback(() => {
        // console.log("focusNextColumn", currentyActiveRowId, currentyActiveColumnId);

        const nextRow = moveToNextElement(columns, currentyActiveColumnId, 1, (element) => checkIfColumnHasTasks(element));

        console.log("Moving focus to ", nextRow?.id);
        
        setCurrentlyActiveColumnId(nextRow?.id);
        
        setFocusRequest({
            rowId: currentyActiveRowId,
            columnId: nextRow?.id
        });
    }, [currentyActiveColumnId, columns, moveToNextElement, checkIfColumnHasTasks, currentyActiveRowId]);

    const focusPreviousColumn = useCallback(() => {
        // console.log("focusPreviousColumn", currentyActiveRowId, currentyActiveColumnId);

        const nextRow = moveToNextElement(columns, currentyActiveColumnId, -1, (element) => checkIfColumnHasTasks(element));

        console.log("Moving focus to ", nextRow?.id);

        setCurrentlyActiveColumnId(nextRow?.id);
        
        setFocusRequest({
            rowId: currentyActiveRowId,
            columnId: nextRow?.id
        });
    }, [currentyActiveColumnId, columns, moveToNextElement, checkIfColumnHasTasks, currentyActiveRowId]);

    interface HasId {
        id: number | string;
    }

    return [
        handleRowFocusChange,
        shouldHighlightRow,
        currentyActiveRowId,
        focusNextRow,
        focusPreviousRow,
        focusNextColumn,
        focusPreviousColumn,
        currentyActiveColumnId,
        focusRequest
    ] as const;
}