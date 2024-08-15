import { useContext, useMemo, useState } from 'react';
import PlusIcon from '../icons/PlusIcon';
import { Column, Id, Row, Task } from '../types';
import ColumnContainer from './ColumnContainer';
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import TaskCard from './TaskCard';
import RowDetails from './RowDetails';
import ModalContext, { ModalContextProps } from './modal/ModalContext';

interface Props {
    row: Row;
    columns: Column[];

    deleteColumn: (id: Id) => void;
    updateColumn: (id: Id, title: string) => void;

    rowDescriptionClicked: (id: Id) => void;

    showTaskDetails: (id: Id) => void;
}

function RowContainer(props: Props) {
    const { row, columns, deleteColumn, updateColumn, rowDescriptionClicked, showTaskDetails } = props;


    const [rows, setRows] = useState<Row[]>();
    const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

    const [tasks, setTasks] = useState<Task[]>([]);

    const [activeColumn, setActiveColumn] = useState<Column | null>(null);
    const [activeRow, setActiveRow] = useState<Row | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const { setModalOpen, setModalContent } = useContext(ModalContext) as ModalContextProps;

    const handleClickOnRowDetails = () => {
        setModalContent(<RowDetails />);
        setModalOpen(true);
    };

    // sensor below requires dnd-kit to detect drag only after 3px distance of mouse move
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 3
            }
        })
    )

    return (
        <div className="
            m-auto
            flex
            w-full 
            items-center
            overflow-x-auto
            overflow-y-hidden
            ">
            <DndContext
                sensors={sensors}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}>
                <div className='flex w-full'>
                    <div className='w-[200px] flex-none' onClick={() => {
                        // rowDescriptionClicked(row.id);
                        handleClickOnRowDetails();
                    }}
                    >
                        {row.title}
                    </div>

                    <SortableContext items={columnsId}>
                        <div className='flex grow w-full'>
                            {columns.map((col) => (
                                <ColumnContainer
                                    key={col.id}
                                    column={col}
                                    row={row}
                                    deleteColumn={deleteColumn}
                                    updateColumn={updateColumn}
                                    createTask={createTask}
                                    deleteTask={deleteTask}
                                    updateTask={updateTask}
                                    tasks={tasks.filter(task => task.columnId === col.id)}
                                    showTaskDetails={showTaskDetails}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </div>

                {createPortal(
                    <DragOverlay>
                        {activeColumn && activeRow && (
                            <ColumnContainer
                                column={activeColumn}
                                row={activeRow}
                                deleteColumn={deleteColumn}
                                updateColumn={updateColumn}
                                createTask={createTask}
                                deleteTask={deleteTask}
                                updateTask={updateTask}
                                tasks={tasks.filter(task => task.columnId === activeColumn.id)}
                                showTaskDetails={showTaskDetails}
                            />
                        )}
                        {
                            activeTask && <TaskCard
                                task={activeTask}
                                deleteTask={deleteTask}
                                updateTask={updateTask}
                                showTaskDetails={showTaskDetails}
                            />
                        }
                    </DragOverlay>,
                    document.body
                )}
            </DndContext>
        </div>
    )

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

    function onDragStart(event: DragStartEvent) {
        if (event.active.data.current?.type === "Column") {
            setActiveColumn(event.active.data.current.column);
            return;
        }

        if (event.active.data.current?.type === "Task") {
            setActiveTask(event.active.data.current.task);
            return;
        }
    }

    function onDragEnd(event: DragEndEvent) {
        setActiveColumn(null);
        setActiveTask(null);

        const { active, over } = event;
        if (!over) return;

        const activeColumnId = active.id;
        const overColumnId = over.id;

        if (activeColumnId === overColumnId) return;

        // setColumns((columns) => {
        //     const activeColumnIndex = columns.findIndex(
        //         (col) => col.id === activeColumnId
        //     );

        //     const overColumnIndex = columns.findIndex(
        //         (col) => col.id === overColumnId
        //     );

        //     return arrayMove(columns, activeColumnIndex, overColumnIndex);
        // });
    }

    function onDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeColumnId = active.id;
        const overColumnId = over.id;

        if (activeColumnId === overColumnId) return;

        const isActiveTask = active.data.current?.type === "Task";
        const isOverATask = over.data.current?.type === "Task";

        if (!isActiveTask) return;

        if (isActiveTask && isOverATask) {
            setTasks(tasks => {
                const activeIndex = tasks.findIndex(t => t.id === activeColumnId);
                const overIndex = tasks.findIndex(t => t.id === overColumnId);

                tasks[activeIndex].columnId = tasks[overIndex].columnId;

                return arrayMove(tasks, activeIndex, overIndex);
            });
        }

        const isOverAColumn = over.data.current?.type === "Column";

        if (isActiveTask && isOverAColumn) {
            setTasks(tasks => {
                const activeIndex = tasks.findIndex(t => t.id === activeColumnId);

                tasks[activeIndex].columnId = overColumnId;

                return arrayMove(tasks, activeIndex, activeIndex);
            });
        }
    }
}

function generateId() {
    return Math.floor(Math.random() * 10001)
}

export default RowContainer