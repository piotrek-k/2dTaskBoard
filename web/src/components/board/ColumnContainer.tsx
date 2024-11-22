import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { ColumnInStorage, Id, RowInStorage, TaskInStorage } from "../../types"
import { useEffect, useMemo, useRef, useState } from "react";
import PlusIcon from "../../icons/PlusIcon";
import TaskCard from "./TaskCard";
import { CSS } from "@dnd-kit/utilities";
import { FocusRequest } from "../../hooks/useBoardFocusManager";
import { useHotkeys } from "react-hotkeys-hook";

interface Props {
    column: ColumnInStorage;
    row: RowInStorage;
    isFirstColumn: boolean;

    createTask: (columnId: Id, rowId: Id) => void;
    tasks: TaskInStorage[];

    requestSavingDataToStorage: () => Promise<void>;
    focusRequest: FocusRequest;
    moveTaskToNextColumn: (task: TaskInStorage, direction: number) => void;
}

function ColumnContainer(props: Props) {
    const { column, row, createTask, tasks, requestSavingDataToStorage, isFirstColumn, focusRequest, moveTaskToNextColumn } = props;

    const addTaskButtonRef = useRef<HTMLButtonElement>(null);
    const columnRef = useRef<HTMLDivElement>(null);

    const hotKeyNewTaskRef = useHotkeys('n', () => { createTask(column.id, row.id) }, { enabled: true });
    useEffect(() => {
        hotKeyNewTaskRef(columnRef.current);
    }, [hotKeyNewTaskRef]);

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

    useEffect(() => {
        setNodeRef(columnRef.current);
    }, [setNodeRef]);

    const style = {
        transition,
        transform: CSS.Transform.toString(transform)
    };

    const [taskToFocus, setTaskToFocus] = useState<TaskInStorage>();

    useEffect(() => {
        if (focusRequest.columnId === column.id && focusRequest.rowId === row.id) {
            if (tasks.length > 0) {
                setTaskToFocus(tasks[0]);
            }
            else {
                addTaskButtonRef.current?.focus();
            }
        }
    }, [tasks, column.id, row.id, focusRequest.columnId, focusRequest.rowId]);

    const removeFocusRequest = () => {
        setTaskToFocus(undefined);
    };

    return (
        <div
            ref={columnRef}
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
        >
            {/* Tasks container */}
            <div className="p-2 overflow-x-hidden overflow-y-hidden flex flex-row flex-wrap">
                <SortableContext items={tasksIds}>
                    {tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            requestSavingDataToStorage={requestSavingDataToStorage}
                            shouldBeFocused={taskToFocus?.id === task.id}
                            removeFocusRequest={removeFocusRequest}
                            moveTaskToNextColumn={moveTaskToNextColumn}
                        />
                    ))}
                </SortableContext>
            </div>

            {/* Add Task button */}
            {isFirstColumn && <button className={`flex gap-2 items-center
            border-columnBackgroundColor border-2 rounded-md p-2.5
            border-x-columnBackgroundColor
            hover:bg-mainBackgroundColor hover:text-rose-500
            active:bg-black text-gray-500`}
                ref={addTaskButtonRef}
                onClick={() => {
                    createTask(column.id, row.id)
                }}>
                <PlusIcon />
            </button>}
        </div>
    )
}

export default ColumnContainer