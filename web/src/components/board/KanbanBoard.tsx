import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PlusIcon from '../../icons/PlusIcon';
import FolderIcon from '../../icons/FolderIcon'; // Assuming you have this icon, if not, you can use another appropriate icon
import { ColumnInStorage, Id, KanbanDataContainer, RowInStorage, TaskInStorage } from '../../types';
import { DndContext, DragOverEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import RowContainer from './RowContainer';
import ColumnHeaderContainer from './ColumnHeaderContainer';
import { createPortal } from 'react-dom';
import TaskCard from './TaskCard';
import ArchiveIcon from '../../icons/ArchiveIcon';
import ArchiveView from '../archive/ArchiveView';
import taskStorage from '../../services/CardStorage';
import archiveStorage from '../../services/ArchiveStorage';
import fileSystemHandler from '../../services/FileSystemHandler';
import { useStorageHandlerStatus } from '../../hooks/useStorageHandlerStatus';
import { useBoardFocusManager } from '../../hooks/useBoardFocusManager';
import { useHotkeys } from 'react-hotkeys-hook';
import ModalContext, { ModalContextProps } from '../../context/ModalContext';
import { MetadataType, TaskStoredMetadata } from '../../dataTypes/CardMetadata';
import MenuIcon from '../../icons/MenuIcon';
import { debounce } from 'lodash';
import { Mutex } from 'async-mutex';
import boardStorage from '../../services/BoardStorage';

const lockForCreatingNewElements = new Mutex();

function KanbanBoard() {

    const [tasks, setTasks] = useState<TaskInStorage[]>([]);
    const [rows, setRows] = useState<RowInStorage[]>([]);
    const [columns, setColumns] = useState<ColumnInStorage[]>([]);

    const [showArchive, setShowArchive] = useState(false);

    const boardState: KanbanDataContainer = useMemo(() => ({ tasks, rows, columns } as KanbanDataContainer), [tasks, rows, columns]);
    const [dataLoaded, setDataLoaded] = useState(false);

    const [activeTask, setActiveTask] = useState<TaskInStorage | null>(null);

    const rowsId = useMemo(() => rows.map((row) => row.id), [rows]);
    const headerNames = useMemo(() => columns.map((col) => col.title), [columns]);

    const { modalOpen } = useContext(ModalContext) as ModalContextProps;

    const [navMenuOpened, setNavMenuOpened] = useState(false);

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
        const dataContainer = await boardStorage.getKanbanState();

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

        setTasks([...dataContainer.tasks]);
        setRows([...dataContainer.rows]);
        setColumns(dataContainer.columns ?? []);

        setDataLoaded(true);
    }

    async function loadFromDifferentSource() {
        await fileSystemHandler.chooseDifferentSource();

        await loadBoard();
    }

    const saveBoard = useCallback(async () => {
        console.log("Saving board state");
        await boardStorage.saveKanbanState(boardState);
    }, [boardState]);

    const debouncedSaveBoard = useMemo(() => debounce(saveBoard, 500), [saveBoard]);

    useEffect(() => {
        return () => {
            debouncedSaveBoard.cancel();
        };
    }, [debouncedSaveBoard]);

    async function saveBoardAndReload() {
        await saveBoard();

        await loadBoard();
    }

    async function switchArchiveView() {
        await loadBoard();

        setShowArchive(!showArchive);
    }

    useEffect(() => {
        if (dataLoaded) {
            debouncedSaveBoard();
        }
    }, [boardState, dataLoaded, debouncedSaveBoard]);

    return (
        <div className="flex flex-col h-screen">

            <nav className="bg-gray-800 py-2 px-4">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-white text-lg font-semibold">Kanban Board</h1>
                    <div className="hidden md:flex space-x-3">
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
                    <div className="md:hidden" onClick={() => setNavMenuOpened(!navMenuOpened)}>
                        <MenuIcon />
                    </div>
                </div>
                {navMenuOpened ? <div className="flex flex-col my-5">
                    <button
                        onClick={() => { switchArchiveView() }}
                        className="flex items-center bg-gray-700 text-white px-3 py-1 text-sm"
                    >
                        <ArchiveIcon />
                        <span className="p-2">Show archive</span>
                    </button>
                    <button
                        onClick={() => createNewRow()}
                        className="flex items-center bg-gray-700 text-white px-3 py-1 text-sm"
                    >
                        <PlusIcon />

                        <span className="p-2">Add Row</span>
                    </button>
                    <button
                        onClick={() => loadFromDifferentSource()}
                        className="flex items-center bg-gray-700 text-white px-3 py-1 text-sm"
                    >
                        <FolderIcon />

                        <span className="p-2">Load Different Directory</span>
                    </button>
                </div> : <></>}
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
                                    // row.isVisible &&
                                    <div
                                        key={row.id}
                                    >
                                        <RowContainer
                                            row={row}
                                            columns={columns}
                                            createTask={createTask}
                                            removeTask={removeTask}
                                            removeRow={removeRow}
                                            tasks={tasks.filter((task) => task.rowId === row.id)}
                                            requestSavingDataToStorage={saveBoardAndReload}
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
                                            requestRemovingCard={() => { }}
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
        let newTask: TaskInStorage | null = null;

        await lockForCreatingNewElements.runExclusive(async () => {
            const newTitle = `Task ${tasks.length + 1}`;

            newTask = {
                id: await boardStorage.generateId(),
                columnId,
                rowId,
                position: getLowestPositionForTask(),
                title: newTitle
            };

            const newTaskMetadata: TaskStoredMetadata = {
                id: newTask.id,
                title: newTitle,
                type: MetadataType.Task
            }

            await taskStorage.saveCardMetadata(newTaskMetadata);
        });

        if (newTask == null) {
            throw new Error("Task creation failed");
        }

        setTasks([newTask, ...tasks]);
    }

    async function removeTask(taskId: Id) {
        setTasks(tasks.filter(task => task.id !== taskId));

        taskStorage.removeCard(taskId);
    }

    async function modifyTask(task: TaskInStorage) {
        setTasks([task, ...tasks.filter(x => x.id != task.id)]);
    }

    async function removeRow(rowId: Id) {
        const tasksToRemove = tasks.filter(task => task.rowId === rowId);
        tasksToRemove.forEach(task => removeTask(task.id));

        setRows(rows.filter(row => row.id !== rowId));

        taskStorage.removeCard(rowId);
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
                rows.find(row => row.id === rowId) as RowInStorage,
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
        await lockForCreatingNewElements.runExclusive(async () => {
            const newTitle = `Row ${rows.length + 1}`;
            const newId = await boardStorage.generateId();

            const rowToAdd: RowInStorage = {
                id: newId,
                position: getHighestPositionForRow(),
                title: newTitle
            };

            await taskStorage.createNewRowMetadata(rowToAdd.id, newTitle);

            await boardStorage.addRowToBoard(rowToAdd, []);

            await loadBoard();
        });
    }

    function getLowestPositionForTask() {
        if (tasks.length == 0) {
            return 1;
        }

        const taskWithLowestPosition = tasks.reduce((lowest, current) =>
            current.position < lowest.position ? current : lowest
        );

        return taskWithLowestPosition.position - 1;
    }

    function getHighestPositionForRow() {
        if (rows.length == 0) {
            return 1;
        }

        const rowWithHighestPosition = rows.reduce((highest, current) =>
            current.position > highest.position ? current : highest
        );

        return rowWithHighestPosition.position + 1;
    }
}

export default KanbanBoard