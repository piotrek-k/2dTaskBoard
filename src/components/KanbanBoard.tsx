import { useContext, useEffect, useMemo, useState } from 'react';
import PlusIcon from '../icons/PlusIcon';
import { Column, Id, KanbanDataContainer, Row, Task } from '../types';
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import RowContainer from './RowContainer';
import ColumnHeaderContainer from './ColumnHeaderContainer';
import { createPortal } from 'react-dom';
import TaskCard from './TaskCard';
import Modal from 'react-modal';
import DataStorageContext from './filesystem/DataStorageContext';
import WelcomeScreen from './WelcomeScreen';



function KanbanBoard() {

    const [tasks, setTasks] = useState<Task[]>([]);
    const [rows, setRows] = useState<Row[]>([]);
    const [columns, setColumns] = useState<Column[]>([]);
    const boardState: KanbanDataContainer = useMemo(() => ({ tasks, rows, columns } as KanbanDataContainer), [tasks, rows, columns]);
    const [dataLoaded, setDataLoaded] = useState(false);

    const [storageActive, setStorageActive] = useState<boolean>(false);

    const dataStorage = useContext(DataStorageContext);

    useEffect(() => {
        dataStorage.registerOnChangeCallback((newState) => {
            setStorageActive(() => newState);
        });

        return () => {
            dataStorage.registerOnChangeCallback(() => { });
        };
    }, []);

    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const rowsId = useMemo(() => rows.map((row) => row.id), [rows]);
    const headerNames = useMemo(() => columns.map((col) => col.title), [columns]);

    // sensor below requires dnd-kit to detect drag only after 3px distance of mouse move
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3
            }
        })
    )

    async function loadBoard() {
        const dataContainer = await dataStorage?.getKanbanState();

        if (dataContainer == undefined) {
            throw new Error("Data storage not set");
        }

        setTasks(dataContainer.tasks ?? []);
        setRows(dataContainer.rows ?? []);
        setColumns(dataContainer.columns ?? []);

        setDataLoaded(true);
    }

    async function loadFromDifferentSource() {
        await dataStorage.chooseDifferentSource();

        await loadBoard();
    }

    async function saveBoard() {
        if (dataStorage == undefined) {
            throw new Error("Data storage not set");
        }

        await dataStorage.saveKanbanState(boardState);
    }

    useEffect(() => {
        if (dataLoaded) {
            saveBoard();
        }
    }, [tasks, rows, columns]);

    return (

        <div className="
            flex flex-col max-w-full
            ">
            <DndContext
                sensors={sensors}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}>
                <div className="m-auto flex gap-2  flex-col w-full">
                    <div className='flex flex-col'>
                        <ColumnHeaderContainer
                            headerNames={headerNames}
                        />
                        <SortableContext items={rowsId}>
                            {rows.map((row) => (
                                row.isVisible &&
                                <RowContainer
                                    key={row.id}
                                    row={row}
                                    columns={columns}
                                    createTask={createTask}
                                    getTasks={getTasks}
                                    requestSavingDataToStorage={saveBoard}
                                    rowNavigation={{
                                        moveUp: moveRowUp,
                                        moveDown: moveRowDown,
                                        moveTop: moveRowTop,
                                        moveBottom: moveRowBottom,
                                        archive: archiveRow
                                    }}
                                />
                            ))}
                        </SortableContext>

                        {createPortal(
                            <DragOverlay>
                                {
                                    activeTask && <TaskCard
                                        task={activeTask}
                                        requestSavingDataToStorage={saveBoard}
                                    />
                                }
                            </DragOverlay>,
                            document.body
                        )}
                    </div>
                    <button
                        onClick={() => {
                            createNewRow();
                        }}
                        className="
                            flex
                            "
                    >
                        <PlusIcon />
                        Add Row
                    </button>
                    {/* <button
                        onClick={() => {
                            createNewColumn();
                        }}
                        className="
                            flex
                            "
                    >
                        <PlusIcon />
                        Add Columns
                    </button> */}
                    {/* <button
                        onClick={() => {
                            loadBoard();
                        }}
                        className="
                            flex
                            "
                    >
                        <PlusIcon />
                        Load data
                    </button> */}
                    <button
                        onClick={() => {
                            loadFromDifferentSource();
                        }}
                        className="
                            flex
                            "
                    >
                        <PlusIcon />
                        Load different directory
                    </button>
                    {/* <button
                        onClick={() => {
                            saveBoard();
                        }}
                        className="
                            flex
                            "
                    >
                        <PlusIcon />
                        Save data
                    </button> */}

                    {!storageActive && <Modal
                        isOpen={true}
                        style={{
                            content: {
                                top: '50%',
                                left: '50%',
                                right: 'auto',
                                bottom: 'auto',
                                marginRight: '-50%',
                                transform: 'translate(-50%, -50%)',
                            }
                        }}
                    >
                        <p>
                            Your browser lost access to directory storing your tasks.
                        </p>

                        <WelcomeScreen />

                        <button
                            onClick={() => {
                                loadBoard();
                            }}
                            className="
                                flex
                                "
                        >
                            <PlusIcon />
                            Click to regain access
                        </button>
                    </Modal>
                    }
                </div>
            </DndContext>
            <footer className='bg-mainBackgroundColor text-slate-600 text-sm'>
                &copy; 2024 - {new Date().getFullYear()} Piotr Kozerski. All rights reserved.
            </footer>
        </div>
    )

    function onDragStart(event: DragStartEvent) {
        if (event.active.data.current?.type === "Task") {
            setActiveTask(event.active.data.current.task);
            return;
        }
    }

    function onDragEnd(_event: DragEndEvent) {
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

    function getTasks(columnId: Id, rowId: Id) {
        return tasks.filter((task) => task.columnId === columnId && task.rowId === rowId);
    }

    function createTask(columnId: Id, rowId: Id) {
        const newTask: Task = {
            id: generateId(),
            columnId,
            rowId,
            title: `Task ${tasks.length + 1}`
        };

        setTasks([...tasks, newTask]);
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
        setRows(rows => {
            return rows.map(row => {
                if (row.id === rowId) {
                    return { ...row, isVisible: false };
                }
                return row;
            });
        });
    }

    // function deleteTask(id: Id) {
    //     const filteredTasks = tasks.filter((task) => task.id !== id);
    //     setTasks(filteredTasks);
    // }

    // function updateTask(id: Id, content: string) {
    //     const newTasks = tasks.map((task) => {
    //         if (task.id !== id) return task;
    //         return { ...task, content };
    //     });

    //     setTasks(newTasks);
    // }

    function createNewRow() {
        const rowToAdd: Row = {
            id: generateId(),
            title: `Row ${rows.length + 1}`,
            isVisible: true
        };

        setRows([...rows, rowToAdd]);
    }

    function createNewColumn() {
        const columnToAdd: Column = {
            id: generateId(),
            title: `Column ${columns.length + 1}`,
        };

        setColumns([...columns, columnToAdd]);
    }

    // function deleteColumn(id: Id) {
    //     const filteredColumns = columns.filter((col) => col.id !== id);
    //     setColumns(filteredColumns);

    //     const newTasks = tasks.filter(t => t.columnId !== id);
    //     setTasks(newTasks);
    // }

    // function updateColumn(id: Id, title: string) {
    //     const newColumns = columns.map(col => {
    //         if (col.id !== id) return col;
    //         return { ...col, title };
    //     });

    //     setColumns(newColumns);
    // }
}


function generateId() {
    return Math.floor(Math.random() * 10001)
}

export default KanbanBoard