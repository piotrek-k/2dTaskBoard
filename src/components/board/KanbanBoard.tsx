import { useContext, useEffect, useMemo, useState } from 'react';
import PlusIcon from '../../icons/PlusIcon';
import FolderIcon from '../../icons/FolderIcon'; // Assuming you have this icon, if not, you can use another appropriate icon
import { Column, Id, KanbanDataContainer, Row, Task } from '../../types';
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import RowContainer from './RowContainer';
import ColumnHeaderContainer from './ColumnHeaderContainer';
import { createPortal } from 'react-dom';
import TaskCard from './TaskCard';
import DataStorageContext from '../../context/DataStorageContext';

function KanbanBoard() {

    const [tasks, setTasks] = useState<Task[]>([]);
    const [rows, setRows] = useState<Row[]>([]);
    const [columns, setColumns] = useState<Column[]>([]);

    const boardState: KanbanDataContainer = useMemo(() => ({ tasks, rows, columns } as KanbanDataContainer), [tasks, rows, columns]);
    const [dataLoaded, setDataLoaded] = useState(false);

    const dataStorage = useContext(DataStorageContext);

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

    useEffect(() => {
        const startFetch = async () => {
            if (dataStorage?.storageReady) {
                await loadBoard();
            }
        };

        startFetch();
    }, [dataStorage?.storageReady]);

    async function loadBoard() {
        const dataContainer = await dataStorage?.fileSystemStorage.getKanbanState();

        if (dataContainer == undefined) {
            throw new Error("Data storage not set");
        }

        setTasks(dataContainer.tasks ?? []);
        setRows(dataContainer.rows ?? []);
        setColumns(dataContainer.columns ?? []);

        setDataLoaded(true);
    }

    async function loadFromDifferentSource() {
        await dataStorage?.fileSystemStorage.chooseDifferentSource();

        await loadBoard();
    }

    async function saveBoard() {
        if (dataStorage == undefined) {
            throw new Error("Data storage not set");
        }

        await dataStorage.fileSystemStorage.saveKanbanState(boardState);
    }

    useEffect(() => {
        if (dataLoaded) {
            saveBoard();
        }
    }, [tasks, rows, columns]);

    return (
        <div className="flex flex-col h-screen">
            <nav className="bg-gray-800 py-2 px-4">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-white text-lg font-semibold">Kanban Board</h1>
                    <div className="flex space-x-3">
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
                <DndContext
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
                    </div>
                </DndContext>

            </div>
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

    function createNewRow() {
        const rowToAdd: Row = {
            id: generateId(),
            title: `Row ${rows.length + 1}`,
            isVisible: true
        };

        setRows([...rows, rowToAdd]);
    }
}


function generateId() {
    return Math.floor(Math.random() * 10001)
}

export default KanbanBoard