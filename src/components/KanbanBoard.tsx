import { useMemo, useState } from 'react';
import PlusIcon from '../icons/PlusIcon';
import { Column, Id, Row, Task } from '../types';
import ColumnContainer from './ColumnContainer';
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import TaskCard from './TaskCard';
import RowContainer from './RowContainer';

function KanbanBoard() {
    const [rows, setRows] = useState<Row[]>([]);
    const rowsId = useMemo(() => rows.map((row) => row.id), [rows]);

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
                <div className="m-auto flex gap-2  flex-col">
                    <div className='flex flex-col'>
                        <SortableContext items={rowsId}>
                            {rows.map((row) => (
                                <RowContainer
                                    row={row}
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
            title: `Column ${rows.length + 1}`,
        };

        setRows([...rows, rowToAdd]);
    }
}


function generateId() {
    return Math.floor(Math.random() * 10001)
}

export default KanbanBoard