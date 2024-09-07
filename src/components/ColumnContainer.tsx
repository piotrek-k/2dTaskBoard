import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { Column, Id, Row, Task } from "../types"
import { useMemo, useState } from "react";
import PlusIcon from "../icons/PlusIcon";
import TaskCard from "./TaskCard";
import { CSS } from "@dnd-kit/utilities";

interface Props {
    column: Column;
    row: Row;
    isFirstColumn: boolean;

    createTask: (columnId: Id, rowId: Id) => void;
    tasks: Task[];

    requestSavingDataToStorage: () => Promise<void>;
}

function ColumnContainer(props: Props) {
    const { column, row, createTask, tasks, requestSavingDataToStorage, isFirstColumn } = props;
    const [showButton, setShowButton] = useState<boolean>(false);

    const tasksIds = useMemo(() => {
        return tasks.map(task => task.id);
    }, [tasks]);

    const { setNodeRef, transform, transition } = useSortable({
        id: column.id + "-" + row.id,
        data: {
            type: "TaskContainer",
            column: column,
            row: row
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
            basis-0
            min-w-0
            "
            onMouseEnter={() => setShowButton(true)}
            onMouseLeave={() => setShowButton(false)}
            >

            {/* Tasks container */}
            <div className="p-2 overflow-x-hidden overflow-y-hidden flex flex-row flex-wrap">
                <SortableContext items={tasksIds}>
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} requestSavingDataToStorage={requestSavingDataToStorage} />
                    ))}
                </SortableContext>
            </div>

            {/* Add Task button */}
            {isFirstColumn && <button className={`flex gap-2 items-center
            border-columnBackgroundColor border-2 rounded-md p-2.5
            border-x-columnBackgroundColor
            hover:bg-mainBackgroundColor hover:text-rose-500
            active:bg-black text-gray-500`}
                onClick={() => {
                    createTask(column.id, row.id)
                }}>
                <PlusIcon />
            </button>}
        </div>
    )
}

export default ColumnContainer