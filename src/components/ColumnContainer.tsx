import { useSortable } from "@dnd-kit/sortable";
import TrashIcon from "../icons/TrashIcon";
import { Column, Id } from "../types"
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

interface Props {
    column: Column;
    deleteColumn: (id: Id) => void;
    updateColumn: (id: Id, title: string) => void;
}

function ColumnContainer(props: Props) {
    const { column, deleteColumn, updateColumn } = props;

    const [editMode, setEditMode] = useState(false);

    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: column.id,
        data: {
            type: "Column",
            column
        },
        disabled: editMode
    });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform)
    };

    if (isDragging) {
        return <div ref={setNodeRef} style={style}
            className="
            bg-columnBackgroundColor
            opacity-60
            border-2
            border-rose-500
            w-[350px]
            h-[500px]
            max-h-[500px]
            rounded-md
            flex
            flex-col
            "></div>
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="
            bg-columnBackgroundColor
            w-[350px]
            h-[500px]
            max-h-[500px]
            rounded-md
            flex
            flex-col
            ">
            {/* Column title */}
            <div
                {...attributes}
                {...listeners}
                onClick={() => {
                    setEditMode(true)
                }}
                className="
                bg-mainBackgroundColor
                text-md
                h-[60px]
                cursor-grab
                rounded-md
                rounded-b-none
                p-3
                font-bold
                border-columnBackgroundColor
                border-4
                flex
                items-center
                justify-between
                ">
                <div className="flex gap-2">
                    <div
                        className="
                        flex
                        justify-center
                        items-center
                        bg-columnBackgroundColor
                        px-2
                        py-1
                        text-sm
                        rounded-full
                        ">
                        0
                    </div>
                    {!editMode && column.title}
                    {editMode &&
                        <input
                            className="bg-black focus:border-rose-500 border-rounded outline-none px-2"
                            value={column.title}
                            onChange={(e) => updateColumn(column.id, e.target.value)}
                            autoFocus
                            onBlur={() => {
                                setEditMode(false);
                            }}
                            onKeyDown={(e) => {
                                if (e.key !== "Enter") return;
                                setEditMode(false);
                            }} />
                    }
                </div>
                <button
                    onClick={() => {
                        deleteColumn(column.id);
                    }}
                    className="
                    stroke-gray-500
                    hover:stroke-white
                    hover:bg-columnBackgroundColor
                    rounded
                    px-1
                    py-2
                    "
                >
                    <TrashIcon />
                </button>
            </div>
            <div className="flex flex-grow">Content</div>
            <div>Footer</div>
        </div>
    )
}

export default ColumnContainer