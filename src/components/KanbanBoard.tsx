import { useMemo, useState } from 'react';
import PlusIcon from '../icons/PlusIcon';
import { Column, Id, Row, Task } from '../types';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import RowContainer from './RowContainer';
import ColumnHeaderContainer from './ColumnHeaderContainer';

function KanbanBoard() {
    const [rows, setRows] = useState<Row[]>([]);
    const rowsId = useMemo(() => rows.map((row) => row.id), [rows]);
   
    const [columns, setColumns] = useState<Column[]>([]);
    const headerNames = useMemo(() => columns.map((col) => col.title), [columns]);

    const [tasks, setTasks] = useState<Task[]>([]);

    const [activeColumn, setActiveColumn] = useState<Column | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);

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
            flex
            ">
            <DndContext
                sensors={sensors}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}>
                <div className="m-auto flex gap-2  flex-col w-[100vw]">
                    <div className='flex flex-col'>
                        <SortableContext items={rowsId}>
                            <ColumnHeaderContainer
                                headerNames={headerNames}
                            />
                            {rows.map((row) => (
                                <RowContainer
                                    row={row}
                                    columns={columns}
                                    deleteColumn={deleteColumn}
                                    updateColumn={updateColumn}
                                />
                            ))}
                        </SortableContext>
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
                </div>
            </DndContext>
        </div>
    )

    function onDragStart(event: DragStartEvent) {

    }

    function onDragEnd(event: DragEndEvent) {

    }

    function onDragOver(event: DragOverEvent) {

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