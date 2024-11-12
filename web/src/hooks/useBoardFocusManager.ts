import { useCallback, useEffect, useState } from "react";
import { Id, Row } from "../types";

export enum FocusDirection {
    DOWN = "DOWN",
}

export function useBoardFocusManager(rows: Row[]) {
    const [currentyActiveRowId, setCurrentlyActiveRowId] = useState<Id | undefined>(undefined);
    const [previousRowIdWithFocus, setPreviousRowIdWithFocus] = useState<Id | undefined>(undefined);
    const [rowIdToFocusOn, setRowIdToFocusOn] = useState<Id | undefined>(undefined);

    const [taskWithFocus, setTaskWithFocus] = useState<Id | undefined>(undefined);

    const [focusIndicatorActive, setFocusIndicatorActive] = useState(true);

    const handleRowFocusChange = useCallback((rowId?: Id) => {
        if(rowId !== currentyActiveRowId && rowId !== previousRowIdWithFocus) {
            setCurrentlyActiveRowId(rowId);
        }
    }, [currentyActiveRowId, previousRowIdWithFocus]);

    const handleTaskFocusChange = useCallback((taskId?: Id) => {
        setTaskWithFocus(taskId);
    }, []);

    useEffect(() => {
        console.log("Row with focus: ", currentyActiveRowId, " Task with focus: ", taskWithFocus);
    }, [currentyActiveRowId, taskWithFocus]);

    function shouldHighlightRow(rowId?: Id) {
        const result = focusIndicatorActive && currentyActiveRowId === rowId && taskWithFocus === undefined;

        return result;
    }

    function shouldHighlightTask(taskId?: Id) {
        const result = focusIndicatorActive && taskWithFocus === taskId;

        return result;
    }

    const focusNextRow = useCallback(() => {

        const currentRowId = currentyActiveRowId ? currentyActiveRowId : previousRowIdWithFocus;
        const indexOfRow = currentRowId ? rows.findIndex((element) => element.id === currentRowId) : 0;
        const nextRow = indexOfRow !== -1 && indexOfRow < rows.length - 1 ? rows[indexOfRow + 1] : rows[indexOfRow];

        console.log('nextRow', nextRow);

        setCurrentlyActiveRowId(nextRow?.id);
        setPreviousRowIdWithFocus(nextRow?.id);
        setRowIdToFocusOn(nextRow?.id);
    }, [currentyActiveRowId, rows, previousRowIdWithFocus]);

    const focusPreviousRow = useCallback(() => {

        const currentRowId = currentyActiveRowId ? currentyActiveRowId : previousRowIdWithFocus;
        const indexOfRow = currentRowId ? rows.findIndex((element) => element.id === currentRowId) : 0;
        const nextRow = indexOfRow !== -1 && indexOfRow > 0 ? rows[indexOfRow - 1] : rows[indexOfRow];

        console.log('nextRow', nextRow);
        
        setCurrentlyActiveRowId(nextRow?.id);
        setPreviousRowIdWithFocus(nextRow?.id);
        setRowIdToFocusOn(nextRow?.id);
    }, [currentyActiveRowId, rows, previousRowIdWithFocus]);


    return [handleRowFocusChange, handleTaskFocusChange, shouldHighlightRow, shouldHighlightTask, currentyActiveRowId, focusNextRow, focusPreviousRow, rowIdToFocusOn] as const;
}