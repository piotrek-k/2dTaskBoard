import { useCallback, useState } from "react";
import { ColumnInStorage, Id, RowInStorage, TaskInStorage } from "../types";

export interface FocusRequest {
    rowId?: Id;
    columnId?: Id;
    focusAddTaskButton?: boolean;
}

export function useBoardFocusManager(rows: RowInStorage[], columns: ColumnInStorage[], tasks: TaskInStorage[]) {
    const [currentyActiveRowId, setCurrentlyActiveRowId] = useState<Id | undefined>(undefined);
    const [currentyActiveColumnId, setCurrentlyActiveColumnId] = useState<Id | undefined>(undefined);

    const [focusRequest, setFocusRequest] = useState<FocusRequest>({} as FocusRequest);
    const [currentlyFocusedOnAddButton, setCurrentlyFocusedOnAddButton] = useState<boolean>(false);

    const handleRowFocusChange = useCallback((rowId?: Id) => {
        if (rowId !== currentyActiveRowId) {
            setCurrentlyActiveRowId(rowId);
        }
    }, [currentyActiveRowId]);

    const moveToNextElement = useCallback(function <T extends HasId>(
        arrayToNavigateOn: T[],
        currentlyActiveElementId: Id | undefined,
        modifierNumber: number,
        shouldStopHere?: (element: T) => boolean
    ): T | undefined {

        const arrayIndexAtStart = currentlyActiveElementId ?
            arrayToNavigateOn.findIndex((element) => element.id === currentlyActiveElementId) :
            -1;

        let resultCandidate: T = arrayToNavigateOn[arrayIndexAtStart];
        let indexOfElementInArray = arrayIndexAtStart;

        do {
            indexOfElementInArray += modifierNumber;

            const isIndexInRange = indexOfElementInArray >= 0 && indexOfElementInArray <= arrayToNavigateOn.length;

            if (isIndexInRange) {
                resultCandidate = arrayToNavigateOn[indexOfElementInArray];
            }
            else {
                break;
            }

        } while (shouldStopHere && !shouldStopHere(resultCandidate));

        if (resultCandidate == undefined || (shouldStopHere && !shouldStopHere(resultCandidate))) {
            return arrayToNavigateOn[arrayIndexAtStart];
        }

        return resultCandidate;
    }, []);

    const getColumnById = useCallback((columnId: Id) => {
        return columns.find((column) => column.id === columnId);
    }, [columns]);

    const columnHasAnyTasks = useCallback((element: ColumnInStorage) => {
        if (element === undefined) {
            return false;
        }

        let result = false;

        if (currentyActiveRowId !== undefined) {
            result = tasks.some((task) => element !== undefined && task.columnId === element.id && task.rowId === currentyActiveRowId);
        }

        return result;
    }, [tasks, currentyActiveRowId]);

    const columnHasAddButton = useCallback((element: ColumnInStorage) => {
        if (element === undefined) {
            return false;
        }

        const columnWithAddTaskButton = columns[0];

        return element.id === columnWithAddTaskButton.id;
    }, [columns]);


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
        const currentColumn = currentyActiveColumnId ? getColumnById(currentyActiveColumnId) : undefined;
        const currentColumnHasTasks = currentColumn ? columnHasAnyTasks(currentColumn) : false;
        const currentColumnHasAddButton = currentColumn ? columnHasAddButton(currentColumn) : false;

        if (!currentlyFocusedOnAddButton && currentColumnHasAddButton && currentColumnHasTasks) {

            setFocusRequest({
                rowId: currentyActiveRowId,
                columnId: currentyActiveColumnId,
                focusAddTaskButton: true
            });

            setCurrentlyFocusedOnAddButton(true);

            return;
        }

        setCurrentlyFocusedOnAddButton(false);

        const nextColumn = moveToNextElement(
            columns,
            currentyActiveColumnId,
            1,
            (element) =>
                columnHasAnyTasks(element)
                || columnHasAddButton(element)
        );

        setCurrentlyActiveColumnId(nextColumn?.id);

        setFocusRequest({
            rowId: currentyActiveRowId,
            columnId: nextColumn?.id,
            focusAddTaskButton: false
        });
    }, [currentyActiveColumnId, columns, moveToNextElement, columnHasAnyTasks, currentyActiveRowId, columnHasAddButton, currentlyFocusedOnAddButton, setCurrentlyFocusedOnAddButton, getColumnById]);

    const focusPreviousColumn = useCallback(() => {

        const currentColumn = currentyActiveColumnId ? getColumnById(currentyActiveColumnId) : undefined;
        const currentColumnHasTasks = currentColumn ? columnHasAnyTasks(currentColumn) : false;

        if (currentlyFocusedOnAddButton && currentColumnHasTasks) {

            setFocusRequest({
                rowId: currentyActiveRowId,
                columnId: currentyActiveColumnId,
                focusAddTaskButton: false
            });
            
            setCurrentlyFocusedOnAddButton(false);

            return;
        }

        setCurrentlyFocusedOnAddButton(false);

        const nextColumn = moveToNextElement(
            columns,
            currentyActiveColumnId,
            -1,
            (element) =>
                columnHasAnyTasks(element)
                || columnHasAddButton(element)
        );

        const noNextColumn = currentyActiveColumnId === nextColumn?.id;

        if (noNextColumn) {

            setFocusRequest({
                rowId: currentyActiveRowId
            });

            setCurrentlyActiveColumnId(undefined);

            return;
        }

        if (nextColumn !== undefined && !noNextColumn && columnHasAddButton(nextColumn)) {

            setCurrentlyActiveColumnId(nextColumn?.id);
            setFocusRequest({
                rowId: currentyActiveRowId,
                columnId: nextColumn.id,
                focusAddTaskButton: true
            });

            setCurrentlyFocusedOnAddButton(true);

            return;
        }

        setCurrentlyActiveColumnId(nextColumn?.id);
        setCurrentlyFocusedOnAddButton(false);

        setFocusRequest({
            rowId: currentyActiveRowId,
            columnId: nextColumn?.id,
            focusAddTaskButton: false
        });
    }, [currentyActiveColumnId, columns, moveToNextElement, columnHasAnyTasks, currentyActiveRowId, columnHasAddButton, getColumnById, currentlyFocusedOnAddButton]);

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