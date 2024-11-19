import { useContext, useEffect, useMemo, useState } from 'react';
import PlusIcon from '../../icons/PlusIcon';
import FolderIcon from '../../icons/FolderIcon'; // Assuming you have this icon, if not, you can use another appropriate icon
import { Column, Id, KanbanDataContainer, Row, Task, WorkUnitType } from '../../types';
import { DndContext, DragOverEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import RowContainer from './RowContainer';
import ColumnHeaderContainer from './ColumnHeaderContainer';
import { createPortal } from 'react-dom';
import TaskCard from './TaskCard';
import ArchiveIcon from '../../icons/ArchiveIcon';
import ArchiveView from '../archive/ArchiveView';
import kanbanBoardStorage from '../../services/KanbanBoardStorage';
import taskStorage from '../../services/TaskStorage';
import archiveStorage from '../../services/ArchiveStorage';
import fileSystemHandler from '../../services/FileSystemHandler';
import { useStorageHandlerStatus } from '../../hooks/useStorageHandlerStatus';
import { useBoardFocusManager } from '../../hooks/useBoardFocusManager';
import { useHotkeys } from 'react-hotkeys-hook';
import ModalContext, { ModalContextProps } from '../../context/ModalContext';
import { MetadataType, RowStoredMetadata, TaskStoredMetadata } from '../../dataTypes/CardMetadata';

function KanbanBoard() {

    const [tasks, setTasks] = useState<Task[]>([]);
    const [rows, setRows] = useState<Row[]>([]);
    const [columns, setColumns] = useState<Column[]>([]);

    const [showArchive, setShowArchive] = useState(false);

    const boardState: KanbanDataContainer = useMemo(() => ({ tasks, rows, columns } as KanbanDataContainer), [tasks, rows, columns]);
    const [dataLoaded, setDataLoaded] = useState(false);

    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const rowsId = useMemo(() => rows.map((row) => row.id), [rows]);
    const headerNames = useMemo(() => columns.map((col) => col.title), [columns]);

    const { modalOpen } = useContext(ModalContext) as ModalContextProps;

    const storageIsReady = useStorageHandlerStatus();

    const [
        handleRowFocusChange,
        currentyActiveRowId,
        focusNextRow,
        focusPreviousRow,
        focusNextColumn,
        focusPreviousColumn,
        currentyActiveColumnId,
        focusRequest,
        setFocusRequest
    ] = useBoardFocusManager(rows, columns, tasks);

    useHotkeys('w', focusPreviousRow, { enabled: !modalOpen });
    useHotkeys('s', focusNextRow, { enabled: !modalOpen });
    useHotkeys('a', focusPreviousColumn, { enabled: !modalOpen });
    useHotkeys('d', focusNextColumn, { enabled: !modalOpen });

    useEffect(() => {
        console.log("currentyActiveRowId (KB): ", currentyActiveRowId);
    }, [currentyActiveRowId]);

    useEffect(() => {
        console.log("currentyActiveColumnId (KB): ", currentyActiveColumnId);
    }, [currentyActiveColumnId]);


    // sensor below requires dnd-kit to detect drag only after 3px distance of mouse move
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3
            }
        })
    )

    useEffect(() => {
        const startFetch = async () => {
            if (storageIsReady) {
                await loadBoard();
            }
        };

        startFetch();
    }, [storageIsReady]);

    async function loadBoard() {
        const dataContainer = await kanbanBoardStorage.getKanbanState();

        if (dataContainer == undefined) {
            throw new Error("Data storage not set");
        }

        // TODO: fix! This replaces board state with old data

        // for (const taskIndex in dataContainer.tasks) {
        //     const metadata = await taskStorage.getCardMetadata(dataContainer.tasks[taskIndex].id);

        //     if (metadata) {
        //         Object.assign(dataContainer.tasks[taskIndex], metadata);
        //     }
        // }

        // for (const taskIndex in dataContainer.rows) {
        //     const metadata = await taskStorage.getCardMetadata(dataContainer.rows[taskIndex].id);

        //     if (metadata) {
        //         Object.assign(dataContainer.rows[taskIndex], metadata);
        //     }
        // }

        setTasks(dataContainer.tasks ?? []);
        setRows(dataContainer.rows ?? []);
        setColumns(dataContainer.columns ?? []);

        setDataLoaded(true);
    }

    async function loadFromDifferentSource() {
        await fileSystemHandler.chooseDifferentSource();

        await loadBoard();
    }

    async function saveBoard() {
        await kanbanBoardStorage.saveKanbanState(boardState);
    }

    async function switchArchiveView() {
        await loadBoard();

        setShowArchive(!showArchive);
    }

    useEffect(() => {
        if (dataLoaded) {
            saveBoard();
        }
    }, [boardState]);

    return (
        <div className="flex flex-col h-screen">

            <nav className="bg-gray-800 py-2 px-4">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-white text-lg font-semibold">Kanban Board</h1>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => { switchArchiveView() }}
                            className="flex items-center bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                        >
                            <ArchiveIcon />
                            Show archive
                        </button>
                        <button
                            onClick={() => createNewRow()}
                            className="flex items-center bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                        >
                            <PlusIcon />
                            Add Row
                        </button>
                        <button
                            onClick={() => loadFromDifferentSource()}
                            className="flex items-center bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                        >
                            <FolderIcon />
                            Load Different Directory
                        </button>
                    </div>
                </div>
            </nav>

            <div className="flex-grow overflow-auto scrollbar-thin">
                {!showArchive ? <DndContext
                    sensors={sensors}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onDragOver={onDragOver}>
                    <div className="m-auto flex gap-2 flex-col w-full">
                        <div className='flex flex-col'>


                            <ColumnHeaderContainer
                                headerNames={headerNames}
                            />
                            <SortableContext items={rowsId}>
                                {rows.map((row) => (
                                    row.isVisible &&
                                    <div
                                        key={row.id}
                                    >
                                        <RowContainer
                                            row={row}
                                            columns={columns}
                                            createTask={createTask}
                                            tasks={tasks.filter((task) => task.rowId === row.id)}
                                            requestSavingDataToStorage={saveBoard}
                                            rowNavigation={{
                                                moveUp: moveRowUp,
                                                moveDown: moveRowDown,
                                                moveTop: moveRowTop,
                                                moveBottom: moveRowBottom,
                                                archive: archiveRow
                                            }}
                                            handleRowFocusChange={handleRowFocusChange}
                                            focusRequest={focusRequest}
                                            setFocusRequest={setFocusRequest}
                                            modifyTask={modifyTask}
                                        />
                                    </div>
                                ))}
                            </SortableContext>
                            {createPortal(
                                <DragOverlay>
                                    {
                                        activeTask && <TaskCard
                                            task={activeTask}
                                            requestSavingDataToStorage={saveBoard}
                                            shouldBeFocused={false}
                                            removeFocusRequest={() => { }}
                                            moveTaskToNextColumn={() => { }}
                                        />
                                    }
                                </DragOverlay>,
                                document.body
                            )}
                        </div>
                    </div>
                </DndContext> :
                    <ArchiveView />
                }

            </div>

        </div >

    )

    function onDragStart(event: DragStartEvent) {
        if (event.active.data.current?.type === "Task") {
            setActiveTask(event.active.data.current.task);
            return;
        }
    }

    function onDragEnd() {
        setActiveTask(null);
    }

    function onDragOver(event: DragOverEvent) {
        const { active, over } = event;

        if (!over) return;

        if (active.id === over.id) return;

        const draggedObjectIsATask = active.data.current?.type === "Task";
        const targetIsTask = over.data.current?.type === "Task";
        const targetIsTaskContainer = over.data.current?.type === "TaskContainer";

        if (!draggedObjectIsATask) return;

        if (draggedObjectIsATask && targetIsTask) {
            setTasks(tasks => {
                const activeIndex = tasks.findIndex(t => t.id === active.id);
                const overIndex = tasks.findIndex(t => t.id === over.id);

                tasks[activeIndex].columnId = tasks[overIndex].columnId;
                tasks[activeIndex].rowId = tasks[overIndex].rowId;

                return arrayMove(tasks, activeIndex, overIndex);
            });
        }


        if (draggedObjectIsATask && targetIsTaskContainer) {
            setTasks(tasks => {
                const activeIndex = tasks.findIndex(t => t.id === active.id);

                tasks[activeIndex].columnId = over.data.current?.column.id;
                tasks[activeIndex].rowId = over.data.current?.row.id;

                return arrayMove(tasks, activeIndex, activeIndex);
            });
        }
    }

    async function createTask(columnId: Id, rowId: Id) {
        const newTask: Task = {
            id: await generateId(),
            columnId,
            rowId,
            title: `Task ${tasks.length + 1}`,
            type: WorkUnitType.Task
        };

        const newTaskMetadata: TaskStoredMetadata = {
            id: newTask.id,
            title: newTask.title,
            type: MetadataType.Task
        }

        await taskStorage.saveCardMetadata(newTaskMetadata);

        setTasks([newTask, ...tasks]);
    }

    async function modifyTask(task: Task) {
        await taskStorage.saveCardMetadata({
            id: task.id,
            title: task.title,
            type: MetadataType.Task
        });

        setTasks([task, ...tasks.filter(x=>x.id != task.id)]);
    }

    function moveRowUp(rowId: Id) {
        const rowIndex = rows.findIndex((row) => row.id === rowId);

        if (rowIndex === 0) return;

        const newRows = arrayMove(rows, rowIndex, rowIndex - 1);
        setRows(newRows);
    }

    function moveRowDown(rowId: Id) {
        const rowIndex = rows.findIndex((row) => row.id === rowId);

        if (rowIndex === rows.length - 1) return;

        const newRows = arrayMove(rows, rowIndex, rowIndex + 1);
        setRows(newRows);
    }

    function moveRowTop(rowId: Id) {
        const rowIndex = rows.findIndex((row) => row.id === rowId);

        if (rowIndex === 0) return;

        const newRows = arrayMove(rows, rowIndex, 0);
        setRows(newRows);
    }

    function moveRowBottom(rowId: Id) {
        const rowIndex = rows.findIndex((row) => row.id === rowId);

        if (rowIndex === rows.length - 1) return;

        const newRows = arrayMove(rows, rowIndex, rows.length - 1);
        setRows(newRows);
    }

    function archiveRow(rowId: Id) {
        archiveStorage.addToArchive(
            archiveStorage.createArchiveRow(
                rows.find(row => row.id === rowId) as Row,
                tasks.filter(task => task.rowId === rowId),
                columns
            )
        )

        setRows(rows => {
            return rows.filter(row => {
                if (row.id === rowId) {
                    return false;
                }
                return true;
            });
        });

        setTasks(tasks => {
            return tasks.filter(task => {
                if (task.rowId === rowId) {
                    return false;
                }
                return true;
            });
        });
    }

    async function createNewRow() {
        const rowToAdd: Row = {
            id: await generateId(),
            title: `Row ${rows.length + 1}`,
            isVisible: true,
            type: WorkUnitType.Row
        };

        const rowMetadata: RowStoredMetadata = {
            id: rowToAdd.id,
            title: rowToAdd.title,
            type: MetadataType.Row
        }

        taskStorage.saveCardMetadata(rowMetadata);

        setRows([...rows, rowToAdd]);
    }

    async function generateId(): Promise<number> {
        const archive = await archiveStorage.getArchive();
        const maxRowIdInArchive = archive?.rows.reduce((max, row) => row.row.id > max ? row.row.id : max, 0) ?? 0;
        const maxTaskIdInArchive = archive?.rows.reduce((max, row) => row.columns.reduce((max, column) => column.tasks.reduce((max, taskId) => taskId > max ? taskId : max, max), max), 0) ?? 0;
        const maxTaskIdOnBoard = tasks.reduce((max, task) => task.id > max ? task.id : max, 0);
        const maxRowIdOnBoard = rows.reduce((max, row) => row.id > max ? row.id : max, 0);

        return Math.max(maxRowIdInArchive, maxTaskIdInArchive, maxTaskIdOnBoard, maxRowIdOnBoard) + 1;
    }

}

export default KanbanBoard