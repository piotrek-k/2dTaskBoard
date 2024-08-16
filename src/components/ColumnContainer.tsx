import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { Column, Id, Row, Task } from "../types"
import { useMemo } from "react";
import PlusIcon from "../icons/PlusIcon";
import TaskCard from "./TaskCard";
import { CSS } from "@dnd-kit/utilities";

interface Props {
    column: Column;
    row: Row;

    createTask: (columnId: Id, rowId: Id) => void;
    tasks: Task[];
}

function ColumnContainer(props: Props) {
    const { column, row, createTask, tasks } = props;

    const tasksIds = useMemo(() => {
        return tasks.map(task => task.id);
    }, [tasks]);

    const { setNodeRef, transform, transition } = useSortable({
        id: column.id,
        data: {
            type: "Column",
            column
        }
    });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform)
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="
            bg-columnBackgroundColor
            min-h-[200px]
            flex
            flex-col
            grow
            ">

            {/* Tasks container */}
            <div className="flex flex-grow flex-col p-2 overflow-x-hidden overflow-y-auto">
                <SortableContext items={tasksIds}>
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </SortableContext>
            </div>

            {/* Add Task button */}
            <button className="flex gap-2 items-center
            border-columnBackgroundColor border-2 rounded-md p-4
            border-x-columnBackgroundColor
            hover:bg-mainBackgroundColor hover:text-rose-500
            active:bg-black"
                onClick={() => {
                    createTask(column.id, row.id)
                }}>
                <PlusIcon />
                Add Task
            </button>
        </div>
    )
}

export default ColumnContainer