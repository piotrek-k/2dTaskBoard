import React, { useState } from 'react'
import PlusIcon from '../icons/PlusIcon'

function KanbanBoard() {
    const [columns, setColumns] = useState([]);

    return (
        <div className="
            m-auto
            flex
            min-h-screen
            w-full 
            items-center
            overflow-x-auto
            overflow-y-hidden
            px-[40px]
            ">
            <div className="m-auto">
                <button
                    onClick={() => {
                        createNewColumn();
                    }}
                    className="
                h-[60px]
                w-[350px]
                min-w-[350px]
                cursor-pointer
                rounded-lg
                bg-mainBackgroundColor
                border-2
                border-columnBackgroundColor
                p-4
                ring-rose-500
                hover:ring-2
                flex
                gap-2
                "
                >
                    <PlusIcon/>
                    Add Columns
                </button>
            </div>
        </div>
    )

    function createNewColumn() {

    }
}

export default KanbanBoard