import { useEffect, useMemo, useState } from 'react';
import PlusIcon from '../icons/PlusIcon';
import { Column, Id, Row, Task } from '../types';
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import RowContainer from './RowContainer';
import ColumnHeaderContainer from './ColumnHeaderContainer';
import { createPortal } from 'react-dom';
import TaskCard from './TaskCard';
import { openDB } from 'idb';

function KanbanBoard() {

    const [tasks, setTasks] = useState<Task[]>([]);
    const [rows, setRows] = useState<Row[]>([]);
    const [columns, setColumns] = useState<Column[]>([]);

    const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);

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

    async function restoreHandle(): Promise<FileSystemDirectoryHandle> {
        const db = await openDB('file-handles-db', 1, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('handles')) {
                    db.createObjectStore('handles');
                }
            },
        });

        let handle = await db.get('handles', 'directoryHandle');

        if (handle) {
            console.log("Handle exists:", handle);

            let opts = { mode: 'readwrite' };

            if ((await handle.queryPermission(opts)) === "granted") {
                setDirectoryHandle(handle);
                return handle;
            }

            if ((await handle.requestPermission(opts)) === "granted") {
                setDirectoryHandle(handle);
                return handle;
            }
        } else {
            handle = await (window as any).showDirectoryPicker() as FileSystemDirectoryHandle;
            await db.put('handles', handle, 'directoryHandle');
        }

        return handle;
    }

    useEffect(() => {
    });

    return (
        <div className="
            flex
            ">
            <DndContext
                sensors={sensors}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}>
                <div className="m-auto flex gap-2  flex-col w-[100vw]">
                    <div className='flex flex-col'>
                        <ColumnHeaderContainer
                            headerNames={headerNames}
                        />
                        <SortableContext items={rowsId}>
                            {rows.map((row) => (
                                <RowContainer
                                    key={row.id}
                                    row={row}
                                    columns={columns}
                                    createTask={createTask}
                                    getTasks={getTasks}
                                />
                            ))}
                        </SortableContext>

                        {createPortal(
                            <DragOverlay>
                                {
                                    activeTask && <TaskCard
                                        task={activeTask}
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
                    <button
                        onClick={() => {
                            createNewColumn();
                        }}
                        className="
                            flex
                            "
                    >
                        <PlusIcon />
                        Add Columns
                    </button>
                    <button
                        onClick={() => {
                            restoreHandle();
                        }}
                        className="
                            flex
                            "
                    >
                        <PlusIcon />
                        Load data
                    </button>
                    {directoryHandle == null && <span>Directory handle not set up</span>}
                </div>
            </DndContext>
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
            content: `Task ${tasks.length + 1}`
        };

        setTasks([...tasks, newTask]);
    }

    function deleteTask(id: Id) {
        const filteredTasks = tasks.filter((task) => task.id !== id);
        setTasks(filteredTasks);
    }

    function updateTask(id: Id, content: string) {
        const newTasks = tasks.map((task) => {
            if (task.id !== id) return task;
            return { ...task, content };
        });

        setTasks(newTasks);
    }

    function createNewRow() {
        const rowToAdd: Row = {
            id: generateId(),
            title: `Row ${rows.length + 1}`,
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

    function deleteColumn(id: Id) {
        const filteredColumns = columns.filter((col) => col.id !== id);
        setColumns(filteredColumns);

        const newTasks = tasks.filter(t => t.columnId !== id);
        setTasks(newTasks);
    }

    function updateColumn(id: Id, title: string) {
        const newColumns = columns.map(col => {
            if (col.id !== id) return col;
            return { ...col, title };
        });

        setColumns(newColumns);
    }
}


function generateId() {
    return Math.floor(Math.random() * 10001)
}

export default KanbanBoard